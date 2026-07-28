'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resendVerification,
} from '../../src/lib/firebase';
import { exchangeFirebaseToken } from '../../src/lib/api';
import { saveToken, isAuthenticated } from '../../src/lib/auth';

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab]               = useState<'login' | 'register'>('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [info, setInfo]             = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) { router.replace('/dashboard'); return; }
    // Show success banner if redirected from verification email
    if (searchParams.get('verified') === '1') {
      setInfo('Email verified successfully! You can now sign in.');
      setTab('login');
    }
  }, [router, searchParams]);

  // ─── Email / Password ───────────────────────────────────────────────────────

  const handleEmailAuth = async () => {
    setError(null); setInfo(null);
    if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
    if (tab === 'register' && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (tab === 'register' && password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      if (tab === 'register') {
        await registerWithEmail(email.trim(), password);
        setInfo('Account created! A verification email has been sent to ' + email.trim() + '. Please check your inbox and click the link before signing in.');
        setTab('login');
        setPassword(''); setConfirm('');
      } else {
        const user = await loginWithEmail(email.trim(), password);
        const idToken = await user.getIdToken();
        const { token } = await exchangeFirebaseToken(idToken);
        saveToken(token, email.trim());
        router.replace('/dashboard');
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      // Show resend button if verification error
      if (msg.toLowerCase().includes('verify')) setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend verification email ──────────────────────────────────────────────

  const handleResend = async () => {
    if (!email || !password) { setError('Enter your email and password to resend the verification email.'); return; }
    setLoading(true); setError(null);
    try {
      await resendVerification(email.trim(), password);
      setInfo('Verification email resent to ' + email.trim() + '. Please check your inbox.');
      setShowResend(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google OAuth ───────────────────────────────────────────────────────────

  const handleGoogle = async () => {
    setError(null); setInfo(null);
    setGoogleLoading(true);
    try {
      const user    = await loginWithGoogle();
      const idToken = await user.getIdToken();
      const { token, email: userEmail } = await exchangeFirebaseToken(idToken);
      saveToken(token, userEmail);
      router.replace('/dashboard');
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes('popup-closed')) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchTab = (t: 'login' | 'register') => {
    setTab(t); setError(null); setInfo(null); setShowResend(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4 shadow-lg p-2.5">
            <img src="/favicon.png" className="w-full h-full object-contain" alt="Automate Work Favicon" />
          </div>
          <h1 className="text-2xl font-bold text-white">Automate Work</h1>
          <p className="text-slate-400 text-sm mt-1">Website analysis &amp; proposal platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-8 space-y-4">

            {/* Info banner */}
            {info && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                <p className="font-semibold mb-0.5">
                  {tab === 'login' && info.includes('verified') ? '✓ Email verified' : '📧 Check your inbox'}
                </p>
                <p className="text-xs leading-relaxed">{info}</p>
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <svg className="h-4 w-4 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                /* Google SVG logo */
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200"/>
              <span className="text-xs text-slate-400 font-medium">or with email</span>
              <div className="flex-1 h-px bg-slate-200"/>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleEmailAuth()}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleEmailAuth()}
                placeholder={tab === 'register' ? 'Min. 8 characters' : '••••••••'}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {/* Confirm password (register only) */}
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="input-base"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleEmailAuth()}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Resend verification */}
            {showResend && (
              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
              >
                Resend verification email to {email || 'your address'}
              </button>
            )}

            {/* Submit */}
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="btn-primary w-full py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {tab === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                tab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>

            {/* Switch tab */}
            <p className="text-center text-xs text-slate-400">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
                className="text-blue-600 font-semibold hover:underline"
              >
                {tab === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>

          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Your workspace is fully private — clients and proposals are only visible to you.
        </p>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense (required for useSearchParams) ────────────────

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
