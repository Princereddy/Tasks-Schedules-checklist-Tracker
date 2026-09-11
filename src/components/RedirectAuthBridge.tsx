import React, { useEffect, useState } from 'react';
import { checkRedirectResult, loginWithGoogleRedirect, auth } from '../lib/firebase';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface RedirectAuthBridgeProps {
  onComplete?: () => void;
}

export const RedirectAuthBridge: React.FC<RedirectAuthBridgeProps> = () => {
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);


  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        // Step 1: Check if we are returning from Google OAuth
        const user = await checkRedirectResult();
        if (!isMounted) return;

        if (user) {
          setAuthenticatedUser(user);
          setStatus('success');

          // Notify opener if this tab was opened from an iframe or parent window
          if (window.opener) {
            try {
              window.opener.postMessage(
                {
                  type: 'PLANVEXA_AUTH_SUCCESS',
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                },
                '*'
              );
            } catch (e) {
              console.warn('Could not postMessage to opener:', e);
            }
          }

          // Auto-close or redirect back to root after short pause
          setTimeout(() => {
            if (window.opener) {
              try {
                window.close();
              } catch (e) {
                // Ignore if browser prevents closing
              }
            }
            window.location.href = '/';
          }, 1800);
          return;
        }

        // Step 2: If user is already signed in on this domain, complete immediately
        if (auth.currentUser) {
          setAuthenticatedUser(auth.currentUser);
          setStatus('success');
          if (window.opener) {
            try {
              window.opener.postMessage(
                {
                  type: 'PLANVEXA_AUTH_SUCCESS',
                  uid: auth.currentUser.uid,
                  email: auth.currentUser.email,
                  displayName: auth.currentUser.displayName,
                },
                '*'
              );
            } catch (e) {}
          }
          setTimeout(() => {
            if (window.opener) {
              try {
                window.close();
              } catch (e) {}
            }
            window.location.href = '/';
          }, 1500);
          return;
        }

        // Step 3: Not signed in and no redirect result yet -> initiate Google OAuth redirect
        setStatus('redirecting');
        await loginWithGoogleRedirect();
      } catch (err: any) {
        console.error('Redirect auth bridge error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'Authentication encountered an error. Please try again.');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRetry = async () => {
    setStatus('redirecting');
    setErrorMessage(null);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to initiate Google sign-in.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
      <div 
        id="redirect-auth-card"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold text-white tracking-tight">PLANVEXA</h1>
            <p className="text-xs text-slate-400 font-medium">Secure Google Authentication</p>
          </div>
        </div>

        {/* State: Checking / Redirecting */}
        {(status === 'checking' || status === 'redirecting') && (
          <div className="py-6 space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping opacity-50" />
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">
                {status === 'checking' ? 'Verifying Credentials...' : 'Connecting to Google Accounts...'}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {status === 'checking'
                  ? 'Checking Google authentication response and syncing Firestore...'
                  : 'Redirecting to Google secure authentication page. Stand by...'}
              </p>
            </div>
          </div>
        )}

        {/* State: Success */}
        {status === 'success' && (
          <div className="py-6 space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">Sign-In Complete!</h2>
              <p className="text-xs text-emerald-400 font-medium">
                Signed in as: <span className="font-semibold text-white">{authenticatedUser?.email || authenticatedUser?.displayName || 'Google User'}</span>
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1 leading-relaxed">
                Your PLANVEXA account is connected and Cloud Firestore auto-sync is active.
              </p>
            </div>

            <div className="pt-2">
              <a
                id="btn-return-to-planvexa"
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Return to PLANVEXA</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="py-4 space-y-4 text-left bg-rose-950/20 border border-rose-800/40 rounded-2xl p-5 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-rose-200">
                <p className="font-bold text-rose-300">Sign-In Encountered an Issue</p>
                <p className="text-rose-200/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="btn-retry-auth"
                onClick={handleManualRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer text-center"
              >
                Try Again
              </button>
              <a
                id="btn-back-to-app"
                href="/"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all cursor-pointer text-center"
              >
                Return to App
              </a>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
          Protected by Google Identity & Cloud Firestore Security Rules
        </div>
      </div>
    </div>
  );
};
