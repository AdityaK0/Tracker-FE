import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, StickyNote, CheckCircle2, TrendingUp, BookOpen, Flame, Clock, ArrowRight } from 'lucide-react';
import { dashboardApi, trackersApi, notesApi } from '../api/endpoints';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { Link } from 'react-router-dom';
import { formatDate, parseUTC } from '../utils/date';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats });
  const { data: trackers } = useQuery({ queryKey: ['trackers'], queryFn: () => trackersApi.list() });
  const { data: notes } = useQuery({ queryKey: ['notes'], queryFn: () => notesApi.list() });

  if (isLoading) return <LoadingSpinner />;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { label: 'Active Trackers', value: stats?.active_trackers ?? 0, icon: Target },
    { label: 'Completed', value: stats?.completed_trackers ?? 0, icon: CheckCircle2 },
    { label: 'Upcoming', value: stats?.upcoming_trackers ?? 0, icon: Clock },
    { label: 'Notes', value: stats?.total_notes ?? 0, icon: StickyNote },
  ];

  const activeTrackers = trackers?.filter(t => t.status === 'active') ?? [];
  const upcomingTrackers = trackers?.filter(t => t.status === 'upcoming') ?? [];
  const recentNotes = notes?.slice(0, 4) ?? [];

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#111111] tracking-tighter mb-1">
          {greeting()}, {user?.fullname?.split(' ')[0]}
        </h1>
        <p className="text-[#888888] text-sm font-light">Here's what's happening today</p>
      </div>

      {/* Today's completion banner */}
      {activeTrackers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#555555]" />
              <span className="text-sm font-normal text-[#111111]">Today's completion</span>
            </div>
            <span className="text-sm font-medium text-[#111111]">{stats?.today_completion_percent ?? 0}%</span>
          </div>
          <ProgressBar value={stats?.today_completion_percent ?? 0} />
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ label, value, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
            <div className="w-8 h-8 bg-[#F2F2F2] rounded-xl flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-[#555555]" />
            </div>
            <p className="text-2xl font-light text-[#111111] tracking-tighter">{value}</p>
            <p className="text-[#888888] text-xs mt-0.5 font-light">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Trackers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#111111] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#888888]" /> Active Trackers
            </h2>
            <Link to="/trackers" className="text-xs text-[#888888] hover:text-[#111111] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {activeTrackers.slice(0, 4).map(t => (
              <Link key={t.id} to={`/trackers/${t.id}`}>
                <div className="card-hover p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-normal text-[#111111] truncate">{t.name}</span>
                    <Badge variant="active">active</Badge>
                  </div>
                  <ProgressBar value={t.completion_percent} className="mb-2" />
                  <div className="flex justify-between text-xs text-[#888888]">
                    <span>{t.completion_percent}%</span>
                    <span>{t.current_streak} day streak</span>
                  </div>
                </div>
              </Link>
            ))}
            {activeTrackers.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-[#888888] text-sm font-light mb-2">No active trackers</p>
                <Link to="/trackers/new" className="text-sm text-[#111111] font-normal hover:underline underline-offset-2">Create one →</Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Notes */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#111111] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#888888]" /> Recent Notes
            </h2>
            <Link to="/notes" className="text-xs text-[#888888] hover:text-[#111111] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentNotes.map(note => (
              <Link key={note.id} to="/notes">
                <div className="card-hover p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {note.is_pinned && <span className="text-xs">📌</span>}
                    <span className="text-sm font-normal text-[#111111] truncate">{note.title}</span>
                  </div>
                  {note.content && <p className="text-xs text-[#888888] font-light line-clamp-1 leading-relaxed">{note.content}</p>}
                  <p className="text-xs text-[#888888] mt-1.5">{formatDate(note.updated_at)}</p>
                </div>
              </Link>
            ))}
            {recentNotes.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-[#888888] text-sm font-light mb-2">No notes yet</p>
                <Link to="/notes" className="text-sm text-[#111111] font-normal hover:underline underline-offset-2">Write your first note →</Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Upcoming */}
      {upcomingTrackers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#111111] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#888888]" /> Upcoming
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingTrackers.slice(0, 4).map(t => {
              const startsIn = Math.ceil((parseUTC(t.start_date).getTime() - Date.now()) / 86400000);
              return (
                <Link key={t.id} to={`/trackers/${t.id}`}>
                  <div className="card-hover p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-[#111111]">{t.name}</span>
                      <Badge variant="upcoming">upcoming</Badge>
                    </div>
                    <p className="text-xs text-[#888888] font-light mt-1.5">
                      Starts {startsIn <= 0 ? 'today' : `in ${startsIn} day${startsIn !== 1 ? 's' : ''}`}
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
