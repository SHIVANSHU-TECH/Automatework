'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isAuthenticated, getEmail } from '../src/lib/auth';
import { fetchJson } from '../src/lib/api';
import Header from '../src/components/Header';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  clients: number;
  proposals: number;
  pending: number;
  exported: number;
}

// ─── Static data (shown to guest users) ───────────────────────────────────────

const features = [
  {
    title: 'Website Analyzer',
    description: 'Deep crawl any website — Lighthouse scores, Core Web Vitals, SEO audit, security headers, domain info, and traffic rank in one click.',
    href: '/website-analyzer',
    color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    iconColor: 'bg-blue-500/20 text-blue-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    title: 'Proposal Generator',
    description: 'Proposals auto-populate from analysis data. Edit all sections inline, advance status, and export as PDF, Word, HTML, or Markdown.',
    href: '/proposals',
    color: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
    iconColor: 'bg-indigo-500/20 text-indigo-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
  {
    title: 'Lead Finder',
    description: 'Find and qualify new leads by industry, location, and business type. Save promising leads to your CRM instantly.',
    href: '/lead-finder',
    color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    iconColor: 'bg-emerald-500/20 text-emerald-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
  {
    title: 'Client CRM',
    description: 'Track every prospect and client, link analyses and proposals, and manage your full pipeline from one private workspace.',
    href: '/crm',
    color: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
    iconColor: 'bg-violet-500/20 text-violet-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z"/>
      </svg>
    ),
  },
  {
    title: 'LinkedIn & X Content',
    description: 'Turn website analysis into polished LinkedIn posts or X threads. Share insights, grow your audience, and attract prospects.',
    href: '/linkedin-generator',
    color: 'from-sky-500/10 to-sky-500/5 border-sky-500/20',
    iconColor: 'bg-sky-500/20 text-sky-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
      </svg>
    ),
  },
  {
    title: 'URL Shortener',
    description: 'Create short trackable links for proposals and reports. Share them cleanly and monitor engagement in your dashboard.',
    href: '/url-shortener',
    color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    iconColor: 'bg-amber-500/20 text-amber-400',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
    ),
  },
];

const steps = [
  { num: '01', title: 'Analyze a Website',  desc: 'Enter any URL — Lighthouse, SEO audit, domain info, and content extracted automatically.' },
  { num: '02', title: 'Save to Clients',     desc: 'One click saves the site to your CRM and links the analysis to a client record.' },
  { num: '03', title: 'Generate Proposal',   desc: 'Proposal sections auto-populate. Edit, refine, and save in your private workspace.' },
  { num: '04', title: 'Export & Deliver',    desc: 'Download as PDF, Word, HTML, or Markdown. Ready to send in minutes, not days.' },
];

const metrics = [
  { value: '10+',    label: 'Analysis Signals'   },
  { value: 'GDPR',   label: 'Private Workspaces' },
  { value: '4',      label: 'Export Formats'     },
  { value: '< 60s',  label: 'Full Audit Time'    },
];

// ─── Greeting helper ──────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── Dashboard card (logged-in users) ────────────────────────────────────────

