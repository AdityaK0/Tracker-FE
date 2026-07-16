import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Target,
  StickyNote,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Flame,
  Clock,
} from 'lucide-react';
import { dashboardApi, trackersApi, notesApi } from '../api/endpoints';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const statusVariantMap = {
  active: 'active',
  upcoming: 'upcoming',
  completed: 'completed',
  paused: 'paused',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.stats,
  });
  const { data: trackers } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => trackersApi.list(),
  });
  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list(),
  });

  if (statsLoading) return <LoadingSpinner />;

  const statCards = [
    {
      label: 'Active Trackers',
      value: stats?.active_trackers ?? 0,
      icon: Target,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Completed',
      value: stats?.completed_trackers ?? 0,
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Upcoming',
      value: stats?.upcoming_trackers ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Total Notes',
      value: stats?.total_notes ?? 0,
      icon: StickyNote,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

  const activeTrackers = trackers?.filter((t) => t.status === 'active') ?? [];
  const upcomingTrackers =
    trackers?.filter((t) => t.status === 'upcoming') ?? [];

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">
          {greeting()}, {user?.fullname?.split(' ')[0]} 👋
        </h1>
        <p className="text-[#a1a1aa] text-sm">
          Here's what's happening with your habits
        </p>
      </motion.div>

      {/* Today's completion bar */}
      {(stats?.active_trackers ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">
                Today's Progress
              </span>
            </div>
            <span className="text-sm font-bold text-white">
              {stats?.today_completion_percent ?? 0}%
            </span>
          </div>
          <ProgressBar
            value={stats?.today_completion_percent ?? 0}
            color={
              (stats?.today_completion_percent ?? 0) >= 80
                ? 'bg-green-500'
                : (stats?.today_completion_percent ?? 0) >= 50
                  ? 'bg-indigo-500'
                  : 'bg-amber-500'
            }
          />
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="card p-4"
          >
            <div
              className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-[#52525b] text-xs mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active trackers + Recent notes */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Trackers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Active Trackers
            </h2>
            <Link
              to="/trackers"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {activeTrackers.slice(0, 4).map((t) => (
              <Link key={t.id} to={`/trackers/${t.id}`}>
                <div className="card p-4 hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white truncate">
                      {t.name}
                    </span>
                    <Badge variant={statusVariantMap[t.status]}>
                      {t.status}
                    </Badge>
                  </div>
                  <ProgressBar value={t.completion_percent} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-[#52525b]">
                      {t.completion_percent}% complete
                    </span>
                    <span className="text-xs text-[#52525b]">
                      🔥 {t.current_streak} streak
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {activeTrackers.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-[#52525b] text-sm">No active trackers</p>
                <Link
                  to="/trackers/new"
                  className="text-indigo-400 text-sm hover:text-indigo-300 mt-1 inline-block"
                >
                  Create one →
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> Recent Notes
            </h2>
            <Link
              to="/notes"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {notes?.slice(0, 4).map((note) => (
              <Link key={note.id} to="/notes">
                <div className="card p-4 hover:border-[#2a2a2a] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {note.is_pinned && (
                      <span className="text-amber-400 text-xs">📌</span>
                    )}
                    <span className="text-sm font-medium text-white truncate">
                      {note.title}
                    </span>
                  </div>
                  {note.content && (
                    <p className="text-xs text-[#52525b] line-clamp-1">
                      {note.content}
                    </p>
                  )}
                  <p className="text-xs text-[#52525b] mt-1.5">
                    {format(new Date(note.updated_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
            ))}
            {!notes?.length && (
              <div className="card p-6 text-center">
                <p className="text-[#52525b] text-sm">No notes yet</p>
                <Link
                  to="/notes"
                  className="text-indigo-400 text-sm hover:text-indigo-300 mt-1 inline-block"
                >
                  Write your first note →
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Upcoming trackers */}
      {upcomingTrackers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Upcoming
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingTrackers.slice(0, 4).map((t) => {
              const startsIn = Math.ceil(
                (new Date(t.start_date).getTime() - Date.now()) / 86400000,
              );
              return (
                <Link key={t.id} to={`/trackers/${t.id}`}>
                  <div className="card p-4 hover:border-[#2a2a2a] transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-white">
                        {t.name}
                      </span>
                      <Badge variant="upcoming">upcoming</Badge>
                    </div>
                    <p className="text-xs text-amber-400 mt-1.5">
                      Starts in{' '}
                      {startsIn <= 0 ? 'today' : `${startsIn}d`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
