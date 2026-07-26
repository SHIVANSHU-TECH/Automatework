import Link from 'next/link';

const stats = [
  { label: 'Total Clients',    value: '—', icon: '👥', color: 'bg-blue-50   text-blue-700',   border: 'border-blue-100'   },
  { label: 'Proposals',        value: '—', icon: '📄', color: 'bg-purple-50 text-purple-700', border: 'border-purple-100' },
  { label: 'Pending Review',   value: '—', icon: '⏳', color: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-100' },
  { label: 'Exported',         value: '—', icon: '✅', color: 'bg-green-50  text-green-700',  border: 'border-green-100'  },
];

const quickLinks = [
  { href: '/website-analyzer', label: 'Analyze a Website', icon: '🔍', desc: 'Crawl and inspect any client site' },
  { href: '/proposals',        label: 'Create Proposal',   icon: '📄', desc: 'Start a new client proposal' },
  { href: '/crm',              label: 'Add Client',        icon: '👥', desc: 'Register a new CRM client' },
];

export default function DashboardPage() {
  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Overview of your workspace activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`card flex items-center gap-4 border ${s.border}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickLinks.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="card group flex items-center gap-4 transition hover:border-blue-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl group-hover:bg-blue-100 transition">
                  {q.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition">{q.label}</p>
                  <p className="text-xs text-slate-400">{q.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Recent Activity</h2>
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm font-medium text-slate-600">No activity yet</p>
            <p className="text-xs text-slate-400 mt-1">Start by analyzing a website or adding a client.</p>
            <Link
              href="/website-analyzer"
              className="mt-4 btn-primary text-xs px-4 py-2"
            >
              Get started
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
