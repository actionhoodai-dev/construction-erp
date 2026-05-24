'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [uiLoading, setUiLoading] = useState(true);

  // Profile form fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Password form fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Operation states
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setUiLoading(true);
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to load profile.');
      const data = await res.json();
      setProfile(data.user);
      setEditName(data.user.name);
      setEditEmail(data.user.email);
    } catch (err: unknown) {
      const errorVal = err as Error;
      console.error(errorVal);
      setProfileError(errorVal.message || 'Failed to load profile.');
    } finally {
      setUiLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      const timer = setTimeout(() => {
        fetchProfile();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Handle profile info update (name/email)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editName.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    if (!editEmail.trim()) {
      setProfileError('Email cannot be empty.');
      return;
    }

    // Only send changed fields
    const payload: Record<string, string> = {};
    if (editName !== profile?.name) payload.name = editName;
    if (editEmail !== profile?.email) payload.email = editEmail;

    if (Object.keys(payload).length === 0) {
      setProfileError('No changes detected.');
      return;
    }

    setProfileSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      setProfileSuccess('Profile information updated successfully.');
      fetchProfile();
      refreshSession(); // Refresh the sidebar/header with new name
    } catch (err: unknown) {
      const errorVal = err as Error;
      setProfileError(errorVal.message || 'Operation failed.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');

      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorVal = err as Error;
      setPasswordError(errorVal.message || 'Operation failed.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading || uiLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none max-w-2xl">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-2xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your profile information, email address, and security credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20 select-none">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-slate-800 text-lg truncate">{profile.name}</h2>
            <p className="text-slate-500 text-xs truncate mt-0.5">{profile.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border select-none ${
              profile.role === 'ADMIN'
                ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {profile.role}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Joined {new Date(profile.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-800 text-sm">Profile Information</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Update your display name and email address.</p>
        </div>

        {profileSuccess && (
          <div className="mx-6 mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs py-3 px-4 rounded-xl font-medium animate-[fadeIn_0.2s_ease-out]">
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl font-medium animate-[fadeIn_0.2s_ease-out]">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Email Address</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSubmitting}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-sm shadow-amber-500/10 outline-none transition-all active:scale-95"
            >
              {profileSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-800 text-sm">Change Password</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Verify your current password before setting a new one.</p>
        </div>

        {passwordSuccess && (
          <div className="mx-6 mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs py-3 px-4 rounded-xl font-medium animate-[fadeIn_0.2s_ease-out]">
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl font-medium animate-[fadeIn_0.2s_ease-out]">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Current Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:border-amber-500/50 shadow-inner font-medium transition-all"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-all outline-none select-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {showPasswords ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                )}
              </svg>
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm outline-none transition-all active:scale-95"
            >
              {passwordSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100/60 bg-red-50/30">
          <h3 className="font-extrabold text-red-600 text-sm">Danger Zone</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Irreversible actions that affect your account security.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-800">Sign out of all sessions</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Changing your password will automatically invalidate existing sessions on next request.</p>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 select-none">
              Via password change
            </span>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
