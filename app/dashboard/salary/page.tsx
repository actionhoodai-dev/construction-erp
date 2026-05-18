'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  totalSalary: number;
  paidStatus: 'PAID' | 'UNPAID' | 'PENDING';
  createdAt: string;
  employee: {
    id: string;
    name: string;
    role: string;
    salaryType: string;
  };
}

interface EmployeeOption {
  id: string;
  name: string;
  role: string;
}

export default function SalaryPage() {
  const { hasReadPermission, hasWritePermission, loading } = useAuth();
  const router = useRouter();

  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [uiLoading, setUiLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState('2026-05');
  const [totalSalary, setTotalSalary] = useState('');
  const [paidStatus, setPaidStatus] = useState('PENDING');
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const canRead = hasReadPermission('Salary');
  const canWrite = hasWritePermission('Salary');

  useEffect(() => {
    // Access guard
    if (!loading && !canRead) {
      router.push('/dashboard');
    }
  }, [canRead, loading, router]);

  const fetchSalaries = async () => {
    try {
      setUiLoading(true);
      setError('');

      const res = await fetch('/api/salary');

      if (!res.ok) {
        throw new Error('Failed to retrieve payroll records.');
      }

      const data = await res.json();
      setSalaries(data);

      // Fetch employees for dropdown select (only if writer is logging wages)
      if (canWrite) {
        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData.map((e: any) => ({ id: e.id, name: e.name, role: e.role })));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection error.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (canRead && !loading) {
      fetchSalaries();
    }
  }, [canRead, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!employeeId || !month || totalSalary === undefined || !paidStatus) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(month)) {
      setError('Month must be in standard YYYY-MM format (e.g. 2026-05).');
      return;
    }

    const numSalary = parseFloat(totalSalary);
    if (isNaN(numSalary) || numSalary < 0) {
      setError('Total salary must be a positive number.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          month,
          totalSalary: numSalary,
          paidStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payroll ledger.');
      }

      setSuccess('Salary payroll record logged/updated successfully!');
      setEmployeeId('');
      setTotalSalary('');
      setFormOpen(false);
      fetchSalaries(); // Reload list
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || uiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        </div>
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payroll Ledger System
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Log contractor payouts, track monthly compensation, and manage wage disbursal schedules.
          </p>
        </div>
        
        {canWrite && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/10 transition-all"
          >
            {formOpen ? 'Close Panel' : '+ Log Payroll'}
          </button>
        )}
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs py-3 px-4 rounded-xl font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Log Salary Form Drawer (Visible on canWrite & formOpen) */}
      {canWrite && formOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-[slideDown_0.2s_ease-out]">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Log / Update Employee Payroll Record
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Select Employee</label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              >
                <option value="">-- Choose Laborer --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Payroll Cycle Month</label>
              <input
                type="text"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="YYYY-MM (e.g. 2026-05)"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Total Compensation (₹)</label>
              <input
                type="number"
                required
                value={totalSalary}
                onChange={(e) => setTotalSalary(e.target.value)}
                placeholder="e.g. 25000"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Disbursal Status</label>
              <select
                value={paidStatus}
                onChange={(e) => setPaidStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none animate-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="UNPAID">UNPAID</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
              >
                {submitting ? 'Logging...' : 'Save Payroll'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Salary Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Employee Name</th>
                <th className="py-4 px-6">Role/Title</th>
                <th className="py-4 px-6">Billing Month</th>
                <th className="py-4 px-6">Payout Value</th>
                <th className="py-4 px-6">Disbursal State</th>
                <th className="py-4 px-6">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No payroll entries recorded in database yet.
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-6 font-extrabold text-slate-800">
                      {s.employee?.name || 'Deleted Worker'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-bold">
                      {s.employee?.role || 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 font-bold">
                      {s.month}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-950 text-sm">
                      ₹{s.totalSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      {s.paidStatus === 'PAID' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-green-50 text-green-600 border border-green-100 uppercase">
                          Paid
                        </span>
                      ) : s.paidStatus === 'PENDING' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-100 uppercase">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
