import { useQuery } from '@tanstack/react-query';
import { Target, StickyNote, CheckCircle2, Clock, Flame, Pin, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { dashboardApi, trackersApi, notesApi, activityApi } from '../api/endpoints';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ProgressBar from '../components/ui/ProgressBar';
import { Link } from 'react-router-dom';
import { formatDate, parseUTC } from '../utils/date';
import HabitHeatmap from '../components/ui/HabitHeatmap';
import Badge from '../components/ui/Badge';
import { cn } from '../utils/cn';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.stats });
  const { data: trackers } = useQuery({ queryKey: ['trackers'], queryFn: () => trackersApi.list() });
  const { data: notes } = useQuery({ queryKey: ['notes'], queryFn: () => notesApi.list() });
  const { data: activity } = useQuery({ queryKey: ['activity'], queryFn: () => activityApi.get(), staleTime: 60_000 });

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
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="page-title">{greeting()}, {user?.fullname?.split(' ')[0]}</h1>
        <p className="text-xs text-[#888888] mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Today's progress — inline banner */}
      {activeTrackers.length > 0 && (
        <div className="flex items-center gap-4 py-3 mb-5 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#888888]" />
            <span className="text-sm text-[#555555]">Today</span>
          </div>
          <div className="flex-1">
            <ProgressBar value={stats?.today_completion_percent ?? 0} />
          </div>
          <span className="text-sm font-semibold text-[#111111] flex-shrink-0 tabular-nums">
            {stats?.today_completion_percent ?? 0}%
          </span>
        </div>
      )}

      {/* Stats row — inline metric strip */}
      <div className="flex items-center gap-0 border border-[#E5E5E5] rounded-md overflow-hidden mb-6">
        {statCards.map(({ label, value, icon: Icon }, i) => (
          <div
            key={label}
            className={cn(
              'flex-1 px-4 py-3',
              i < statCards.length - 1 && 'border-r border-[#E5E5E5]',
            )}
          >
            <p className="text-xl font-semibold text-[#111111]">{value}</p>
            <p className="text-xs text-[#888888] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column: Active Trackers + Recent Notes */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Active Trackers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label">Active Trackers</p>
            <Link to="/trackers" className="text-xs text-[#888888] hover:text-[#111111] transition-colors">View all</Link>
          </div>
          <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
            {activeTrackers.slice(0, 4).map(t => (
              <Link key={t.id} to={`/trackers/${t.id}`}>
                <div className="list-row">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-[#111111] truncate">{t.name}</span>
                      <span className="text-xs text-[#888888] flex-shrink-0 tabular-nums">{t.completion_percent}%</span>
                    </div>
                    <ProgressBar value={t.completion_percent} />
                  </div>
                </div>
              </Link>
            ))}
            {activeTrackers.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[#888888]">No active trackers</p>
                <Link to="/trackers/new" className="text-sm text-[#111111] underline underline-offset-2 mt-1 inline-block">Create one</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label">Recent Notes</p>
            <Link to="/notes" className="text-xs text-[#888888] hover:text-[#111111] transition-colors">View all</Link>
          </div>
          <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
            {recentNotes.map(note => (
              <Link key={note.id} to="/notes">
                <div className="list-row">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {note.is_pinned && <Pin className="w-3 h-3 text-[#888888] flex-shrink-0" />}
                      <span className="text-sm font-medium text-[#111111] truncate">{note.title}</span>
                    </div>
                    {note.content && <p className="text-xs text-[#888888] truncate">{note.content}</p>}
                  </div>
                  <span className="text-xs text-[#888888] flex-shrink-0">{formatDate(note.updated_at, 'MMM d')}</span>
                </div>
              </Link>
            ))}
            {recentNotes.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[#888888]">No notes yet</p>
                <Link to="/notes" className="text-sm text-[#111111] underline underline-offset-2 mt-1 inline-block">Write your first</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming */}
      {upcomingTrackers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="section-label">Upcoming</p>
          </div>
          <div className="border border-[#E5E5E5] rounded-md overflow-hidden">
            {upcomingTrackers.slice(0, 4).map(t => {
              const startsIn = Math.ceil((parseUTC(t.start_date).getTime() - Date.now()) / 86400000);
              return (
                <Link key={t.id} to={`/trackers/${t.id}`}>
                  <div className="list-row">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#111111] truncate block">{t.name}</span>
                      <span className="text-xs text-[#888888]">
                        Starts {startsIn <= 0 ? 'today' : `in ${startsIn} day${startsIn !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <Badge variant="upcoming">upcoming</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity heatmap */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Activity</p>
          {activity?.total_events > 0 && (
            <span className="text-xs text-[#888888]"></span>
          )}
        </div>
        <div className="border border-[#E5E5E5] rounded-md p-4 overflow-x-auto">
          <HabitHeatmap data={activity?.data ?? []} weeks={26} mode="activity" />
        </div>
      </div>
    </div>
  );
}
