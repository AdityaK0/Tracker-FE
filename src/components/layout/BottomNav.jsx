import { NavLink } from 'react-router-dom';
import { LayoutDashboard, StickyNote, Target, Search, User } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/notes', icon: StickyNote, label: 'Notes', end: false },
  { to: '/trackers', icon: Target, label: 'Trackers', end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] z-30 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[56px] transition-colors',
                isActive ? 'text-[#111111]' : 'text-[#888888]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('w-10 h-10 flex items-center justify-center rounded-xl transition-colors', isActive && 'bg-[#F2F2F2]')}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-normal">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Search button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[56px] text-[#888888] transition-colors"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F2] transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-normal">Search</span>
        </button>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl min-w-[56px] transition-colors',
              isActive ? 'text-[#111111]' : 'text-[#888888]',
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn('w-10 h-10 flex items-center justify-center rounded-xl transition-colors', isActive && 'bg-[#F2F2F2]')}>
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-normal">Profile</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
