import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Flame,
  Trophy,
  Clock,
  Target,
  CheckSquare,
  XSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { trackersApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

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

  const { data: tracker, isLoading } = useQuery({
    queryKey: ['tracker', trackerId],
    queryFn: () => trackersApi.get(trackerId),
    staleTime: 30_000,
  });

  const progressMutation = useMutation({
    mutationFn: ({ dayIndex, habitId, completed }) =>
      trackersApi.updateProgress(trackerId, dayIndex, habitId, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker', trackerId] });
    },
    onError: () => toast.error('Failed to save progress'),
  });

  if (isLoading || !tracker) return <LoadingSpinner />;

  const isCompleted = (dayIndex, habitId) =>
    tracker.progress.some(
      (p) => p.day_index === dayIndex && p.habit_id === habitId && p.completed,
    );

  const toggleProgress = (dayIndex, habitId) => {
    const current = isCompleted(dayIndex, habitId);
    progressMutation.mutate({
      dayIndex,
      habitId,
      completed: !current,
    });
  };

  const statItems = [
    {
      label: 'Completion',
      value: `${tracker.completion_percent}%`,
      icon: Target,
    },
    {
      label: 'Current Streak',
      value: `${tracker.current_streak}d`,
      icon: Flame,
    },
    {
      label: 'Longest Streak',
      value: `${tracker.longest_streak}d`,
      icon: Trophy,
    },
    {
      label: 'Days Left',
      value: String(tracker.days_remaining),
      icon: Clock,
    },
    {
      label: 'Completed',
      value: String(tracker.completed_habits),
      icon: CheckSquare,
    },
    {
      label: 'Missed',
      value: String(tracker.missed_habits),
      icon: XSquare,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/trackers')}
          className="btn-ghost p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-light text-[#111111] tracking-tighter truncate">
              {tracker.name}
            </h1>
            <Badge variant={statusVariantMap[tracker.status]}>
              {tracker.status}
            </Badge>
          </div>
          {tracker.description && (
            <p className="text-[#888888] text-sm mt-0.5 font-light">
              {tracker.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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

      {/* Overall progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#555555] font-light">Overall Progress</span>
          <span className="text-sm font-medium text-[#111111]">
            {tracker.completion_percent}%
          </span>
        </div>
        <ProgressBar value={tracker.completion_percent} />
        <div className="flex justify-between mt-2 text-xs text-[#888888] font-light">
          <span>
            Day {tracker.days_elapsed} of {tracker.duration_days}
          </span>
          <span>
            {format(new Date(tracker.start_date), 'MMM d')} –{' '}
            {format(new Date(tracker.end_date), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Daily progress table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5]">
          <h2 className="text-sm font-medium text-[#111111]">Daily Progress</h2>
          <p className="text-xs text-[#888888] mt-0.5 font-light">
            Click a cell to toggle completion
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider sticky left-0 bg-white z-10 min-w-[90px]">
                  Day
                </th>
                {tracker.habits.map((habit) => (
                  <th
                    key={habit.id}
                    className="px-4 py-3 text-xs font-medium text-[#888888] uppercase tracking-wider text-center min-w-[140px]"
                  >
                    <span
                      className="truncate block max-w-[120px] mx-auto"
                      title={habit.name}
                    >
                      {habit.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: tracker.duration_days }, (_, dayIndex) => {
                const isToday =
                  dayIndex === tracker.days_elapsed - 1 &&
                  tracker.status === 'active';
                const isPast = dayIndex < tracker.days_elapsed;
                const isFuture = dayIndex >= tracker.days_elapsed;

                return (
                  <tr
                    key={dayIndex}
                    className={cn(
                      'border-b border-[#E5E5E5] hover:bg-[#F7F7F7] transition-colors',
                      isToday && 'bg-[#F7F7F7]',
                    )}
                  >
                    <td
                      className={cn(
                        'px-4 py-3 text-sm sticky left-0 z-10',
                        isToday
                          ? 'text-[#111111] font-medium bg-[#F7F7F7]'
                          : isPast
                            ? 'text-[#555555] bg-white'
                            : 'text-[#888888] bg-white',
                      )}
                    >
                      Day {dayIndex + 1}
                      {isToday && (
                        <span className="ml-1.5 text-xs text-[#888888] font-light">
                          ← today
                        </span>
                      )}
                    </td>
                    {tracker.habits.map((habit) => {
                      const done = isCompleted(dayIndex, habit.id);
                      return (
                        <td
                          key={habit.id}
                          className="px-4 py-3 text-center"
                        >
                          <button
                            onClick={() =>
                              !isFuture && toggleProgress(dayIndex, habit.id)
                            }
                            disabled={isFuture || progressMutation.isPending}
                            className={cn(
                              'w-8 h-8 rounded-lg border-2 flex items-center justify-center mx-auto transition-all duration-150',
                              isFuture
                                ? 'border-[#E5E5E5] cursor-not-allowed opacity-30 bg-[#F7F7F7]'
                                : done
                                  ? 'bg-[#111111] border-[#111111] hover:bg-[#333333] hover:border-[#333333]'
                                  : 'border-[#E5E5E5] hover:border-[#111111] bg-white',
                            )}
                            title={
                              isFuture
                                ? 'Future day'
                                : done
                                  ? 'Mark incomplete'
                                  : 'Mark complete'
                            }
                          >
                            {done && (
                              <svg
                                viewBox="0 0 12 10"
                                className="w-3.5 h-3.5 text-white"
                                fill="none"
                              >
                                <path
                                  d="M1 5L4.5 8.5L11 1.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
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
    </div>
  );
}
