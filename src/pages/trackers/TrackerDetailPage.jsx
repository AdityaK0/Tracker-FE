import { Fragment, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Flame, Trophy, Clock, Target,
  CheckSquare, XSquare, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { trackersApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { cn } from '../../utils/cn';
import { toast } from '../../components/ui/Toaster';
import { formatDate } from '../../utils/date';

const statusVariantMap = {
  active: 'active',
  upcoming: 'upcoming',
  completed: 'completed',
  paused: 'paused',
};

export default function TrackerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const trackerId = parseInt(id, 10);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const saveTimeoutRef = useRef(null);
  const todayRowRef = useRef(null);
  const tableContainerRef = useRef(null);

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['tracker', trackerId],
    queryFn: () => trackersApi.get(trackerId),
    staleTime: 30_000,
  });

  const progressMutation = useMutation({
    mutationFn: ({ dayIndex, habitId, completed }) =>
      trackersApi.updateProgress(trackerId, dayIndex, habitId, completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracker', trackerId] }),
    onError: () => toast.error('Failed to save progress'),
  });

  const noteMutation = useMutation({
    mutationFn: ({ dayIndex, content }) => trackersApi.upsertDayNote(trackerId, dayIndex, content),
    onSuccess: (data) => {
      qc.setQueryData(['tracker', trackerId], data);
      setNoteSaving(false);
    },
    onError: () => {
      toast.error('Failed to save note');
      setNoteSaving(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => trackersApi.delete(trackerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trackers'] });
      toast.success('Tracker deleted');
      navigate('/trackers');
    },
    onError: () => toast.error('Failed to delete tracker'),
  });

  useEffect(() => {
    const container = tableContainerRef.current;
    const row = todayRowRef.current;
    if (!container || !row) return;
    // Scroll only within the table container so the page header stays put
    const targetTop = row.offsetTop - container.clientHeight / 2 + row.offsetHeight / 2;
    container.scrollTop = Math.max(0, targetTop);
  }, [tracker?.id]);

  if (isLoading || !tracker) return <LoadingSpinner />;

  const noteMap = tracker.day_notes || {};

  const getDayDate = (dayIndex) => {
    const [y, m, d] = tracker.start_date.split('-').map(Number);
    return new Date(y, m - 1, d + dayIndex);
  };

  const handleDayClick = (dayIndex) => {
    if (expandedDay === dayIndex) {
      setExpandedDay(null);
      return;
    }
    setExpandedDay(dayIndex);
    clearTimeout(saveTimeoutRef.current);
    setNoteSaving(false);
    setNoteText(noteMap[String(dayIndex)] ?? '');
  };

  const scheduleNoteSave = (content) => {
    setNoteSaving(true);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      noteMutation.mutate({ dayIndex: expandedDay, content });
    }, 800);
  };

  const isHabitDone = (dayIndex, habitId) =>
    tracker.progress.some(p => p.day_index === dayIndex && p.habit_id === habitId && p.completed);

  const toggleProgress = (dayIndex, habitId) => {
    progressMutation.mutate({ dayIndex, habitId, completed: !isHabitDone(dayIndex, habitId) });
  };

  const statItems = [
    { label: 'Completion', value: `${tracker.completion_percent}%`, icon: Target },
    { label: 'Streak',     value: `${tracker.current_streak}d`,     icon: Flame },
    { label: 'Best',       value: `${tracker.longest_streak}d`,     icon: Trophy },
    { label: 'Days left',  value: String(tracker.days_remaining),   icon: Clock },
    { label: 'Done',       value: String(tracker.completed_habits), icon: CheckSquare },
    { label: 'Missed',     value: String(tracker.missed_habits),    icon: XSquare },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <button onClick={() => navigate('/trackers')} className="btn-ghost p-1.5 flex-shrink-0 mt-0.5">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{tracker.name}</h1>
            <Badge variant={statusVariantMap[tracker.status]}>{tracker.status}</Badge>
          </div>
          {tracker.description && (
            <p className="text-xs text-[#888888] mt-0.5">{tracker.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-[#888888] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Delete</span>
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex items-center border border-[#E5E5E5] rounded-md overflow-hidden mb-5">
        {statItems.map(({ label, value }, i) => (
          <div
            key={label}
            className={cn('flex-1 px-3 py-2.5 text-center', i < statItems.length - 1 && 'border-r border-[#E5E5E5]')}
          >
            <p className="text-sm font-semibold text-[#111111] tabular-nums">{value}</p>
            <p className="text-[10px] text-[#888888] mt-0.5 leading-none">{label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="flex items-center gap-3 py-3 mb-5 border-b border-[#E5E5E5]">
        <span className="text-xs text-[#888888] flex-shrink-0">Overall</span>
        <div className="flex-1">
          <ProgressBar value={tracker.completion_percent} />
        </div>
        <span className="text-xs font-semibold text-[#111111] tabular-nums flex-shrink-0">
          {tracker.completion_percent}%
        </span>
        <span className="text-xs text-[#888888] flex-shrink-0 hidden sm:block">
          {formatDate(tracker.start_date, 'MMM d')} – {formatDate(tracker.end_date, 'MMM d')}
        </span>
      </div>

      {/* ── Tracker table ──────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E5E5]">
          <h2 className="text-xs font-medium text-[#888888] uppercase tracking-wider">Daily Progress</h2>
          <span className="text-xs text-[#AAAAAA]">Tap a day number to view / add note</span>
        </div>

        <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <table className="border-collapse w-max min-w-full">

            <thead className="sticky top-0 z-20">
              <tr className="bg-white border-b border-[#E5E5E5]">
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-white px-3 py-2.5 text-left text-[10px] font-medium text-[#888888] uppercase tracking-wider border-r border-[#E5E5E5] min-w-[80px]"
                >
                  Day
                </th>
                {tracker.habits.map(habit => (
                  <th
                    key={habit.id}
                    scope="col"
                    style={{ minWidth: '110px' }}
                    className="px-3 py-2.5 text-center text-[10px] font-medium text-[#888888] normal-case leading-snug"
                  >
                    {habit.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: tracker.duration_days }, (_, dayIndex) => {
                const isToday     = dayIndex === tracker.days_elapsed - 1 && tracker.status === 'active';
                const isPast      = dayIndex < tracker.days_elapsed;
                const isFuture    = dayIndex >= tracker.days_elapsed;
                const isImmutable = isPast && !isToday;
                const isExpanded  = expandedDay === dayIndex;
                const hasNote     = Boolean(noteMap[String(dayIndex)]);
                const canNote     = !isFuture; // today and past can show/add notes

                const habitIds = tracker.habits.map(h => h.id);
                const snapshotDay = tracker.history?.days?.[String(dayIndex)];
                const doneCount = isToday
                  ? habitIds.filter(hid => isHabitDone(dayIndex, hid)).length
                  : snapshotDay?.completed ?? habitIds.filter(hid => isHabitDone(dayIndex, hid)).length;
                const dayPct = isPast && habitIds.length > 0
                  ? (snapshotDay?.completion ?? Math.round((doneCount / habitIds.length) * 100))
                  : null;
                const isPerfect = isPast && doneCount === habitIds.length && habitIds.length > 0;

                const rowBg = isPerfect ? 'bg-[#F0FDF4]' : isToday ? 'bg-[#FAFAFA]' : 'bg-white';
                const cellBg = isPerfect ? 'bg-[#F0FDF4]' : isToday ? 'bg-[#FAFAFA]' : 'bg-white';

                return (
                  <Fragment key={dayIndex}>
                    {/* ── Main day row ─────────────────────────────────── */}
                    <tr
                      ref={isToday ? todayRowRef : null}
                      className={cn(
                        'border-b transition-colors',
                        isExpanded ? 'border-[#E5E5E5]' : 'border-[#F2F2F2]',
                        rowBg,
                        !isPerfect && !isToday && 'hover:bg-[#FAFAFA]',
                      )}
                    >
                      {/* Day cell — clickable for note */}
                      <td
                        onClick={() => canNote && handleDayClick(dayIndex)}
                        className={cn(
                          'sticky left-0 z-10 px-3 py-1.5 align-middle transition-colors',
                          isExpanded
                            ? 'border-r-2 border-r-[#111111]'
                            : 'border-r border-r-[#E5E5E5]',
                          canNote ? 'cursor-pointer hover:bg-[#F0F0F0]' : 'cursor-default',
                          cellBg,
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            'text-sm tabular-nums',
                            isExpanded          ? 'font-bold text-[#111111]'
                            : isToday           ? 'font-medium text-[#111111]'
                            : isPast            ? 'font-medium text-[#555555]'
                            : 'font-medium text-[#CCCCCC]',
                          )}>
                            {dayIndex + 1}
                          </span>
                          {hasNote && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#AAAAAA] flex-shrink-0" title="Has note" />
                          )}
                        </div>
                        {dayPct !== null && (
                          <span className={cn(
                            'text-[10px] tabular-nums leading-none block mt-0.5',
                            isPerfect ? 'text-[#16A34A]' : 'text-[#AAAAAA]',
                          )}>
                            {dayPct}%
                          </span>
                        )}
                        {isToday && (
                          <span className="text-[10px] text-[#888888] leading-none block">today</span>
                        )}
                      </td>

                      {/* Habit checkbox cells */}
                      {tracker.habits.map(habit => {
                        const done = isHabitDone(dayIndex, habit.id);
                        return (
                          <td key={habit.id} className="px-1 py-1 text-center align-middle">
                            <button
                              onClick={() => !isFuture && !isImmutable && toggleProgress(dayIndex, habit.id)}
                              disabled={isFuture || isImmutable || progressMutation.isPending}
                              title={
                                isFuture     ? 'Future day — not yet'
                                : isImmutable ? 'Past days are locked'
                                : done        ? `Uncheck — ${habit.name}`
                                :               `Check — ${habit.name}`
                              }
                              className={cn(
                                'w-5 h-5 border flex items-center justify-center mx-auto transition-colors duration-100',
                                isFuture
                                  ? 'border-transparent cursor-default opacity-20 bg-transparent'
                                  : isImmutable
                                    ? done
                                      ? 'bg-[#D4D4D4] border-[#D4D4D4] cursor-not-allowed'
                                      : 'border-[#E5E5E5] bg-[#FAFAFA] cursor-not-allowed'
                                    : done
                                      ? 'bg-[#111111] border-[#111111] hover:bg-[#2A2A2A] hover:border-[#2A2A2A] active:scale-95'
                                      : 'border-[#E5E5E5] bg-white hover:border-[#999999] active:bg-[#F7F7F7]',
                              )}
                            >
                              {done && (
                                <svg viewBox="0 0 12 10" className="w-2.5 h-2.5" fill="none"
                                  style={{ color: isImmutable ? '#AAAAAA' : 'white' }}>
                                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>

                    {/* ── Expanded note row ─────────────────────────────── */}
                    {isExpanded && (
                      <tr className="border-b border-[#E5E5E5]">
                        <td
                          colSpan={1 + tracker.habits.length}
                          className="px-4 py-3 bg-[#FAFAFA] border-l-2 border-l-[#111111]"
                        >
                          <p className="text-[10px] text-[#AAAAAA] mb-2 font-medium uppercase tracking-wider">
                            {format(getDayDate(dayIndex), 'EEE, MMM d')}
                            {isImmutable && (
                              <span className="ml-2 normal-case tracking-normal">· read only</span>
                            )}
                          </p>

                          {isToday ? (
                            // ── Today — editable ─────────────────────────
                            <>
                              <textarea
                                autoFocus
                                className="w-full max-w-2xl text-sm text-[#111111] placeholder-[#CCCCCC] bg-white border border-[#E5E5E5] rounded p-2.5 resize-none focus:outline-none focus:border-[#111111] transition-colors"
                                rows={3}
                                placeholder="How did today go? What did you notice?"
                                value={noteText}
                                onChange={(e) => {
                                  setNoteText(e.target.value);
                                  scheduleNoteSave(e.target.value);
                                }}
                              />
                              <p className={cn(
                                'text-[10px] mt-1 transition-opacity duration-200',
                                noteSaving ? 'text-[#AAAAAA] opacity-100' : 'opacity-0',
                              )}>
                                Saving…
                              </p>
                            </>
                          ) : (
                            // ── Past — read only ──────────────────────────
                            <p className={cn(
                              'text-sm max-w-2xl leading-relaxed',
                              noteMap[String(dayIndex)]
                                ? 'text-[#444444]'
                                : 'text-[#CCCCCC] italic',
                            )}>
                              {noteMap[String(dayIndex)] || 'No note was written for this day.'}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete tracker?"
        description={`"${tracker.name}" and all its progress data will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete tracker"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
