'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  location: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  createdAt: string;
  inventoryItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
}

export default function ProjectsPage() {
  const { hasReadPermission, hasWritePermission, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [uiLoading, setUiLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const canRead = hasReadPermission('Projects');
  const canWrite = hasWritePermission('Projects');

  useEffect(() => {
    // Access guard
    if (!loading && !canRead) {
      router.push('/dashboard');
    }
  }, [canRead, loading, router]);

  const fetchProjects = async () => {
    try {
      setUiLoading(true);
      setError('');
      const res = await fetch('/api/projects');

      if (!res.ok) {
        throw new Error('Failed to retrieve project sites.');
      }

      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection error.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (canRead && !loading) {
      fetchProjects();
    }
  }, [canRead, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!name || !location || !status) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, location, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project.');
      }

      setSuccess('Project site registered successfully!');
      setName('');
      setLocation('');
      setFormOpen(false);
      fetchProjects(); // Reload list
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl border border-slate-200" />
          ))}
        </div>
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
            Project Sites Manager
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track active construction projects, coordinate sites, and monitor inventory distribution.
          </p>
        </div>
        
        {canWrite && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/10 transition-all"
          >
            {formOpen ? 'Close Panel' : '+ Register Site'}
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

      {/* Add Project Form Drawer (Visible on canWrite & formOpen) */}
      {canWrite && formOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-[slideDown_0.2s_ease-out]">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Register New Project Site
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Project Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corporate Tech Center"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Site Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Chennai, TN"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ON_HOLD">ON HOLD</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 mt-2 flex justify-end gap-3">
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
                {submitting ? 'Registering...' : 'Save Site'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-bold">
            No project sites registered in database yet.
          </div>
        ) : (
          projects.map((proj) => (
            <div key={proj.id} className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
              
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-800 text-base truncate">{proj.name}</h3>
                  <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{proj.location}</p>
                </div>
                
                {/* Badge styling */}
                {proj.status === 'IN_PROGRESS' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                    Active
                  </span>
                ) : proj.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-green-50 text-green-600 border border-green-100 uppercase">
                    Completed
                  </span>
                ) : proj.status === 'PLANNING' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                    Planning
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-100 uppercase">
                    On Hold
                  </span>
                )}
              </div>

              {/* Allocated Materials */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Allocated Material Inventory
                </p>
                {!proj.inventoryItems || proj.inventoryItems.length === 0 ? (
                  <p className="text-slate-400 text-[11px] font-medium py-1">
                    No items dispatched to this project site yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                    {proj.inventoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b border-slate-200/50 pb-1">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="font-extrabold text-slate-800 whitespace-nowrap">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-[10px] text-slate-400 text-right font-medium">
                Registered: {new Date(proj.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
