'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick fill helper for demo/testing
  const fillDemo = (role: 'ADMIN' | 'SUPERVISOR') => {
    if (role === 'ADMIN') {
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      setEmail('supervisor@company.com');
      setPassword('supervisor123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Check if user exists. If not, auto-register them for demo convenience!
      // This ensures the system works perfectly even on the first run on a fresh database.
      let authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      let authData = await authResponse.json();

      // Auto-register convenience fallback for testing
      if (authResponse.status === 401 && (email === 'admin@company.com' || email === 'supervisor@company.com')) {
        setError('First run detected! Registering demo user, please wait...');
        const regResponse = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            name: email === 'admin@company.com' ? 'System Administrator' : 'Site Supervisor',
            email,
            password,
            role: email === 'admin@company.com' ? 'ADMIN' : 'SUPERVISOR',
          }),
        });

        if (regResponse.ok) {
          // Retry login after auto-registration
          authResponse = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password }),
          });
          authData = await authResponse.json();
        }
      }

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Authentication failed. Please check your credentials.');
      }

      // 2. Load user profile into context state
      login(authData.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 relative overflow-hidden select-none">
      {/* Background Graphic Lines representing scaffolding/construction */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-10 left-10 w-96 h-96 border-l border-t border-amber-600/10 pointer-events-none hidden md:block" />
      <div className="absolute bottom-10 right-10 w-96 h-96 border-r border-b border-amber-600/10 pointer-events-none hidden md:block" />

      {/* Login Card Container */}
      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 relative">
          
          {/* Brand Header */}
          <div className="text-center flex flex-col gap-2">
            <div className="inline-flex items-center justify-center self-center w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black text-2xl tracking-tighter shadow-lg shadow-amber-600/20">
              CX
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-2">
              Construx<span className="text-amber-500">ERP</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Construction Management & Enterprise Portal
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-slate-950/50 border border-slate-800 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 text-white rounded-xl px-4 py-3 text-sm transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-950/50 border border-slate-800 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 text-white rounded-xl px-4 py-3 text-sm transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-600/15"
            >
              {loading ? 'Authenticating System...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              Demo Credentials
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Quick Fills */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillDemo('ADMIN')}
              className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/30 text-slate-300 hover:text-white rounded-xl py-2.5 px-3 text-xs transition-all flex flex-col items-center gap-1"
            >
              <span className="font-bold text-amber-500">ADMIN</span>
              <span className="text-[10px] text-slate-500">Full Access</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('SUPERVISOR')}
              className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/30 text-slate-300 hover:text-white rounded-xl py-2.5 px-3 text-xs transition-all flex flex-col items-center gap-1"
            >
              <span className="font-bold text-amber-500">SUPERVISOR</span>
              <span className="text-[10px] text-slate-500">Restricted RBAC</span>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
