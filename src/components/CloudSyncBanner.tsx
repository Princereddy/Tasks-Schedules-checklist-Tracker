import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, Zap, ChevronRight, X, Lock } from 'lucide-react';
import { SyncStatus, UserProfile } from '../types';

interface CloudSyncBannerProps {
  currentUser: UserProfile | null;
  isSyncing: boolean;
  syncStatus?: SyncStatus;
  customDisplayName?: string | null;
  onOpenAuthModal: () => void;
  tasksCount: number;
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({
  currentUser,
  isSyncing,
  syncStatus = 'idle',
  customDisplayName,
  onOpenAuthModal,
  tasksCount,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (isDismissed) return null;

  if (currentUser) {
    const effectiveName = customDisplayName || currentUser.displayName || currentUser.email || 'Workspace User';
    return (
      <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border-b border-emerald-200/70 dark:border-emerald-800/60 py-2 px-3 sm:px-6 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs gap-3 min-w-0">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="truncate">
              <span className="font-bold">Welcome, {effectiveName}!</span> All {tasksCount} tasks &amp; habits are protected in your Firestore cloud partition.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {syncStatus === 'saving' || isSyncing ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Auto-saving...</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                <span>Cloud Live</span>
              </span>
            )}
            <button
              onClick={onOpenAuthModal}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>Edit Profile</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated reminder banner
  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-2.5 px-3 sm:px-6 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="font-medium">
            <span className="font-bold">Protect Your Tasks:</span> Sign in with your Email ID and Password to connect Cloud Firestore and keep your data permanently secure.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Sign In / Register</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
