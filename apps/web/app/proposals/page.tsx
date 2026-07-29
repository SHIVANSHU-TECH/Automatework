'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJson } from '../../src/lib/api';

interface ProposalSummary {
  proposalId: string;
  clientId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

const statusColor: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  generated: 'bg-blue-100 text-blue-700',
  reviewed:  'bg-yellow-100 text-yellow-700',
  exported:  'bg-green-100 text-green-700',
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage]     = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick-create form
  const [title, setTitle]     = useState('');
  const [clientId, setClientId] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProposals = async () => {
    try {
      setLoadError(null);
      const result = await fetchJson<{ proposals: ProposalSummary[] }>('/api/proposals');
      setProposals(result.proposals ?? []);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  };

  useEffect(() => { loadProposals(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetchJson<{ proposal: { proposalId: string } }>('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          clientId: clientId.trim() || 'unknown-client',
          title: title.trim(),
          status: 'draft',
          submittedAt: null,
          version: 1,
          executiveSummary: '', scope: '', timeline: '', deliverables: '',
          pricing: '', maintenancePlan: '', whyChooseUs: '',
          caseStudies: '', terms: '', signature: '', metadata: {},
        }),
      });
      setMessage({ text: 'Proposal created.', type: 'success' });
      setTitle(''); setClientId('');
      await loadProposals();
      // Navigate to the new proposal
      window.location.href = `/proposals/${res.proposal.proposalId}`;
    } catch (err) {
      setMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">

        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
            <p className="mt-1 text-sm text-slate-500">Create, edit, and export client proposals.</p>
          </div>
          <Link href="/website-analyzer" className="btn-secondary text-sm px-4 py-2">
            🔍 Analyze a Website First
          </Link>
        </div>

        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">⚠️ Could not load proposals</p>
            <p className="text-xs text-amber-700 mt-1">{loadError}</p>
            {loadError.includes('Firestore') || loadError.includes('Firebase') ? (
              <p className="text-xs text-amber-600 mt-2">
                Enable Firestore at{' '}
                <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  console.firebase.google.com
                </a>
                {' '}→ Firestore Database → Create database
              </p>
            ) : null}
          </div>
        )}

        {/* Quick create */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Quick Create Blank Proposal</h2>
          <p className="text-xs text-slate-400">Or use the Website Analyzer to auto-populate proposal content from a crawled site.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
              <input className="input-base" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Website Redesign for Acme Corp" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client ID <span className="font-normal normal-case text-slate-400">(optional)</span></span>
              <input className="input-base" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Paste from CRM" />
            </label>
          </div>
          <button onClick={handleCreate} disabled={creating || !title.trim()} className="btn-primary">
            {creating ? 'Creating…' : '+ Create Blank Proposal'}
          </button>
          {message && (
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
            </p>
          )}
        </div>

        {/* Proposal list */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            All Proposals {proposals.length > 0 && `(${proposals.length})`}
          </h2>

          {proposals.length === 0 && !loadError ? (
            <div className="card flex flex-col items-center py-12 text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-sm font-medium text-slate-600">No proposals yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Analyze a website to auto-generate one, or create a blank proposal above.
              </p>
              <Link href="/website-analyzer" className="mt-4 btn-primary text-xs px-4 py-2">
                🔍 Analyze a Website
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => {
                const sourceUrl = p.metadata?.sourceUrl as string | undefined;
                return (
                  <Link
                    key={p.proposalId}
                    href={`/proposals/${p.proposalId}`}
                    className="card flex items-center justify-between gap-4 hover:border-blue-200 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition truncate">
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs text-slate-400">
                          {new Date(p.updatedAt || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {sourceUrl && (
                          <>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs text-blue-400 truncate max-w-[200px]">🌐 {sourceUrl}</span>
                          </>
                        )}
                        {p.clientId && p.clientId !== 'unknown-client' && (
                          <>
                            <span className="text-xs text-slate-300">·</span>
                            <span className="text-xs font-mono text-slate-400">Client: {p.clientId.slice(0, 8)}…</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`badge ${statusColor[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                      <span className="text-slate-300 group-hover:text-blue-400 transition text-sm">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
