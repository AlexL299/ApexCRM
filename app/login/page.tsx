'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, Loader2, ShieldCheck, UserCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/pipeline';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Glow aura */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="bg-[#111827]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back to ApexCRM</h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to access your AI pipeline and intelligent telemetry.
          </p>
        </div>

        {/* Quick Demo Logins */}
        <div className="mb-6 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Quick Demo Access (One-Click)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('sarah.chen@apexcrm.io')}
              disabled={loading}
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-xs group"
            >
              <div className="font-medium text-slate-200 group-hover:text-indigo-300 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                Sarah (Admin)
              </div>
              <div className="text-[10px] text-slate-400 truncate">sarah.chen@apexcrm.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('marcus.johnson@apexcrm.io')}
              disabled={loading}
              className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-xs group"
            >
              <div className="font-medium text-slate-200 group-hover:text-indigo-300 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-indigo-400" />
                Marcus (Rep)
              </div>
              <div className="text-[10px] text-slate-400 truncate">marcus.johnson@apexcrm.io</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <span className="text-[11px] text-slate-400">Default: password123</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in to ApexCRM
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-sm">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
