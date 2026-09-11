import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cloud, 
  CheckCircle2, 
  Lock, 
  LogOut, 
  User as UserIcon, 
  RefreshCw, 
  X, 
  AlertCircle,
  Edit2,
  Check,
  Mail,
  ArrowRight
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { SyncStatus, UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isSyncing: boolean;
  syncStatus?: SyncStatus;
  lastSyncedAt: Date | null;
  customDisplayName?: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onManualSync: () => Promise<void>;
  onUpdateDisplayName?: (newName: string) => Promise<string>;
  tasksCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSyncing,
  syncStatus = 'idle',
  lastSyncedAt,
  customDisplayName,
  onLogin,
  onLogout,
  onManualSync,
  onUpdateDisplayName,
  tasksCount,
}) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameSuccessMessage, setNameSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEffectiveName = customDisplayName || currentUser?.displayName || 'Google User';

  const handleStartEditName = () => {
    setNameInput(currentEffectiveName);
    setIsEditingName(true);
    setNameSuccessMessage(null);
    setAuthError(null);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setAuthError('Display name cannot be empty.');
      return;
    }
    if (!onUpdateDisplayName) return;

    setIsSavingName(true);
    setAuthError(null);
    try {
      await onUpdateDisplayName(trimmed);
      setNameSuccessMessage('Name updated & synced to Cloud Firestore!');
      setIsEditingName(false);
      soundFx.playSuccessChime();
      setTimeout(() => setNameSuccessMessage(null), 3500);
    } catch (err: any) {
      setAuthError('Failed to change name: ' + (err?.message || 'Check connection'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleOAuthSignIn = async () => {
    setAuthError(null);
    setIsProcessing(true);
    try {
      await onLogin();
    } catch (err: any) {
      console.error('OAuth Login error:', err);
      const code = err?.code || '';
      const msg = (err?.message || '').toLowerCase();
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setAuthError('Firebase preview domain not authorized in Firebase Console. Please add this domain or vercel.app to Authorized Domains.');
      } else {
        setAuthError(err?.message || 'Google sign-in encountered an issue. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setIsProcessing(true);
    try {
      soundFx.playClickBeep();
      onClose();
      await onLogout();
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncClick = async () => {
    setIsProcessing(true);
    try {
      await onManualSync();
      soundFx.playSuccessChime();
    } catch (err: any) {
      setAuthError('Sync encountered an issue: ' + (err?.message || 'Check connection'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div 
        id="auth-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser ? 'Profile & Cloud Firestore' : 'Google Account Sign In'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Google Authentication • Firebase Cloud Firestore
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {nameSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{nameSuccessMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Signed In View */
            <div className="space-y-4">
              {/* User Profile Card with Change Name Option */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-start gap-3.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentEffectiveName}
                      className="w-12 h-12 rounded-full ring-2 ring-blue-500/30 object-cover mt-0.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base mt-0.5">
                      {(currentEffectiveName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {currentEffectiveName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                      {!isEditingName && (
                        <button
                          id="btn-trigger-edit-name"
                          type="button"
                          onClick={handleStartEditName}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer flex-shrink-0"
                          title="Change your account display name"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Change Name</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        ● Signed in with Gmail
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Firestore Partition Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inline Name Editor Form */}
                {isEditingName && (
                  <form onSubmit={handleSaveName} className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="input-change-name" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Change Display Name:
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Auto-syncs to cloud
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="input-change-name"
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter your new display name"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={40}
                        autoFocus
                      />
                      <button
                        id="btn-save-display-name"
                        type="submit"
                        disabled={isSavingName || !nameInput.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingName ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Cloud Database Persistence Summary */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Cloud Firestore Live Protection</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                    Live Auto-Sync
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  Your schedule, streaks, and {tasksCount} tasks are saved in Cloud Firestore under your Gmail. Any change you make auto-saves immediately and is never auto-deleted.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                  <span>
                    Last Synced:{' '}
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </span>
                  <button
                    id="btn-trigger-manual-sync"
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isProcessing || isSyncing}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isProcessing || isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  id="btn-sign-out"
                  type="button"
                  onClick={handleSignOut}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                <button
                  id="btn-auth-done"
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Signed Out View */
            <div className="space-y-4 py-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Google Account Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Sign in with your Google account to open your private Cloud Firestore workspace.
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="btn-google-sign-in"
                  type="button"
                  onClick={handleOAuthSignIn}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm font-bold text-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
                      <span>Continue with Google (Gmail)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Protected by Firebase Auth Rules</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
