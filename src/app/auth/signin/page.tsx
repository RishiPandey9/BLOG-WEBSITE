'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { BookOpen, Github, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const [tab, setTab] = useState<'oauth' | 'email'>('oauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const googleIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/',
    });
    setIsLoading(false);
    if (res?.error) {
      toast.error('Invalid email or password. Please try again.');
    } else {
      toast.success('Signed in successfully!');
      window.location.href = res?.url ?? '/';
    }
  }

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to start writing and engaging with the community
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            <button
              onClick={() => setTab('oauth')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'oauth'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              OAuth
            </button>
            <button
              onClick={() => setTab('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'email'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Email &amp; Password
            </button>
          </div>

          {tab === 'oauth' ? (
            <div className="space-y-3">
              <button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-200 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Github className="w-5 h-5" />
                Continue with GitHub
              </button>
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-medium transition-all duration-200 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                {googleIcon}
                Continue with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    required
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Sign In
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-sky-500 hover:text-sky-600 font-medium">
                  Create one
                </Link>
              </p>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-400 dark:text-gray-500">
                or
              </span>
            </div>
          </div>

          {/* Guest */}
          <Link
            href="/blog"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm"
          >
            Browse as Guest
          </Link>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
