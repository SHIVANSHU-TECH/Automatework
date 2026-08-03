'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';

const PUBLIC_PATHS = ['/', '/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const pub = PUBLIC_PATHS.includes(pathname);
    const auth = isAuthenticated();

    if (!pub && !auth) {
      router.replace('/login');
    } else if (pathname === '/login' && auth) {
      // Redirect authed users away from login → dashboard
      router.replace('/dashboard');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (!ready && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
