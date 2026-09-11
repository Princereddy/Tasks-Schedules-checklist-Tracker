import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Database, 
  Sun, 
  Moon,
  ExternalLink,
  AlertCircle,
  KeyRound,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { ThemeMode } from '../types';

interface FullPageLoginProps {
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

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleOAuthClick = () => {
    setErrorMessage(null);
    setIsOAuthSubmitting(true);

    onGoogleOAuthLogin()
      .catch((err: any) => {
        console.error('Google Sign-In notice:', err);
        setIsOAuthSubmitting(false);
        const code = err?.code || '';
        const msg = (err?.message || '').toLowerCase();
        
        const isDomainIssue = code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain');

        if (isDomainIssue) {
          setErrorMessage(
            'Domain unauthorized: Please add this domain to Authorized Domains in your Firebase Console.'
          );
        } else {
          setErrorMessage(
            err?.message || 'Google sign-in encountered an issue. Please try again.'
          );
        }
      });
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

          <button
            type="button"
            onClick={() => onThemeChange(themeMode === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-colors cursor-pointer"
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md mx-auto">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
            
            {/* Top Accent Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

            <div className="p-6 sm:p-8">
              
              {/* Card Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Authentication</span>
                </div>
                
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Sign in with Google
                </h1>
                
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Log in with your Google account to open your private Cloud Firestore workspace.
                </p>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Google Sign-In Button */}
              <div>
                <button
                  id="btn-google-login-primary"
                  type="button"
                  onClick={handleOAuthClick}
                  disabled={isOAuthSubmitting}
                  className="w-full group relative py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                        Continue with Google
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </>
                  )}
                </button>

                {/* If in iframe: Helper link to open in new tab */}
                {isInIframe && (
                  <div className="text-center pt-3">
                    <button
                      type="button"
                      onClick={handleOpenInNewWindow}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer underline underline-offset-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Prefer opening in a new browser tab? Click here</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Security & Verification Details */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                    <span>Authentication Method</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Google Sign-In</span>
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
        PLANVEXA • Professional Habit &amp; Schedule Management • Direct Google Sign-In
      </footer>

    </div>
  );
};
