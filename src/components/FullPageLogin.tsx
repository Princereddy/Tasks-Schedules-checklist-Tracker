import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Database, 
  Lock, 
  Sun, 
  Moon,
  ExternalLink,
  AlertCircle,
  KeyRound,
  Layers,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { ThemeMode } from '../types';

interface FullPageLoginProps {
  onSimpleLogin?: (email: string, displayName?: string) => Promise<void>;
  onGoogleOAuthLogin: () => Promise<void>;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export const FullPageLogin: React.FC<FullPageLoginProps> = ({
  onGoogleOAuthLogin,
  themeMode,
  onThemeChange,
}) => {
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState<boolean>(false);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleOAuthClick = async () => {
    setErrorMessage(null);
    setIsPopupBlocked(false);
    setIsOAuthSubmitting(true);
    try {
      await onGoogleOAuthLogin();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      const code = err?.code || '';
      const msg = (err?.message || '').toLowerCase();
      
      if (code === 'auth/popup-blocked' || msg.includes('popup') || msg.includes('blocked')) {
        setIsPopupBlocked(true);
        setErrorMessage(
          'Your browser blocked the Google authentication popup. Please click "Open in New Window" below to sign in, or allow popups for this site.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed before completing. Please click the button to try again.');
      } else if (code === 'auth/cancelled-popup-request') {
        // Another popup was opened, ignore
      } else {
        setErrorMessage(
          err?.message || 'Google authentication encountered an unexpected issue. Please verify your internet connection and try again.'
        );
      }
    } finally {
      setIsOAuthSubmitting(false);
    }
  };

  const handleOpenInNewWindow = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900">
      
      {/* Top Header */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                PLANVEXA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Daily Routines, Habits &amp; Eisenhower Matrix
            </p>
          </div>
        </div>

        {/* Theme Switcher & Status */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Cloud Firestore</span>
          </div>

          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              id="theme-toggle-light"
              onClick={() => onThemeChange('light')}
              title="Light Mode"
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              id="theme-toggle-dark"
              onClick={() => onThemeChange('dark')}
              title="Dark Mode"
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand & Value Highlights */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Isolated Personal Workspace</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.2]">
                Achieve relentless consistency with{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  PLANVEXA
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Log in with your Gmail account to access your personal productivity engine. Zero sample records — you start with a clean canvas tailored completely to you.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Starts Clean with 0 Tasks
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    No pre-loaded demo tasks. Build your authentic daily routine from day one.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Google Cloud Firestore Persistence
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Every checkmark and streak is backed up in real time to Google Cloud.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Strict Account Isolation
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Protected by Firebase Security Rules. Only your verified Gmail can access your data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Sign-In Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 relative overflow-hidden">
              
              {/* Subtle Ambient Accent */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Card Header */}
              <div className="mb-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Authentication Only</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Sign in with Gmail
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Connect your Google account to enter your secure, isolated workspace. Direct access has been retired to ensure 100% cloud privacy.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs leading-relaxed space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{errorMessage}</div>
                  </div>
                  {isPopupBlocked && (
                    <button
                      type="button"
                      onClick={handleOpenInNewWindow}
                      className="w-full mt-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Window to Sign In</span>
                    </button>
                  )}
                </div>
              )}

              {/* Primary Google Login Button */}
              <div className="space-y-4">
                <button
                  id="btn-google-login-primary"
                  type="button"
                  onClick={handleOAuthClick}
                  disabled={isOAuthSubmitting}
                  className="w-full group relative py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isOAuthSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        Signing in with Google...
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Official Google 4-Color SVG Icon */}
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        Continue with Google (Gmail)
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </>
                  )}
                </button>

                {/* If in iframe: Helper link to open in new tab */}
                {isInIframe && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleOpenInNewWindow}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer underline underline-offset-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Prefer signing in in a new tab? Click here</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Security & Verification Details */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                    <span>OAuth 2.0 Authentication</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Database</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Firestore Cloud</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Security Model</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Private Partition</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60">
        PLANVEXA • Professional Habit &amp; Schedule Management • Exclusively Secured by Google Authentication
      </footer>

    </div>
  );
};
