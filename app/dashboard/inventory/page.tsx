'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  } | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const { hasReadPermission, hasWritePermission, loading } = useAuth();
  const router = useRouter();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [uiLoading, setUiLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('bags');
  const [projectId, setProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const canRead = hasReadPermission('Inventory');
  const canWrite = hasWritePermission('Inventory');

  useEffect(() => {
    // Access guard
    if (!loading && !canRead) {
      router.push('/dashboard');
    }
  }, [canRead, loading, router]);

  const fetchInventory = async () => {
    try {
      setUiLoading(true);
      setError('');

      const res = await fetch('/api/inventory');

      if (!res.ok) {
        throw new Error('Failed to retrieve inventory ledger.');
      }

      const data = await res.json();
      setInventory(data);

      // Fetch projects for dropdown list (only if writer is adding stock)
      if (canWrite) {
        const projRes = await fetch('/api/projects');
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData.map((p: any) => ({ id: p.id, name: p.name })));
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
      fetchInventory();
    }
  }, [canRead, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    if (!name || quantity === undefined || !unit) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          quantity: numQuantity,
          unit,
          projectId: projectId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add inventory item.');
      }

      setSuccess('Inventory item recorded/allocated successfully!');
      setName('');
      setQuantity('');
      setProjectId('');
      setFormOpen(false);
      fetchInventory(); // Reload list
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
            Warehouse Material Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit inventory intake, dispatch raw resources directly to sites, and monitor stock volumes.
          </p>
        </div>
        
        {canWrite && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/10 transition-all"
          >
            {formOpen ? 'Close Panel' : '+ Dispatch Stock'}
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

      {/* Add Stock Form Drawer (Visible on canWrite & formOpen) */}
      {canWrite && formOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-[slideDown_0.2s_ease-out]">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Record / Dispatch Material Stock
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Material Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. OPC Cement"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 150"
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Unit of Measurement</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none"
              >
                <option value="bags">bags</option>
                <option value="tons">tons</option>
                <option value="meters">meters</option>
                <option value="pieces">pieces</option>
                <option value="liters">liters</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Target Allocation</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-amber-500/50 text-slate-800 rounded-xl px-4 py-2.5 text-xs transition-all outline-none animate-none"
              >
                <option value="">Main Warehouse (Unassigned)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    Site: {p.name}
                  </option>
                ))}
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
                {submitting ? 'Recording...' : 'Save Stock'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Material Stock Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Material Name</th>
                <th className="py-4 px-6">Allocated Stock Volume</th>
                <th className="py-4 px-6">UoM</th>
                <th className="py-4 px-6">Current Location</th>
                <th className="py-4 px-6">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    No material assets logged in database yet.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-6 font-extrabold text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-950 text-sm">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-bold uppercase">
                      {item.unit}
                    </td>
                    <td className="py-4 px-6">
                      {item.project ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100">
                          Site: {item.project.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Main Warehouse
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                      {new Date(item.updatedAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
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
