'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserPermission {
  read: boolean;
  write: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR';
  permissions: Record<string, UserPermission>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  hasReadPermission: (moduleName: string) => boolean;
  hasWritePermission: (moduleName: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetches current authenticated session from HTTP-only cookie
  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to sync authenticated session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = (newUser: UserProfile) => {
    setUser(newUser);

    // Redirect based on role
    if (newUser.role === 'ADMIN') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/supervisor');
    }
  };

  const logout = async () => {
    try {
      // Clear token cookie from server side
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (error) {
      console.error('Failed to log out of portal:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const hasReadPermission = (moduleName: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.[moduleName]?.read ?? false;
  };

  const hasWritePermission = (moduleName: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.[moduleName]?.write ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasReadPermission,
        hasWritePermission,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
