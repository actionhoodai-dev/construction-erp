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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl animate-bounce">
            CX
          </div>
          <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 bg-amber-500 rounded-full animate-[loading_1.5s_infinite] w-1/2" />
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Loading Enterprise Portal...
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
      module: 'Dashboard', // Dashboard always visible
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'Employees',
      path: '/dashboard/employees',
      module: 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Daily Attendance',
      path: '/dashboard/attendance',
      module: 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-12 5h12m-9 3h2m-2 3h2m4-6h4m-4 3h4m-4 3h4" />
        </svg>
      ),
    },
    {
      name: 'Projects',
      path: '/dashboard/projects',
      module: 'Projects',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Inventory',
      path: '/dashboard/inventory',
      module: 'Inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Salary / Payroll',
      path: '/dashboard/salary',
      module: 'Salary',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Supervisors & Access',
      path: '/dashboard/supervisors',
      module: 'Supervisors',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Audit Logs',
      path: '/dashboard/audit',
      module: 'AuditLogs',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Dynamically filter sidebar menus
  const visibleMenuItems = menuItems.filter(
    (item) => item.module === 'Dashboard' || hasReadPermission(item.module)
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. SIDEBAR (Desktop: fixed, Mobile: sliding overlay) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 transition-transform duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:flex md:flex-col`}
      >
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center font-extrabold text-slate-950 text-sm">
            CX
          </div>
          <span className="font-extrabold text-white tracking-tight text-lg">
            Construx<span className="text-amber-500">ERP</span>
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-amber-500 transition-all'}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card inside Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 border border-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full bg-slate-800/80 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-700/80 text-xs font-bold py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-20 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. BODY FRAME */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden outline-none"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Path indicator */}
            <div className="text-sm font-bold text-slate-800 capitalize select-none hidden sm:block">
              {pathname.split('/').slice(-1)[0].replace('-', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Role Badge */}
            {user.role === 'ADMIN' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wide">
                Admin Portal
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                Supervisor
              </span>
            )}

            <div className="w-px h-6 bg-slate-200" />

            <span className="text-xs font-semibold text-slate-500 select-none hidden md:inline">
              Site Operations Portal
            </span>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
