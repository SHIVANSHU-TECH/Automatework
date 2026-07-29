'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isMobileOpen} setIsOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col md:ml-56 min-w-0 min-h-screen transition-all">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-5 h-14 bg-navy text-white sticky top-0 z-20 shadow-md border-b border-customBorder/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 shrink-0 p-1.5">
              <img src="/favicon.png" className="w-full h-full object-contain" alt="Logo" />
            </div>
            <p className="text-sm font-bold leading-tight">Automate Work</p>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 -mr-2 text-slate-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-navy/80 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
