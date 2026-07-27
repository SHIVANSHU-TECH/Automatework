import Link from 'next/link';

const features = [
  {
    title: 'Website Analyzer',
    description: 'Crawl any client site and extract tech stack, SEO gaps, accessibility issues, performance score, and full content in seconds.',
    href: '/website-analyzer',
    color: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    title: 'Proposal Generator',
    description: 'Proposals auto-populate from analysis data. Edit all 10 sections, change status, and export as PDF, Word, HTML, or Markdown.',
    href: '/proposals',
    color: 'bg-indigo-50 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  {
    title: 'Client Management',
    description: 'Track every client, link their website to analyses and proposals, and manage your full pipeline from one place.',
    href: '/crm',
    color: 'bg-violet-50 border-violet-200',
    dot: 'bg-violet-500',
  },
  {
    title: 'Multi-Format Export',
    description: 'One click to download a polished PDF, formatted Word document, standalone HTML page, or plain Markdown file.',
    href: '/proposals',
    color: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  {
    title: 'SEO & Performance Audit',
    description: 'Detect missing titles, broken links, accessibility violations, and render-blocking resources automatically on every crawl.',
    href: '/website-analyzer',
    color: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    title: 'Isolated Workspace',
    description: 'Every account is fully isolated. Your clients, analyses, and proposals are private and never visible to other users.',
    href: '/dashboard',
    color: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
  },
];

const steps = [
  { num: '01', title: 'Analyze a Website', desc: 'Enter any URL — we crawl it and extract all meaningful data automatically.' },
  { num: '02', title: 'Save to Clients', desc: 'One click saves the site to your CRM and links the analysis to a client record.' },
  { num: '03', title: 'Generate Proposal', desc: 'Proposal sections auto-populate. Edit, refine, and save in your workspace.' },
  { num: '04', title: 'Export & Deliver', desc: 'Download as PDF, Word, HTML, or Markdown. Ready to send in minutes.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-8 py-20 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 tracking-wide mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"/>
            Business Intelligence Platform
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-5 tracking-tight">
            Turn any website into<br />
            <span className="text-blue-400">a winning proposal</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mb-8 leading-relaxed">
            Crawl a prospect&apos;s site, capture every insight automatically,
            and deliver a polished proposal — in minutes, not days.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/website-analyzer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
              Analyze a Website
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border-b border-slate-100 px-8 py-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">How it works</p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-col gap-2 relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-3 left-full w-full h-px bg-slate-100 -translate-y-0.5" style={{ width: 'calc(100% - 1rem)' }}/>
                )}
                <span className="text-3xl font-black text-blue-100 select-none">{s.num}</span>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-8 py-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Everything you need</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className={`group flex flex-col gap-3 rounded-2xl border p-5 transition hover:shadow-md hover:-translate-y-0.5 ${f.color}`}
              >
                <span className={`h-2 w-2 rounded-full ${f.dot}`}/>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
