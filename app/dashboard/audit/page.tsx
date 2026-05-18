'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  timestamp: string;
  details: any;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function AuditLogsPage() {
  const { hasReadPermission, loading } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [uiLoading, setUiLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering States
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const canRead = hasReadPermission('AuditLogs');

  useEffect(() => {
    // Access guard
    if (!loading && !canRead) {
      router.push('/dashboard');
    }
  }, [canRead, loading, router]);

  const fetchLogs = async () => {
    try {
      setUiLoading(true);
      setError('');
      const res = await fetch('/api/audit');

      if (!res.ok) {
        throw new Error('Failed to retrieve system audit logs.');
      }

      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection error.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (canRead && !loading) {
      fetchLogs();
    }
  }, [canRead, loading]);

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Filter logs locally in real-time
  const filteredLogs = logs.filter((log) => {
    const matchesModule = moduleFilter ? log.module === moduleFilter : true;
    const matchesUser = searchUser
      ? (log.user?.name || 'System Operator')
          .toLowerCase()
          .includes(searchUser.toLowerCase())
      : true;
    return matchesModule && matchesUser;
  });

  if (loading || uiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-16 bg-slate-200 rounded-2xl border border-slate-200" />
        <div className="h-96 bg-slate-200 rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <h2 className="text-red-500 font-bold text-lg">Access Denied</h2>
        <p className="text-slate-500 text-xs">You do not have permissions to read this module.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          System Audit Trail
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review immutable, database-backed security logs, contractor check-ins, inventory disbursements, and ledger changes.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          {/* User search */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Search by Operator Name..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2 text-xs transition-all outline-none"
            />
          </div>

          {/* Module Filter */}
          <div className="min-w-[160px] w-full sm:w-auto">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2 text-xs transition-all outline-none"
            >
              <option value="">All System Modules</option>
              <option value="Inventory">Inventory</option>
              <option value="Employees">Employees</option>
              <option value="Projects">Projects</option>
              <option value="Salary">Salary</option>
              <option value="AuditLogs">Audit Trail</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 border border-slate-200 font-bold text-xs py-2 px-4 rounded-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.21" />
          </svg>
          Refresh Trail
        </button>
      </div>

      {/* Audit Logs Table Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Acting Operator</th>
                <th className="py-4 px-6">System Role</th>
                <th className="py-4 px-6">Action Code</th>
                <th className="py-4 px-6">Module</th>
                <th className="py-4 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No matching audit records captured in database.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/20 transition-all">
                        <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-800">
                          {log.user?.name || 'System Operator'}
                        </td>
                        <td className="py-4 px-6">
                          {log.user ? (
                            log.user.role === 'ADMIN' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                Supervisor
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-200/50 uppercase">
                              System
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-500">
                          {log.module}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => toggleExpandLog(log.id)}
                            className="bg-slate-50 hover:bg-amber-500/10 text-slate-600 hover:text-amber-600 border border-slate-200/60 hover:border-amber-500/20 font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all"
                          >
                            {isExpanded ? 'Hide Payload' : 'View Payload'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Collapsible Action Payload Details Viewer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-t border-slate-100">
                          <td colSpan={6} className="py-4 px-6">
                            <div className="bg-slate-950 text-slate-300 font-mono text-[10px] p-4 rounded-xl border border-slate-800 overflow-x-auto shadow-inner flex flex-col gap-2 max-w-full">
                              <p className="font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-1.5">
                                Transaction Context Details Payload
                              </p>
                              {log.details ? (
                                <pre className="whitespace-pre-wrap leading-relaxed select-all">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              ) : (
                                <span className="text-slate-500 font-medium">
                                  No transaction metadata attached.
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
