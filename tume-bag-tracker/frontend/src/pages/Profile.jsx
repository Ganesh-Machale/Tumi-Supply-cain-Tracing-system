import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, User, KeyRound, Check } from 'lucide-react';

const Profile = () => {
  const { user, updatePassword } = useAuth();
  const { addToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast('All password fields are required.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password and password confirmation do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long.', 'warning');
      return;
    }

    setLoading(true);
    const result = await updatePassword(oldPassword, newPassword);
    setLoading(false);

    if (result.success) {
      addToast('Password updated successfully.', 'success');
      // Reset fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      addToast(result.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
          My Account Profile
        </h2>
        <p className="text-xs text-slate-400">
          Configure security credentials and view account metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card Info */}
        <div className="md:col-span-1 glass-card p-6 rounded-xl border border-slate-850 flex flex-col items-center text-center h-fit">
          <div className="w-20 h-20 bg-slate-850 border border-slate-700/60 rounded-full flex items-center justify-center text-cyan-400 font-extrabold text-3xl mb-4 shadow-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-base font-black text-slate-100">{user?.name}</h3>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block truncate max-w-full">
            {user?.email}
          </span>

          <div className="mt-6 pt-5 border-t border-slate-800/80 w-full space-y-4 text-left text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Security Clearance</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded font-bold uppercase mt-1">
                <Shield size={12} />
                {user?.role}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">System Access State</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-bold mt-1">
                <Check size={12} />
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2 glass-card p-6 rounded-xl border border-slate-850">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-5">
            <KeyRound className="text-cyan-400" size={18} />
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
              Change System Password
            </h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="form-label font-bold text-xs uppercase text-slate-400" htmlFor="oldPassword">
                Current Password <span className="text-cyan-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={15} />
                </span>
                <input
                  id="oldPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input text-xs pl-9"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label font-bold text-xs uppercase text-slate-400" htmlFor="newPassword">
                  New Password <span className="text-cyan-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={15} />
                  </span>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input text-xs pl-9"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label font-bold text-xs uppercase text-slate-400" htmlFor="confirmPassword">
                  Confirm New Password <span className="text-cyan-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={15} />
                  </span>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input text-xs pl-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-xs w-full sm:w-auto px-6 py-2 disabled:opacity-50"
              >
                {loading ? 'Updating Credentials...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
