'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchJson, apiUrl } from '../../../src/lib/api';
import { getToken } from '../../../src/lib/auth';

interface Proposal {
  proposalId: string;
  clientId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  executiveSummary: string;
  scope: string;
  timeline: string;
  deliverables: string;
  pricing: string;
  maintenancePlan: string;
  whyChooseUs: string;
  caseStudies: string;
  terms: string;
  metadata?: Record<string, unknown>;
}

interface ShortUrlResult {
  shortUrl: string;
  qrCode?: string;
  shortId: string;
}

const statusColor: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  generated: 'bg-blue-100 text-blue-700',
  reviewed:  'bg-yellow-100 text-yellow-700',
  exported:  'bg-green-100 text-green-700',
};

const statusNext: Record<string, string> = {
  draft:     'generated',
  generated: 'reviewed',
  reviewed:  'exported',
};

const FORMATS = [
  {
    key: 'pdf',
    label: 'PDF',
    desc: 'A4 document',
    icon: (
      <svg className="h-4 w-4 shrink-0 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4"/>
      </svg>
    ),
  },
  {
    key: 'docx',
    label: 'Word',
    desc: '.docx file',
    icon: (
      <svg className="h-4 w-4 shrink-0 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M8.5 16l1.2-5h1.1l1.1 3.8L13.1 11h1.1l1.2 5H14l-.7-3.2L12.2 16h-.9l-1.1-3.2L9.5 16H8.5z"/>
      </svg>
    ),
  },
  {
    key: 'html',
    label: 'HTML',
    desc: 'web page',
    icon: (
      <svg className="h-4 w-4 shrink-0 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/>
      </svg>
    ),
  },
  {
    key: 'markdown',
    label: 'Markdown',
    desc: '.md file',
    icon: (
      <svg className="h-4 w-4 shrink-0 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 15V9h1.2L10 12l1.8-3H13v6h-1.3V11L10.4 14H9.6L8.3 11v4H7zm7 0l2-2.5V9h1.3v3.5L19.3 15H17.8l-1.1-1.5L15.6 15H14z"/>
      </svg>
    ),
  },
];

const IconSave = (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H7V3M7 21v-8h10v8"/>
  </svg>
);

