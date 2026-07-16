import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, StickyNote, Target, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notesApi, trackersApi } from '../../api/endpoints';
import { cn } from '../../utils/cn';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Listen for Cmd+K and custom event from sidebar
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const handleCustom = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('open-search', handleCustom);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('open-search', handleCustom);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setSelectedIndex(0); }
  }, [open]);

  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list(),
    enabled: open,
    staleTime: 30_000,
  });

  const { data: trackers } = useQuery({
    queryKey: ['trackers'],
    queryFn: () => trackersApi.list(),
    enabled: open,
    staleTime: 30_000,
  });

  const q = query.toLowerCase().trim();
  const matchedNotes = (notes ?? [])
    .filter(n => !q || n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q))
    .slice(0, 5)
    .map(n => ({ id: n.id, type: 'note', title: n.title, subtitle: n.content?.slice(0, 60), href: '/notes' }));

  const matchedTrackers = (trackers ?? [])
    .filter(t => !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    .slice(0, 5)
    .map(t => ({ id: t.id, type: 'tracker', title: t.name, subtitle: t.description, href: `/trackers/${t.id}` }));

  const results = [...matchedNotes, ...matchedTrackers];

  const select = useCallback((item) => {
    navigate(item.href);
    setOpen(false);
  }, [navigate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) { select(results[selectedIndex]); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative w-full max-w-lg bg-white border border-[#E5E5E5] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.12)] overflow-hidden z-10"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18 }}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5E5]">
              <Search className="w-4 h-4 text-[#888888] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search notes and trackers…"
                className="flex-1 text-sm text-[#111111] placeholder-[#888888] bg-transparent outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[#888888] hover:text-[#111111] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="text-xs text-[#888888] bg-[#F2F2F2] px-1.5 py-0.5 rounded-md font-mono">Esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#888888] font-light">
                    {query ? `No results for "${query}"` : 'Start typing to search…'}
                  </p>
                </div>
              ) : (
                <div className="p-1.5">
                  {matchedNotes.length > 0 && (
                    <p className="text-xs text-[#888888] uppercase tracking-wider font-medium px-3 py-2">Notes</p>
                  )}
                  {matchedNotes.map((item, i) => (
                    <ResultRow key={`n-${item.id}`} item={item} isSelected={selectedIndex === i} onSelect={() => select(item)} />
                  ))}
                  {matchedTrackers.length > 0 && (
                    <p className="text-xs text-[#888888] uppercase tracking-wider font-medium px-3 py-2 mt-1">Trackers</p>
                  )}
                  {matchedTrackers.map((item, i) => (
                    <ResultRow key={`t-${item.id}`} item={item} isSelected={selectedIndex === matchedNotes.length + i} onSelect={() => select(item)} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#E5E5E5] px-4 py-2 flex items-center gap-4 text-xs text-[#888888]">
              <span className="flex items-center gap-1"><kbd className="font-mono bg-[#F2F2F2] px-1 rounded">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-[#F2F2F2] px-1 rounded">↵</kbd> open</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-[#F2F2F2] px-1 rounded">Esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ResultRow({ item, isSelected, onSelect }) {
  const Icon = item.type === 'note' ? StickyNote : Target;
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group',
        isSelected ? 'bg-[#F2F2F2]' : 'hover:bg-[#F7F7F7]'
      )}
    >
      <div className="w-7 h-7 bg-[#F2F2F2] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#888888]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#111111] font-normal truncate">{item.title}</p>
        {item.subtitle && <p className="text-xs text-[#888888] font-light truncate">{item.subtitle}</p>}
      </div>
      <ArrowRight className={cn('w-3.5 h-3.5 text-[#888888] transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} />
    </button>
  );
}
