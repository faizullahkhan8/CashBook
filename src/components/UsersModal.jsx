import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, Users, UserPlus, Shield, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

export default function UsersModal({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'cashier',
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.auth.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.username || !form.password || !form.full_name) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.auth.createUser(form);
      setSuccess(`User "@${form.username}" created successfully!`);
      setForm({ username: '', full_name: '', password: '', role: 'cashier' });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(u) {
    if (u.id === currentUser?.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const next = u.status === 'active' ? 'inactive' : 'active';
    try {
      await api.auth.toggleStatus(u.id, next);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Counter Staff & Cashiers</h2>
              <p className="text-xs text-slate-400">Manage user accounts saved in Hostinger MySQL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add New User Form */}
          <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Create New Staff / Cashier Account
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Ullah"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. asad_pos"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cashier">Cashier (Daily Counter Operations)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors shadow disabled:opacity-50"
                >
                  {saving ? 'Creating...' : '+ Create Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Users List Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500" />
              Existing Accounts
            </h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className={u.status === 'inactive' ? 'opacity-40' : ''}>
                      <td className="p-3">
                        <span className="font-bold text-white block text-sm">{u.full_name}</span>
                        <span className="text-slate-500">@{u.username}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          u.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.id !== currentUser?.id ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                              u.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-slate-500 italic text-xs">(You)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
