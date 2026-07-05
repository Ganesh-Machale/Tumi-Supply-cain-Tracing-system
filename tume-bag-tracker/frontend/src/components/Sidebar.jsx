import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Boxes, 
  Package, 
  MapPin, 
  BarChart3, 
  Bell, 
  Users, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon 
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Supply Records', path: '/supply', icon: Truck, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Inventory', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Products (SKUs)', path: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Locations', path: '/locations', icon: MapPin, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'Alerts Log', path: '/alerts', icon: Bell, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['ADMIN'] },
    { name: 'My Profile', path: '/profile', icon: User, roles: ['ADMIN', 'MANAGER', 'VIEWER'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-lg">
              T
            </div>
            <div>
              <span className="font-bold text-slate-100 tracking-wide text-sm">Tume Bag Co.</span>
              <span className="block text-xs text-cyan-400 font-medium">Supply Tracker</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="md:hidden text-slate-400 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10'
                    : 'hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer (Theme + User + Logout) */}
      <div className="border-t border-slate-800 p-4 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs font-medium transition-colors"
        >
          <span className="flex items-center gap-2 text-slate-400">
            {isDark ? <Moon size={14} className="text-cyan-400" /> : <Sun size={14} className="text-amber-400" />}
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Toggle</span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
            <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[9px] font-bold rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          ></div>
          {/* Drawer panel */}
          <div className="relative w-64 max-w-xs flex-1 flex flex-col h-full animate-slide-in-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
