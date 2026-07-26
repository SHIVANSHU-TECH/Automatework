import Link from 'next/link';

const features = [
  {
    icon: '🔍',
    title: 'Website Analyzer',
    description: 'Crawl any site and extract tech stack, SEO issues, accessibility violations, performance score, social links, CTAs, and full content.',
    href: '/website-analyzer',
    color: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100',
  },
  {
    icon: '🤖',
    title: 'AI Analysis',
    description: 'Groq-powered LLM generates recommendations for UX, security, performance, automation opportunities, and estimated costs.',
    href: '/proposals',
    color: 'bg-purple-50 border-purple-100',
    iconBg: 'bg-purple-100',
  },
  {
    icon: '📄',
    title: 'Proposal Generator',
    description: 'Assemble professional proposals with 19 content sections. Export as PDF, DOCX, HTML, or Markdown in one click.',
    href: '/proposals',
    color: 'bg-green-50 border-green-100',
    iconBg: 'bg-green-100',
  },
  {
    icon: '👥',
    title: 'CRM',
    description: 'Track clients, link website analyses to proposals, and manage the full sales pipeline from one place.',
    href: '/crm',
    color: 'bg-orange-50 border-orange-100',
    iconBg: 'bg-orange-100',
  },
  {
    icon: '📸',
    title: 'Screenshot Engine',
    description: 'Capture desktop, tablet, and mobile screenshots of any website using headless Chromium — no extensions needed.',
    href: '/website-analyzer',
    color: 'bg-pink-50 border-pink-100',
    iconBg: 'bg-pink-100',
  },
  {
    icon: '📊',
    title: 'Dashboard',
    description: 'See total clients, active proposals, pending reviews, and exported documents at a glance.',
    href: '/dashboard',
    color: 'bg-slate-50 border-slate-100',
    iconBg: 'bg-slate-100',
  },
];

const steps = [
  { num: '01', title: 'Enter a URL', desc: 'Paste any website — the analyzer crawls and extracts all meaningful data.' },
  { num: '02', title: 'Run AI Analysis', desc: 'Groq generates a 20-field strategy report with recommendations and cost estimates.' },
  { num: '03', title: 'Build Proposal', desc: 'All sections auto-populate. Edit, refine, and save to the client record.' },
  { num: '04', title: 'Export & Send', desc: 'One-click export to PDF, DOCX, HTML, or Markdown. Ready to send.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-4">
            Automation Platform
          </span>
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            Turn any website into<br />a winning proposal
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mb-8">
            Crawl a client&apos;s site, get AI-powered insights, and generate a polished proposal — in minutes, not days.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/website-analyzer"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-95"
            >
              🔍 Analyze a Website
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              📊 Open Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-8 py-12 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">How it works</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col gap-2">
                <span className="text-2xl font-black text-blue-100">{s.num}</span>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Features</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className={`group flex flex-col gap-3 rounded-2xl border p-5 transition hover:shadow-md ${f.color}`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${f.iconBg}`}>
                  {f.icon}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">{f.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
