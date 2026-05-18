'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/supervisor');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl animate-bounce">
          CX
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Verifying secure session tokens...
        </p>
      </div>
    </main>
  );
}
