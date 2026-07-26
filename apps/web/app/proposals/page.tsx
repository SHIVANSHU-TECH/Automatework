'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../../src/lib/api';

interface ProposalSummary {
  proposalId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusColor: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  generated: 'bg-blue-100 text-blue-700',
  reviewed:  'bg-yellow-100 text-yellow-700',
  exported:  'bg-green-100 text-green-700',
};

export default function ProposalsPage() {
  const [proposals, setProposals]   = useState<ProposalSummary[]>([]);
  const [title, setTitle]           = useState('New Proposal');
  const [clientId, setClientId]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [message, setMessage]       = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
    setLoading(true);
    setMessage(null);

    try {
      await fetchJson('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          clientId: clientId.trim() || 'unknown-client',
          title: title.trim(),
          status: 'draft',
          submittedAt: null,
          version: 1,
          executiveSummary: '',
          scope: '',
          timeline: '',
          deliverables: '',
          pricing: '',
          maintenancePlan: '',
          whyChooseUs: '',
          caseStudies: '',
          terms: '',
          signature: '',
          metadata: {},
        }),
      });
      setMessage({ text: 'Proposal created successfully.', type: 'success' });
      setTitle('New Proposal');
      setClientId('');
      await loadProposals();
    } catch (err) {
      setMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage client proposals.</p>
        </div>

        {/* Firebase warning */}
        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">⚠️ Could not load proposals</p>
            <p className="text-xs text-amber-700 mt-1">{loadError}</p>
            {loadError.includes('Firebase') && (
              <p className="text-xs text-amber-600 mt-2">
                Firebase Realtime Database is deactivated. Enable it at{' '}
                <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  console.firebase.google.com
                </a>
              </p>
            )}
          </div>
        )}

        {/* Create form */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Create New Proposal</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Proposal Title</span>
              <input
                className="input-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Redesign for Acme Corp"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Client ID <span className="normal-case font-normal text-slate-400">(optional)</span></span>
              <input
                className="input-base"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Paste a client ID from CRM"
              />
            </label>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating…
              </>
            ) : '+ Create Draft Proposal'}
          </button>

          {message && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
              {message.type === 'error' && message.text.includes('Firebase') && (
                <p className="mt-1 text-xs font-normal">Firebase Realtime Database is deactivated — enable it in the Firebase console.</p>
              )}
            </div>
          )}
        </div>

        {/* List */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            All Proposals {proposals.length > 0 && `(${proposals.length})`}
          </h2>

          {proposals.length === 0 && !loadError ? (
            <div className="card flex flex-col items-center py-12 text-center">
              <span className="text-4xl mb-3">📄</span>
              <p className="text-sm font-medium text-slate-600">No proposals yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first proposal above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <div key={p.proposalId} className="card flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Created {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}ID: <span className="font-mono">{p.proposalId.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${statusColor[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
