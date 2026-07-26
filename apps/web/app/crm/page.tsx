'use client';

import { useEffect, useState } from 'react';
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
  'Healthcare':             'bg-red-50    text-red-600',
  'E-commerce':             'bg-orange-50 text-orange-600',
  'SaaS':                   'bg-blue-50   text-blue-600',
  'Finance':                'bg-green-50  text-green-600',
  'Education':              'bg-yellow-50 text-yellow-600',
  'Real Estate':            'bg-purple-50 text-purple-600',
  'Professional Services':  'bg-slate-50  text-slate-600',
};

export default function CrmPage() {
  const [clients, setClients]           = useState<ClientSummary[]>([]);
  const [name, setName]                 = useState('');
  const [websiteUrl, setWebsiteUrl]     = useState('');
  const [businessCategory, setCategory] = useState('Professional Services');
  const [contactEmail, setEmail]        = useState('');
  const [loading, setLoading]           = useState(false);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [message, setMessage]           = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
          name: name.trim(),
          websiteUrl: websiteUrl.trim(),
          businessCategory,
          contactEmail: contactEmail.trim(),
          contactPhone: '',
          socialLinks: [],
        }),
      });
      setMessage({ text: `Client "${name.trim()}" added successfully.`, type: 'success' });
      setName(''); setWebsiteUrl(''); setEmail('');
      await loadClients();
    } catch (err) {
      setMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Professional Services', 'Healthcare', 'E-commerce', 'SaaS',
    'Finance', 'Education', 'Real Estate',
  ];

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="page-header">
          <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
          <p className="mt-1 text-sm text-slate-500">Manage clients and connect website data with proposal workflows.</p>
        </div>

        {/* Load error */}
        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">⚠️ Could not load clients</p>
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

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">

          {/* Add client form */}
          <div className="card h-fit space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Add New Client</h2>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Client Name *</span>
              <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Website URL *</span>
              <input className="input-base" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="fit29.com" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Business Category</span>
              <select
                className="input-base"
                value={businessCategory}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Contact Email</span>
              <input className="input-base" type="email" value={contactEmail} onChange={(e) => setEmail(e.target.value)} placeholder="hello@client.com" />
            </label>

            <button
              onClick={handleCreate}
              disabled={loading || !name.trim() || !websiteUrl.trim()}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : '+ Add Client'}
            </button>

            {message && (
              <div className={`rounded-lg px-4 py-2.5 text-xs font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
                {message.type === 'error' && message.text.includes('Firebase') && (
                  <p className="mt-1 font-normal">Firebase Realtime Database is deactivated — enable it in the Firebase console.</p>
                )}
              </div>
            )}
          </div>

          {/* Client list */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Clients {clients.length > 0 && `(${clients.length})`}
            </h2>

            {clients.length === 0 && !loadError ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <span className="text-4xl mb-3">👥</span>
                <p className="text-sm font-medium text-slate-600">No clients yet</p>
                <p className="text-xs text-slate-400 mt-1">Add your first client using the form.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((c) => (
                  <div key={c.clientId} className="card flex items-start justify-between gap-4">
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-0.5 block truncate"
                      >
                        {c.websiteUrl}
                      </a>
                      {c.contactEmail && (
                        <p className="text-xs text-slate-400 mt-0.5">{c.contactEmail}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-mono text-slate-300">{c.clientId.slice(0, 8)}</span>
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
