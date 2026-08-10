import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Star, Trash2, CheckSquare, Square, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { trackersApi } from '../../api/endpoints';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/shared/EmptyState';
import SkeletonCard from '../../components/shared/SkeletonCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/date';
import { toast } from '../../components/ui/Toaster';

const statuses = [
  { value: 'all',       label: 'All'       },
  { value: 'active',    label: 'Active'    },
  { value: 'upcoming',  label: 'Upcoming'  },
  { value: 'completed', label: 'Completed' },
  { value: 'paused',    label: 'Paused'    },
];

export default function TrackersPage() {
  const [statusFilter, setStatusFilter]         = useState('all');
  const [selectMode, setSelectMode]             = useState(false);
  const [selected, setSelected]                 = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [menuOpen, setMenuOpen]                 = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trackers, isLoading } = useQuery({
    queryKey: ['trackers', statusFilter],
    queryFn: () => trackersApi.list(statusFilter === 'all' ? undefined : statusFilter),
  });

  const pinMutation = useMutation({
    mutationFn: (id) => trackersApi.togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trackers'] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => { for (const id of ids) await trackersApi.delete(id); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trackers'] });
      toast.success(`${selected.size} tracker${selected.size !== 1 ? 's' : ''} deleted`);
      exitSelectMode();
    },
    onError: () => toast.error('Failed to delete some trackers'),
  });

  // Close ⋯ menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Selection helpers ───────────────────────────────────────────────
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Clicking a card checkbox enters select mode if not already in it
  const handleCheckbox = (e, id) => {
    e.stopPropagation();
    if (!selectMode) setSelectMode(true);
    toggleSelect(id);
  };

  const allIds = (trackers ?? []).map(t => t.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  const handleSelectAll = () => {
    setSelectMode(true);
    setSelected(new Set(allIds));
    setMenuOpen(false);
  };

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  const handleCardClick = (tracker) => {
    if (selectMode) { toggleSelect(tracker.id); return; }
    navigate(`/trackers/${tracker.id}`);
  };

  const sorted = [...(trackers ?? [])].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <div className="pb-24">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Trackers</h1>
          <p className="text-xs text-[#888888] mt-0.5">
            {selectMode && selected.size > 0
              ? `${selected.size} selected`
              : `${trackers?.length ?? 0} trackers`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ⋯ kebab — normal mode only, has trackers */}
          {!isLoading && !!trackers?.length && !selectMode && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#888888] hover:text-[#111111] hover:bg-[#F2F2F2] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#E5E5E5] rounded-md py-1 min-w-[160px]"
                  >
                    <button
                      onClick={handleSelectAll}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Select all
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Cancel — select mode only */}
          {selectMode && (
            <button
              onClick={exitSelectMode}
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E5E5E5] text-[#555555] hover:text-[#111111] hover:border-[#CCCCCC] bg-white transition-colors"
            >
              Cancel
            </button>
          )}

          <Link to="/trackers/new" className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Tracker</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto pb-1 mb-6">
        <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-md p-1 w-fit min-w-full sm:min-w-0">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-sm font-medium transition-colors whitespace-nowrap',
                statusFilter === s.value ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !sorted.length ? (
        <EmptyState
          icon={Target}
          title="No trackers found"
          description="Create your first habit tracker to start building better habits"
          action={<Link to="/trackers/new" className="btn-primary">Create tracker</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map((tracker, i) => {
            const isSelected = selected.has(tracker.id);
            return (
              <motion.div
                key={tracker.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleCardClick(tracker)}
                className={cn(
                  'card p-5 transition-all duration-150 cursor-pointer group relative',
                  isSelected
                    ? 'border-[#111111] bg-[#FAFAFA]'
                    : 'hover:bg-[#FAFAFA] hover:border-[#D0D0D0]',
                )}
              >
                {/* Checkbox — appears on hover, always visible in select mode */}
                <button
                  onClick={(e) => handleCheckbox(e, tracker.id)}
                  className={cn(
                    'absolute top-3.5 right-3.5 z-10 transition-opacity duration-100',
                    (selectMode || isSelected)
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100',
                  )}
                >
                  {isSelected
                    ? <CheckSquare className="w-4 h-4 text-[#111111]" />
                    : <Square className="w-4 h-4 text-[#CCCCCC]" />}
                </button>

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm font-medium text-[#111111] truncate">{tracker.name}</p>
                    {tracker.description && (
                      <p className="text-xs text-[#888888] mt-0.5 truncate font-light">{tracker.description}</p>
                    )}
                  </div>
                  {/* Pin — only in normal mode */}
                  {!selectMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); pinMutation.mutate(tracker.id); }}
                      className={cn(
                        'p-1 rounded-sm transition-colors duration-150 flex-shrink-0 mt-0.5',
                        tracker.is_pinned
                          ? 'text-amber-400 hover:text-amber-500'
                          : 'text-transparent group-hover:text-[#CCCCCC] hover:!text-amber-400',
                      )}
                    >
                      <Star className={cn('w-3.5 h-3.5', tracker.is_pinned && 'fill-amber-400')} />
                    </button>
                  )}
                </div>

                <ProgressBar value={tracker.completion_percent} className="mb-2" />

                <div className="flex items-center justify-between text-xs text-[#888888] font-light">
                  <span>{tracker.completion_percent}% complete</span>
                  <span>{tracker.current_streak} day streak</span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E5E5] text-xs text-[#888888] font-light">
                  <span>{tracker.duration_days} days · {tracker.habit_count} habits</span>
                  <span>{formatDate(tracker.start_date, 'MMM d')} – {formatDate(tracker.end_date, 'MMM d, yyyy')}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Floating bulk action bar ──────────────────────────────────── */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="bg-[#111111] text-white rounded-md px-4 py-2.5 flex items-center gap-3 whitespace-nowrap">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={toggleAll}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => bulkDeleteMutation.mutate([...selected])}
        title={`Delete ${selected.size} tracker${selected.size !== 1 ? 's' : ''}?`}
        description="All progress data will be permanently deleted. This cannot be undone."
        confirmLabel={`Delete ${selected.size}`}
        isLoading={bulkDeleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
