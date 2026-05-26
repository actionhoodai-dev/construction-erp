'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface MenuItem {
  name: string;
  path: string;
  module: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasReadPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authenticate / Redirect Lock
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 select-none">
        {/* Glowing loader */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 blur-lg opacity-40 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-2xl relative shadow-2xl animate-bounce">
              CX
            </div>
          </div>
          <div className="h-1 w-36 bg-zinc-900 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full animate-[loading_1.5s_infinite] w-1/2" />
          </div>
          <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
            Syncing Operations Ledger...
          </p>
        </div>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  // Root landing path based on role
  const dashboardHome = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/supervisor';

  // Standard menu items mapped to DB Module Names
  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: dashboardHome,
      module: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'Employees',
      path: '/dashboard/employees',
      module: 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Attendance',
      path: '/dashboard/attendance',
      module: 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-12 5h12m-9 3h2m-2 3h2m4-6h4m-4 3h4m-4 3h4" />
        </svg>
      ),
    },
    {
      name: 'Projects',
      path: '/dashboard/projects',
      module: 'Projects',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Inventory',
      path: '/dashboard/inventory',
      module: 'Inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Payroll',
      path: '/dashboard/salary',
      module: 'Salary',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Access',
      path: '/dashboard/supervisors',
      module: 'Supervisors',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Audit Logs',
      path: '/dashboard/audit',
      module: 'AuditLogs',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
      module: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Dynamically filter sidebar menus
  const visibleMenuItems = menuItems.filter(
    (item) => item.module === 'Dashboard' || hasReadPermission(item.module)
  );

  // Bottom Navigation Bar Items (limit to top 5 primary pages for Flutter/React Native style layout)
  const bottomNavItems = visibleMenuItems.slice(0, 5);

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR: Beautiful floating pill container */}
      <aside className="hidden md:flex md:flex-col w-72 p-5 h-screen sticky top-0 bg-zinc-950 border-r border-zinc-900 z-30">
        
        {/* Brand Container with Glass Accent */}
        <div className="h-16 px-4 mb-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-indigo-500/10">
            CX
          </div>
          <span className="font-black text-white tracking-tight text-lg">
            Construx<span className="text-indigo-400">ERP</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-1 overflow-y-auto space-y-1 scrollbar-none">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`rn-spring-btn flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-indigo-500 rounded-full" />
                )}
                <span className={isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-indigo-400 transition-all'}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card inside Sidebar */}
        <div className="p-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col gap-4 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-extrabold text-sm text-white shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-bold uppercase tracking-wider">
                {user.role}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="rn-spring-btn w-full bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:text-red-400 text-xs font-bold py-3 px-3 rounded-2xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay for drawer-like look */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 p-5 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300 transform md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 mb-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-black text-white text-sm">
              CX
            </div>
            <span className="font-extrabold text-white tracking-tight text-sm">
              Construx<span className="text-indigo-400">ERP</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-1 overflow-y-auto space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-zinc-500'}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-4 mt-auto">
          <button
            onClick={logout}
            className="w-full bg-zinc-900 border border-zinc-800 text-red-400 text-xs font-bold py-3 px-3 rounded-2xl text-center flex items-center justify-center gap-2"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. BODY FRAME: Perfectly responsive container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        
        {/* Top Header Bar styled like clean iOS navbar */}
        <header className="h-20 bg-zinc-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20 border-b border-zinc-900/60">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle (drawer icon) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-xl md:hidden outline-none cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Title / Module Name Indicator */}
            <div className="text-lg font-black text-white capitalize select-none tracking-tight">
              {pathname.split('/').slice(-1)[0].replace('-', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Role Badge in high-end Flutter Pill Format */}
            {user.role === 'ADMIN' ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                Admin Console
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-pink-500/10 text-pink-400 border border-pink-500/20 uppercase tracking-wider">
                Supervisor Portal
              </span>
            )}

            <div className="w-px h-6 bg-zinc-800 hidden sm:block" />

            <span className="text-xs font-semibold text-zinc-500 select-none hidden sm:inline uppercase tracking-widest font-mono">
              Construx Cloud
            </span>
          </div>
        </header>

        {/* Main Content Workspace with custom smooth scroll styling */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-28 md:pb-8 bg-zinc-950/40">
          <div className="max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>

        {/* 3. FLUTTER/REACT NATIVE MOBILE BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/80 flex items-center justify-around px-4 z-30 md:hidden pb-4">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="rn-spring-btn flex flex-col items-center gap-1.5 text-center flex-1 py-1 cursor-pointer"
              >
                <div className={`p-2 rounded-2xl transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20 scale-110 active-tab-glow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold tracking-tight transition-all ${
                  isActive ? 'text-white' : 'text-zinc-500'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
