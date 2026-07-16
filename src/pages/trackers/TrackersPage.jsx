import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Target, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { trackersApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/shared/EmptyState';
import SkeletonCard from '../../components/shared/SkeletonCard';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const statuses = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
];

const statusVariantMap = {
  active: 'active',
  upcoming: 'upcoming',
  completed: 'completed',
  paused: 'paused',
};

export default function TrackersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: trackers, isLoading } = useQuery({
    queryKey: ['trackers', statusFilter],
    queryFn: () =>
      trackersApi.list(statusFilter === 'all' ? undefined : statusFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => trackersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trackers'] });
      toast.success('Tracker deleted');
    },
    onError: () => toast.error('Failed to delete tracker'),
  });

  const handleDelete = (id, name) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Trackers</h1>
          <p className="text-[#52525b] text-sm mt-0.5">
            {trackers?.length ?? 0} trackers
          </p>
        </div>
        <Link to="/trackers/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Tracker
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-[#111111] border border-[#1a1a1a] rounded-xl p-1 mb-6 overflow-x-auto">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap',
              statusFilter === s.value
                ? 'bg-[#1a1a1a] text-white'
                : 'text-[#52525b] hover:text-white',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !trackers?.length ? (
        <EmptyState
          icon={Target}
          title="No trackers found"
          description="Create your first habit tracker to start building better habits"
          action={
            <Link to="/trackers/new" className="btn-primary">
              Create tracker
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {trackers.map((tracker, i) => (
            <motion.div
              key={tracker.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5 hover:border-[#2a2a2a] transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/trackers/${tracker.id}`}
                    className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
                  >
                    {tracker.name}
                  </Link>
                  {tracker.description && (
                    <p className="text-xs text-[#52525b] mt-0.5 truncate">
                      {tracker.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={statusVariantMap[tracker.status]}>
                    {tracker.status}
                  </Badge>
                  <button
                    onClick={() => handleDelete(tracker.id, tracker.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[#52525b] hover:text-red-400 transition-all rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <ProgressBar value={tracker.completion_percent} className="mb-2" />

              <div className="flex items-center justify-between text-xs text-[#52525b]">
                <span>{tracker.completion_percent}% complete</span>
                <span>🔥 {tracker.current_streak} day streak</span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a] text-xs text-[#52525b]">
                <span>
                  {tracker.duration_days} days · {tracker.habit_count} habits
                </span>
                <span>
                  {format(new Date(tracker.start_date), 'MMM d')} –{' '}
                  {format(new Date(tracker.end_date), 'MMM d, yyyy')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
