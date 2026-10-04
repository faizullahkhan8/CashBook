import React, { useState } from 'react';
import { api } from '../api';
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.auth.login(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or MySQL server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 px-4 py-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hostinger MySQL Online
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ZADA PHARMACY
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            POS Cash Counter & Shift Reconciliation
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or cashier"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50 text-sm"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Counter'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Initial Admin: <span className="text-slate-400 font-mono">admin</span> / <span className="text-slate-400 font-mono">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
