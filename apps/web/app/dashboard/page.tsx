'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getEmail } from '../../src/lib/auth';
import { fetchJson } from '../../src/lib/api';

interface Stats {
  clients: number;
  proposals: number;
  pending: number;
  exported: number;
}

const quickLinks = [
  {
    href: '/website-analyzer',
    label: 'Analyze a Website',
    desc: 'Crawl and inspect any client site',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
      </svg>
    ),
    color: 'text-blue-600 bg-blue-50',
  },
  {
    href: '/proposals',
    label: 'New Proposal',
    desc: 'Create or view proposals',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    href: '/crm',
    label: 'Add Client',
    desc: 'Register a new client',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
      </svg>
    ),
    color: 'text-violet-600 bg-violet-50',
  },
];

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ clients: 0, proposals: 0, pending: 0, exported: 0 });

  useEffect(() => {
    setEmail(getEmail());

    // Load real counts
    Promise.all([
      fetchJson<{ clients: unknown[] }>('/api/crm').catch(() => ({ clients: [] })),
      fetchJson<{ proposals: Array<{ status: string }> }>('/api/proposals').catch(() => ({ proposals: [] })),
    ]).then(([crm, prop]) => {
      const proposals = prop.proposals ?? [];
      setStats({
        clients:   crm.clients?.length  ?? 0,
        proposals: proposals.length,
        pending:   proposals.filter((p) => p.status === 'draft' || p.status === 'generated').length,
        exported:  proposals.filter((p) => p.status === 'exported').length,
      });
    });
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { label: 'Total Clients',   value: stats.clients,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Proposals',       value: stats.proposals, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Review',  value: stats.pending,   color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: 'Exported',        value: stats.exported,  color: 'text-emerald-600',bg: 'bg-emerald-50'},
  ];

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}{email ? `, ${email.split('@')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s an overview of your workspace.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="card flex flex-col gap-1">
              <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <p className="section-label">Quick Actions</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickLinks.map((q) => (
              <Link key={q.href} href={q.href} className="card-hover flex items-center gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${q.color}`}>
                  {q.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{q.label}</p>
                  <p className="text-xs text-slate-400">{q.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Empty state hint */}
        {stats.clients === 0 && stats.proposals === 0 && (
          <div className="card border-dashed border-2 border-slate-200 bg-slate-50 flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">Start with a website analysis</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Analyze any website to automatically extract insights and generate a proposal.
            </p>
            <Link href="/website-analyzer" className="mt-5 btn-primary text-sm px-5 py-2">
              Analyze a Website
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
