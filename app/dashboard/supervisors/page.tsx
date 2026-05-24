'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface PermissionRecord {
  id: string;
  moduleId: string;
  canRead: boolean;
  canWrite: boolean;
  module: {
    name: string;
  };
}

interface Supervisor {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
    location: string;
  } | null;
  permissions: PermissionRecord[];
}

interface ERPModule {
  id: string;
  name: string;
}

interface ProjectSite {
  id: string;
  name: string;
  location: string;
}

export default function SupervisorsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [modules, setModules] = useState<ERPModule[]>([]);
  const [projects, setProjects] = useState<ProjectSite[]>([]);
  const [uiLoading, setUiLoading] = useState(true);

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editPermsModalOpen, setEditPermsModalOpen] = useState(false);
  const [assignProjectModalOpen, setAssignProjectModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form payloads
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  
  // Selected target for edits/deletions
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Record<string, { canRead: boolean; canWrite: boolean }>>({});
  const [targetProjectId, setTargetProjectId] = useState('');

  // Operation flags
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Access guard: strictly ADMIN only
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);

  // Fetch supervisors directory, module index, and projects
  const fetchData = async () => {
    try {
      setUiLoading(true);
      setError('');
      const res = await fetch('/api/supervisors');
      if (!res.ok) {
        throw new Error('Failed to retrieve supervisors and permissions catalog.');
      }
      const data = await res.json();
      setSupervisors(data.supervisors || []);
      setModules(data.modules || []);
      setProjects(data.projects || []);
    } catch (err: unknown) {
      const errorVal = err as Error;
      console.error(errorVal);
      setError(errorVal.message || 'Failed to connect to secure portal API.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !loading) {
      const timer = setTimeout(() => {
        fetchData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, loading]);

  // Calculate Metrics
  const stats = useMemo(() => {
    const total = supervisors.length;
    const active = supervisors.filter((s) => s.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [supervisors]);

  // Client-side search and filters mapping
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && s.isActive) ||
        (filterStatus === 'INACTIVE' && !s.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [supervisors, searchQuery, filterStatus]);

  // Handle account creation
  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newName || !newEmail || !newPassword) {
      setError('All credential fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          projectId: newProjectId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register supervisor account.');
      }

      setSuccess(`Account for ${newName} created successfully! Default permissions seeded.`);
      setCreateModalOpen(false);
      
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewProjectId('');

      // Reload
      fetchData();
    } catch (err: unknown) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/inactive account status immediately
  const handleToggleStatus = async (supervisor: Supervisor) => {
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/supervisors/${supervisor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !supervisor.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle account status.');
      }

      setSuccess(`Account for ${supervisor.name} ${!supervisor.isActive ? 'activated' : 'deactivated'} successfully.`);
      fetchData();
    } catch (err: unknown) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Operation failed.');
    }
  };

  // Prepare Project Site Assignment Modal
  const openAssignProject = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setTargetProjectId(supervisor.projectId || '');
    setError('');
    setSuccess('');
    setAssignProjectModalOpen(true);
  };

  // Handle Project Assignment
  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisor) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/supervisors/${selectedSupervisor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: targetProjectId || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign project site.');
      }

      setSuccess(`Project site assignment updated successfully for ${selectedSupervisor.name}.`);
      setAssignProjectModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare Permission Grid Modal
  const openEditPermissions = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setError('');
    setSuccess('');

    // Pre-populate active mappings
    const mapping: Record<string, { canRead: boolean; canWrite: boolean }> = {};
    
    // Seed all modules as false first
    modules.forEach((mod) => {
      mapping[mod.id] = { canRead: false, canWrite: false };
    });

    // Layer supervisor explicit values
    supervisor.permissions.forEach((p) => {
      mapping[p.moduleId] = { canRead: p.canRead, canWrite: p.canWrite };
    });

    setSelectedPerms(mapping);
    setEditPermsModalOpen(true);
  };

  // Toggle dynamic matrix cell value
  const handleToggleMatrixCell = (moduleId: string, type: 'canRead' | 'canWrite') => {
    setSelectedPerms((prev) => {
      const updated = { ...prev };
      const currentVal = updated[moduleId] || { canRead: false, canWrite: false };
      
      if (type === 'canRead') {
        const nextRead = !currentVal.canRead;
        // Strict consistency rule: If read access is revoked, write access must also be revoked.
        const nextWrite = nextRead ? currentVal.canWrite : false;
        updated[moduleId] = { canRead: nextRead, canWrite: nextWrite };
      } else if (type === 'canWrite') {
        const nextWrite = !currentVal.canWrite;
        // Strict consistency rule: If write access is enabled, read access must automatically be enabled.
        const nextRead = nextWrite ? true : currentVal.canRead;
        updated[moduleId] = { canRead: nextRead, canWrite: nextWrite };
      }

      return updated;
    });
  };

  // Sync edited permissions
  const handleSyncPermissions = async () => {
    if (!selectedSupervisor) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payloadPermissions = Object.entries(selectedPerms).map(([moduleId, val]) => ({
        moduleId,
        canRead: val.canRead,
        canWrite: val.canWrite,
      }));

      const res = await fetch(`/api/supervisors/${selectedSupervisor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payloadPermissions }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to synchronize module permissions.');
      }

      setSuccess(`Permissions catalog updated for supervisor ${selectedSupervisor.name}.`);
      setEditPermsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Hard Delete flow
  const triggerDeleteConfirm = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setDeleteConfirmOpen(true);
  };

  const handleHardDelete = async () => {
    if (!selectedSupervisor) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/supervisors/${selectedSupervisor.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove supervisor account.');
      }

      setSuccess(`Supervisor account for ${selectedSupervisor.name} permanently deleted.`);
      setDeleteConfirmOpen(false);
      setSelectedSupervisor(null);
      fetchData();
    } catch (err: unknown) {
      const errorVal = err as Error;
      setError(errorVal.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || uiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="h-10 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-8 pb-20">
      
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Supervisor Management & Permissions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create supervisor records, assign project sites, control credentials, and assign module rights.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-3 px-5 rounded-xl shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 outline-none select-none"
        >
          <svg className="w-4 h-4 stroke-slate-950" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Supervisor
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-105" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Supervisors</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">accounts registered</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-105" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Supervisors
          </span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-emerald-600">{stats.active}</span>
            <span className="text-xs font-semibold text-slate-400">authorized</span>
          </div>
        </div>

        {/* Deactivated Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-105" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Deactivated
          </span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-rose-600">{stats.inactive}</span>
            <span className="text-xs font-semibold text-slate-400">locked out</span>
          </div>
        </div>
      </div>

      {/* Notifications Alerts */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs py-3.5 px-4 rounded-xl font-medium shadow-sm animate-[fadeIn_0.2s_ease-out]">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3.5 px-4 rounded-xl font-medium shadow-sm animate-[fadeIn_0.2s_ease-out]">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search supervisors by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner transition-all font-medium"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 select-none">Status Filter:</label>
          <div className="bg-slate-100 p-0.5 rounded-xl flex gap-0.5 border border-slate-200/60 text-[10px] font-bold select-none">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Data Grid Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4.5 px-6">Supervisor Info</th>
                <th className="py-4.5 px-6">Assigned Site</th>
                <th className="py-4.5 px-6">Account Status</th>
                <th className="py-4.5 px-6">Registered On</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSupervisors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-bold">
                    No supervisors matched your active filters.
                  </td>
                </tr>
              ) : (
                filteredSupervisors.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-all">
                    {/* User Card Info */}
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center border border-slate-200 select-none">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm">{s.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Project Site */}
                    <td className="py-4.5 px-6">
                      {s.project ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-slate-800 text-xs">
                            {s.project.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            📍 {s.project.location}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic font-medium">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Account status flag pill */}
                    <td className="py-4.5 px-6">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border select-none transition-all active:scale-95 ${
                          s.isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80 hover:bg-emerald-100/60'
                            : 'bg-rose-50 text-rose-600 border-rose-200/80 hover:bg-rose-100/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {s.isActive ? 'Active' : 'Locked'}
                      </button>
                    </td>

                    {/* Date Joined */}
                    <td className="py-4.5 px-6 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Operational controls */}
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 1. Project Assignment Trigger */}
                        <button
                          onClick={() => openAssignProject(s)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-amber-600 transition-all outline-none"
                          title="Assign Project Site"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </button>

                        {/* 2. Permissions edit trigger */}
                        <button
                          onClick={() => openEditPermissions(s)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-amber-600 transition-all outline-none"
                          title="Configure Permissions Matrix"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </button>

                        {/* 3. Permanent Account Cleanup */}
                        <button
                          onClick={() => triggerDeleteConfirm(s)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-400 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all outline-none"
                          title="Permanently Delete Supervisor"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-black text-slate-900 tracking-tight">Create Supervisor Account</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Add a new supervisor account and optional site assignment. Credentials can be shared with the supervisor.
            </p>

            <form onSubmit={handleCreateSupervisor} className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@construxerp.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Temporary Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Assign Project Site</label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
                >
                  <option value="">-- Select Project Site (Optional) --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl outline-none transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-sm outline-none transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PROJECT MODAL */}
      {assignProjectModalOpen && selectedSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            
            <button
              onClick={() => setAssignProjectModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-black text-slate-900 tracking-tight">Assign Project Site</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Select the active construction site assigned to <strong className="text-slate-800 font-bold">{selectedSupervisor.name}</strong>.
            </p>

            <form onSubmit={handleAssignProject} className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Project Site</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
                >
                  <option value="">-- Unassigned / Central Warehouse --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignProjectModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl outline-none transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-sm outline-none transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MATRIX MODAL */}
      {editPermsModalOpen && selectedSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[85vh]">
            
            <button
              onClick={() => setEditPermsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-base font-black text-slate-900 tracking-tight">Configure Granular Access</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              Select module rights for <strong className="text-slate-800 font-bold">{selectedSupervisor.name}</strong>. Access is evaluated in real time at the API gateway layer.
            </p>

            <div className="flex-1 overflow-y-auto mt-6">
              <table className="w-full text-left text-xs border-collapse select-none">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">ERP Module</th>
                    <th className="py-3 px-4 text-center">Read access</th>
                    <th className="py-3 px-4 text-center">Write access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {modules.map((mod) => {
                    const currentVal = selectedPerms[mod.id] || { canRead: false, canWrite: false };
                    return (
                      <tr key={mod.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-800 text-xs">{mod.name}</span>
                        </td>
                        
                        {/* Read permission check */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMatrixCell(mod.id, 'canRead')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border outline-none transition-all ${
                              currentVal.canRead
                                ? 'bg-sky-50 text-sky-600 border-sky-200 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {currentVal.canRead ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>

                        {/* Write permission check */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMatrixCell(mod.id, 'canWrite')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border outline-none transition-all ${
                              currentVal.canWrite
                                ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {currentVal.canWrite ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-6 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditPermsModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl outline-none transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyncPermissions}
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-sm outline-none transition-all"
              >
                {submitting ? 'Syncing...' : 'Save Matrix'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirmOpen && selectedSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            
            <h3 className="text-base font-black text-slate-900 tracking-tight">Confirm Hard Deletion</h3>
            <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
              Are you sure you want to permanently delete the supervisor account for <strong className="text-slate-800 font-bold">{selectedSupervisor.name}</strong> ({selectedSupervisor.email})? 
              <br /><br />
              <strong className="text-red-500 font-extrabold uppercase text-[9px] tracking-wide">Warning:</strong> This action is permanent and cannot be undone. All module permission records for this account will be completely removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl outline-none transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHardDelete}
                disabled={submitting}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm outline-none transition-all"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Animations styling rules */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
