import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftOpen, Zap } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { cn } from '../../utils/cn';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const location = useLocation();

  // Close sidebar on mobile/tablet route change
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  // Escape key closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-[#F7F7F7] overflow-hidden">

      {/* ── Desktop sidebar — flex item, animates width ───────────────── */}
      <div
        className={cn(
          'hidden lg:block flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
          sidebarOpen ? 'w-60' : 'w-0',
        )}
      >
        {/* Inner wrapper keeps the sidebar at full 240px regardless of container width */}
        <div className="w-60 h-full">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* ── Mobile/tablet drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 h-full w-72 z-50 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#111111] hover:bg-zinc-100 transition-colors flex-shrink-0"
            style={{ borderRadius: '4px' }}
            aria-label="Toggle sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          <div className={cn(
            'flex items-center gap-2 transition-opacity duration-200',
            'lg:opacity-0 lg:pointer-events-none',
            !sidebarOpen && 'lg:opacity-100 lg:pointer-events-auto',
          )}>
            <div className="w-5 h-5 bg-[#111111] flex items-center justify-center" style={{ borderRadius: '4px' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-tight text-[#111111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              HabitFlow
            </span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation ──────────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
