'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ModuleCard {
  name: string;
  module: string;
  description: string;
  path: string;
  glowColor: string;
  icon: React.ReactNode;
}

export default function SupervisorDashboardPage() {
  const { user, hasReadPermission } = useAuth();

  // Definition of ERP Modules
  const modulesList: ModuleCard[] = [
    {
      name: 'Employees Directory',
      module: 'Employees',
      description: 'Manage workforce logs, check contractor positions, and track job assignments.',
      path: '/dashboard/employees',
      glowColor: 'group-hover:border-indigo-500/30 group-hover:shadow-indigo-500/10 text-indigo-400 bg-indigo-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Project Sites Tracker',
      module: 'Projects',
      description: 'Track ongoing construction stages, coordinate locations, and inspect material allocation.',
      path: '/dashboard/projects',
      glowColor: 'group-hover:border-pink-500/30 group-hover:shadow-pink-500/10 text-pink-400 bg-pink-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Material & Warehouse Stock',
      module: 'Inventory',
      description: 'Monitor building materials supply ledger, dispatch stocks to sites, and update quantities.',
      path: '/dashboard/inventory',
      glowColor: 'group-hover:border-amber-500/30 group-hover:shadow-amber-500/10 text-amber-400 bg-amber-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Payroll Ledger',
      module: 'Salary',
      description: 'Log monthly contractor payouts, calculate hourly/daily wages, and verify payment states.',
      path: '/dashboard/salary',
      glowColor: 'group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10 text-emerald-400 bg-emerald-500/10',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'System Audit Logs',
      module: 'AuditLogs',
      description: 'Inspect transaction trials, operations records, and track database modification entries.',
      path: '/dashboard/audit',
      glowColor: 'group-hover:border-zinc-450/30 group-hover:shadow-zinc-500/10 text-zinc-400 bg-zinc-900',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // Filter modules based on dynamic RBAC permissions
  const allowedModules = modulesList.filter((m) => hasReadPermission(m.module));

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Welcome Banner with glowing accent */}
      <div className="relative rounded-[2.2rem] overflow-hidden p-8 border border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900 to-pink-950/10 shadow-2xl">
        <div className="absolute top-[-20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-[80px] pointer-events-none animate-pulse-glow" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_2px_rgba(236,72,153,0.4)] animate-ping" />
              <span className="text-[10px] uppercase font-black tracking-widest text-pink-400 font-mono">
                Supervisor Center
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">{user?.name}</span>!
            </h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-2xl font-medium leading-relaxed">
              Your security-authenticated access key lists all authorized ERP pipelines below. Select a module bento card to launch operations.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-center font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Sync: OK</span>
          </div>
        </div>
      </div>

      {/* Allowed Modules Grid */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono pl-1">
          Authorized Operation Modules
        </h2>

        {allowedModules.length === 0 ? (
          /* Empty / Restricted State */
          <div className="glass-panel border border-amber-500/20 rounded-[2.2rem] p-10 text-center max-w-xl mx-auto flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-white text-lg">Granular Access Key Unresolved</h3>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              Your supervisor credentials do not possess any module-level read permissions. 
              Please contact the system administrator (<code className="text-indigo-400">admin@company.com</code>) to configure your permission parameters.
            </p>
          </div>
        ) : (
          /* Bento Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allowedModules.map((m) => (
              <Link
                key={m.path}
                href={m.path}
                className={`rn-spring-btn glass-panel glass-panel-hover p-6 rounded-[2rem] shadow-2xl flex flex-col gap-5 group relative border border-zinc-900/60 overflow-hidden`}
              >
                {/* Dynamic corner glowing gradient */}
                <div className="absolute top-[-20%] right-[-20%] w-[100px] h-[100px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-[30px]" />
                
                {/* Visual Icon with dynamic style */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-inner ${m.glowColor}`}>
                  {m.icon}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="font-extrabold text-white text-lg leading-tight group-hover:text-indigo-400 transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform self-start mt-2 font-mono uppercase tracking-wider">
                  Launch Panel <span className="transition-all group-hover:pl-0.5">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
