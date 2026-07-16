import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-[#F7F7F7] overflow-hidden">
      {/* ── Desktop: permanent sidebar ───────────────────────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-60">
          <Sidebar onClose={() => {}} />
        </div>
      </div>

      {/* ── Mobile/Tablet: slide-over drawer ─────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
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

      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — visible on mobile/tablet only */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E5E5] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F2] transition-colors"
            aria-label="Open menu"
          >
            {/* Hamburger */}
            <div className="flex flex-col gap-1.5">
              <span className="w-5 h-0.5 bg-[#111111] rounded-full block" />
              <span className="w-5 h-0.5 bg-[#111111] rounded-full block" />
              <span className="w-3 h-0.5 bg-[#111111] rounded-full block" />
            </div>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#111111] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-white">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-medium text-[#111111] text-sm">HabitFlow</span>
          </div>
          {/* Right side placeholder — keeps logo centered */}
          <div className="w-10" />
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {/* Bottom padding on mobile for the bottom nav */}
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation ──────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
