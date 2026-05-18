'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ModuleCard {
  name: string;
  module: string;
  description: string;
  path: string;
  colorClass: string;
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
      colorClass: 'from-amber-600/10 to-amber-500/5 text-amber-600 border-amber-500/20 hover:border-amber-500/50',
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
      colorClass: 'from-blue-600/10 to-blue-500/5 text-blue-600 border-blue-500/20 hover:border-blue-500/50',
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
      colorClass: 'from-teal-600/10 to-teal-500/5 text-teal-600 border-teal-500/20 hover:border-teal-500/50',
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
      colorClass: 'from-emerald-600/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:border-emerald-500/50',
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
      colorClass: 'from-slate-600/10 to-slate-500/5 text-slate-600 border-slate-500/20 hover:border-slate-500/50',
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
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col gap-2 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_0%,rgba(245,158,11,0.1),rgba(255,255,255,0))] pointer-events-none" />
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">
            Supervisor Operations Center
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-2xl mt-1 leading-relaxed">
          Your portal contains granular, security-approved modules. Select any module card below to begin site management operations.
        </p>
      </div>

      {/* Allowed Modules Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
          Authorized Operation Modules
        </h2>

        {allowedModules.length === 0 ? (
          /* Empty / Restricted State */
          <div className="bg-amber-500/5 border border-amber-500/20 text-amber-800 rounded-2xl p-8 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="font-bold text-slate-900 text-base">Restricted Access Key</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              No module permissions are assigned to your supervisor profile yet. 
              Please contact the system administrator (`admin@company.com`) to activate your module permissions.
            </p>
          </div>
        ) : (
          /* Bento Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allowedModules.map((m) => (
              <Link
                key={m.path}
                href={m.path}
                className={`bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group relative ${m.colorClass}`}
              >
                {/* Visual Glow */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center transition-all group-hover:scale-105">
                  {m.icon}
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <h3 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-slate-900 transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform self-start mt-2">
                  Launch Module <span className="transition-all group-hover:pl-0.5">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
