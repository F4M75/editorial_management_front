import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Tag, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/context/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/articles', label: 'Articles', icon: FileText },
  { to: '/categories', label: 'Catégories', icon: Tag },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const Sidebar = () => {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#1a1a2e] text-white">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-lg font-bold tracking-widest uppercase">Editorial</p>
        <p className="text-xs text-white/40 mt-0.5">Management</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/40 mb-1">Connecté en tant que</p>
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-white/50 truncate mb-3">{user?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
