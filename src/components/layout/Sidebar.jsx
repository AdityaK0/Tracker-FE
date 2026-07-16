import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, StickyNote, Target, LogOut, Zap, User, ChevronUp, Settings, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { toast } from '../ui/Toaster';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/notes', icon: StickyNote, label: 'Notes', end: false },
  { to: '/trackers', icon: Target, label: 'Trackers', end: false },
  { to: '/trash', icon: Trash2, label: 'Trash', end: false },
];

export default function Sidebar({ onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    onClose();
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const avatarUrl = user?.avatar_path ? `http://localhost:8001/${user.avatar_path}` : null;
  const initials = user?.fullname?.[0]?.toUpperCase() ?? 'U';
  const displayName = user?.display_name || user?.fullname || user?.username;

  return (
    <aside className="h-full w-full bg-white border-r border-[#E5E5E5] flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#111111] rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-[#111111] text-sm tracking-wide">HabitFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-xs font-medium text-[#888888] uppercase tracking-wider px-3 mb-3 mt-1">Menu</p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-search'));
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#888888] hover:text-[#111111] hover:bg-[#F2F2F2] w-full transition-all mb-3"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search</span>
          <span className="text-xs bg-[#F2F2F2] px-1.5 py-0.5 rounded-md font-mono">⌘K</span>
        </button>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-normal text-[#555555] hover:text-[#111111] hover:bg-[#F2F2F2] transition-all duration-200 cursor-pointer',
                isActive && 'text-[#111111] bg-[#F2F2F2] font-medium')
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section with dropdown */}
      <div className="p-3 border-t border-[#E5E5E5]" ref={dropdownRef}>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="mb-2 bg-white border border-[#E5E5E5] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              {/* Profile header inside dropdown */}
              <div className="px-3 py-3 border-b border-[#F2F2F2]">
                <p className="text-xs font-medium text-[#111111] truncate">{displayName}</p>
                <p className="text-xs text-[#888888] truncate">{user?.email}</p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setDropdownOpen(false); onClose(); navigate('/profile'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5" />
                  View Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onClose(); navigate('/profile?tab=settings'); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Account Settings
                </button>
              </div>

              <div className="border-t border-[#F2F2F2] p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar trigger */}
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
            dropdownOpen ? 'bg-[#F2F2F2]' : 'hover:bg-[#F7F7F7]'
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-[#E5E5E5]" />
          ) : (
            <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[#111111] text-xs font-medium truncate">{displayName}</p>
            <p className="text-[#888888] text-xs truncate">@{user?.username}</p>
          </div>
          <ChevronUp className={cn('w-3.5 h-3.5 text-[#888888] transition-transform flex-shrink-0', dropdownOpen && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
