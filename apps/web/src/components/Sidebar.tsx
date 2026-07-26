'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/',                  label: 'Home',             icon: '🏠' },
  { href: '/dashboard',         label: 'Dashboard',        icon: '📊' },
  { href: '/website-analyzer',  label: 'Website Analyzer', icon: '🔍' },
  { href: '/proposals',         label: 'Proposals',        icon: '📄' },
  { href: '/crm',               label: 'CRM',              icon: '👥' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
          AI
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">Proposal</p>
          <p className="text-xs text-slate-400 leading-tight">Generator</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <p className="text-xs text-slate-400">AI Proposal Generator</p>
        <p className="text-xs text-slate-300">v0.1.0</p>
      </div>
    </aside>
  );
}
