'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface WorkforceMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  salaryType: string;
  attendance: { id: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' } | null;
}

export default function AttendancePage() {
  const { hasReadPermission, hasWritePermission, loading } = useAuth();
  const router = useRouter();

  // Selected date (defaults to today's date formatted as YYYY-MM-DD local time)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | null>>({});
  const [initialAttendance, setInitialAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | null>>({});
  
  const [uiLoading, setUiLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canRead = hasReadPermission('Employees');
  const canWrite = hasWritePermission('Employees');

  // Enforce that attendance writing/updating is restricted ONLY to the current date
  const isToday = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return selectedDate === `${yyyy}-${mm}-${dd}`;
  }, [selectedDate]);

  const isWritable = canWrite && isToday;

  useEffect(() => {
    // Access guard: Redirect to dashboard home if unauthorized
    if (!loading && !canRead) {
      router.push('/dashboard');
    }
  }, [canRead, loading, router]);

  // Fetch daily attendance and workforce lists
  const fetchDailyLogs = async (dateStr: string) => {
    try {
      setUiLoading(true);
      setError('');
      setSuccess('');
      const res = await fetch(`/api/attendance?date=${dateStr}`);

      if (!res.ok) {
        throw new Error('Failed to retrieve daily attendance registry.');
      }

      const data = await res.json();
      setWorkforce(data.workforce || []);
      
      // Initialize local state mapping
      const mapping: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | null> = {};
      (data.workforce || []).forEach((emp: WorkforceMember) => {
        mapping[emp.id] = emp.attendance ? emp.attendance.status : null;
      });

      setLocalAttendance(mapping);
      setInitialAttendance({ ...mapping });
    } catch (err: unknown) {
      const errorVal = err as Error;
      console.error(errorVal);
      setError(errorVal.message || 'Server connection error.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (canRead && !loading) {
      const timer = setTimeout(() => {
        fetchDailyLogs(selectedDate);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, canRead, loading]);

  // Track if local modifications differ from database records
  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(localAttendance).some(
      (id) => localAttendance[id] !== initialAttendance[id]
    );
  }, [localAttendance, initialAttendance]);

  // Quick statistics computation
  const stats = useMemo(() => {
    const total = workforce.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let logged = 0;

    Object.values(localAttendance).forEach((status) => {
      if (status) logged++;
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LATE') late++;
      else if (status === 'LEAVE') leave++;
    });

    const completionRate = total > 0 ? Math.round((logged / total) * 100) : 0;
    const presenceRate = logged > 0 ? Math.round((present / logged) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      leave,
      logged,
      completionRate,
      presenceRate,
    };
  }, [workforce, localAttendance]);

  // Mark attendance status for a specific worker
  const markStatus = (employeeId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE') => {
    if (!isWritable) return;
    setLocalAttendance((prev) => ({
      ...prev,
      [employeeId]: prev[employeeId] === status ? null : status, // Toggle status off if clicked again
    }));
  };

  // Mark all unlogged workers with a specific status
  const markAllUnlogged = (status: 'PRESENT' | 'ABSENT') => {
    if (!isWritable) return;
    setLocalAttendance((prev) => {
      const updated = { ...prev };
      workforce.forEach((emp) => {
        if (updated[emp.id] === null) {
          updated[emp.id] = status;
        }
      });
      return updated;
    });
  };

  // Submit local logs to database
  const handleSyncLogs = async () => {
    if (!isWritable || !hasUnsavedChanges) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Build batch records payloads (filtering out any remaining null statuses if desired)
      const records = Object.entries(localAttendance)
        .filter(([, status]) => status !== null)
        .map(([employeeId, status]) => ({
          employeeId,
          status: status!,
        }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          records,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synchronize daily attendance records.');
      }

      setSuccess(`Daily attendance logs for ${selectedDate} synced successfully!`);
      
      // Update initial state so changes register as saved
      setInitialAttendance({ ...localAttendance });
      
      // Trigger short visual reload
      setTimeout(() => {
        fetchDailyLogs(selectedDate);
      }, 500);
    } catch (err: unknown) {
      const errorVal = err as Error;
      console.error(errorVal);
      setError(errorVal.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || uiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
          <div className="h-10 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl border border-slate-200" />
          ))}
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
    <div className="flex flex-col gap-8 pb-20">
      
      {/* Header section with Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Daily Attendance Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Perform daily check-ins for the workforce. Synchronize logs directly to the secure database ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs uppercase font-bold text-slate-400 select-none">Target Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:border-amber-500/50 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Historical Read-Only Notice */}
      {!isToday && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4.5 flex gap-4 items-start shadow-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-700 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Historical Read-Only Mode</h4>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              You are viewing attendance logs for <strong className="text-slate-800 font-bold">{selectedDate}</strong>. Attendance write and modification options are strictly restricted to the current date only.
            </p>
          </div>
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Workers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Workforce</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400">laborers</span>
          </div>
        </div>

        {/* 2. Present Stat */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-105" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Present
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-600">{stats.present}</span>
            {stats.logged > 0 && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {stats.presenceRate}%
              </span>
            )}
          </div>
        </div>

        {/* 3. Absent Stat */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-105" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Absent
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-rose-600">{stats.absent}</span>
            <span className="text-xs font-semibold text-slate-400">workers</span>
          </div>
        </div>

        {/* 4. Other (Late/Leave) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Late / Leave</span>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-amber-500">{stats.late}</span>
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight ml-0.5">Late</span>
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-sky-500">{stats.leave}</span>
              <span className="text-[9px] font-bold text-sky-600 uppercase tracking-tight ml-0.5">Leave</span>
            </div>
          </div>
        </div>

        {/* 5. Completion Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between text-white col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Logging Progress</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-500">{stats.completionRate}%</span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
              ({stats.logged} of {stats.total} logged)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500" 
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Operations Shortcut panel */}
      {isWritable && stats.logged < stats.total && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-700">
            💡 Quick Actions: Mark all remaining unlogged workers ({stats.total - stats.logged}) as:
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => markAllUnlogged('PRESENT')}
              className="flex-1 sm:flex-none bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-bold px-4 py-2 rounded-xl transition-all"
            >
              All Present
            </button>
            <button
              onClick={() => markAllUnlogged('ABSENT')}
              className="flex-1 sm:flex-none bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 font-bold px-4 py-2 rounded-xl transition-all"
            >
              All Absent
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-4.5 px-6 w-1/3">Laborer Information</th>
                <th className="py-4.5 px-6 hidden md:table-cell">Role & Wage Schema</th>
                <th className="py-4.5 px-6 text-center w-2/5 md:w-1/2">Daily Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {workforce.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-slate-400 font-bold">
                    No workforce members registered in database yet.
                  </td>
                </tr>
              ) : (
                workforce.map((emp) => {
                  const status = localAttendance[emp.id];
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/30 transition-all">
                      {/* Worker Card */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center border border-slate-200 select-none">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 text-sm">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{emp.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Salary schema badges */}
                      <td className="py-4 px-6 hidden md:table-cell">
                        <div className="flex flex-col gap-1.5 align-middle">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {emp.role}
                            </span>
                          </div>
                          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">
                            {emp.salaryType} Rate
                          </div>
                        </div>
                      </td>

                      {/* Multi-Segment Controls */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center md:justify-end gap-1 sm:gap-2">
                          {/* 1. Present button */}
                          <button
                            disabled={!isWritable}
                            onClick={() => markStatus(emp.id, 'PRESENT')}
                            className={`flex-1 md:flex-none py-2 px-2.5 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border outline-none ${
                              status === 'PRESENT'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                : 'bg-white hover:bg-emerald-50/40 hover:text-emerald-600 border-slate-200 text-slate-500 disabled:hover:bg-white disabled:hover:text-slate-500'
                            }`}
                          >
                            Present
                          </button>

                          {/* 2. Absent button */}
                          <button
                            disabled={!isWritable}
                            onClick={() => markStatus(emp.id, 'ABSENT')}
                            className={`flex-1 md:flex-none py-2 px-2.5 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border outline-none ${
                              status === 'ABSENT'
                                ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/20'
                                : 'bg-white hover:bg-rose-50/40 hover:text-rose-600 border-slate-200 text-slate-500 disabled:hover:bg-white disabled:hover:text-slate-500'
                            }`}
                          >
                            Absent
                          </button>

                          {/* 3. Late button */}
                          <button
                            disabled={!isWritable}
                            onClick={() => markStatus(emp.id, 'LATE')}
                            className={`flex-1 md:flex-none py-2 px-2.5 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border outline-none ${
                              status === 'LATE'
                                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                                : 'bg-white hover:bg-amber-50/40 hover:text-amber-600 border-slate-200 text-slate-500 disabled:hover:bg-white disabled:hover:text-slate-500'
                            }`}
                          >
                            Late
                          </button>

                          {/* 4. Leave button */}
                          <button
                            disabled={!isWritable}
                            onClick={() => markStatus(emp.id, 'LEAVE')}
                            className={`flex-1 md:flex-none py-2 px-2.5 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border outline-none ${
                              status === 'LEAVE'
                                ? 'bg-sky-500 border-sky-500 text-white shadow-sm shadow-sky-500/20'
                                : 'bg-white hover:bg-sky-50/40 hover:text-sky-600 border-slate-200 text-slate-500 disabled:hover:bg-white disabled:hover:text-slate-500'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Save/Unsaved Sync Notice (Strictly visible only if changes exist) */}
      {isWritable && hasUnsavedChanges && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-50 bg-slate-900 border border-slate-800 text-white p-4.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-black">Unsaved Daily Logs</p>
              <p className="text-[10px] text-slate-400 font-medium">Modified changes are not synced</p>
            </div>
          </div>

          <button
            onClick={handleSyncLogs}
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2 px-4 rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                Save changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Animations styling rules */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
