'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getEmail, clearToken, isAuthenticated } from '../lib/auth';

const navLinks = [
  { href: '/website-analyzer', label: 'Website Analyzer' },
  { href: '/proposals',        label: 'Proposals' },
  { href: '/lead-finder',      label: 'Lead Finder' },
];

const dropdownLinks = [
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
        <path strokeLinecap="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z"/>
      </svg>
    ),
  },
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

export default function Header() {
  const router = useRouter();
  const [authed, setAuthed]       = useState(false);
  const [email, setEmail]         = useState<string | null>(null);
  const [open, setOpen]           = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setEmail(getEmail());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setEmail(null);
    setOpen(false);
    router.replace('/login');
  };

  const initials = email ? email.slice(0, 2).toUpperCase() : 'ME';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 p-1.5">
            <img src="/favicon.png" className="w-full h-full object-contain" alt="Automate Work" />
          </div>
          <span className="text-sm font-bold text-white hidden sm:block">Automate Work</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {authed ? (
            /* Profile dropdown */
            <div ref={dropRef} className="relative">
              <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 hover:bg-white/10 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:block text-xs font-medium text-slate-200 max-w-[120px] truncate">{email}</span>
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden z-50">
                  {/* Email label */}
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{email}</p>
                  </div>

                  {/* Nav items */}
                  <div className="py-1.5">
                    {dropdownLinks.map(l => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <span className="text-slate-500">{l.icon}</span>
                        {l.label}
                      </Link>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-slate-700 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign In / Get Started */
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/login" className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg">
                Get Started Free
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900 px-5 py-3 space-y-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
