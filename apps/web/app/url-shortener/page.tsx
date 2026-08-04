'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchJson } from '../../src/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShortUrl {
  shortId: string;
  originalUrl: string;
  alias?: string;
  shortCode: string;
  shortUrl: string;
  qrCode?: string;
  password?: string;
  expiresAt?: string;
  totalClicks: number;
  createdAt: string;
  proposalId?: string;
}

interface Analytics {
  totalClicks: number;
  byCountry: Record<string, number>;
  byDevice:  Record<string, number>;
  byBrowser: Record<string, number>;
  byOs:      Record<string, number>;
  clicksByDay: [string, number][];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  link: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
    </svg>
  ),
  copy: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  ),
  check: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  ),
  qr: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      <path strokeLinecap="round" d="M14 14h2m4 0v2m0 4h-4v-4m4 0h.01"/>
    </svg>
  ),
  chart: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  open: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
    </svg>
  ),
  trash: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  close: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  download: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  ),
  lock: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="2"/><path strokeLinecap="round" d="M8 11V7a4 4 0 018 0v4"/>
    </svg>
  ),
  clock: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
    </svg>
  ),
  spinner: (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  ),
};

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={`inline-flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${copied ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'} px-2.5 py-1.5 ${className}`}>
      {copied ? Icon.check : Icon.copy}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ─── Sparkline bar chart ──────────────────────────────────────────────────────

