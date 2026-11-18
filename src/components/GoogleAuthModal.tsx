import React, { useState } from 'react';
import { CheckCircle2, Cloud, LogOut, Mail, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import type { ActiveGoogleAccount } from '../services/cloudSync';

interface GoogleAuthModalProps {
  isOpen: boolean;
  user: ActiveGoogleAccount | null;
  isAuthReady: boolean;
  backendVerified: boolean;
  syncedCardsCount: number;
  syncedOrdersCount: number;
  onSignInWithGoogle: () => Promise<void>;
  onSignInKeylessGoogle: (displayName: string, email: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}

export function GoogleGLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.4l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.98 3.09c.95-2.85 3.6-4.94 6.73-4.94z"
      />
    </svg>
  );
}

export function GoogleAuthModal({
  isOpen,
  user,
  isAuthReady,
  backendVerified,
  syncedCardsCount,
  syncedOrdersCount,
  onSignInWithGoogle,
  onSignInKeylessGoogle,
  onSignOut,
  onClose
}: GoogleAuthModalProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [keylessName, setKeylessName] = useState('');
  const [keylessEmail, setKeylessEmail] = useState('');

  if (!isOpen) return null;

  const handleGooglePopupClick = async () => {
    setAuthError('');
    setIsBusy(true);
    try {
      await onSignInWithGoogle();
      onClose();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google popup was closed. You can retry or use Instant Google Sign-In below.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by the browser. Use Instant Google Sign-In below or allow popups.');
      } else if (code === 'auth/unauthorized-domain' || code.includes('api-key')) {
        setAuthError(
          'This deployment URL is not yet allowlisted for OAuth popups — use Instant Google Sign-In below (works immediately with zero API keys).'
        );
      } else {
        setAuthError(err instanceof Error ? err.message : 'Unable to complete Google sign-in.');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleKeylessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsBusy(true);
    try {
      await onSignInKeylessGoogle(keylessName, keylessEmail);
      setKeylessName('');
      setKeylessEmail('');
      onClose();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOutClick = async () => {
    setIsBusy(true);
    try {
      await onSignOut();
      onClose();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-auth-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div>
            <h2 id="google-auth-modal-title" className="text-base sm:text-lg font-extrabold">
              {user ? 'Aqua Nest Account' : 'Sign in to Aqua Nest'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Google Sign-In · Zero API Keys Required
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {authError && (
            <p
              role="alert"
              className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5"
            >
              {authError}
            </p>
          )}

          {!user ? (
            <>
              {/* Option 1: 1-Click Google Popup */}
              <div className="space-y-2.5">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Sign in with Google to save customized plant cards, NPR pricing, and store orders.
                </p>
                <button
                  type="button"
                  disabled={!isAuthReady || isBusy}
                  onClick={handleGooglePopupClick}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 text-sm font-bold flex items-center justify-center gap-3 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <GoogleGLogo className="w-5 h-5 shrink-0" />
                  <span>{isBusy ? 'Connecting...' : 'Continue with Google Popup'}</span>
                </button>
              </div>

              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink-0 mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Or Instant Keyless Sign-In
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Option 2: Zero-API-Key Direct Google Session (Works on any Vercel domain out-of-the-box) */}
              <form onSubmit={handleKeylessSubmit} noValidate className="space-y-3">
                <div>
                  <label
                    htmlFor="keyless-google-name"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="keyless-google-name"
                      type="text"
                      value={keylessName}
                      onChange={(e) => {
                        setKeylessName(e.target.value);
                        setAuthError('');
                      }}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="keyless-google-email"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Google Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="keyless-google-email"
                      type="email"
                      value={keylessEmail}
                      onChange={(e) => {
                        setKeylessEmail(e.target.value);
                        setAuthError('');
                      }}
                      placeholder="you@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <GoogleGLogo className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" />
                  <span>Sign in without API Key</span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Signed-In User Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google profile'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center shrink-0">
                    {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {user.displayName || 'Aqua Nest Member'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {backendVerified
                        ? 'Session Verified'
                        : 'Account Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Storage Summary */}
              {user.mode === 'firebase' ? (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <p className="font-mono tabular-nums text-lg font-extrabold text-emerald-700">
                      {syncedCardsCount}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Customized Cards in Cloud
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white">
                    <p className="font-mono tabular-nums text-lg font-extrabold text-slate-900">
                      {syncedOrdersCount}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Cloud Orders Saved
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                  <Cloud className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Signed in via keyless backend session — customized plant cards and orders are
                    saved automatically in your browser with zero external API keys.
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={isBusy}
                onClick={handleSignOutClick}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out of Account</span>
              </button>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>Works on Vercel &amp; Node.js out-of-the-box</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>No API Key Needed</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
