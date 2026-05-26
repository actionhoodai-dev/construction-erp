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
      let authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      let authData = await authResponse.json();

      // Auto-register convenience fallback for testing
      if (authResponse.status === 401 && (email === 'admin@company.com' || email === 'supervisor@company.com')) {
        setError('Setting up your demo account on first access...');
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
    <main className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 relative overflow-hidden select-none">
      {/* Flutter style background fluid shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Floating abstract structural lines (construction visual theme) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Login Card Container */}
      <div className="w-full max-w-[420px] z-10">
        <div className="glass-panel rounded-[2rem] p-8 shadow-2xl relative flex flex-col gap-6">
          
          {/* Top Indicator representing mobile device notch/handle */}
          <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 opacity-50" />

          {/* Brand Header */}
          <div className="text-center flex flex-col gap-2 mt-2">
            <div className="inline-flex items-center justify-center self-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-extrabold text-2xl tracking-tighter shadow-lg shadow-indigo-500/20">
              CX
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mt-3">
              Construx<span className="text-indigo-400">ERP</span>
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              Enterprise Mobile Operations Portal
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-2xl text-center font-semibold animate-[bounce_0.5s_ease-out-1]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider pl-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="glass-input text-white rounded-2xl px-5 py-4 text-sm transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider pl-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input text-white rounded-2xl px-5 py-4 text-sm transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rn-spring-btn mt-3 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Syncing Portal...
                </>
              ) : 'Sign In to Portal'}
            </button>
          </form>

          {/* Flutter-style Bottom Sheet Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
              Tap to Autofill Demo
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Quick Fills styled like dynamic Flutter Cards */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => fillDemo('ADMIN')}
              className="rn-spring-btn bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 rounded-2xl py-3 px-4 text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer text-left"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 self-end -mr-1 -mt-1 shadow-[0_0_8px_1px_rgba(99,102,241,0.5)]" />
              <span className="font-extrabold text-white uppercase tracking-wider text-center w-full">ADMIN</span>
              <span className="text-[10px] text-zinc-500 text-center font-medium">Full Enterprise Access</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('SUPERVISOR')}
              className="rn-spring-btn bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-pink-500/40 rounded-2xl py-3 px-4 text-xs transition-all flex flex-col items-center gap-1.5 cursor-pointer text-left"
            >
              <div className="w-2 h-2 rounded-full bg-pink-500 self-end -mr-1 -mt-1 shadow-[0_0_8px_1px_rgba(236,72,153,0.5)]" />
              <span className="font-extrabold text-white uppercase tracking-wider text-center w-full">SUPERVISOR</span>
              <span className="text-[10px] text-zinc-500 text-center font-medium">Restricted RBAC Roles</span>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
