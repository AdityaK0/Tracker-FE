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
    <aside className="h-full w-full bg-[#F7F7F7] border-r border-[#E5E5E5] flex flex-col">

      {/* ── Wordmark ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-[#111111] rounded-md flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-[#111111] tracking-tight">HabitFlow</span>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors duration-100 select-none',
              isActive
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:text-[#111111] hover:bg-[#EBEBEB]',
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── User ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-3 mt-auto" ref={dropdownRef}>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="mb-1.5 bg-white border border-[#E5E5E5] rounded-md overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-[#F2F2F2]">
                <p className="text-xs font-medium text-[#111111] truncate">{displayName}</p>
                <p className="text-[11px] text-[#AAAAAA] truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setDropdownOpen(false); onClose(); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
                >
                  <User className="w-3 h-3" />Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onClose(); navigate('/profile?tab=settings'); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
                >
                  <Settings className="w-3 h-3" />Settings
                </button>
              </div>
              <div className="border-t border-[#F2F2F2] p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
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
            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors duration-100',
            dropdownOpen ? 'bg-[#EBEBEB]' : 'hover:bg-[#EBEBEB]',
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0 border border-[#E5E5E5]" />
          ) : (
            <div className="w-6 h-6 bg-[#111111] rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-medium">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-medium text-[#111111] truncate leading-none mb-0.5">{displayName}</p>
            <p className="text-[10px] text-[#AAAAAA] truncate">@{user?.username}</p>
          </div>
          <ChevronUp className={cn('w-3 h-3 text-[#CCCCCC] transition-transform flex-shrink-0', dropdownOpen && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
