'use client';

import { useState, useEffect } from 'react';
import { fetchJson, apiUrl } from '../../src/lib/api';
import { getToken } from '../../src/lib/auth';

interface LinkedInPost {
  postId: string;
  contentType: string;
  topic: string;
  tone: string;
  audience: string;
  headline: string;
  hook: string;
  body: string;
  ctaText: string;
  hashtags: string[];
  imageSuggestions: string[];
  carouselSuggestions: string[];
  commentStrategy: string;
  bestPostingTime: string;
  proposalId?: string;
  createdAt: string;
}

const CONTENT_TYPES = ['Educational','Case Study','Project Showcase','Company Update','Hiring','Technical Tips','Automation','Web Development','React / Next.js','Startup','Founder Journey','Client Win','Product Launch'];
const TONES = ['Professional','Conversational','Inspirational','Bold','Humorous'];
const LENGTHS = ['Short (50-100 words)','Medium (150-300 words)','Long (400-600 words)'];
const EMOJI_OPTIONS = ['None','Minimal','Moderate','Heavy'];

export default function LinkedInGeneratorPage() {
  const [tab, setTab] = useState<'generate' | 'saved'>('generate');

  // Form
  const [contentType, setContentType] = useState('Educational');
  const [topic, setTopic]             = useState('');
  const [tone, setTone]               = useState('Professional');
  const [audience, setAudience]       = useState('Software Decision Makers');
  const [length, setLength]           = useState('Medium (150-300 words)');
  const [cta, setCta]                 = useState('Comment below');
  const [emojiUsage, setEmojiUsage]   = useState('Moderate');
  const [hashtagCount, setHashtagCount] = useState(5);

  // State
  const [generating, setGenerating] = useState(false);
  const [post, setPost]             = useState<LinkedInPost | null>(null);
  const [saved, setSaved]           = useState<LinkedInPost[]>([]);
  const [saving, setSaving]         = useState(false);
  const [copying, setCopying]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [message, setMessage]       = useState<string | null>(null);
  const [posting, setPosting]       = useState(false);
  
  // Editable post body
  const [editHeadline, setEditHeadline] = useState('');
  const [editHook, setEditHook]         = useState('');
  const [editBody, setEditBody]         = useState('');
  const [editCta, setEditCta]           = useState('');

  const loadSaved = async () => {
    try {
      const data = await fetchJson<{ posts: LinkedInPost[] }>('/api/linkedin');
      setSaved(data.posts ?? []);
    } catch { setSaved([]); }
  };

  useEffect(() => { 
    loadSaved(); 
  }, []);

  useEffect(() => {
    if (post) {
      setEditHeadline(post.headline);
      setEditHook(post.hook);
      setEditBody(post.body);
      setEditCta(post.ctaText);
    }
  }, [post]);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Topic is required'); return; }
    setGenerating(true); setError(null); setPost(null);
    try {
      const data = await fetchJson<{ post: LinkedInPost }>('/api/linkedin/generate', {
        method: 'POST',
        body: JSON.stringify({ contentType, topic, tone, audience, length, cta, emojiUsage, hashtagCount }),
      });
      setPost(data.post);
    } catch (err) { setError((err as Error).message); }
    finally { setGenerating(false); }
  };

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    try {
      const toSave = { ...post, headline: editHeadline, hook: editHook, body: editBody, ctaText: editCta };
      await fetchJson('/api/linkedin/save', { method: 'POST', body: JSON.stringify(toSave) });
      setMessage('Post saved!');
      await loadSaved();
      setTimeout(() => setMessage(null), 2500);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const handleCopy = async () => {
    if (!post) return;
    const full = `${editHeadline}\n\n${editHook}\n\n${editBody}\n\n${editCta}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`;
    await navigator.clipboard.writeText(full);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleExport = async (savedPost: LinkedInPost, format: string) => {
    const token = getToken();
    const res = await fetch(`${apiUrl}/api/linkedin/${savedPost.postId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ format }),
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `linkedin-post.${format === 'docx' ? 'docx' : format === 'html' ? 'html' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (postId: string) => {
    await fetchJson(`/api/linkedin/${postId}`, { method: 'DELETE' });
    await loadSaved();
  };

  const handlePostInstantly = () => {
    if (!post) return;
    setPosting(true);
    const full = `${editHeadline}\n\n${editHook}\n\n${editBody}\n\n${editCta}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`;
    // For LinkedIn, we copy to clipboard first because they don't support pre-filling text via intent URL
    navigator.clipboard.writeText(full);
    window.open('https://www.linkedin.com/feed/', '_blank');
    setMessage('Copied to clipboard! Paste it directly into LinkedIn.');
    setTimeout(() => setMessage(null), 3000);
    setPosting(false);
  };

  const fullPostText = post
    ? `${editHeadline}\n\n${editHook}\n\n${editBody}\n\n${editCta}\n\n${post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')}`
    : '';

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="page-header flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">LinkedIn Content Generator</h1>
            <p className="mt-1 text-sm text-slate-500">Generate high-quality LinkedIn posts for your software agency.</p>
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
                  placeholder="e.g. How we helped a clinic save 10hrs/week" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Tone</span>
                <select className="input-base" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {TONES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Target Audience</span>
                <input className="input-base" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. SME owners" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Length</span>
                <select className="input-base" value={length} onChange={(e) => setLength(e.target.value)}>
                  {LENGTHS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="section-label">Call to Action</span>
                <input className="input-base" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. DM me" />
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
                    {[3,5,7,10].map((n) => <option key={n} value={n}>{n}</option>)}
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
                  <span className="text-4xl mb-3">✏️</span>
                  <p className="text-sm font-medium text-slate-600">Fill in the settings and click Generate</p>
                  <p className="text-xs text-slate-400 mt-1">Your LinkedIn post will appear here</p>
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
                    <button onClick={handlePostInstantly} disabled={posting} className="btn-primary bg-[#0A66C2] hover:bg-[#004182] text-white border-0 text-xs px-3 py-2 shadow-sm">
                      {posting ? 'Opening…' : '🚀 Post Instantly'}
                    </button>
                    <button onClick={handleGenerate} disabled={generating} className="btn-secondary text-xs px-3 py-2">
                      🔄 Regenerate
                    </button>
                  </div>

                  {/* Editable post */}
                  <div className="card space-y-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="section-label">Headline</span>
                      <input className="input-base font-semibold" value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="section-label">Hook (First Lines)</span>
                      <textarea className="input-base min-h-[60px] resize-y" value={editHook} onChange={(e) => setEditHook(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="section-label">Body</span>
                      <textarea className="input-base min-h-[160px] resize-y" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="section-label">Call to Action</span>
                      <input className="input-base" value={editCta} onChange={(e) => setEditCta(e.target.value)} />
                    </label>
                    <div>
                      <span className="section-label">Hashtags</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {post.hashtags.map((h, i) => (
                          <span key={i} className="rounded-full bg-blue-50 px-3 py-0.5 text-xs text-blue-700 font-medium">#{h.replace(/^#/, '')}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {post.imageSuggestions.length > 0 && (
                      <div className="card">
                        <p className="section-label mb-2">Image Ideas</p>
                        <ul className="space-y-1">{post.imageSuggestions.map((s,i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-blue-400 shrink-0">•</span>{s}</li>)}</ul>
                      </div>
                    )}
                    {post.carouselSuggestions.length > 0 && (
                      <div className="card">
                        <p className="section-label mb-2">Carousel Slides</p>
                        <ul className="space-y-1">{post.carouselSuggestions.map((s,i) => <li key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-purple-400 shrink-0">{i+1}.</span>{s}</li>)}</ul>
                      </div>
                    )}
                    <div className="card">
                      <p className="section-label mb-1">Comment Strategy</p>
                      <p className="text-xs text-slate-600">{post.commentStrategy}</p>
                    </div>
                    <div className="card">
                      <p className="section-label mb-1">Best Posting Time</p>
                      <p className="text-xs font-semibold text-slate-700">{post.bestPostingTime}</p>
                    </div>
                  </div>

                  {/* Character count */}
                  <p className="text-xs text-slate-400 text-right">{fullPostText.length} characters</p>
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
                        <p className="text-sm font-semibold text-slate-900">{p.headline}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge text-xs bg-blue-50 text-blue-700">{p.contentType}</span>
                          <span className="badge text-xs bg-slate-100 text-slate-600">{p.tone}</span>
                          <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {['markdown','html','docx'].map((fmt) => (
                          <button key={fmt} onClick={() => handleExport(p, fmt)} className="btn-secondary text-xs px-2 py-1">{fmt.toUpperCase()}</button>
                        ))}
                        <button onClick={() => handleDelete(p.postId)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1">✕</button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3">{p.hook} {p.body}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.hashtags.slice(0, 5).map((h, i) => (
                        <span key={i} className="text-xs text-blue-500">#{h.replace(/^#/, '')}</span>
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
