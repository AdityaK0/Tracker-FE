import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Target, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { trackersApi } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/shared/EmptyState';
import SkeletonCard from '../../components/shared/SkeletonCard';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/date';

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
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trackers, isLoading } = useQuery({
    queryKey: ['trackers', statusFilter],
    queryFn: () => trackersApi.list(statusFilter === 'all' ? undefined : statusFilter),
  });

  const pinMutation = useMutation({
    mutationFn: (id) => trackersApi.togglePin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trackers'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-light text-[#111111] tracking-tighter">Trackers</h1>
          <p className="text-[#888888] text-sm mt-0.5 font-light">
            {trackers?.length ?? 0} trackers
          </p>
        </div>
        <Link to="/trackers/new" className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Tracker</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="overflow-x-auto pb-1 mb-6">
        <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-full p-1 w-fit min-w-full sm:min-w-0">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'px-4 py-1.5 text-xs rounded-full font-normal transition-colors whitespace-nowrap',
                statusFilter === s.value
                  ? 'bg-[#111111] text-white'
                  : 'text-[#555555] hover:text-[#111111]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !trackers?.length ? (
        <EmptyState
          icon={Target}
          title="No trackers found"
          description="Create your first habit tracker to start building better habits"
          action={<Link to="/trackers/new" className="btn-primary">Create tracker</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...trackers].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map((tracker, i) => (
            <motion.div
              key={tracker.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/trackers/${tracker.id}`)}
              className="card p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{tracker.name}</p>
                  {tracker.description && (
                    <p className="text-xs text-[#888888] mt-0.5 truncate font-light">
                      {tracker.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); pinMutation.mutate(tracker.id); }}
                    className={cn(
                      'p-1 rounded-lg transition-all duration-200',
                      tracker.is_pinned
                        ? 'text-amber-400 hover:text-amber-500'
                        : 'text-transparent group-hover:text-[#CCCCCC] hover:!text-amber-400',
                    )}
                    title={tracker.is_pinned ? 'Unpin tracker' : 'Pin tracker'}
                  >
                    <Star className={cn('w-3.5 h-3.5', tracker.is_pinned && 'fill-amber-400')} />
                  </button>
                  <Badge variant={statusVariantMap[tracker.status]}>
                    {tracker.status}
                  </Badge>
                </div>
              </div>

              <ProgressBar value={tracker.completion_percent} className="mb-2" />

              <div className="flex items-center justify-between text-xs text-[#888888] font-light">
                <span>{tracker.completion_percent}% complete</span>
                <span>{tracker.current_streak} day streak</span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E5E5] text-xs text-[#888888] font-light">
                <span>{tracker.duration_days} days · {tracker.habit_count} habits</span>
                <span>
                  {formatDate(tracker.start_date, 'MMM d')} – {formatDate(tracker.end_date, 'MMM d, yyyy')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
