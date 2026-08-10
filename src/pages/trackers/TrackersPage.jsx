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
  const [headerMenuOpen, setHeaderMenuOpen]     = useState(false);
  const [cardMenuId, setCardMenuId]             = useState(null); // which card's mini-menu is open
  const headerMenuRef = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trackers, isLoading } = useQuery({
    queryKey: ['trackers', statusFilter],
    queryFn: () => trackersApi.list(statusFilter === 'all' ? undefined : statusFilter),
  });

  const pinMutation = useMutation({
    mutationFn: (id) => trackersApi.togglePin(id),
    onSuccess: (data, id) => {
      // Immediately update every tracker cache entry (prefix match: ['trackers'], ['trackers','all'], etc.)
      qc.setQueriesData({ queryKey: ['trackers'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(t => t.id === id ? { ...t, is_pinned: data.is_pinned ?? !t.is_pinned } : t);
      });
      qc.invalidateQueries({ queryKey: ['trackers'] });
      toast.success(data.is_pinned ? 'Added to favourites' : 'Removed from favourites');
    },
    onError: () => toast.error('Failed to update favourite'),
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

  // Close header ⋯ menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close card mini-menu on outside click
  useEffect(() => {
    if (!cardMenuId) return;
    const handler = (e) => {
      if (!e.target.closest('[data-card-menu]')) setCardMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [cardMenuId]);

  // ── Selection helpers ────────────────────────────────────────────────
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allIds = (trackers ?? []).map(t => t.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  const handleSelectAll = () => {
    setSelectMode(true);
    setSelected(new Set(allIds));
    setHeaderMenuOpen(false);
  };

  const handleCardClick = (tracker) => {
    if (cardMenuId) { setCardMenuId(null); return; }
    if (selectMode) { toggleSelect(tracker.id); return; }
    navigate(`/trackers/${tracker.id}`);
  };

  // Card checkbox click: in select mode → toggle; otherwise → open mini-menu
  const handleCheckboxClick = (e, trackerId) => {
    e.stopPropagation();
    if (selectMode) {
      toggleSelect(trackerId);
    } else {
      setCardMenuId(prev => prev === trackerId ? null : trackerId);
    }
  };

  const sorted = [...(trackers ?? [])].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <div className="pb-24">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Trackers</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {selectMode && selected.size > 0
              ? `${selected.size} selected`
              : `${trackers?.length ?? 0} trackers`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ⋯ header kebab */}
          {!isLoading && !!trackers?.length && !selectMode && (
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setHeaderMenuOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#111111] hover:bg-zinc-100 transition-colors"
                style={{ borderRadius: '4px' }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {headerMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 z-20 bg-white border border-black/10 py-1 min-w-[160px]"
                    style={{ borderRadius: '4px', boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.85)' }}
                  >
                    <button
                      onClick={handleSelectAll}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#111111] hover:bg-zinc-50 transition-colors text-left"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Select all
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {selectMode && (
            <button
              onClick={exitSelectMode}
              className="text-xs px-2.5 py-1.5 border border-zinc-200 text-zinc-500 hover:text-[#111111] hover:border-black bg-white transition-colors font-semibold"
              style={{ borderRadius: '4px', fontFamily: "'Space Grotesk', sans-serif" }}
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
        <div className="flex gap-1 bg-white border border-black/10 p-1 w-fit min-w-full sm:min-w-0" style={{ borderRadius: '4px' }}>
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors whitespace-nowrap',
                statusFilter === s.value
                  ? 'bg-[#111111] text-white'
                  : 'text-zinc-500 hover:text-[#111111]',
              )}
              style={{ borderRadius: '2px', fontFamily: "'Space Grotesk', sans-serif" }}
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
            const isMenuOpen = cardMenuId === tracker.id;

            return (
              <motion.div
                key={tracker.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleCardClick(tracker)}
                className={cn(
                  'p-5 transition-all duration-150 cursor-pointer group relative bg-white border',
                  isSelected ? 'border-black' : tracker.is_pinned ? 'border-[#111111]' : 'border-black/10',
                )}
                style={{
                  borderRadius: '4px',
                  boxShadow: isSelected
                    ? '4px 4px 0px 0px rgba(0,0,0,0.85)'
                    : tracker.is_pinned
                      ? '4px 4px 0px 0px rgba(0,0,0,0.85)'
                      : '3px 3px 0px 0px rgba(0,0,0,0.85)',
                }}
              >
                {/* ── Top-right zone: PIN chip (always) + checkbox (hover) ── */}
                <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5" data-card-menu>

                  {/* PIN chip — always visible when pinned, hidden in select mode */}
                  {tracker.is_pinned && !selectMode && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-[#111111] text-white"
                      style={{ borderRadius: '2px', fontSize: '9px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    >
                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                      Pin
                    </span>
                  )}

                  {/* Checkbox — hover-visible; always visible in select/selected mode */}
                  <div className={cn(
                    'relative',
                    (selectMode || isSelected || isMenuOpen) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    'transition-opacity duration-100',
                  )}>
                    <button
                      onClick={(e) => handleCheckboxClick(e, tracker.id)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                      style={{ borderRadius: '3px' }}
                      title={selectMode ? (isSelected ? 'Deselect' : 'Select') : 'Options'}
                    >
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-[#111111]" />
                        : <Square className="w-4 h-4 text-zinc-300" />
                      }
                    </button>

                    {/* Mini-menu */}
                    <AnimatePresence>
                      {isMenuOpen && !selectMode && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-7 z-30 bg-white border border-black/10 py-1 min-w-[170px]"
                          style={{ borderRadius: '4px', boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.85)' }}
                          data-card-menu
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pinMutation.mutate(tracker.id);
                              setCardMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#111111] hover:bg-zinc-50 transition-colors text-left"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            <Star className={cn('w-3.5 h-3.5', tracker.is_pinned ? 'fill-[#111111] text-[#111111]' : '')} />
                            {tracker.is_pinned ? 'Unpin' : 'Pin to top'}
                          </button>
                          <div className="h-px bg-zinc-100 mx-2 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectMode(true);
                              toggleSelect(tracker.id);
                              setCardMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#111111] hover:bg-zinc-50 transition-colors text-left"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Select
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Card body */}
                <div className="mb-3">
                  <p
                    className="text-sm font-semibold text-[#111111] truncate"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", paddingRight: tracker.is_pinned ? '88px' : '32px' }}
                  >
                    {tracker.name}
                  </p>
                  {tracker.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate font-light pr-8">{tracker.description}</p>
                  )}
                </div>

                <ProgressBar value={tracker.completion_percent} className="mb-2" />

                <div className="flex items-center justify-between text-xs text-zinc-400 font-light">
                  <span>{tracker.completion_percent}% complete</span>
                  <span>{tracker.current_streak} day streak</span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-400 font-light">
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
            <div
              className="bg-[#111111] text-white px-4 py-2.5 flex items-center gap-3 whitespace-nowrap"
              style={{ borderRadius: '4px', boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.5)' }}
            >
              <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {selected.size} selected
              </span>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={toggleAll}
                className="text-[11px] font-semibold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
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
