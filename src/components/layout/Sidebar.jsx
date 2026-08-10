import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, StickyNote, Target, LogOut, Zap, User, Settings, Trash2, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { toast } from '../ui/Toaster';

const navItems = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard, end: true  },
  { to: '/notes',    label: 'Notes',     icon: StickyNote,      end: false },
  { to: '/trackers', label: 'Trackers',  icon: Target,          end: false },
  { to: '/trash',    label: 'Trash',     icon: Trash2,          end: false },
];

export default function Sidebar({ onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    onClose();
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const avatarUrl = user?.avatar_path ? `http://localhost:8001/${user.avatar_path}` : null;
  const initials = user?.fullname?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase() ?? 'U';
  const displayName = user?.display_name || user?.fullname || user?.username;

  return (
    <aside className="h-full w-full bg-white border-r border-zinc-100 flex flex-col">

      {/* ── Wordmark ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#111111] flex items-center justify-center flex-shrink-0" style={{ borderRadius: '4px' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-sm font-black uppercase tracking-tight text-[#111111]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            HabitFlow
          </span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            className={({ isActive }) => cn(
              'sidebar-link',
              isActive && 'sidebar-link-active',
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── User ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-4 mt-auto border-t border-zinc-100" ref={dropdownRef}>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="mb-2 bg-white border border-black/10 overflow-hidden"
              style={{ borderRadius: '4px', boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.85)' }}
            >
              <div className="px-3 py-2.5 border-b border-zinc-100">
                <p
                  className="text-[10px] font-black uppercase tracking-widest text-[#111111] truncate"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {displayName}
                </p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setDropdownOpen(false); onClose(); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#111111] hover:bg-zinc-50 transition-colors text-left"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", borderRadius: '2px' }}
                >
                  <User className="w-3 h-3" />Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onClose(); navigate('/profile?tab=settings'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#111111] hover:bg-zinc-50 transition-colors text-left"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", borderRadius: '2px' }}
                >
                  <Settings className="w-3 h-3" />Settings
                </button>
              </div>
              <div className="border-t border-zinc-100 p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors text-left"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", borderRadius: '2px' }}
                >
                  <LogOut className="w-3 h-3" />Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setDropdownOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2 transition-colors duration-100',
            dropdownOpen ? 'bg-zinc-100' : 'hover:bg-zinc-100',
          )}
          style={{ borderRadius: '4px' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-7 h-7 object-cover flex-shrink-0 border border-black/10" style={{ borderRadius: '4px' }} />
          ) : (
            <div className="w-7 h-7 bg-[#111111] flex items-center justify-center flex-shrink-0" style={{ borderRadius: '4px' }}>
              <span className="text-white text-[10px] font-black">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p
              className="text-[11px] font-black uppercase tracking-tight text-[#111111] truncate leading-none mb-0.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {displayName}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">@{user?.username}</p>
          </div>
          <ChevronUp className={cn('w-3 h-3 text-zinc-300 transition-transform flex-shrink-0', dropdownOpen && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