function Sparkline({ data }: { data: [string, number][] }) {
  if (!data.length) return <span className="text-xs text-slate-400">No clicks yet</span>;
  const last14 = data.slice(-14);
  const max = Math.max(...last14.map(([, v]) => v), 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {last14.map(([day, count]) => (
        <div
          key={day}
          title={`${day}: ${count} click${count !== 1 ? 's' : ''}`}
          className="flex-1 rounded-t bg-blue-500 opacity-80 hover:opacity-100 transition-opacity min-w-[4px]"
          style={{ height: `${Math.max(2, Math.round((count / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}

// ─── QR Modal ────────────────────────────────────────────────────────────────

function QrModal({ url, qrCode, onClose }: { url: string; qrCode: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">QR Code</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">{Icon.close}</button>
        </div>
        <div className="flex justify-center">
          <img src={qrCode} alt="QR Code" className="w-44 h-44 rounded-xl border border-slate-200" />
        </div>
        <p className="text-xs text-slate-500 text-center break-all font-mono">{url}</p>
        <div className="flex gap-2">
          <a href={qrCode} download="qr-code.png" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-xs font-semibold py-2.5 hover:bg-slate-700 transition-colors">
            {Icon.download} Download PNG
          </a>
          <CopyButton text={url} className="flex-1 justify-center" />
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Drawer ────────────────────────────────────────────────────────

function AnalyticsDrawer({ url, onClose }: { url: ShortUrl; onClose: () => void }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchJson<Analytics>(`/api/urls/${url.shortId}/analytics`)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [url.shortId]);

  const BarChart = ({ data, total }: { data: Record<string, number>; total: number }) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = entries[0]?.[1] ?? 1;
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="text-xs text-slate-600 w-24 shrink-0 truncate">{k}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(v / max) * 100}%` }}/>
            </div>
            <span className="text-xs text-slate-500 w-12 text-right shrink-0">{v} ({total > 0 ? Math.round((v/total)*100) : 0}%)</span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-xs text-slate-400">No data yet</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-sm font-semibold text-slate-800 truncate">Analytics</p>
            <p className="text-xs text-blue-600 font-mono truncate mt-0.5">{url.shortUrl}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">{Icon.close}</button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">{Icon.spinner}</div>
          ) : !analytics ? (
            <p className="text-sm text-slate-400 text-center py-8">No analytics data available.</p>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Clicks', value: analytics.totalClicks, color: 'text-blue-600' },
                  { label: 'Countries',    value: Object.keys(analytics.byCountry).length, color: 'text-indigo-600' },
                  { label: 'Devices',      value: Object.keys(analytics.byDevice).length,  color: 'text-violet-600' },
                  { label: 'Browsers',     value: Object.keys(analytics.byBrowser).length, color: 'text-emerald-600' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Clicks over time */}
              {analytics.clicksByDay.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Clicks over time (last 14 days)</p>
                  <div className="flex items-end gap-1 h-16">
                    {analytics.clicksByDay.slice(-14).map(([day, count]) => {
                      const max = Math.max(...analytics.clicksByDay.map(([, c]) => c), 1);
                      return (
                        <div key={day} className="flex flex-col items-center flex-1 gap-1" title={`${day}: ${count}`}>
                          <div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.max(3, Math.round((count / max) * 56))}px` }}/>
                          <span className="text-[8px] text-slate-400 whitespace-nowrap">{day.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Breakdown panels */}
              {([
                { title: 'By Device',  data: analytics.byDevice  },
                { title: 'By Browser', data: analytics.byBrowser },
                { title: 'By Country', data: analytics.byCountry },
                { title: 'By OS',      data: analytics.byOs      },
              ] as { title: string; data: Record<string, number> }[]).map(({ title, data }) => (
                <div key={title} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-600 mb-3">{title}</p>
                  <BarChart data={data} total={analytics.totalClicks} />
                </div>
              ))}

              {/* Original URL */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Destination URL</p>
                <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">{url.originalUrl}</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── URL Card ────────────────────────────────────────────────────────────────

function UrlCard({
  url,
  onDelete,
  onViewAnalytics,
}: {
  url: ShortUrl;
  onDelete: (id: string) => void;
  onViewAnalytics: (url: ShortUrl) => void;
}) {
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const shortDomain = url.shortUrl.replace(/^https?:\/\//, '').split('/').slice(0,2).join('/');

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
        <div className="flex items-start gap-3">
          {/* Click count */}
          <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-lg font-black text-blue-600 leading-none">{url.totalClicks}</span>
            <span className="text-[9px] text-blue-400 font-medium">clicks</span>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={url.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline font-mono"
              >
                {shortDomain}
              </a>
              {url.password && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {Icon.lock} Protected
                </span>
              )}
              {url.expiresAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                  {Icon.clock} Expires {url.expiresAt.slice(0, 10)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs" title={url.originalUrl}>{url.originalUrl}</p>
            <p className="text-[10px] text-slate-300">{new Date(url.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 flex-wrap">
          <CopyButton text={url.shortUrl} />

          {url.qrCode && (
            <button
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-2.5 py-1.5 transition-colors"
            >
              {Icon.qr} QR Code
            </button>
          )}

          <button
            onClick={() => onViewAnalytics(url)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-2.5 py-1.5 transition-colors"
          >
            {Icon.chart} Analytics
          </button>

          <a
            href={url.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 px-2.5 py-1.5 transition-colors"
          >
            {Icon.open} Open
          </a>

          <div className="flex-1"/>

          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Delete?</span>
              <button onClick={() => onDelete(url.shortId)} className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">No</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 transition-colors"
            >
              {Icon.trash}
            </button>
          )}
        </div>
      </div>

      {qrOpen && url.qrCode && (
        <QrModal url={url.shortUrl} qrCode={url.qrCode} onClose={() => setQrOpen(false)} />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UrlShortenerPage() {
  // Create form
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias]             = useState('');
  const [password, setPassword]       = useState('');
  const [expiresAt, setExpiresAt]     = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State
  const [creating, setCreating]     = useState(false);
  const [created, setCreated]       = useState<ShortUrl | null>(null);
  const [urls, setUrls]             = useState<ShortUrl[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [analyticsUrl, setAnalyticsUrl] = useState<ShortUrl | null>(null);
  const [search, setSearch]         = useState('');

  const loadUrls = async () => {
    try {
      const data = await fetchJson<{ urls: ShortUrl[] }>('/api/urls');
      setUrls(data.urls ?? []);
    } catch {
      setUrls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUrls(); }, []);

  const handleCreate = async () => {
    if (!originalUrl.trim()) { setError('Please enter a URL'); return; }
    try { new URL(originalUrl); } catch { setError('Enter a valid URL including https://'); return; }
    setCreating(true); setError(null); setCreated(null);
    try {
      const data = await fetchJson<{ shortUrl: ShortUrl }>('/api/urls', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          alias: alias.trim() || undefined,
          password: password.trim() || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      setCreated(data.shortUrl);
      setOriginalUrl(''); setAlias(''); setPassword(''); setExpiresAt(''); setShowAdvanced(false);
      await loadUrls();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetchJson(`/api/urls/${id}`, { method: 'DELETE' });
    setUrls(prev => prev.filter(u => u.shortId !== id));
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://automatework-tmfr.onrender.com';
    const { getToken } = await import('../../src/lib/auth');
    const res = await fetch(`${apiBase}/api/urls/export/${format}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = `short-urls.${format}`; a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const filtered = urls.filter(u =>
    !search.trim() ||
    u.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
    u.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
    (u.alias ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalClicks = urls.reduce((sum, u) => sum + u.totalClicks, 0);

  return (
    <>
      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Header */}
          <div className="page-header">
            <h1 className="text-2xl font-bold text-slate-900">URL Shortener</h1>
            <p className="mt-1 text-sm text-slate-500">Create short links, track clicks, and generate QR codes.</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Links',  value: urls.length,  color: 'text-blue-600'    },
              { label: 'Total Clicks', value: totalClicks,  color: 'text-indigo-600'  },
              { label: 'Active Today', value: urls.filter(u => u.createdAt.slice(0,10) === new Date().toISOString().slice(0,10)).length, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="card py-4 flex flex-col gap-1 items-center text-center">
                <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Create form */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Shorten a URL</h2>

            <div className="flex gap-2">
              <input
                className="input-base flex-1"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
                placeholder="https://example.com/your/long/url"
                type="url"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !originalUrl.trim()}
                className="btn-primary shrink-0 px-5"
              >
                {creating ? (
                  <span className="flex items-center gap-2">{Icon.spinner} Shortening…</span>
                ) : (
                  <span className="flex items-center gap-2">{Icon.link} Shorten</span>
                )}
              </button>
            </div>

            {/* Advanced options toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
            >
              <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-slate-100">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom alias</span>
                  <input className="input-base font-mono text-sm" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="my-link" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password protect</span>
                  <input className="input-base text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional password" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry date</span>
                  <input className="input-base text-sm" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </label>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
            )}
          </div>

          {/* Created success banner */}
          {created && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  {Icon.check && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                </div>
                <p className="text-sm font-semibold text-green-800">Short link created successfully</p>
              </div>

              <div className="flex items-center gap-3 bg-white rounded-xl border border-green-200 px-4 py-3">
                <a href={created.shortUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-blue-600 font-mono text-sm font-semibold hover:underline break-all min-w-0">
                  {created.shortUrl}
                </a>
                <CopyButton text={created.shortUrl} className="shrink-0" />
              </div>

              {created.qrCode && (
                <div className="flex items-center gap-4 pt-1">
                  <img src={created.qrCode} alt="QR Code" className="w-20 h-20 rounded-xl border border-green-200 bg-white p-1" />
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-600">Scan to open the link on any device</p>
                    <a href={created.qrCode} download="qr-code.png" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      {Icon.download} Download QR Code
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Link list */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">Your Short URLs</p>
                {urls.length > 0 && (
                  <input
                    className="input-base text-xs py-1.5 max-w-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search links…"
                  />
                )}
              </div>
              {urls.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => handleExport('csv')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                    {Icon.download} CSV
                  </button>
                  <button onClick={() => handleExport('json')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                    {Icon.download} JSON
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-300">{Icon.spinner}</div>
            ) : filtered.length === 0 ? (
              urls.length === 0 ? (
                <div className="card flex flex-col items-center py-14 text-center border-dashed border-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3">{Icon.link}</div>
                  <p className="text-sm font-semibold text-slate-700">No short URLs yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Paste a long URL above and click Shorten to create your first link.</p>
                </div>
              ) : (
                <div className="card flex flex-col items-center py-10 text-center">
                  <p className="text-sm text-slate-500">No links match &ldquo;{search}&rdquo;</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {filtered.map(u => (
                  <UrlCard
                    key={u.shortId}
                    url={u}
                    onDelete={handleDelete}
                    onViewAnalytics={(u) => setAnalyticsUrl(u)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Analytics drawer */}
      {analyticsUrl && (
        <AnalyticsDrawer url={analyticsUrl} onClose={() => setAnalyticsUrl(null)} />
      )}
    </>
  );
}
