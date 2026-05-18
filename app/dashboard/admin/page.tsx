'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  totalInventoryItems: number;
  paidSalariesCount: number;
  totalExpenditure: number;
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeProjects: 0,
    totalInventoryItems: 0,
    paidSalariesCount: 0,
    totalExpenditure: 0,
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [uiLoading, setUiLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prevent non-admins from viewing this page
    if (!loading && user && user.role !== 'ADMIN') {
      router.push('/dashboard/supervisor');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;

    const fetchDashboardData = async () => {
      try {
        setUiLoading(true);
        setError('');

        // Fetch all data in parallel (cookies are automatically attached)
        const [empRes, projRes, invRes, salRes, audRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/projects'),
          fetch('/api/inventory'),
          fetch('/api/salary'),
          fetch('/api/audit'),
        ]);

        if (!empRes.ok || !projRes.ok || !invRes.ok || !salRes.ok || !audRes.ok) {
          throw new Error('Failed to fetch some dashboard resources.');
        }

        const employees = await empRes.json();
        const projects = await projRes.json();
        const inventory = await invRes.json();
        const salaries = await salRes.json();
        const audits = await audRes.json();

        // Calculate statistics
        const activeProjs = projects.filter((p: any) => p.status === 'IN_PROGRESS').length;
        const totalExp = salaries.reduce((acc: number, cur: any) => acc + cur.totalSalary, 0);
        const paidCount = salaries.filter((s: any) => s.paidStatus === 'PAID').length;

        setStats({
          totalEmployees: employees.length,
          activeProjects: activeProjs,
          totalInventoryItems: inventory.length,
          paidSalariesCount: paidCount,
          totalExpenditure: totalExp,
        });

        setAuditLogs(audits.slice(0, 5)); // Get recent 5 logs
        setProjectsList(projects.slice(0, 4)); // Get top 4 projects
      } catch (err: any) {
        console.error('Failed to load admin stats:', err);
        setError(err.message || 'Server connection error.');
      } finally {
        setUiLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, loading]);

  if (loading || uiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl border border-slate-200" />
          <div className="h-96 bg-slate-200 rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-red-800 font-bold text-lg">System Dashboard Failed</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here is a high-level operational overview of your construction projects, labor, and assets.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Employees */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Laborers
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalEmployees}
            </span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-2/3" />
            </div>
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Sites
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.activeProjects}
            </span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full w-1/2" />
            </div>
          </div>
        </div>

        {/* Card 3: Inventory */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Material Items
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalInventoryItems}
            </span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full w-3/4" />
            </div>
          </div>
        </div>

        {/* Card 4: Financial Expenditure */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Payroll Exp.
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{stats.totalExpenditure.toLocaleString('en-IN')}
            </span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-2/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections: Project Summary & Audit logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Audit Logs Column (Col-Span 2) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent System Action Trail
            </h2>
            <Link
              href="/dashboard/audit"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              View Full Logs →
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Acting User</th>
                  <th className="py-3 px-5">Action Code</th>
                  <th className="py-3 px-5">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No system events logged in this cycle yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700">
                        {log.user?.name || 'System Operator'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-500">
                        {log.module}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Info Column: Projects & Shortcut Cards */}
        <div className="flex flex-col gap-6">
          {/* Projects Tracker */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Site Projects Status
              </h2>
              <Link
                href="/dashboard/projects"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Manage Sites →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {projectsList.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-6 font-medium">
                  No active project records created yet.
                </p>
              ) : (
                projectsList.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.location}</p>
                    </div>
                    <div>
                      {p.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100">
                          Active
                        </span>
                      ) : p.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-green-50 text-green-600 border border-green-100">
                          Completed
                        </span>
                      ) : p.status === 'PLANNING' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100">
                          Planning
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-100">
                          On Hold
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 text-white flex flex-col gap-4 shadow-xl">
            <div>
              <h3 className="font-bold text-sm text-white">System Actions Shortcuts</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Trigger database operations directly.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
              <Link
                href="/dashboard/employees"
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-center font-semibold py-2.5 px-3 rounded-xl transition-all"
              >
                + Laborer
              </Link>
              <Link
                href="/dashboard/inventory"
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-center font-semibold py-2.5 px-3 rounded-xl transition-all"
              >
                + Materials
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
