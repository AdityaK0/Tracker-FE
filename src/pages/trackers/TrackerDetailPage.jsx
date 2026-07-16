import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Flame, Trophy, Clock, Target, CheckSquare, XSquare, Trash2 } from 'lucide-react';
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

  const deleteMutation = useMutation({
    mutationFn: () => trackersApi.delete(trackerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trackers'] });
      toast.success('Tracker deleted');
      navigate('/trackers');
    },
    onError: () => toast.error('Failed to delete tracker'),
  });

  if (isLoading || !tracker) return <LoadingSpinner />;

  const isHabitDone = (dayIndex, habitId) =>
    tracker.progress.some(p => p.day_index === dayIndex && p.habit_id === habitId && p.completed);

  const toggleProgress = (dayIndex, habitId) => {
    progressMutation.mutate({ dayIndex, habitId, completed: !isHabitDone(dayIndex, habitId) });
  };

  const statItems = [
    { label: 'Completion', value: `${tracker.completion_percent}%`, icon: Target },
    { label: 'Streak', value: `${tracker.current_streak}d`, icon: Flame },
    { label: 'Best', value: `${tracker.longest_streak}d`, icon: Trophy },
    { label: 'Days left', value: String(tracker.days_remaining), icon: Clock },
    { label: 'Done', value: String(tracker.completed_habits), icon: CheckSquare },
    { label: 'Missed', value: String(tracker.missed_habits), icon: XSquare },
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
        {statItems.map(({ label, value, icon: Icon }, i) => (
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

      {/* ── Tracker table — all screen sizes ─────────────────────────────────
          Sticky thead (top) + sticky Day column (left) + horizontal scroll.
          Exactly like Google Sheets / GitHub Projects on mobile.
          Touch targets: 44×44px checkbox cells (w-11 h-11).
      ──────────────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E5E5]">
          <h2 className="text-xs font-medium text-[#888888] uppercase tracking-wider">Daily Progress</h2>
          <span className="text-xs text-[#AAAAAA]">Tap to toggle</span>
        </div>

        {/* Scroll container — horizontal on mobile, vertical for long trackers */}
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '65vh' }}>
          <table className="border-collapse w-max min-w-full">

            {/* Sticky header row */}
            <thead className="sticky top-0 z-20">
              <tr className="bg-white border-b border-[#E5E5E5]">

                {/* Day column header — double-sticky: top + left */}
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-white px-3 py-2.5 text-left text-[10px] font-medium text-[#888888] uppercase tracking-wider border-r border-[#E5E5E5] min-w-[72px]"
                >
                  Day
                </th>

                {/* One column per habit */}
                {tracker.habits.map(habit => (
                  <th
                    key={habit.id}
                    scope="col"
                    style={{ minWidth: '120px' }}
                    className="px-3 py-2.5 text-center text-[10px] font-medium text-[#888888] normal-case leading-snug"
                  >
                    {habit.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: tracker.duration_days }, (_, dayIndex) => {
                const isToday = dayIndex === tracker.days_elapsed - 1 && tracker.status === 'active';
                const isPast  = dayIndex < tracker.days_elapsed;
                const isFuture = dayIndex >= tracker.days_elapsed;

                // Perfect-day tint
                const habitIds = tracker.habits.map(h => h.id);
                const doneCount = habitIds.filter(hid => isHabitDone(dayIndex, hid)).length;
                const isPerfect = isPast && doneCount === habitIds.length && habitIds.length > 0;

                return (
                  <tr
                    key={dayIndex}
                    className={cn(
                      'border-b border-[#F2F2F2] transition-colors',
                      isPerfect   ? 'bg-[#F0FDF4]'  // subtle green for 100% days
                      : isToday   ? 'bg-[#FAFAFA]'
                      : 'hover:bg-[#FAFAFA]',
                    )}
                  >
                    {/* Day cell — sticky left, matches row tint */}
                    <td
                      className={cn(
                        'sticky left-0 z-10 px-3 py-1.5 border-r border-[#E5E5E5] align-middle',
                        isPerfect ? 'bg-[#F0FDF4]'
                        : isToday ? 'bg-[#FAFAFA]'
                        : 'bg-white',
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium tabular-nums block',
                        isToday   ? 'text-[#111111]'
                        : isPast  ? 'text-[#555555]'
                        : 'text-[#CCCCCC]',
                      )}>
                        {dayIndex + 1}
                      </span>
                      {isToday && (
                        <span className="text-[10px] text-[#888888] leading-none">today</span>
                      )}
                    </td>

                    {/* Habit cells */}
                    {tracker.habits.map(habit => {
                      const done = isHabitDone(dayIndex, habit.id);
                      return (
                        <td key={habit.id} className="px-1 py-1 text-center align-middle">
                          <button
                            onClick={() => !isFuture && toggleProgress(dayIndex, habit.id)}
                            disabled={isFuture || progressMutation.isPending}
                            title={
                              isFuture ? 'Future day'
                              : done    ? `Uncheck — ${habit.name}`
                              :           `Check — ${habit.name}`
                            }
                            className={cn(
                              'w-7 h-7 rounded-md border flex items-center justify-center mx-auto transition-colors duration-100',
                              isFuture
                                ? 'border-transparent cursor-default opacity-20 bg-transparent'
                                : done
                                  ? 'bg-[#111111] border-[#111111] hover:bg-[#2A2A2A] hover:border-[#2A2A2A] active:scale-95'
                                  : 'border-[#E5E5E5] bg-white hover:border-[#999999] active:bg-[#F7F7F7]',
                            )}
                          >
                            {done && (
                              <svg viewBox="0 0 12 10" className="w-3 h-3 text-white" fill="none">
                                <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
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
