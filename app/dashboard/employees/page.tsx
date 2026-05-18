'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  salaryType: string;
  createdAt: string;
}

export default function EmployeesPage() {
  const { hasReadPermission, hasWritePermission, loading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [uiLoading, setUiLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Mason');
  const [salaryType, setSalaryType] = useState('DAILY');
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const canRead = hasReadPermission('Employees');
  const canWrite = hasWritePermission('Employees');

  useEffect(() => {
    // Access guard: Redirect if unauthenticated or no read rights
    if (!loading && !canRead) {
      router.push('/dashboard');
    }
  }, [canRead, loading, router]);

  const fetchEmployees = async () => {
    try {
      setUiLoading(true);
      setError('');
      const res = await fetch('/api/employees');

      if (!res.ok) {
        throw new Error('Failed to retrieve employees directory.');
      }

      const data = await res.json();
      setEmployees(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection error.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (canRead && !loading) {
      fetchEmployees();
    }
  }, [canRead, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!name || !phone || !role || !salaryType) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, role, salaryType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register employee.');
      }

      setSuccess('Employee registered successfully!');
      setName('');
      setPhone('');
      setFormOpen(false);
      fetchEmployees(); // Reload list
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
            Workforce Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Maintain employee records, contract positions, phone directories, and wage schemas.
          </p>
        </div>
        
        {canWrite && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/10 transition-all"
          >
            {formOpen ? 'Close Panel' : '+ Register Laborer'}
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

      {/* Add Employee Form Drawer (Visible on canWrite & formOpen) */}
      {canWrite && formOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-[slideDown_0.2s_ease-out]">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Register New Employee
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sivam"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">System Role/Title</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              >
                <option value="Mason">Mason</option>
                <option value="Laborer">Laborer</option>
                <option value="Electrician">Electrician</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Engineer">Engineer</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Salary Schema</label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              >
                <option value="DAILY">DAILY (Wages)</option>
                <option value="MONTHLY">MONTHLY (Salary)</option>
                <option value="HOURLY">HOURLY (Wages)</option>
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
                {submitting ? 'Registering...' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Table Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Role/Title</th>
                <th className="py-4 px-6">Salary Type</th>
                <th className="py-4 px-6">Date Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    No laborers registered in database yet.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-6 font-extrabold text-slate-800">
                      {emp.name}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {emp.phone}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-500">
                      {emp.salaryType}
                    </td>
                    <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                      {new Date(emp.createdAt).toLocaleDateString('en-IN', {
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