const IconGlobe = (
  <svg className="h-3.5 w-3.5 shrink-0 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <circle cx="12" cy="12" r="9"/>
    <path strokeLinecap="round" d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>
  </svg>
);
function Field({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {multiline ? (
        <textarea
          className="input-base min-h-[90px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      ) : (
        <input
          className="input-base"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}…`}
        />
      )}
    </div>
  );
}

export default function ProposalDetailPage() {
  const params   = useParams();
  const id       = params?.id as string;
  const router   = useRouter();
  const dropRef  = useRef<HTMLDivElement>(null);

  const [proposal, setProposal]       = useState<Proposal | null>(null);
  const [loading, setLoading]         = useState(true);
  const [isOwner, setIsOwner]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [advancing, setAdvancing]     = useState(false);
  const [exporting, setExporting]     = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const [exportOpen, setExportOpen]   = useState(false);

  // V2 integrations
  const [shareUrl, setShareUrl]           = useState<ShortUrlResult | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [copiedShare, setCopiedShare]     = useState(false);
  const [generatingLinkedIn, setGeneratingLinkedIn] = useState(false);
  const [linkedInPostId, setLinkedInPostId] = useState<string | null>(null);

  const [title, setTitle]               = useState('');
  const [executiveSummary, setExec]     = useState('');
  const [scope, setScope]               = useState('');
  const [timeline, setTimeline]         = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [pricing, setPricing]           = useState('');
  const [maintenance, setMaintenance]   = useState('');
  const [whyUs, setWhyUs]               = useState('');
  const [caseStudies, setCaseStudies]   = useState('');
  const [terms, setTerms]               = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load proposal — try owner endpoint first, fall back to public shared endpoint
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const applyProposal = (p: Proposal) => {
      if (cancelled) return;
      setProposal(p);
      setTitle(p.title ?? '');
      setExec(p.executiveSummary ?? '');
      setScope(p.scope ?? '');
      setTimeline(p.timeline ?? '');
      setDeliverables(p.deliverables ?? '');
      setPricing(p.pricing ?? '');
      setMaintenance(p.maintenancePlan ?? '');
      setWhyUs(p.whyChooseUs ?? '');
      setCaseStudies(p.caseStudies ?? '');
      setTerms(p.terms ?? '');
    };

    fetchJson<{ proposal: Proposal }>(`/api/proposals/${id}`)
      .then(({ proposal: p }) => { setIsOwner(true); applyProposal(p); })
      .catch(() => {
        // Not the owner — try the public shared snapshot (created when owner shared the link)
        return fetchJson<{ proposal: Proposal }>(`/api/proposals/shared/${id}`)
          .then(({ proposal: p }) => { setIsOwner(false); applyProposal(p); })
          .catch((err) => { if (!cancelled) setError((err as Error).message); });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async () => {
    if (!proposal) return;
    setSaving(true); setSaved(false); setError(null);
    try {
      const updated = await fetchJson<{ proposal: Proposal }>(`/api/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title, executiveSummary, scope, timeline, deliverables,
          pricing, maintenancePlan: maintenance, whyChooseUs: whyUs,
          caseStudies, terms,
        }),
      });
      setProposal(updated.proposal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!proposal || !statusNext[proposal.status]) return;
    setAdvancing(true);
    try {
      const updated = await fetchJson<{ proposal: Proposal }>(`/api/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: statusNext[proposal.status] }),
      });
      setProposal(updated.proposal);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdvancing(false);
    }
  };

  const handleExport = async (format: string) => {
    setExportOpen(false);
    setExporting(format);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ proposalId: id, format }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Export failed');
      }
      const blob = await res.blob();
      const ext  = format === 'markdown' ? 'md' : format;
      const name = `${proposal?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() ?? 'proposal'}.${ext}`;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(null);
    }
  };

  // V2: Generate shareable short URL for this proposal
  const handleGenerateShareableLink = async () => {
    if (!proposal) return;
    setGeneratingShare(true); setError(null);
    try {
      // Always share the proposal page on the web app — never the API/Render host
      // (opening https://…onrender.com/proposals/… shows a raw "Cannot GET" page).
      const webBase =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://automatework-web.vercel.app');
      const longUrl = `${webBase}/proposals/${id}`;
      const data = await fetchJson<{ shortUrl: { shortUrl: string; qrCode?: string; shortId: string } }>('/api/urls', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: longUrl,
          alias: `proposal-${id.slice(0, 6)}`,
          proposalId: id,
        }),
      });
      setShareUrl({ shortUrl: data.shortUrl.shortUrl, qrCode: data.shortUrl.qrCode, shortId: data.shortUrl.shortId });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingShare(false);
    }
  };

  // V2: Generate LinkedIn post from this proposal
  const handleGenerateLinkedIn = async (postType: string) => {
    if (!proposal) return;
    setGeneratingLinkedIn(true); setError(null);
    try {
      const data = await fetchJson<{ post: { postId: string } }>('/api/linkedin/from-proposal', {
        method: 'POST',
        body: JSON.stringify({ proposalId: id, postType }),
      });
      // Save it automatically
      await fetchJson('/api/linkedin/save', { method: 'POST', body: JSON.stringify(data.post) });
      setLinkedInPostId(data.post.postId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingLinkedIn(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm">Loading proposal…</span>
        </div>
      </main>
    );
  }

  if (error && !proposal) {
    return (
      <main className="p-4 md:p-8">
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm max-w-xl">
          <p className="font-semibold">Could not load proposal</p>
          <p className="mt-1 text-xs">{error}</p>
          <button onClick={() => router.push('/proposals')} className="mt-3 btn-secondary text-xs px-3 py-1.5">
            ← Back to Proposals
          </button>
        </div>
      </main>
    );
  }

  if (!proposal) return null;

  const sourceUrl  = proposal.metadata?.sourceUrl as string | undefined;
  const clientName = proposal.metadata?.clientName as string | undefined;

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button
              onClick={() => router.push('/proposals')}
              className="text-xs text-slate-400 hover:text-slate-600 mb-2 flex items-center gap-1 transition"
            >
              ← All Proposals
            </button>
            <h1 className="text-2xl font-bold text-slate-900">{proposal.title}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`badge ${statusColor[proposal.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {proposal.status}
              </span>
              <span className="text-xs text-slate-400">v{proposal.version}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">
                Updated {new Date(proposal.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {clientName && (
                <><span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">👤 {clientName}</span></>
              )}
              {sourceUrl && (
                <><span className="text-xs text-slate-300">·</span>
                <a
                  href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 hover:underline max-w-[280px] truncate"
                >{IconGlobe}<span className="truncate">{sourceUrl}</span></a></>
              )}
            </div>
          </div>

          {/* ─── Action buttons ──────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap items-center">
            {isOwner && statusNext[proposal.status] && (
              <button
                onClick={handleAdvanceStatus}
                disabled={advancing}
                className="btn-secondary text-xs px-3 py-2"
              >
                {advancing ? 'Updating…' : `→ Mark as ${statusNext[proposal.status]}`}
              </button>
            )}

            {/* Click-toggled export dropdown — no hover gap issue */}
            <div ref={dropRef} className="relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                disabled={!!exporting}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
              >
                {exporting ? (
                  <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Exporting {exporting.toUpperCase()}…</>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Export <span className="text-slate-400">{exportOpen ? '▴' : '▾'}</span>
                  </>
                )}
              </button>

              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[200px] overflow-hidden">
                  {FORMATS.map(({ key, label, desc, icon }) => (
                    <button
                      key={key}
                      onClick={() => handleExport(key)}
                      className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-colors"
                    >
                      {icon}
                      <span className="flex flex-col min-w-0">
                        <span className="font-medium text-slate-800">{label}</span>
                        <span className="text-xs text-slate-400">{desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isOwner && (
              <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                {saving ? 'Saving…' : <>{IconSave} Save</>}
              </button>
            )}
          </div>
        </div>

        {/* ─── Feedback banners ────────────────────────────────────────── */}
        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 font-medium">
            ✓ Proposal saved
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            ✗ {error}
          </div>
        )}

        {!isOwner && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
            👁 You are viewing a shared proposal (read-only)
          </div>
        )}

        {/* ─── Editable fields ─────────────────────────────────────────── */}
        <div className="card space-y-5">
          <Field label="Title"               value={title}             onChange={isOwner ? setTitle : () => {}} multiline={false} />
          <Field label="Executive Summary"   value={executiveSummary} onChange={isOwner ? setExec : () => {}}  multiline />
          <Field label="Scope of Work"       value={scope}             onChange={isOwner ? setScope : () => {}} multiline />
          <Field label="Timeline"            value={timeline}          onChange={isOwner ? setTimeline : () => {}} />
          <Field label="Deliverables"        value={deliverables}      onChange={isOwner ? setDeliverables : () => {}} multiline />
          <Field label="Pricing"             value={pricing}           onChange={isOwner ? setPricing : () => {}}      multiline />
          <Field label="Maintenance Plan"    value={maintenance}       onChange={isOwner ? setMaintenance : () => {}}  multiline />
          <Field label="Why Choose Us"       value={whyUs}             onChange={isOwner ? setWhyUs : () => {}}        multiline />
          <Field label="Case Studies"        value={caseStudies}       onChange={isOwner ? setCaseStudies : () => {}}  multiline />
          <Field label="Terms & Conditions"  value={terms}             onChange={isOwner ? setTerms : () => {}}        multiline />
        </div>


        <div className="flex justify-between items-center">
          <button onClick={() => router.push('/proposals')} className="btn-secondary text-sm px-4 py-2">
            ← Back
          </button>
          {isOwner && (
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
              {saving ? 'Saving…' : <>{IconSave} Save Proposal</>}
            </button>
          )}
        </div>

        {/* ─── V2: Shareable Link ──────────────────────────────────────── */}
        {isOwner && (
        <div className="card border-indigo-100 bg-indigo-50 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-indigo-900">🔗 Shareable Link</p>
              <p className="text-xs text-indigo-600 mt-0.5">Create a short URL + QR code to share this proposal</p>
            </div>
            {!shareUrl && (
              <button onClick={handleGenerateShareableLink} disabled={generatingShare} className="btn-primary text-xs px-4 py-2">
                {generatingShare ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>Generating…
                  </span>
                ) : '+ Generate Link'}
              </button>
            )}
          </div>

          {shareUrl && (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={shareUrl.shortUrl} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-sm text-blue-700 hover:underline break-all">{shareUrl.shortUrl}</a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl.shortUrl); setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2000); }}
                    className="btn-secondary text-xs px-2 py-1 shrink-0">
                    {copiedShare ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge text-xs bg-green-100 text-green-700">✓ Short URL created</span>
                  <button onClick={() => router.push('/url-shortener')} className="text-xs text-blue-600 hover:underline">View analytics →</button>
                  <button onClick={() => setShareUrl(null)} className="text-xs text-slate-400 hover:text-slate-600">Reset</button>
                </div>
              </div>
              {shareUrl.qrCode && (
                <div className="flex flex-col items-center gap-1">
                  <img src={shareUrl.qrCode} alt="QR" className="w-20 h-20 rounded-lg border border-indigo-200" />
                  <a href={shareUrl.qrCode} download="qr.png" className="text-[10px] text-indigo-500 hover:underline">⬇ QR</a>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* ─── V2: LinkedIn Content ────────────────────────────────────── */}
        {isOwner && (
        <div className="card border-blue-100 bg-blue-50 space-y-3">
          <div>
            <p className="text-sm font-semibold text-blue-900">LinkedIn Content</p>
            <p className="text-xs text-blue-600 mt-0.5">Auto-generate a LinkedIn post from this proposal</p>
          </div>

          {linkedInPostId ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge text-xs bg-green-100 text-green-700">✓ Post generated & saved</span>
              <button onClick={() => router.push('/linkedin-generator')} className="btn-primary text-xs px-3 py-1.5">
                View in LinkedIn Generator →
              </button>
              <button onClick={() => setLinkedInPostId(null)} className="text-xs text-slate-400 hover:text-slate-600">Generate another</button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {['Case Study', 'Project Showcase', 'Client Win'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleGenerateLinkedIn(type)}
                  disabled={generatingLinkedIn}
                  className="btn-secondary text-xs px-3 py-2 border-blue-200 hover:border-blue-400"
                >
                  {generatingLinkedIn ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>…
                    </span>
                  ) : `✏️ ${type}`}
                </button>
              ))}
            </div>
          )}
        </div>
        )}

      </div>
    </main>
  );
}
