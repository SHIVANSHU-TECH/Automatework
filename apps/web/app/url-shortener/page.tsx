'use client';

import { useState, useEffect } from 'react';
import { fetchJson } from '../../src/lib/api';

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
  clicksByDay: [string, number][];
}

export default function UrlShortenerPage() {
  const [tab, setTab] = useState<'create' | 'list' | 'analytics'>('create');

  // Create form
  const [originalUrl, setOriginalUrl] = useState('');
  const [alias, setAlias]             = useState('');
  const [password, setPassword]       = useState('');
  const [expiresAt, setExpiresAt]     = useState('');

  // State
  const [creating, setCreating]     = useState(false);
  const [created, setCreated]       = useState<ShortUrl | null>(null);
  const [urls, setUrls]             = useState<ShortUrl[]>([]);
  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [message, setMessage]       = useState<string | null>(null);

  const loadUrls = async () => {
    try {
      const data = await fetchJson<{ urls: ShortUrl[] }>('/api/urls');
      setUrls(data.urls ?? []);
    } catch { setUrls([]); }
  };

  useEffect(() => { loadUrls(); }, []);

  const handleCreate = async () => {
    if (!originalUrl.trim()) { setError('URL is required'); return; }
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
      setOriginalUrl(''); setAlias(''); setPassword(''); setExpiresAt('');
      await loadUrls();
      setTab('list');
    } catch (err) { setError((err as Error).message); }
    finally { setCreating(false); }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await fetchJson(`/api/urls/${id}`, { method: 'DELETE' });
    await loadUrls();
  };

  const handleViewAnalytics = async (id: string) => {
    setAnalyticsId(id);
    setTab('analytics');
    setLoadingAnalytics(true);
    try {
      const data = await fetchJson<Analytics>(`/api/urls/${id}/analytics`);
      setAnalytics(data);
    } catch { setAnalytics(null); }
    finally { setLoadingAnalytics(false); }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://automatework-tmfr.onrender.com';
    const { getToken } = await import('../../src/lib/auth');
    const res = await fetch(`${apiBase}/api/urls/export/${format}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `short-urls.${format}`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedUrl = analyticsId ? urls.find((u) => u.shortId === analyticsId) : null;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="page-header flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">URL Shortener</h1>
            <p className="mt-1 text-sm text-slate-500">Shorten links, track clicks, generate QR codes.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['create','list','analytics'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === t ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>
                {t === 'create' ? '+ Create' : t === 'list' ? `🔗 Links (${urls.length})` : '📊 Analytics'}
              </button>
            ))}
          </div>
        </div>

        {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700 font-medium">✓ {message}</div>}

        {/* Created banner */}
        {created && tab === 'list' && (
          <div className="card border-green-200 bg-green-50 space-y-3">
            <p className="text-sm font-semibold text-green-800">✓ Short URL created!</p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href={created.shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-mono text-sm hover:underline break-all">{created.shortUrl}</a>
              <button onClick={() => handleCopy(created.shortUrl, 'new')} className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                {copied === 'new' ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            {created.qrCode && (
              <div className="flex items-center gap-4">
                <img src={created.qrCode} alt="QR Code" className="w-24 h-24 rounded-lg border border-slate-200" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Scan the QR code to open the link</p>
                  <a href={created.qrCode} download="qr-code.png" className="text-blue-600 hover:underline">⬇ Download QR</a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create tab */}
        {tab === 'create' && (
          <div className="card space-y-4 max-w-xl">
            <h2 className="text-sm font-semibold text-slate-800">Create Short URL</h2>

            <label className="flex flex-col gap-1.5">
              <span className="section-label">Original URL *</span>
              <input className="input-base" value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/very/long/url" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="section-label">Custom Alias <span className="font-normal text-slate-400">(optional)</span></span>
              <input className="input-base font-mono" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="my-proposal" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Password <span className="font-normal text-slate-400">(optional)</span></span>
                <input className="input-base" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Protect link" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Expires <span className="font-normal text-slate-400">(optional)</span></span>
                <input className="input-base" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </label>
            </div>

            <button onClick={handleCreate} disabled={creating || !originalUrl.trim()} className="btn-primary w-full">
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Creating…
                </span>
              ) : '🔗 Shorten URL'}
            </button>
          </div>
        )}

        {/* List tab */}
        {tab === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="section-label">Your Short URLs</p>
              {urls.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => handleExport('csv')} className="btn-secondary text-xs px-3 py-1.5">⬇ CSV</button>
                  <button onClick={() => handleExport('json')} className="btn-secondary text-xs px-3 py-1.5">⬇ JSON</button>
                </div>
              )}
            </div>
            {urls.length === 0 ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <span className="text-4xl mb-3">🔗</span>
                <p className="text-sm font-medium text-slate-600">No short URLs yet</p>
                <button onClick={() => setTab('create')} className="mt-4 btn-primary text-xs px-4 py-2">Create your first</button>
              </div>
            ) : (
              <div className="space-y-3">
                {urls.map((u) => (
                  <div key={u.shortId} className="card space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a href={u.shortUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 font-mono text-sm hover:underline break-all">{u.shortUrl}</a>
                          {u.password && <span className="badge text-xs bg-yellow-50 text-yellow-700">🔒 Password</span>}
                          {u.expiresAt && <span className="badge text-xs bg-orange-50 text-orange-700">⏰ Expires {u.expiresAt.slice(0, 10)}</span>}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{u.originalUrl}</p>
                        <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">{u.totalClicks}</p>
                          <p className="text-[10px] text-slate-400">clicks</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-slate-100 flex-wrap">
                      <button onClick={() => handleCopy(u.shortUrl, u.shortId)} className="btn-secondary text-xs px-3 py-1.5">
                        {copied === u.shortId ? '✓ Copied' : '📋 Copy'}
                      </button>
                      {u.qrCode && (
                        <a href={u.qrCode} download="qr.png" className="btn-secondary text-xs px-3 py-1.5">⬛ QR Code</a>
                      )}
                      <button onClick={() => handleViewAnalytics(u.shortId)} className="btn-secondary text-xs px-3 py-1.5">
                        📊 Analytics
                      </button>
                      <a href={u.originalUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5">↗ Open</a>
                      <button onClick={() => handleDelete(u.shortId)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1.5">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics tab */}
        {tab === 'analytics' && (
          <div>
            {!analyticsId ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <span className="text-4xl mb-3">📊</span>
                <p className="text-sm font-medium text-slate-600">Select a link to view analytics</p>
                <button onClick={() => setTab('list')} className="mt-4 btn-secondary text-xs px-4 py-2">View Links</button>
              </div>
            ) : loadingAnalytics ? (
              <div className="card flex flex-col items-center py-12">
                <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : analytics ? (
              <div className="space-y-4">
                {selectedUrl && (
                  <div className="card bg-blue-50 border-blue-100">
                    <p className="text-xs text-blue-600 font-mono break-all">{selectedUrl.shortUrl}</p>
                    <p className="text-xs text-slate-400 truncate">{selectedUrl.originalUrl}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Total Clicks', value: analytics.totalClicks },
                    { label: 'Countries', value: Object.keys(analytics.byCountry).length },
                    { label: 'Devices', value: Object.keys(analytics.byDevice).length },
                    { label: 'Browsers', value: Object.keys(analytics.byBrowser).length },
                  ].map((s) => (
                    <div key={s.label} className="card text-center">
                      <p className="text-2xl font-black text-blue-600">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {([
                    { title: 'By Country',  data: analytics.byCountry  },
                    { title: 'By Device',   data: analytics.byDevice   },
                    { title: 'By Browser',  data: analytics.byBrowser  },
                  ] as { title: string; data: Record<string, number> }[]).map(({ title, data }) => (
                    <div key={title} className="card">
                      <p className="section-label mb-2">{title}</p>
                      {Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-700 truncate flex-1">{k}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <div className="h-1.5 rounded-full bg-blue-200 w-16 overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.round((v / analytics.totalClicks) * 100)}%` }}/>
                            </div>
                            <span className="text-slate-500 w-6 text-right">{v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {analytics.clicksByDay.length > 0 && (
                  <div className="card">
                    <p className="section-label mb-3">Clicks by Day</p>
                    <div className="flex items-end gap-1 h-24">
                      {analytics.clicksByDay.slice(-14).map(([day, count]) => {
                        const max = Math.max(...analytics.clicksByDay.map(([, c]) => c));
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count}`}>
                            <div className="w-full bg-blue-500 rounded-t" style={{ height: `${Math.round((count / max) * 80) + 4}px` }} />
                            <span className="text-[8px] text-slate-400 rotate-45 origin-left">{day.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12 text-sm text-slate-500">No analytics data yet.</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
