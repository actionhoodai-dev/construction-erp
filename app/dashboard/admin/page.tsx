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
      <div className="flex flex-col gap-8 animate-pulse select-none">
        <div className="h-10 w-64 bg-zinc-900 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-zinc-900 rounded-[2rem] border border-zinc-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-900 rounded-[2rem] border border-zinc-800" />
          <div className="h-96 bg-zinc-900 rounded-[2rem] border border-zinc-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border border-red-500/20 rounded-[2rem] p-8 text-center max-w-xl mx-auto flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-red-400 font-extrabold text-xl">Operational Pipeline Offline</h3>
        <p className="text-zinc-400 text-sm max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rn-spring-btn mt-2 bg-gradient-to-r from-red-600 to-red-500 hover:opacity-95 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/15 cursor-pointer"
        >
          Reconnect API Gateway
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* Dynamic Greetings with Flutter style gradient header card */}
      <div className="relative rounded-[2.2rem] overflow-hidden p-8 border border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/20 shadow-2xl">
        <div className="absolute top-[-20%] right-[-5%] w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none animate-pulse-glow" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{user?.name}</span>!
            </h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-2xl font-medium leading-relaxed">
              Real-time enterprise dashboard displaying integrated ledger statistics, field personnel allocations, and site materials procurement.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Operations: Active</span>
          </div>
        </div>
      </div>

      {/* Flutter style glowing KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Employees */}
        <div className="glass-panel glass-panel-hover rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Laborers
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <div>
            <span className="text-4xl font-black text-white tracking-tight">
              {stats.totalEmployees}
            </span>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full w-2/3" />
            </div>
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className="glass-panel glass-panel-hover rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Active Sites
              </span>
            </div>
            <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">SITES</span>
          </div>
          <div>
            <span className="text-4xl font-black text-white tracking-tight">
              {stats.activeProjects}
            </span>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full w-1/2" />
            </div>
          </div>
        </div>

        {/* Card 3: Inventory */}
        <div className="glass-panel glass-panel-hover rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Material Items
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">STOCKS</span>
          </div>
          <div>
            <span className="text-4xl font-black text-white tracking-tight">
              {stats.totalInventoryItems}
            </span>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-3/4" />
            </div>
          </div>
        </div>

        {/* Card 4: Financial Expenditure */}
        <div className="glass-panel glass-panel-hover rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Expenditures
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">PAYROLL</span>
          </div>
          <div>
            <span className="text-3xl font-black text-white tracking-tight">
              ₹{stats.totalExpenditure.toLocaleString('en-IN')}
            </span>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full w-2/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Areas styled like high-end widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Action Trail Log Widget (Span 2) */}
        <div className="glass-panel rounded-[2rem] shadow-2xl overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-6 border-b border-zinc-900/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                System Action Trail
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Real-time Activity Log</p>
            </div>
            <Link
              href="/dashboard/audit"
              className="rn-spring-btn text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 cursor-pointer"
            >
              Full Trail
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-900/40 border-b border-zinc-900/60 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">User Operator</th>
                  <th className="py-4 px-6">Action Code</th>
                  <th className="py-4 px-6">Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-500 font-bold">
                      No system events logged in this operational period.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-4 px-6 text-zinc-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-zinc-300">
                        {log.user?.name || 'System Operator'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-[10px] font-black bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-indigo-400 uppercase tracking-widest text-[10px]">
                        {log.module}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Pane: Site Projects & Shortcut Dashboard */}
        <div className="flex flex-col gap-8">
          
          {/* Projects tracker card */}
          <div className="glass-panel rounded-[2rem] p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Active Projects
                </h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Site Allocations</p>
              </div>
              <Link
                href="/dashboard/projects"
                className="rn-spring-btn text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-1.5 cursor-pointer uppercase tracking-wider"
              >
                Sites
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {projectsList.length === 0 ? (
                <p className="text-center text-zinc-500 text-xs py-8 font-bold">
                  No active project records created.
                </p>
              ) : (
                projectsList.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-zinc-900/60 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-bold uppercase tracking-wider">{p.location}</p>
                    </div>
                    <div>
                      {p.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                          Active
                        </span>
                      ) : p.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                          Done
                        </span>
                      ) : p.status === 'PLANNING' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                          Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest">
                          Hold
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Shortcuts with beautiful dark gradients */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/20 border border-zinc-800 rounded-[2rem] p-6 text-white flex flex-col gap-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Quick Ledger Actions</h3>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium leading-relaxed">
                Expedite operational workflows by generating supervisor allocations, labor entries or material registries directly.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
              <Link
                href="/dashboard/employees"
                className="rn-spring-btn bg-zinc-950 border border-zinc-850 hover:border-indigo-500/40 text-center font-bold py-3 px-3 rounded-2xl transition-all cursor-pointer text-zinc-300 hover:text-white"
              >
                + Laborer
              </Link>
              <Link
                href="/dashboard/inventory"
                className="rn-spring-btn bg-zinc-950 border border-zinc-850 hover:border-pink-500/40 text-center font-bold py-3 px-3 rounded-2xl transition-all cursor-pointer text-zinc-300 hover:text-white"
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
