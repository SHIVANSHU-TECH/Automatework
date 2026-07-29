'use client';

import { useState, useEffect } from 'react';
import { fetchJson, apiUrl } from '../../src/lib/api';
import { getToken } from '../../src/lib/auth';

interface XPost {
  postId: string;
  contentType: string;
  topic: string;
  tone: string;
  audience: string;
  format: string;
  emojiUsage: string;
  hashtagCount: number;
  body: string;
  hashtags: string[];
  bestPostingTime: string;
  proposalId?: string;
  createdAt: string;
}

const CONTENT_TYPES = ['Educational','Case Study','Project Showcase','Company Update','Hiring','Technical Tips','Startup','Founder Journey','Product Launch'];
const TONES = ['Professional','Conversational','Inspirational','Bold','Humorous','Controversial'];
const FORMATS = ['Single Tweet','Thread'];
const EMOJI_OPTIONS = ['None','Minimal','Moderate','Heavy'];

export default function XGeneratorPage() {
  const [tab, setTab] = useState<'generate' | 'saved'>('generate');

  // Form
  const [contentType, setContentType] = useState('Educational');
  const [topic, setTopic]             = useState('');
  const [tone, setTone]               = useState('Conversational');
  const [audience, setAudience]       = useState('Tech Community');
  const [format, setFormat]           = useState('Single Tweet');
  const [emojiUsage, setEmojiUsage]   = useState('Moderate');
  const [hashtagCount, setHashtagCount] = useState(2);

  // State
  const [generating, setGenerating] = useState(false);
  const [post, setPost]             = useState<XPost | null>(null);
  const [saved, setSaved]           = useState<XPost[]>([]);
  const [saving, setSaving]         = useState(false);
  const [copying, setCopying]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [message, setMessage]       = useState<string | null>(null);
  const [posting, setPosting]       = useState(false);
  
  // Editable post body
  const [editBody, setEditBody]       = useState('');

  const loadSaved = async () => {
    try {
      const data = await fetchJson<{ posts: XPost[] }>('/api/x-generator');
      setSaved(data.posts ?? []);
    } catch { setSaved([]); }
  };

  useEffect(() => { 
    loadSaved(); 
  }, []);

  useEffect(() => {
    if (post) {
      setEditBody(post.body);
    }
  }, [post]);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Topic is required'); return; }
    setGenerating(true); setError(null); setPost(null);
    try {
      const data = await fetchJson<{ post: XPost }>('/api/x-generator/generate', {
        method: 'POST',
        body: JSON.stringify({ contentType, topic, tone, audience, format, emojiUsage, hashtagCount }),
      });
      setPost(data.post);
    } catch (err) { setError((err as Error).message); }
    finally { setGenerating(false); }
  };

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    try {
      const toSave = { ...post, body: editBody };
      await fetchJson('/api/x-generator/save', { method: 'POST', body: JSON.stringify(toSave) });
      setMessage('Post saved!');
      await loadSaved();
      setTimeout(() => setMessage(null), 2500);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const handleCopy = async () => {
    if (!post) return;
    const full = `${editBody}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`;
    await navigator.clipboard.writeText(full);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleDelete = async (postId: string) => {
    await fetchJson(`/api/x-generator/${postId}`, { method: 'DELETE' });
    await loadSaved();
  };

  const handlePostInstantly = () => {
    if (!post) return;
    setPosting(true);
    const full = `${editBody}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`, '_blank');
    setPosting(false);
  };

  const fullPostText = post
    ? `${editBody}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`
    : '';

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="page-header flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">X (Twitter) Content Generator</h1>
            <p className="mt-1 text-sm text-slate-500">Generate high-performing tweets and threads.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {(['generate','saved'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === t ? 'bg-brandblue text-white' : 'btn-secondary'}`}>
                  {t === 'generate' ? '✏️ Generate' : `📚 Saved (${saved.length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700 font-medium">✓ {message}</div>}

        {tab === 'generate' && (
          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

            {/* Config panel */}
            <div className="card h-fit space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Post Settings</h2>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Content Type</span>
                <select className="input-base" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                  {CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Topic *</span>
                <input className="input-base" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Next.js server components" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Tone</span>
                <select className="input-base" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {TONES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Target Audience</span>
                <input className="input-base" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Frontend Devs" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Format</span>
                <select className="input-base" value={format} onChange={(e) => setFormat(e.target.value)}>
                  {FORMATS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Emojis</span>
                  <select className="input-base" value={emojiUsage} onChange={(e) => setEmojiUsage(e.target.value)}>
                    {EMOJI_OPTIONS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="section-label">Hashtags</span>
                  <select className="input-base" value={hashtagCount} onChange={(e) => setHashtagCount(Number(e.target.value))}>
                    {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>

              <button onClick={handleGenerate} disabled={generating || !topic.trim()} className="btn-primary w-full">
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>Generating…
                  </span>
                ) : '✨ Generate Post'}
              </button>
            </div>

            {/* Generated post */}
            <div>
              {!post && !generating && (
                <div className="card flex flex-col items-center py-16 text-center border-dashed border-2">
                  <span className="text-4xl mb-3">𝕏</span>
                  <p className="text-sm font-medium text-slate-600">Fill in the settings and click Generate</p>
                  <p className="text-xs text-slate-400 mt-1">Your X post will appear here</p>
                </div>
              )}

              {post && (
                <div className="space-y-4">
                  {/* Action bar */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleCopy} className="btn-secondary text-xs px-3 py-2">
                      {copying ? '✓ Copied!' : '📋 Copy'}
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-2">
                      {saving ? 'Saving…' : '💾 Save'}
                    </button>
                    <button onClick={handlePostInstantly} disabled={posting} className="btn-primary bg-black hover:bg-zinc-800 text-white border-0 text-xs px-3 py-2 shadow-sm">
                      {posting ? 'Opening X…' : '🚀 Post to X'}
                    </button>
                    <button onClick={handleGenerate} disabled={generating} className="btn-secondary text-xs px-3 py-2">
                      🔄 Regenerate
                    </button>
                  </div>

                  {/* Editable post */}
                  <div className="card space-y-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="section-label">Post Body</span>
                      <textarea className="input-base min-h-[160px] resize-y font-sans text-sm" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                    </label>
                    <div>
                      <span className="section-label">Hashtags</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {post.hashtags.map((h, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-3 py-0.5 text-xs text-slate-600 font-medium">#{h.replace(/^#/, '')}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="card">
                      <p className="section-label mb-1">Best Posting Time</p>
                      <p className="text-xs font-semibold text-slate-700">{post.bestPostingTime}</p>
                    </div>
                  </div>

                  {/* Character count */}
                  <p className={`text-xs text-right ${fullPostText.length > 280 && format === 'Single Tweet' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {fullPostText.length} characters
                    {format === 'Single Tweet' && fullPostText.length > 280 && ' (Over limit!)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'saved' && (
          <div>
            {saved.length === 0 ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <span className="text-4xl mb-3">📚</span>
                <p className="text-sm font-medium text-slate-600">No saved posts yet</p>
                <p className="text-xs text-slate-400 mt-1">Generate and save posts to see them here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {saved.map((p) => (
                  <div key={p.postId} className="card space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.topic}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge text-xs bg-slate-100 text-slate-700">{p.contentType}</span>
                          <span className="badge text-xs bg-slate-100 text-slate-600">{p.format}</span>
                          <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleDelete(p.postId)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1">✕</button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{p.body}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.hashtags.slice(0, 5).map((h, i) => (
                        <span key={i} className="text-xs text-slate-500">#{h.replace(/^#/, '')}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
