import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import AlertBadge from './AlertBadge';
import { Bell, Menu, Check, AlertTriangle, AlertCircle } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadAlerts, setUnreadAlerts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Derive human-readable page name from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/supply')) return 'Supply Quantity Distribution';
    if (path.startsWith('/inventory')) return 'Inventory & Stock Levels';
    if (path.startsWith('/products')) return 'Product SKU Management';
    if (path.startsWith('/locations')) return 'Locations Directory';
    if (path.startsWith('/reports')) return 'Distribution Reports';
    if (path.startsWith('/alerts')) return 'System Security & Stock Alerts';
    if (path.startsWith('/users')) return 'System User Administration';
    if (path.startsWith('/profile')) return 'My User Profile';
    return 'Tume Bag Supply Tracker';
  };

  const fetchUnreadAlerts = async () => {
    try {
      const response = await axiosInstance.get('/api/alerts?unreadOnly=true');
      setUnreadAlerts(response.data);
    } catch (err) {
      console.error('Error fetching unread alerts in Navbar:', err);
    }
  };

  useEffect(() => {
    fetchUnreadAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchUnreadAlerts, 30000);

    // Dynamic sync when other components update alerts
    window.addEventListener('alertsUpdated', fetchUnreadAlerts);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alertsUpdated', fetchUnreadAlerts);
    };
  }, []);

  const handleMarkAsRead = async (e, alertId) => {
    e.stopPropagation();
    try {
      await axiosInstance.put(`/api/alerts/${alertId}/read`);
      setUnreadAlerts((prev) => prev.filter((a) => a.id !== alertId));
      // Notify other listeners
      window.dispatchEvent(new Event('alertsUpdated'));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleDropdownItemClick = (e, alert) => {
    setShowDropdown(false);
    navigate('/alerts');
  };

  return (
    <header className="h-16 sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-6 z-30">
      {/* Title / Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-300 hover:text-slate-100 p-1.5 bg-slate-900 border border-slate-800 rounded-lg"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg font-bold text-slate-100 hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      {/* Action Indicators */}
      <div className="flex items-center gap-4">
        {/* Alerts Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg relative transition-all duration-150"
          >
            <Bell size={18} />
            <AlertBadge count={unreadAlerts.length} />
          </button>

          {showDropdown && (
            <>
              {/* Click outside backdrop */}
              <div 
                onClick={() => setShowDropdown(false)}
                className="fixed inset-0 z-40"
              ></div>
              
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Recent Alerts</span>
                  <Link 
                    to="/alerts" 
                    onClick={() => setShowDropdown(false)}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    View All Log
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {unreadAlerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No unread system alerts. Healthy!
                    </div>
                  ) : (
                    unreadAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        onClick={(e) => handleDropdownItemClick(e, alert)}
                        className="p-3 border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer flex gap-2.5 transition-colors"
                      >
                        <span className="mt-0.5 text-xs">
                          {alert.alert_type === 'LOW_STOCK' ? (
                            <AlertCircle className="text-rose-500" size={14} />
                          ) : (
                            <AlertTriangle className="text-amber-500" size={14} />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-300 font-medium leading-relaxed line-clamp-2">
                            {alert.message}
                          </p>
                          <span className="text-[9px] text-slate-500 block mt-1">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleMarkAsRead(e, alert.id)}
                          title="Mark read"
                          className="h-6 w-6 rounded border border-slate-800 flex items-center justify-center bg-slate-900/80 hover:bg-emerald-950/20 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 self-center transition-colors"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Quick Info */}
        <Link
          to="/profile"
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-300">{user?.name}</p>
            <span className="text-[9px] font-bold text-slate-500 block">{user?.role}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
