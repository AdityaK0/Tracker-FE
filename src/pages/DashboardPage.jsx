import { useQuery } from '@tanstack/react-query';
import { Target, StickyNote, CheckCircle2, Clock, Flame } from 'lucide-react';
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
