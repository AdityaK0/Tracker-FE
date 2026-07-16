import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Target } from 'lucide-react';
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

  const { data: trackers, isLoading } = useQuery({
    queryKey: ['trackers', statusFilter],
    queryFn: () => trackersApi.list(statusFilter === 'all' ? undefined : statusFilter),
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
        <Link to="/trackers/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Tracker
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-full p-1 mb-6 w-fit">
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
          {trackers.map((tracker, i) => (
            <motion.div
              key={tracker.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/trackers/${tracker.id}`)}
              className="card p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-300 cursor-pointer"
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
                <Badge variant={statusVariantMap[tracker.status]}>
                  {tracker.status}
                </Badge>
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
