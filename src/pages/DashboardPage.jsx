import { useQuery } from '@tanstack/react-query';
import { Target, StickyNote, CheckCircle2, Clock, Flame, Star, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { dashboardApi, trackersApi, activityApi } from '../api/endpoints';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ProgressBar from '../components/ui/ProgressBar';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import HabitHeatmap from '../components/ui/HabitHeatmap';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats });
  const { data: trackers } = useQuery({ queryKey: ['trackers'], queryFn: () => trackersApi.list() });
  const { data: activity } = useQuery({ queryKey: ['activity'], queryFn: () => activityApi.get(), staleTime: 60_000 });

  if (isLoading) return <LoadingSpinner />;

  const now = new Date();
  const firstName = user?.fullname?.split(' ')[0] || user?.username || '';
  const activeTrackers = (trackers ?? []).filter(t => t.status === 'active');
  const pinnedTrackers = (trackers ?? []).filter(t => t.is_pinned);
  const todayPct = stats?.today_completion_percent ?? 0;

  const statItems = [
    { label: 'Active',    value: stats?.active_trackers   ?? 0, to: '/trackers'               },
    { label: 'Completed', value: stats?.completed_trackers ?? 0, to: '/trackers?status=completed' },
    { label: 'Upcoming',  value: stats?.upcoming_trackers  ?? 0, to: '/trackers?status=upcoming'  },
    { label: 'Notes',     value: stats?.total_notes        ?? 0, to: '/notes'                  },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-[#111111] tracking-tight">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-[#AAAAAA] mt-1">{format(now, 'EEEE, MMMM d')}</p>
      </div>

      {/* ── Today — dark hero card (only when trackers exist) ────────── */}
      {activeTrackers.length > 0 ? (
        <div className="bg-[#111111] rounded-md p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">Today</p>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-6xl font-bold text-white tabular-nums">{todayPct}</span>
                <span className="text-xl font-light text-white/30">%</span>
              </div>
            </div>
            <span className={cn(
              'mt-1 text-xs font-medium px-2 py-1 rounded-md',
              todayPct === 100
                ? 'text-green-400 bg-green-400/10'
                : todayPct > 0
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-white/30 bg-white/5',
            )}>
              {todayPct === 100 ? 'All done' : todayPct > 0 ? 'In progress' : 'Not started'}
            </span>
          </div>
          <ProgressBar value={todayPct} color="bg-white" className="bg-white/10" />
          <p className="text-[11px] text-white/25 mt-3">
            {activeTrackers.length} active tracker{activeTrackers.length !== 1 ? 's' : ''}
          </p>
        </div>
      ) : (
        /* Empty — no active trackers */
        <div className="border border-dashed border-[#E5E5E5] rounded-md py-10 text-center">
          <p className="text-sm text-[#888888] mb-1">No active trackers</p>
          <p className="text-xs text-[#AAAAAA] mb-4">Start one to track daily progress</p>
          <Link to="/trackers/new" className="btn-primary inline-flex items-center gap-1.5 text-xs px-3 py-1.5">
            New tracker
          </Link>
        </div>
      )}

      {/* ── Stats — bare numbers, no container ───────────────────────── */}
      <div className="grid grid-cols-4">
        {statItems.map(({ label, value, to }, i) => (
          <Link
            key={label}
            to={to}
            className={cn(
              'group text-center py-1',
              i < 3 && 'border-r border-[#E5E5E5]',
            )}
          >
            <p className="text-3xl font-bold text-[#111111] tabular-nums leading-none group-hover:text-[#555555] transition-colors">
              {value}
            </p>
            <p className="text-[11px] text-[#AAAAAA] mt-1.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Pinned trackers ──────────────────────────────────────────── */}
      {pinnedTrackers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-zinc-400 text-zinc-400" />
              Pinned
            </p>
            <Link to="/trackers" className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-[#111111] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {pinnedTrackers.map(t => {
              const daysLeft = Math.max(0, Math.ceil((new Date(t.end_date) - now) / (1000 * 60 * 60 * 24)));
              return (
                <Link key={t.id} to={`/trackers/${t.id}`}>
                  <div className="card px-4 py-3 hover:bg-zinc-50 transition-all duration-150 cursor-pointer" style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.7)' }}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Star className="w-3 h-3 fill-[#111111] text-[#111111] flex-shrink-0" />
                        <span className="text-sm font-semibold text-[#111111] truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#111111] tabular-nums flex-shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t.completion_percent}%</span>
                    </div>
                    <ProgressBar value={t.completion_percent} />
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{t.habit_count} habit{t.habit_count !== 1 ? 's' : ''}</span>
                      {t.current_streak > 0 && (
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />{t.current_streak}d
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider ml-auto">{daysLeft}d left</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Activity heatmap ──────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-widest mb-3">Activity</p>
        <div className="card p-4 overflow-x-auto">
          <HabitHeatmap data={activity?.data ?? []} weeks={26} mode="activity" />
        </div>
        <p className="text-[10px] text-[#CCCCCC] mt-2">Login activity · {now.getFullYear()}</p>
      </div>

    </div>
  );
}
