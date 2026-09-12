import React from 'react';
import { 
  CheckSquare, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Grid3X3, 
  Plus, 
  Bell, 
  Volume2, 
  VolumeX, 
  Download, 
  CalendarDays, 
  Sparkles, 
  Sun, 
  Moon, 
  Laptop, 
  Layers,
  Cloud,
  RefreshCw,
  CheckCircle2,
  Zap,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { AVAILABLE_YEARS, MONTH_NAMES } from '../utils/dates';
import { ThemeMode, SyncStatus, UserProfile } from '../types';
import { soundFx } from '../utils/audio';

interface HeaderRibbonProps {
  selectedYear: number;
  selectedMonth: number; // 0-11
  selectedDay: number;
  activeTab: 'dashboard' | 'checklist' | 'matrix' | 'manage';
  unreadNotifsCount: number;
  soundEnabled: boolean;
  themeMode: ThemeMode;
  currentUser: UserProfile | null;
  customDisplayName?: string | null;

  isSyncing: boolean;
  syncStatus?: SyncStatus;
  onOpenAuthModal: () => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onJumpToToday: () => void;
  onTabChange: (tab: 'dashboard' | 'checklist' | 'matrix' | 'manage') => void;
  onOpenNewTaskModal: () => void;
  onToggleSound: () => void;
  onOpenNotifications: () => void;
  onOpenExport: () => void;
  onSelectTheme: (mode: ThemeMode) => void;
}

export const HeaderRibbon: React.FC<HeaderRibbonProps> = ({
  selectedYear,
  selectedMonth,
  activeTab,
  unreadNotifsCount,
  soundEnabled,
  themeMode,
  currentUser,
  customDisplayName,
  isSyncing,
  syncStatus = 'idle',
  onOpenAuthModal,
  onYearChange,
  onMonthChange,
  onJumpToToday,
  onTabChange,
  onOpenNewTaskModal,
  onToggleSound,
  onOpenNotifications,
  onOpenExport,
  onSelectTheme,
}) => {

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Top Office Command Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Row: Flexible, wrapped/adaptive on mobile and tablet */}
        <div className="flex items-center justify-between min-h-[3.75rem] py-2 gap-2 sm:gap-3 flex-wrap lg:flex-nowrap">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/20 flex-shrink-0">
              <CheckSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] flex-shrink-0" />
            </div>
            <div>
              <h1 className="flex items-center gap-1.5 m-0 p-0 font-normal">
                <span className="font-black text-base sm:text-lg tracking-wider text-slate-900 dark:text-white uppercase">
                  PLAN<span className="text-blue-600 dark:text-blue-400 font-black">VEXA</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tracking-wide">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden lg:block">
                Task, Habit &amp; Schedule Productivity Suite
              </p>
            </div>
          </div>

          {/* Center Date Picker Bar: Sleek, high-contrast, touch-friendly */}
          <div className="order-3 md:order-2 w-full md:w-auto flex items-center justify-between sm:justify-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            
            {/* Year Selector */}
            <div className="flex items-center gap-1 pl-1">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <select
                id="select-year"
                aria-label="Select tracker year"
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1 py-1"
              >
                {AVAILABLE_YEARS.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 flex-shrink-0" />

            {/* Month Selector */}
            <select
              id="select-month"
              aria-label="Select tracker month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1 py-1"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {name}
                </option>
              ))}
            </select>

            {/* Quick Today Button */}
            <button
              id="btn-jump-today"
              onClick={onJumpToToday}
              className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors shadow-2xs active:scale-95 flex-shrink-0"
              title="Jump to current date"
            >
              Today
            </button>
          </div>

          {/* Right Action Icons & Primary CTA */}
          <div className="order-2 md:order-3 flex items-center gap-1 sm:gap-2 min-w-0 max-w-full">
            
            {/* Mobile Single Theme Cycle Button (<sm) */}
            <button
              id="theme-switch-mobile"
              type="button"
              aria-label={`Current theme: ${themeMode}. Tap to cycle theme.`}
              onClick={() => {
                const next: Record<ThemeMode, ThemeMode> = {
                  light: 'dark',
                  dark: 'system',
                  system: 'light',
                };
                onSelectTheme(next[themeMode]);
                soundFx.playClickBeep();
              }}
              className="sm:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-all flex-shrink-0"
              title={`Current: ${themeMode.toUpperCase()} (Tap to switch)`}
            >
              {themeMode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-400/30 flex-shrink-0" />
              ) : themeMode === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/30 flex-shrink-0" />
              ) : (
                <Laptop className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </button>

            {/* Desktop / Tablet Premium Segmented Theme Switch (>=sm) */}
            <div 
              id="premium-theme-switch"
              role="radiogroup" 
              aria-label="Display theme mode"
              className="hidden sm:flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs flex-shrink-0"
            >
              <button
                id="theme-switch-light"
                type="button"
                role="radio"
                aria-checked={themeMode === 'light'}
                onClick={() => {
                  onSelectTheme('light');
                  soundFx.playClickBeep();
                }}
                title="Light Mode"
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                  themeMode === 'light'
                    ? 'bg-white text-amber-600 shadow-xs border border-amber-200/80 ring-1 ring-amber-400/20 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 flex-shrink-0 ${themeMode === 'light' ? 'text-amber-500 fill-amber-400/30' : ''}`} />
                <span className="hidden xl:inline text-[11px]">Light</span>
              </button>

              <button
                id="theme-switch-dark"
                type="button"
                role="radio"
                aria-checked={themeMode === 'dark'}
                onClick={() => {
                  onSelectTheme('dark');
                  soundFx.playClickBeep();
                }}
                title="Dark Mode"
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 text-indigo-400 shadow-xs border border-indigo-500/50 ring-1 ring-indigo-400/30 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 flex-shrink-0 ${themeMode === 'dark' ? 'text-indigo-400 fill-indigo-400/30' : ''}`} />
                <span className="hidden xl:inline text-[11px]">Dark</span>
              </button>

              <button
                id="theme-switch-system"
                type="button"
                role="radio"
                aria-checked={themeMode === 'system'}
                onClick={() => {
                  onSelectTheme('system');
                  soundFx.playClickBeep();
                }}
                title="System Auto Match"
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                  themeMode === 'system'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-200 dark:border-blue-500/40 ring-1 ring-blue-400/20 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Laptop className={`w-3.5 h-3.5 flex-shrink-0 ${themeMode === 'system' ? 'text-blue-500' : ''}`} />
                <span className="hidden xl:inline text-[11px]">Auto</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              aria-label={soundEnabled ? 'Mute audio chimes' : 'Enable audio chimes'}
              onClick={onToggleSound}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative flex-shrink-0"
              title={soundEnabled ? 'Audio alerts active' : 'Audio alerts muted'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </button>

            {/* Notifications Bell */}
            <button
              id="btn-open-notifications"
              aria-label="Open notifications"
              onClick={onOpenNotifications}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative flex-shrink-0"
              title="Notifications & Reminders"
            >
              <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300 flex-shrink-0" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </button>

            {/* Export */}
            <button
              id="btn-export-data"
              aria-label="Export schedule to Excel or CSV"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex-shrink-0 cursor-pointer"
              title="Export to Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Standalone Window / Open in New Tab */}
            <a
              id="btn-open-standalone-tab"
              href={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in standalone tab"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Open in new window (standalone tab)"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>

            {/* Google / Gmail Auth & Cloud Status */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  id="btn-header-profile"
                  type="button"
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-all shadow-2xs cursor-pointer flex-shrink-0 active:scale-95"
                  title={`Signed in with ${currentUser.email} • Click to open Profile & Cloud Firestore`}
                >
                  <div className="relative flex-shrink-0">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={customDisplayName || currentUser.displayName || 'User'}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/50"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {((customDisplayName || currentUser.displayName || currentUser.email || 'U'))[0].toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${syncStatus === 'saving' || isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'} ring-1 ring-white dark:ring-slate-900`} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white sm:hidden">
                    Profile
                  </span>
                  <div className="hidden sm:flex flex-col items-start leading-none text-left">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white max-w-[110px] truncate">
                      {(customDisplayName || currentUser.displayName)?.split(' ')[0] || 'My Account'}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {syncStatus === 'saving' || isSyncing ? (
                        <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Saving...</span>
                        </span>
                      ) : syncStatus === 'synced' ? (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Synced</span>
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          <Cloud className="w-2.5 h-2.5" />
                          <span>Auto-Sync</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <button
                id="btn-header-auth"
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex-shrink-0"
                title="Sign in with Email ID and Password to keep your data safe in Cloud Firestore"
              >
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Quick Add Task */}
            <button
              id="btn-quick-add-task"
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all active:scale-95 ring-2 ring-blue-600/20 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] flex-shrink-0" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        {/* Ribbon Navigation Tabs (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto border-t border-slate-100 dark:border-slate-800 pt-1 pb-2 no-scrollbar w-full max-w-full min-w-0">
          <button
            id="tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard & Insights</span>
          </button>

          <button
            id="tab-checklist"
            onClick={() => onTabChange('checklist')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'checklist'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
            <span>Daily Schedule & Checklist</span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => onTabChange('matrix')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'matrix'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Grid3X3 className="w-4 h-4 flex-shrink-0" />
            <span>Monthly Habit Matrix (Excel Grid)</span>
          </button>

          <button
            id="tab-manage"
            onClick={() => onTabChange('manage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'manage'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Manage Tasks & Weekdays</span>
          </button>
        </div>
      </div>
    </header>
  );
};
