'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson, apiUrl } from '../../src/lib/api';
import { getToken } from '../../src/lib/auth';

interface Lead {
  leadId: string;
  companyName: string;
  website: string;
  businessCategory: string;
  location: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  detectedTechnologies: string[];
  potentialServices: string[];
  websiteHealthScore: number;
  websiteQualityScore: number;
  aiLeadScore: number;
  priorityScore: number;
  outreachStrategy: string;
  tags: string[];
  savedTocrm: boolean;
  source: string;
  createdAt: string;
}

const scoreColor = (s: number) =>
  s >= 70 ? 'text-green-600 bg-green-50' : s >= 40 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';

const priorityBadge = (p: number) => {
  const map: Record<number, string> = { 5: 'bg-red-100 text-red-700', 4: 'bg-orange-100 text-orange-700', 3: 'bg-yellow-100 text-yellow-700', 2: 'bg-blue-100 text-blue-700', 1: 'bg-slate-100 text-slate-600' };
  return map[p] ?? map[1];
};

export default function LeadFinderPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'search' | 'saved'>('search');
  const [industry, setIndustry] = useState('');
  const [country, setCountry]   = useState('');
  const [city, setCity]         = useState('');
  const [keywords, setKeywords] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [limit, setLimit]       = useState(10);

  const [searching, setSearching] = useState(false);
  const [results, setResults]     = useState<Lead[]>([]);
  const [saved, setSaved]         = useState<Lead[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [saving, setSaving]       = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [message, setMessage]     = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterHasContact, setFilterHasContact] = useState<boolean>(false);

  const loadSaved = async () => {
    try {
      const data = await fetchJson<{ leads: Lead[] }>('/api/leads');
      setSaved(data.leads ?? []);
    } catch { setSaved([]); }
  };

  useEffect(() => { loadSaved(); }, []);

  const handleSearch = async () => {
    if (!industry && !keywords && !city && !country) { setError('Enter at least one search criterion'); return; }
    setSearching(true); setError(null); setResults([]); setSelected(new Set());
    try {
      const data = await fetchJson<{ leads: Lead[] }>('/api/leads/search', {
        method: 'POST',
        body: JSON.stringify({ industry, country, city, keywords, companySize, limit }),
      });
      setResults(data.leads ?? []);
    } catch (err) { setError((err as Error).message); }
    finally { setSearching(false); }
  };

  const handleSaveLead = async (lead: Lead) => {
    setSaving(lead.leadId);
    try {
      await fetchJson('/api/leads/save', { method: 'POST', body: JSON.stringify(lead) });
      setMessage(`"${lead.companyName}" saved`);
      await loadSaved();
      setTimeout(() => setMessage(null), 2500);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(null); }
  };

  const handleSaveToCrm = async (lead: Lead) => {
    setSaving(lead.leadId + '-crm');
    try {
      const data = await fetchJson<{ clientId: string }>(`/api/leads/${lead.leadId}/save-to-crm`, { method: 'POST' });
      setMessage(`Saved to CRM (ID: ${data.clientId.slice(0, 8)}…)`);
      await loadSaved();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(null); }
  };

  const currentList = tab === 'search' ? results : saved;
  const filteredList = currentList.filter((lead) => {
    if (filterPriority && lead.priorityScore !== Number(filterPriority)) return false;
    if (filterHasContact && !lead.email && !lead.phone) return false;
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredList.map((l) => l.leadId);
      setSelected(new Set(allIds));
    } else {
      setSelected(new Set());
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const token = getToken();
    const exportLeads = selected.size
      ? currentList.filter((l) => selected.has(l.leadId))
      : filteredList;

    if (exportLeads.length === 0) {
      setError('No leads to export.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const res = await fetch(`${apiUrl}/api/leads/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ format, leads: exportLeads }),
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `leads.${format}`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (leadId: string) => {
    await fetchJson(`/api/leads/${leadId}`, { method: 'DELETE' });
    await loadSaved();
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const isValidContact = (val?: string) => {
    if (!val) return false;
    const s = val.toLowerCase().trim();
    return s.length > 1 && s !== 'n/a' && s !== 'not found' && s !== 'not available' && s !== 'none';
  };

  const industries = ['SaaS', 'Healthcare', 'E-commerce', 'Finance', 'Education', 'Real Estate', 'Manufacturing', 'Retail', 'Professional Services', 'Hospitality'];
  const sizes      = ['1-10', '11-50', '51-200', '201-500', '500+'];

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <div className="page-header flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lead Finder</h1>
            <p className="mt-1 text-sm text-slate-500">Discover businesses that may need software services.</p>
          </div>
          <div className="flex gap-2">
            {['search','saved'].map((t) => (
              <button key={t} onClick={() => { setTab(t as 'search'|'saved'); setSelected(new Set()); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === t ? 'bg-brandblue text-white' : 'btn-secondary'}`}>
                {t === 'search' ? 'Search' : `Saved (${saved.length})`}
              </button>
            ))}
          </div>
        </div>

        {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700 font-medium">✓ {message}</div>}

        {tab === 'search' && (
          <>
            {/* Search filters */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Search Criteria</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Industry</span>
                  <select className="input-base" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    <option value="">Any industry</option>
                    {industries.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Country</span>
                  <input className="input-base" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">City</span>
                  <input className="input-base" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. New York" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Keywords</span>
                  <input className="input-base" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. dental clinic, restaurant chain" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Company Size</span>
                  <select className="input-base" value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                    <option value="">Any size</option>
                    {sizes.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Results</span>
                  <select className="input-base" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                    {[5,10,15,20].map((n) => <option key={n} value={n}>{n} leads</option>)}
                  </select>
                </label>
              </div>
              <button onClick={handleSearch} disabled={searching} className="btn-primary">
                {searching ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>Searching…
                  </span>
                ) : 'Find Leads'}
              </button>
            </div>

            {/* Results */}
            {currentList.length > 0 && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-customBorder pb-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={filteredList.length > 0 && selected.size === filteredList.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-brandblue focus:ring-brandblue"
                      />
                      Select All
                    </label>
                    <div className="h-4 w-px bg-customBorder hidden sm:block" />
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-textsecondary">Filters:</span>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="rounded-lg border border-customBorder bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brandblue"
                      >
                        <option value="">Any Priority</option>
                        <option value="5">P5 Only</option>
                        <option value="4">P4 Only</option>
                        <option value="3">P3 Only</option>
                        <option value="2">P2 Only</option>
                        <option value="1">P1 Only</option>
                      </select>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={filterHasContact}
                          onChange={(e) => setFilterHasContact(e.target.checked)}
                          className="rounded border-slate-300 text-brandblue focus:ring-brandblue"
                        />
                        Has Contact Details
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-textsecondary mr-2">{selected.size} of {filteredList.length} selected</span>
                    <button onClick={() => handleExport('csv')} className="btn-secondary text-xs px-3 py-1.5">Export CSV</button>
                    <button onClick={() => handleExport('json')} className="btn-secondary text-xs px-3 py-1.5">Export JSON</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredList.map((lead) => (
                    <div key={lead.leadId} className="card space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input type="checkbox" checked={selected.has(lead.leadId)} onChange={() => toggleSelect(lead.leadId)} className="rounded" />
                            <p className="text-sm font-semibold text-slate-900">{lead.companyName}</p>
                            <span className={`badge text-xs ${priorityBadge(lead.priorityScore)}`}>P{lead.priorityScore}</span>
                            <span className="badge text-xs bg-slate-100 text-slate-500">{lead.source}</span>
                          </div>
                          {lead.website && <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{lead.website}</a>}
                          <p className="text-xs text-slate-400 mt-0.5">{lead.location} · {lead.businessCategory}</p>
                        </div>
                        <div className={`flex flex-col items-center px-3 py-1 rounded-lg text-xs font-bold ${scoreColor(lead.aiLeadScore)}`}>
                          <span className="text-lg">{lead.aiLeadScore}</span>
                          <span>AI Score</span>
                        </div>
                      </div>
                      {(isValidContact(lead.email) || isValidContact(lead.phone) || isValidContact(lead.linkedinUrl)) && (
                        <div className="flex gap-4 flex-wrap text-xs text-slate-500">
                          {isValidContact(lead.email) && <span>Email: <a href={`mailto:${lead.email}`} className="text-brandblue hover:underline font-medium">{lead.email}</a></span>}
                          {isValidContact(lead.phone) && (
                            <span>Phone: <a href={`tel:${lead.phone!.replace(/[^0-9+]/g, '')}`} className="text-brandblue hover:underline font-medium">{lead.phone}</a></span>
                          )}
                          {isValidContact(lead.linkedinUrl) && (
                            <a
                              href={/^https?:\/\//i.test(lead.linkedinUrl!.trim()) ? lead.linkedinUrl!.trim() : `https://${lead.linkedinUrl!.trim().replace(/^\/+/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brandblue hover:underline font-medium"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      )}
                      {lead.potentialServices.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.potentialServices.map((s, i) => (
                            <span key={i} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{s}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 italic">{lead.outreachStrategy}</p>
                      <div className="flex gap-2 pt-1 border-t border-slate-100 flex-wrap">
                        <button onClick={() => handleSaveLead(lead)} disabled={saving === lead.leadId} className="btn-secondary text-xs px-3 py-1.5">
                          {saving === lead.leadId ? 'Saving…' : 'Save Lead'}
                        </button>
                        <button onClick={() => handleSaveToCrm(lead)} disabled={saving === lead.leadId + '-crm'} className="btn-primary text-xs px-3 py-1.5">
                          {saving === lead.leadId + '-crm' ? 'Adding…' : 'Add to CRM'}
                        </button>
                        <button onClick={() => router.push('/proposals')} className="btn-secondary text-xs px-3 py-1.5">Create Proposal</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'saved' && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="section-label">Saved Leads ({saved.length})</p>
            </div>
            {saved.length === 0 ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 mb-3 border border-customBorder">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No saved leads yet</p>
                <p className="text-xs text-slate-400 mt-1">Search and save leads to see them here.</p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-customBorder pb-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={filteredList.length > 0 && selected.size === filteredList.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-brandblue focus:ring-brandblue"
                      />
                      Select All
                    </label>
                    <div className="h-4 w-px bg-customBorder hidden sm:block" />
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-textsecondary">Filters:</span>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="rounded-lg border border-customBorder bg-white px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brandblue"
                      >
                        <option value="">Any Priority</option>
                        <option value="5">P5 Only</option>
                        <option value="4">P4 Only</option>
                        <option value="3">P3 Only</option>
                        <option value="2">P2 Only</option>
                        <option value="1">P1 Only</option>
                      </select>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={filterHasContact}
                          onChange={(e) => setFilterHasContact(e.target.checked)}
                          className="rounded border-slate-300 text-brandblue focus:ring-brandblue"
                        />
                        Has Contact Details
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-textsecondary mr-2">{selected.size} of {filteredList.length} selected</span>
                    <button onClick={() => handleExport('csv')} className="btn-secondary text-xs px-3 py-1.5">Export CSV</button>
                    <button onClick={() => handleExport('json')} className="btn-secondary text-xs px-3 py-1.5">Export JSON</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredList.map((lead) => (
                    <div key={lead.leadId} className="card flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="checkbox" checked={selected.has(lead.leadId)} onChange={() => toggleSelect(lead.leadId)} className="rounded" />
                          <p className="text-sm font-semibold text-slate-900">{lead.companyName}</p>
                          <span className={`badge text-xs ${priorityBadge(lead.priorityScore)}`}>P{lead.priorityScore}</span>
                          {lead.savedTocrm && <span className="badge text-xs bg-green-100 text-green-700">In CRM</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{lead.location} · {lead.businessCategory}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge text-xs font-bold ${scoreColor(lead.aiLeadScore)}`}>{lead.aiLeadScore}</span>
                        {!lead.savedTocrm && (
                          <button onClick={() => handleSaveToCrm(lead)} disabled={saving === lead.leadId + '-crm'} className="btn-primary text-xs px-3 py-1.5">
                            {saving === lead.leadId + '-crm' ? '…' : 'CRM'}
                          </button>
                        )}
                        <button onClick={() => handleDelete(lead.leadId)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1.5">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
