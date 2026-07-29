'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchJson } from '../../src/lib/api';

interface ClientSummary {
  clientId: string;
  name: string;
  websiteUrl: string;
  businessCategory?: string;
  contactEmail?: string;
  createdAt?: string;
}

const categoryColor: Record<string, string> = {
  'Healthcare':            'bg-red-50 text-red-600',
  'E-commerce':            'bg-orange-50 text-orange-600',
  'SaaS':                  'bg-blue-50 text-blue-600',
  'Finance':               'bg-green-50 text-green-600',
  'Education':             'bg-yellow-50 text-yellow-600',
  'Real Estate':           'bg-purple-50 text-purple-600',
  'Professional Services': 'bg-slate-50 text-slate-600',
};

export default function CrmPage() {
  const router = useRouter();
  const [clients, setClients]           = useState<ClientSummary[]>([]);
  const [name, setName]                 = useState('');
  const [websiteUrl, setWebsiteUrl]     = useState('');
  const [businessCategory, setCategory] = useState('Professional Services');
  const [contactEmail, setEmail]        = useState('');
  const [loading, setLoading]           = useState(false);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [message, setMessage]           = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [creatingProposal, setCreatingProposal] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      setLoadError(null);
      const result = await fetchJson<{ clients: ClientSummary[] }>('/api/crm');
      setClients(result.clients ?? []);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !websiteUrl.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await fetchJson('/api/crm/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(), websiteUrl: websiteUrl.trim(),
          businessCategory, contactEmail: contactEmail.trim(),
          contactPhone: '', socialLinks: [],
        }),
      });
      setMessage({ text: `"${name.trim()}" added.`, type: 'success' });
      setName(''); setWebsiteUrl(''); setEmail('');
      await loadClients();
    } catch (err) {
      setMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (client: ClientSummary) => {
    setCreatingProposal(client.clientId);
    try {
      const res = await fetchJson<{ proposal: { proposalId: string } }>('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          clientId: client.clientId,
          title: `Proposal for ${client.name}`,
          status: 'draft',
          submittedAt: null, version: 1,
          executiveSummary: `This proposal is prepared for ${client.name} (${client.websiteUrl}).`,
          scope: '', timeline: '4–8 weeks', deliverables: '',
          pricing: '', maintenancePlan: '', whyChooseUs: '',
          caseStudies: '', terms: 'Net 30 payment terms.', signature: '',
          metadata: { sourceUrl: client.websiteUrl, clientName: client.name },
        }),
      });
      router.push(`/proposals/${res.proposal.proposalId}`);
    } catch (err) {
      setMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setCreatingProposal(null);
    }
  };

  const categories = ['Professional Services', 'Healthcare', 'E-commerce', 'SaaS', 'Finance', 'Education', 'Real Estate'];

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        <div className="page-header">
          <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
          <p className="mt-1 text-sm text-slate-500">Manage clients. Analyze their websites. Create proposals.</p>
        </div>

        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">⚠️ Could not load clients</p>
            <p className="text-xs text-amber-700 mt-1">{loadError}</p>
            {(loadError.includes('Firestore') || loadError.includes('Firebase')) && (
              <p className="text-xs text-amber-600 mt-2">
                Enable Firestore at{' '}
                <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  console.firebase.google.com
                </a>
                {' '}→ Firestore Database → Create database
              </p>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">

          {/* Add client */}
          <div className="card h-fit space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Add New Client</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client Name *</span>
              <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website URL *</span>
              <input className="input-base" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="fit29.com" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
              <select className="input-base" value={businessCategory} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Email</span>
              <input className="input-base" type="email" value={contactEmail} onChange={(e) => setEmail(e.target.value)} placeholder="hello@client.com" />
            </label>
            <button onClick={handleCreate} disabled={loading || !name.trim() || !websiteUrl.trim()} className="btn-primary w-full">
              {loading ? 'Saving…' : '+ Add Client'}
            </button>
            {message && (
              <p className={`text-xs font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
              </p>
            )}
          </div>

          {/* Client list */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Clients {clients.length > 0 && `(${clients.length})`}
            </h2>

            {clients.length === 0 && !loadError ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 mb-3 border border-customBorder">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No clients yet</p>
                <p className="text-xs text-slate-400 mt-1">Add a client or analyze a website to get started.</p>
                <Link href="/website-analyzer" className="mt-4 btn-primary text-xs px-4 py-2">Analyze a Website</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((c) => (
                  <div key={c.clientId} className="card space-y-3">
                    {/* Client info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          {c.businessCategory && (
                            <span className={`badge text-xs ${categoryColor[c.businessCategory] ?? 'bg-slate-100 text-slate-600'}`}>
                              {c.businessCategory}
                            </span>
                          )}
                        </div>
                        <a
                          href={c.websiteUrl.startsWith('http') ? c.websiteUrl : `https://${c.websiteUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-0.5 block truncate"
                        >
                          {c.websiteUrl}
                        </a>
                        {c.contactEmail && <p className="text-xs text-slate-400 mt-0.5">{c.contactEmail}</p>}
                      </div>
                      <span className="shrink-0 text-xs font-mono text-slate-300">{c.clientId.slice(0, 8)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1 border-t border-slate-100 flex-wrap">
                      <Link
                        href={`/website-analyzer?url=${encodeURIComponent(c.websiteUrl)}&clientId=${c.clientId}`}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Analyze Website
                      </Link>
                      <button
                        onClick={() => handleCreateProposal(c)}
                        disabled={creatingProposal === c.clientId}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {creatingProposal === c.clientId ? 'Creating…' : 'Create Proposal'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
