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

  const isCompleted = (dayIndex, habitId) =>
    tracker.progress.some(p => p.day_index === dayIndex && p.habit_id === habitId && p.completed);

  const toggleProgress = (dayIndex, habitId) => {
    progressMutation.mutate({ dayIndex, habitId, completed: !isCompleted(dayIndex, habitId) });
  };

  const statItems = [
    { label: 'Completion', value: `${tracker.completion_percent}%`, icon: Target },
    { label: 'Current Streak', value: `${tracker.current_streak}d`, icon: Flame },
    { label: 'Longest Streak', value: `${tracker.longest_streak}d`, icon: Trophy },
    { label: 'Days Left', value: String(tracker.days_remaining), icon: Clock },
    { label: 'Completed', value: String(tracker.completed_habits), icon: CheckSquare },
    { label: 'Missed', value: String(tracker.missed_habits), icon: XSquare },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => navigate('/trackers')} className="btn-ghost p-2 flex-shrink-0 mt-0.5">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-light text-[#111111] tracking-tighter break-words">{tracker.name}</h1>
            <Badge variant={statusVariantMap[tracker.status]}>{tracker.status}</Badge>
          </div>
          {tracker.description && (
            <p className="text-[#888888] text-sm mt-0.5 font-light">{tracker.description}</p>
          )}
        </div>

        {/* Delete button — in header, always visible */}
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#888888] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200"
          title="Delete tracker"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Delete</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statItems.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-3 text-center"
          >
            <div className="w-7 h-7 bg-[#F2F2F2] rounded-xl flex items-center justify-center mx-auto mb-2">
              <Icon className="w-3.5 h-3.5 text-[#555555]" />
            </div>
            <p className="text-base font-light text-[#111111] tracking-tighter">{value}</p>
            <p className="text-xs text-[#888888] font-light">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#555555] font-light">Overall Progress</span>
          <span className="text-sm font-medium text-[#111111]">{tracker.completion_percent}%</span>
        </div>
        <ProgressBar value={tracker.completion_percent} />
        <div className="flex justify-between mt-2 text-xs text-[#888888] font-light">
          <span>Day {tracker.days_elapsed} of {tracker.duration_days}</span>
          <span>{formatDate(tracker.start_date, 'MMM d')} – {formatDate(tracker.end_date, 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Mobile: section header */}
      <div className="md:hidden flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[#111111]">Daily Progress</h2>
        <span className="text-xs text-[#888888] font-light">Tap to toggle</span>
      </div>

      {/* Mobile: Day cards */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: tracker.duration_days }, (_, dayIndex) => {
          const isToday = dayIndex === tracker.days_elapsed - 1 && tracker.status === 'active';
          const isPast = dayIndex < tracker.days_elapsed;
          const isFuture = dayIndex >= tracker.days_elapsed;
          const dayComplete = tracker.habits.length > 0 &&
            tracker.habits.every(h => isCompleted(dayIndex, h.id));

          return (
            <div key={dayIndex} className={cn(
              'card p-4',
              isToday && 'border-[#111111]',
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium',
                    isToday ? 'text-[#111111]' : isPast ? 'text-[#555555]' : 'text-[#888888]'
                  )}>
                    Day {dayIndex + 1}
                  </span>
                  {isToday && (
                    <span className="text-xs bg-[#111111] text-white px-2 py-0.5 rounded-full font-normal">Today</span>
                  )}
                </div>
                {isPast && (
                  <span className="text-xs text-[#888888] font-light">
                    {dayComplete ? 'Complete' : 'Incomplete'}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {tracker.habits.map(habit => {
                  const done = isCompleted(dayIndex, habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => !isFuture && toggleProgress(dayIndex, habit.id)}
                      disabled={isFuture || progressMutation.isPending}
                      className={cn(
                        'w-full flex items-center gap-3 py-2.5 px-1 rounded-lg text-left transition-colors min-h-[44px]',
                        isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#F7F7F7] active:bg-[#F2F2F2]',
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        isFuture ? 'border-[#E5E5E5]'
                          : done ? 'bg-[#111111] border-[#111111]'
                          : 'border-[#E5E5E5]',
                      )}>
                        {done && (
                          <svg viewBox="0 0 12 10" className="w-3 h-3 text-white" fill="none">
                            <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={cn('text-sm', done ? 'text-[#555555] line-through' : isFuture ? 'text-[#888888]' : 'text-[#111111]')}>
                        {habit.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet: scrollable table */}
      <div className="hidden md:block card overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h2 className="text-sm font-medium text-[#111111]">Daily Progress</h2>
          <p className="text-xs text-[#888888] mt-0.5 font-light">Click a cell to toggle completion</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider sticky left-0 bg-white z-10 min-w-[90px]">
                  Day
                </th>
                {tracker.habits.map(habit => (
                  <th key={habit.id} className="px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider text-center min-w-[140px]">
                    <span className="truncate block max-w-[120px] mx-auto" title={habit.name}>{habit.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tracker.duration_days }, (_, dayIndex) => {
                const isToday = dayIndex === tracker.days_elapsed - 1 && tracker.status === 'active';
                const isPast = dayIndex < tracker.days_elapsed;
                const isFuture = dayIndex >= tracker.days_elapsed;

                return (
                  <tr key={dayIndex} className={cn('border-b border-[#E5E5E5] hover:bg-[#F7F7F7] transition-colors', isToday && 'bg-[#F7F7F7]')}>
                    <td className={cn('px-4 py-3 text-sm sticky left-0 z-10',
                      isToday ? 'text-[#111111] font-medium bg-[#F7F7F7]'
                        : isPast ? 'text-[#555555] bg-white'
                        : 'text-[#888888] bg-white'
                    )}>
                      Day {dayIndex + 1}
                      {isToday && <span className="ml-1.5 text-xs text-[#888888] font-light">← today</span>}
                    </td>
                    {tracker.habits.map(habit => {
                      const done = isCompleted(dayIndex, habit.id);
                      return (
                        <td key={habit.id} className="px-4 py-3 text-center">
                          <button
                            onClick={() => !isFuture && toggleProgress(dayIndex, habit.id)}
                            disabled={isFuture || progressMutation.isPending}
                            title={isFuture ? 'Future day' : done ? 'Mark incomplete' : 'Mark complete'}
                            className={cn(
                              'w-8 h-8 rounded-lg border-2 flex items-center justify-center mx-auto transition-all duration-150',
                              isFuture
                                ? 'border-[#E5E5E5] cursor-not-allowed opacity-30 bg-[#F7F7F7]'
                                : done
                                  ? 'bg-[#111111] border-[#111111] hover:bg-[#333333] hover:border-[#333333]'
                                  : 'border-[#E5E5E5] hover:border-[#111111] bg-white',
                            )}
                          >
                            {done && (
                              <svg viewBox="0 0 12 10" className="w-3.5 h-3.5 text-white" fill="none">
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

      {/* Delete confirmation dialog */}
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
