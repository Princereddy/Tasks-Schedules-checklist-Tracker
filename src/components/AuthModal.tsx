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
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Sparkles,
  Layers,
  Database,
  Briefcase,
  FileText
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
  onSignIn: (params: { email: string; password: string }) => Promise<UserProfile | void>;
  onSignUp: (params: { email: string; password: string; confirmPassword: string; displayName: string }) => Promise<UserProfile | void>;
  onLogout: () => Promise<void>;
  onManualSync: () => Promise<void>;
  onUpdateProfile: (params: {
    displayName?: string;
    email?: string;
    newPassword?: string;
    confirmNewPassword?: string;
    jobTitle?: string;
    avatarColor?: string;
  }) => Promise<UserProfile>;
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
  onSignIn,
  onSignUp,
  onLogout,
  onManualSync,
  onUpdateProfile,
  tasksCount,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sync'>('profile');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Profile edit fields
  const [nameInput, setNameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [jobTitleInput, setJobTitleInput] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>('#2563eb');
  
  // Password change fields
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState<boolean>(false);

  // Unauthenticated Sign in / Sign up form fields
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formConfirmPassword, setFormConfirmPassword] = useState<string>('');
  const [formDisplayName, setFormDisplayName] = useState<string>('');
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);

  // Feedback states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Initialize fields when user changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setNameInput(customDisplayName || currentUser.displayName || '');
      setEmailInput(currentUser.email || '');
      setJobTitleInput(currentUser.jobTitle || 'Workspace Member');
      setAvatarColor(currentUser.avatarColor || '#2563eb');
    }
  }, [currentUser, customDisplayName, isOpen]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const cleanName = nameInput.trim();
    if (!cleanName || cleanName.length < 2) {
      setFeedbackError('User Name must be at least 2 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateProfile({
        displayName: cleanName,
        jobTitle: jobTitleInput.trim(),
        avatarColor,
      });
      setFeedbackSuccess('Profile successfully updated & synchronized!');
      soundFx.playSuccessChime();
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Failed to update profile.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setFeedbackError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFeedbackError('New password and confirmation do not match.');
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateProfile({
        newPassword,
        confirmNewPassword,
      });
      setFeedbackSuccess('Password successfully updated and encrypted!');
      setNewPassword('');
      setConfirmNewPassword('');
      soundFx.playSuccessChime();
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Failed to update password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const cleanEmail = formEmail.trim().toLowerCase();
    const cleanPassword = formPassword;

    if (!cleanEmail) {
      setFeedbackError('Please enter your Email ID.');
      return;
    }
    if (!cleanPassword) {
      setFeedbackError('Please enter your Password.');
      return;
    }

    setIsProcessing(true);
    try {
      if (authMode === 'signup') {
        if (!formDisplayName.trim() || formDisplayName.trim().length < 2) {
          setFeedbackError('Please enter your User Name.');
          setIsProcessing(false);
          return;
        }
        if (cleanPassword !== formConfirmPassword) {
          setFeedbackError('Passwords do not match.');
          setIsProcessing(false);
          return;
        }
        await onSignUp({
          email: cleanEmail,
          password: cleanPassword,
          confirmPassword: formConfirmPassword,
          displayName: formDisplayName.trim(),
        });
        setFeedbackSuccess('Account created and signed in successfully!');
      } else {
        await onSignIn({
          email: cleanEmail,
          password: cleanPassword,
        });
        setFeedbackSuccess('Signed in successfully!');
      }
      soundFx.playSuccessChime();
      onClose();
    } catch (err: any) {
      setFeedbackError(err?.message || 'Authentication error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOutClick = async () => {
    setIsProcessing(true);
    try {
      await onLogout();
      soundFx.playClickBeep();
      onClose();
    } catch (err: any) {
      setFeedbackError(err?.message || 'Failed to sign out.');
    } finally {
      setIsProcessing(false);
    }
  };

  const COLOR_OPTIONS = [
    { label: 'Royal Blue', value: '#2563eb' },
    { label: 'Indigo', value: '#4f46e5' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Violet', value: '#7c3aed' },
    { label: 'Rose', value: '#e11d48' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Teal', value: '#0d9488' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="auth-profile-modal-card"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {currentUser ? 'Workspace User Profile' : 'Sign In to Workspace'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentUser ? 'Edit your credentials, name & cloud settings' : 'Access your private tasks and habits'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Notices */}
        {feedbackError && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="flex-1 leading-relaxed">{feedbackError}</div>
          </div>
        )}

        {feedbackSuccess && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="flex-1 leading-relaxed">{feedbackSuccess}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {currentUser ? (
            /* Logged In Workspace Profile Management */
            <>
              {/* Profile Card Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-100 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0"
                    style={{ backgroundColor: avatarColor || '#2563eb' }}
                  >
                    {((nameInput || currentUser.displayName || currentUser.email || 'U'))[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {nameInput || currentUser.displayName || 'Workspace User'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {emailInput || currentUser.email}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {jobTitleInput || 'Workspace Member'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Cloud Active</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'profile'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profile Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'security'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sync')}
                  className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'sync'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Cloud Data</span>
                </button>
              </div>

              {/* Tab 1: Edit Profile Info */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      User Name / Display Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        disabled={isProcessing}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Registered Email ID
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Permanent Account ID</span>
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        readOnly
                        disabled
                        value={emailInput}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 text-xs sm:text-sm cursor-not-allowed select-none font-mono"
                      />
                      <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400/80" />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Your registered Email ID is permanent and securely tied to your cloud workspace data.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Job Title / Role
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={jobTitleInput}
                          onChange={(e) => setJobTitleInput(e.target.value)}
                          placeholder="e.g. Lead Designer"
                          disabled={isProcessing}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Avatar Color Accent
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setAvatarColor(c.value)}
                            className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                              avatarColor === c.value ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Profile Changes</span>
                  </button>
                </form>
              )}

              {/* Tab 2: Security & Password Update */}
              {activeTab === 'security' && (
                <form onSubmit={handleSavePassword} className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Security &amp; Password Management</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                      Update your password below. All credentials are encrypted with SHA-256 security digests.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password (Min 6 chars) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isProcessing}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isProcessing}
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                          confirmNewPassword && newPassword !== confirmNewPassword
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !newPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Update Password</span>
                  </button>
                </form>
              )}

              {/* Tab 3: Cloud Data & Auto-Sync Diagnostics */}
              {activeTab === 'sync' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Auto-Sync Function:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>Enabled &amp; Active</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Synced Tasks in Cloud:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tasksCount} Active Tasks</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Workspace Partition:</span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-900/80 px-2 py-0.5 rounded">
                        {currentUser?.uid}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Last Cloud Sync:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Real-time active'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Continuous Real-Time Protection</span>
                    </p>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300/90 leading-relaxed">
                      Every task you create, checklist item you complete, or schedule change you make is instantly and automatically synchronized with your Cloud Firestore database.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
                    <span>{isSyncing ? 'Syncing with Firestore...' : 'Force Manual Cloud Sync'}</span>
                  </button>
                </div>
              )}

              {/* Sign Out Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  PLANVEXA Security &amp; Data Isolation
                </span>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  disabled={isProcessing}
                  className="py-2 px-3.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated View: Sign In or Sign Up Form */
            <div>
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-5 text-center">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setFeedbackError(null); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setFeedbackError(null); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      User Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={formDisplayName}
                        onChange={(e) => setFormDisplayName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        disabled={isProcessing}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      disabled={isProcessing}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {authMode === 'signup' ? 'Create Password' : 'Password'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isProcessing}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={formConfirmPassword}
                        onChange={(e) => setFormConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isProcessing}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'signup' ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>
                    {authMode === 'signup'
                      ? 'Create Account & Access Workspace'
                      : 'Sign In to Workspace'}
                  </span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
