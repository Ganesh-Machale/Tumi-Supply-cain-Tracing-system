import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DataTable from '../components/DataTable';
import { Shield, ShieldAlert, ToggleLeft, ToggleRight, UserCog } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users catalog:', err);
      addToast('Failed to load user administration list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosInstance.put(`/api/users/${userId}/role`, { role: newRole });
      addToast(`Role updated successfully to ${newRole}.`, 'success');
      
      setUsers((prev) => 
        prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Error changing role.';
      addToast(msg, 'error');
    }
  };

  const handleToggleActive = async (user) => {
    if (user.id === currentUser.id) {
      addToast('You cannot deactivate your own administrative account.', 'warning');
      return;
    }

    const nextState = !user.is_active;
    const confirmToggle = window.confirm(`Are you sure you want to ${nextState ? 'ACTIVATE' : 'DEACTIVATE'} user ${user.name}? Deactivated users cannot log into the system.`);
    if (!confirmToggle) return;

    try {
      await axiosInstance.put(`/api/users/${user.id}/deactivate`, { is_active: nextState });
      addToast(`User ${user.name} is now ${nextState ? 'active' : 'deactivated'}.`, 'success');
      
      setUsers((prev) => 
        prev.map((u) => u.id === user.id ? { ...u, is_active: nextState ? 1 : 0 } : u)
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating user status.';
      addToast(msg, 'error');
    }
  };

  const tableColumns = [
    { key: 'name', label: 'Name & Email', render: (row) => (
      <div>
        <div className="font-bold text-slate-100 flex items-center gap-1.5">
          {row.name}
          {row.id === currentUser.id && (
            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/15">
              YOU
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-semibold">{row.email}</span>
      </div>
    )},
    { key: 'role', label: 'Security Role', render: (row) => {
      const isSelf = row.id === currentUser.id;
      return (
        <div className="max-w-[130px]">
          <select
            disabled={isSelf} // Prevent self role downgrades
            className="form-input text-xs py-1.5 px-2 bg-slate-900"
            value={row.role}
            onChange={(e) => handleRoleChange(row.id, e.target.value)}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      );
    }},
    { key: 'is_active', label: 'Account Status', render: (row) => {
      const isActive = !!row.is_active;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
          {isActive ? 'ACTIVE' : 'DEACTIVATED'}
        </span>
      );
    }},
    { key: 'created_at', label: 'Registered On', render: (row) => (
      <span className="text-xs text-slate-500 font-medium">
        {new Date(row.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
      </span>
    )},
    { key: 'actions', label: 'Account Lock Toggle', render: (row) => {
      const isSelf = row.id === currentUser.id;
      const isActive = !!row.is_active;
      return (
        <div>
          <button
            onClick={() => handleToggleActive(row)}
            disabled={isSelf}
            title={isActive ? 'Deactivate Account' : 'Activate Account'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded border border-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed transition-colors"
          >
            {isActive ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold text-[10px]">
                <ToggleRight size={16} />
                Disable
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                <ToggleLeft size={16} />
                Enable
              </span>
            )}
          </button>
        </div>
      );
    }}
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <UserCog className="text-cyan-400" size={22} />
            <span>User Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Regulate enterprise accounts, re-allocate security clearances, or toggle system access.
          </p>
        </div>
      </div>

      {/* Warning Box */}
      <div className="p-4 bg-slate-900 border border-cyan-500/10 text-cyan-400/80 rounded-xl text-xs flex gap-3 max-w-2xl leading-relaxed font-medium">
        <Shield className="flex-shrink-0 mt-0.5" size={16} />
        <div>
          <span className="font-bold text-slate-200 block mb-0.5">RBAC & Moderation Notice</span>
          Role adjustments take effect immediately. Deactivating a user instantly locks them out, rejecting their refresh token on their next server request.
        </div>
      </div>

      {/* Main Datatable */}
      <div className="glass-card p-4 rounded-xl border border-slate-850">
        <DataTable
          columns={tableColumns}
          data={users}
          loading={loading}
          emptyMessage="No system users cataloged."
        />
      </div>
    </div>
  );
};

export default Users;
