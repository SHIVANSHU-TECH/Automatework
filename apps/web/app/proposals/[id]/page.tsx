'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchJson } from '../../../src/lib/api';

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

function Field({
  label, value, onChange, multiline = false,
}: {
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
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);

  const [title, setTitle]             = useState('');
  const [executiveSummary, setExec]   = useState('');
  const [scope, setScope]             = useState('');
  const [timeline, setTimeline]       = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [pricing, setPricing]         = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [whyUs, setWhyUs]             = useState('');
  const [caseStudies, setCaseStudies] = useState('');
  const [terms, setTerms]             = useState('');

  useEffect(() => {
    if (!id) return;
    fetchJson<{ proposal: Proposal }>(`/api/proposals/${id}`)
      .then(({ proposal: p }) => {
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
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!proposal) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await fetchJson<{ proposal: Proposal }>(`/api/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          executiveSummary,
          scope,
          timeline,
          deliverables,
          pricing,
          maintenancePlan: maintenance,
          whyChooseUs: whyUs,
          caseStudies,
          terms,
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
    setError(null);
    try {
      const res = await fetchJson<{ downloadUrl: string }>('/api/reports/export', {
        method: 'POST',
        body: JSON.stringify({ proposalId: id, format }),
      });
      window.open(res.downloadUrl, '_blank');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <main className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Loading proposal…</span>
        </div>
      </main>
    );
  }

  if (error && !proposal) {
    return (
      <main className="p-8">
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

  const sourceUrl = proposal.metadata?.sourceUrl as string | undefined;
  const clientName = proposal.metadata?.clientName as string | undefined;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
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
                <>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium">👤 {clientName}</span>
                </>
              )}
              {sourceUrl && (
                <>
                  <span className="text-xs text-slate-300">·</span>
                  <a
                    href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    🌐 {sourceUrl}
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {statusNext[proposal.status] && (
              <button
                onClick={handleAdvanceStatus}
                disabled={advancing}
                className="btn-secondary text-xs px-3 py-2"
              >
                {advancing ? 'Updating…' : `→ Mark as ${statusNext[proposal.status]}`}
              </button>
            )}

            {/* Export dropdown */}
            <div className="relative group">
              <button className="btn-secondary text-xs px-3 py-2">⬇ Export ▾</button>
              <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-xl shadow-lg min-w-[120px] overflow-hidden">
                {['pdf', 'docx', 'html', 'markdown'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="text-left px-4 py-2.5 text-xs hover:bg-slate-50 text-slate-700 font-medium uppercase"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-4 py-2">
              {saving ? 'Saving…' : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Status messages */}
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

        {/* Editable sections */}
        <div className="card space-y-5">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Executive Summary" value={executiveSummary} onChange={setExec} multiline />
          <Field label="Scope of Work" value={scope} onChange={setScope} multiline />
          <Field label="Timeline" value={timeline} onChange={setTimeline} />
          <Field label="Deliverables" value={deliverables} onChange={setDeliverables} multiline />
          <Field label="Pricing" value={pricing} onChange={setPricing} multiline />
          <Field label="Maintenance Plan" value={maintenance} onChange={setMaintenance} multiline />
          <Field label="Why Choose Us" value={whyUs} onChange={setWhyUs} multiline />
          <Field label="Case Studies" value={caseStudies} onChange={setCaseStudies} multiline />
          <Field label="Terms & Conditions" value={terms} onChange={setTerms} multiline />
        </div>

        <div className="flex justify-between items-center">
          <button onClick={() => router.push('/proposals')} className="btn-secondary text-sm px-4 py-2">
            ← Back
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5">
            {saving ? 'Saving…' : '💾 Save Proposal'}
          </button>
        </div>

      </div>
    </main>
  );
}