function AuthedHero({ email, stats, loading }: { email: string | null; stats: UserStats | null; loading: boolean }) {
  const name = email ? email.split('@')[0] : '';
  const statCards = stats ? [
    { label: 'Clients',       value: stats.clients,   color: 'text-blue-400'   },
    { label: 'Proposals',     value: stats.proposals, color: 'text-indigo-400' },
    { label: 'Pending',       value: stats.pending,   color: 'text-amber-400'  },
    { label: 'Exported',      value: stats.exported,  color: 'text-emerald-400'},
  ] : [];

  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-5 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-blue-400 font-semibold mb-1">{greeting()},</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">{name || 'Welcome back'}</h1>
        <p className="text-slate-400 text-sm mb-10">Here&apos;s your workspace at a glance.</p>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
                <div className="h-8 w-16 bg-white/10 rounded mb-2"/>
                <div className="h-3 w-20 bg-white/5 rounded"/>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
            {statCards.map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/website-analyzer" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            Analyze a Website
          </Link>
          <Link href="/proposals" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
            View Proposals
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors">
            Full Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Guest hero ───────────────────────────────────────────────────────────────

function GuestHero() {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-5 py-24 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 tracking-wide mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"/>
          Business Intelligence Platform
        </div>
        <h1 className="text-5xl font-extrabold leading-tight mb-5 tracking-tight max-w-2xl">
          Turn any website into<br />
          <span className="text-blue-400">a winning proposal</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-xl mb-10 leading-relaxed">
          Crawl a prospect&apos;s site, capture every insight automatically — Lighthouse, SEO, security, domain intelligence — and deliver a polished proposal in minutes, not days.
        </p>
        <div className="flex flex-wrap gap-3 mb-14">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition-colors">
            Get Started Free
          </Link>
          <Link href="/website-analyzer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
            Try the Analyzer
          </Link>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map(m => (
            <div key={m.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-2xl font-black text-blue-400">{m.value}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="bg-white border-b border-slate-100 px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">How it works</p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col gap-2 relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-4 left-full h-px bg-slate-100" style={{ width: 'calc(100% - 8px)' }}/>
              )}
              <span className="text-4xl font-black text-blue-100 select-none leading-none">{s.num}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features grid ────────────────────────────────────────────────────────────

function FeaturesGrid() {
  return (
    <section className="px-5 py-16 bg-slate-50">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Everything you need</p>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8">One platform, every tool</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <Link
              key={f.title}
              href={f.href}
              className={`group flex flex-col gap-4 rounded-2xl border bg-gradient-to-br p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${f.color}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${f.iconColor}`}>
                {f.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">{f.title}</h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA section ─────────────────────────────────────────────────────────────

function CtaSection({ authed }: { authed: boolean }) {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 py-20 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold mb-4">
          {authed ? 'Continue where you left off' : 'Start analyzing websites today'}
        </h2>
        <p className="text-blue-100 text-sm mb-8 max-w-xl mx-auto leading-relaxed">
          {authed
            ? 'Pick up a website audit, review your pending proposals, or find new leads — your workspace is ready.'
            : 'No credit card required. Create a free account and run your first full website audit in under 60 seconds.'}
        </p>
        {authed ? (
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/website-analyzer" className="rounded-xl bg-white text-blue-700 font-semibold px-6 py-3 text-sm hover:bg-blue-50 transition-colors shadow-lg">
              Analyze a Website
            </Link>
            <Link href="/dashboard" className="rounded-xl border border-white/30 bg-white/10 text-white font-semibold px-6 py-3 text-sm hover:bg-white/20 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/login" className="rounded-xl bg-white text-blue-700 font-semibold px-6 py-3 text-sm hover:bg-blue-50 transition-colors shadow-lg">
              Create Free Account
            </Link>
            <Link href="/website-analyzer" className="rounded-xl border border-white/30 bg-white/10 text-white font-semibold px-6 py-3 text-sm hover:bg-white/20 transition-colors">
              Try Without Signing In
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-white/5 px-5 py-10 text-slate-500">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 p-1">
            <img src="/favicon.png" className="w-full h-full object-contain" alt="Logo"/>
          </div>
          <span className="text-sm font-semibold text-slate-400">Automate Work</span>
        </div>
        <div className="flex flex-wrap gap-5 text-xs">
          <Link href="/website-analyzer" className="hover:text-slate-300 transition-colors">Website Analyzer</Link>
          <Link href="/proposals"        className="hover:text-slate-300 transition-colors">Proposals</Link>
          <Link href="/crm"              className="hover:text-slate-300 transition-colors">Clients</Link>
          <Link href="/lead-finder"      className="hover:text-slate-300 transition-colors">Lead Finder</Link>
          <Link href="/login"            className="hover:text-slate-300 transition-colors">Sign In</Link>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Automate Work</p>
      </div>
    </footer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [authed, setAuthed]     = useState(false);
  const [email, setEmail]       = useState<string | null>(null);
  const [stats, setStats]       = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthed(auth);
    setEmail(getEmail());

    if (auth) {
      setStatsLoading(true);
      Promise.all([
        fetchJson<{ clients: unknown[] }>('/api/crm').catch(() => ({ clients: [] })),
        fetchJson<{ proposals: Array<{ status: string }> }>('/api/proposals').catch(() => ({ proposals: [] })),
      ]).then(([crm, prop]) => {
        const proposals = prop.proposals ?? [];
        setStats({
          clients:   crm.clients?.length ?? 0,
          proposals: proposals.length,
          pending:   proposals.filter(p => p.status === 'draft' || p.status === 'generated').length,
          exported:  proposals.filter(p => p.status === 'exported').length,
        });
      }).finally(() => setStatsLoading(false));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header />

      {/* Dynamic hero */}
      {authed
        ? <AuthedHero email={email} stats={stats} loading={statsLoading} />
        : <GuestHero />
      }

      <div className="flex-1 bg-white">
        <HowItWorks />
        <FeaturesGrid />
        <CtaSection authed={authed} />
      </div>

      <Footer />
    </div>
  );
}
