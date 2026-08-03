'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getEmail, clearToken } from '../lib/auth';

const nav = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/website-analyzer',
    label: 'Website Analyzer',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    href: '/proposals',
    label: 'Proposals',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
  {
    href: '/crm',
    label: 'Clients',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8zm6 4a3 3 0 100-6 3 3 0 000 6zM3 16a3 3 0 100-6 3 3 0 000 6z"/>
      </svg>
    ),
  },
  // ─── V2 Modules ─────────────────────────────────────────────────────────────
  {
    href: '/lead-finder',
    label: 'Lead Finder',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
  {
    href: '/linkedin-generator',
    label: 'LinkedIn Content',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
      </svg>
    ),
  },
  {
    href: '/x-generator',
    label: 'X Content',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    href: '/url-shortener',
    label: 'URL Shortener',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => { setEmail(getEmail()); }, []);

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  const initials = email ? email.slice(0, 2).toUpperCase() : '??';

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-navy text-white border-r border-customBorder/5 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Mobile close button (optional, handled by backdrop, but good for accessibility) */}
      <div className="md:hidden flex justify-end p-2 border-b border-customBorder/5">
        <button onClick={() => setIsOpen && setIsOpen(false)} className="p-2 text-slate-300 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Logo */}
      <div className="hidden md:flex h-14 items-center gap-2.5 px-5 border-b border-customBorder/5">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 shrink-0 p-1.5">
          <img src="/favicon.png" className="w-full h-full object-contain" alt="Automate Work Favicon" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Automate Work</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-textsecondary px-3 pt-2 pb-1">
          Navigation
        </p>
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen && setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? 'bg-brandblue text-white shadow-sm'
                  : 'text-slate-400 hover:bg-navy-dark/40 hover:text-white'
              }`}
            >
              <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-customBorder/5 p-3 space-y-1 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-navy-dark/40 border border-white/5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brandblue text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">{email ?? 'Loading…'}</p>
            <p className="text-[10px] text-textsecondary">Your workspace</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-navy-dark/40 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
