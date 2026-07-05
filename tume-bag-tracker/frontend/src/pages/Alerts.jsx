import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  RefreshCw,
  MailOpen
} from 'lucide-react';

const Alerts = () => {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filterType, setFilterType] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/alerts', {
        params: {
          unreadOnly,
          alertType: filterType || undefined,
        },
      });
      setAlerts(response.data || []);
    } catch (err) {
      console.error('Error fetching alerts list:', err);
      addToast('Error loading system alerts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [unreadOnly, filterType]);

  const handleMarkAsRead = async (alertId) => {
    try {
      await axiosInstance.put(`/api/alerts/${alertId}/read`);
      addToast('Alert marked as read.', 'success');
      
      // Update local state
      setAlerts((prev) => 
        prev.map((a) => a.id === alertId ? { ...a, is_read: 1 } : a)
      );

      // Trigger sync event for Navbar
      window.dispatchEvent(new Event('alertsUpdated'));
    } catch (err) {
      console.error('Error marking alert as read:', err);
      addToast('Failed to update alert status.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unreadList = alerts.filter(a => !a.is_read);
    if (unreadList.length === 0) {
      addToast('No unread alerts to clear.', 'warning');
      return;
    }

    try {
      setLoading(true);
      // Sequentially clear unread alerts
      await Promise.all(
        unreadList.map(a => axiosInstance.put(`/api/alerts/${a.id}/read`))
      );
      addToast('All alerts cleared successfully.', 'success');
      
      // Sync list
      fetchAlerts();
      
      // Trigger sync event for Navbar
      window.dispatchEvent(new Event('alertsUpdated'));
    } catch (err) {
      console.error('Error clearing alerts in bulk:', err);
      addToast('Failed to mark all as read.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = [
    { key: 'alert_type', label: 'Type', render: (row) => {
      const isLowStock = row.alert_type === 'LOW_STOCK';
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold rounded-full border ${
          isLowStock 
            ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' 
            : 'bg-amber-500/10 text-amber-455 border-amber-500/20'
        }`}>
          {isLowStock ? <AlertCircle size={10} /> : <AlertTriangle size={10} />}
          {row.alert_type}
        </span>
      );
    }},
    { key: 'message', label: 'Alert Message Description', render: (row) => (
      <div>
        <p className={`text-xs font-semibold leading-relaxed ${row.is_read ? 'text-slate-450 line-through' : 'text-slate-200'}`}>
          {row.message}
        </p>
        <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 block">
          SKU: {row.product_sku} — Location: {row.location_name}
        </span>
      </div>
    )},
    { key: 'created_at', label: 'Triggered Date & Time', render: (row) => (
      <span className="text-xs text-slate-400">
        {new Date(row.created_at).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        {!row.is_read ? (
          <button
            onClick={() => handleMarkAsRead(row.id)}
            title="Mark as Read"
            className="btn-secondary text-[10px] px-2.5 py-1 flex items-center gap-1 border-slate-700/60 hover:bg-slate-800"
          >
            <Check size={12} className="text-emerald-400" />
            <span>Mark Read</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 select-none">
            <MailOpen size={11} />
            Resolved
          </span>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            Notifications & System Logs
          </h2>
          <p className="text-xs text-slate-400">
            A real-time safety log tracking critical stock deficits and logistics events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllRead} 
            disabled={loading || alerts.filter(a => !a.is_read).length === 0}
            className="btn-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            <span>Mark All as Read</span>
          </button>

          <button onClick={fetchAlerts} className="btn-secondary text-xs" title="Refresh list">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <label className="text-xs font-bold text-slate-350 cursor-pointer flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          <span>Show Unread Alerts Only</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alert Type</span>
          <select
            className="form-input text-xs py-1.5 w-48"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="LOW_STOCK">LOW_STOCK</option>
            <option value="OVERSTOCK">OVERSTOCK</option>
            <option value="DELAYED_SHIPMENT">DELAYED_SHIPMENT</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card p-4 rounded-xl border border-slate-850">
        <DataTable
          columns={tableColumns}
          data={alerts}
          loading={loading}
          emptyMessage="No notifications found."
        />
      </div>
    </div>
  );
};

export default Alerts;
