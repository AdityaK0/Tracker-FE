import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, StickyNote, Target, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/notes', icon: StickyNote, label: 'Notes', end: false },
  { to: '/trackers', icon: Target, label: 'Trackers', end: false },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-[#E5E5E5] flex flex-col z-40">
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
        <p className="section-label px-3 mb-3 mt-1">Menu</p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('sidebar-link', isActive && 'sidebar-link-active')}
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[#E5E5E5]">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl hover:bg-[#F7F7F7] transition-colors">
          <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">
              {user?.fullname?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[#111111] text-xs font-medium truncate">{user?.fullname}</p>
            <p className="text-[#888888] text-xs truncate">@{user?.username}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
