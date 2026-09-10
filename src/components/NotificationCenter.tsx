import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Flame, 
  Clock, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { AppNotification, TaskItem } from '../types';
import { notificationService } from '../utils/notifications';
import { soundFx } from '../utils/audio';

interface NotificationCenterProps {
  isOpen: boolean;
  notifications: AppNotification[];
  tasks: TaskItem[];
  soundEnabled: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  onToggleSound: () => void;
  onTriggerTestPush: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  notifications,
  tasks,
  soundEnabled,
  onClose,
  onMarkAllRead,
  onClearNotifications,
  onToggleSound,
  onTriggerTestPush,
}) => {
  const [hasBrowserPermission, setHasBrowserPermission] = useState(
    notificationService.hasPermission()
  );

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const granted = await notificationService.requestPermission();
    setHasBrowserPermission(granted);
    if (granted) {
      notificationService.sendPush('Push Notifications Activated!', {
        body: 'You will receive reminders for your scheduled tasks and habit milestones.',
      });
      soundFx.playSuccessChime();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-in transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Bell className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Notification & Reminder Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time alerts, scheduled reminders, and streaks
              </p>
            </div>
          </div>
          <button
            id="btn-close-notif-center"
            aria-label="Close notifications"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 flex-shrink-0" />
          </button>
        </div>

        {/* Browser Push Permission Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-750">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Browser Push Notifications
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive reminders even when the app is in background or minimized.
              </p>
            </div>

            {hasBrowserPermission ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 flex-shrink-0">
                <Check className="w-3 h-3 flex-shrink-0" /> Enabled
              </span>
            ) : (
              <button
                id="btn-request-browser-push"
                onClick={handleRequestPush}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all flex-shrink-0"
              >
                Enable Push
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700 text-xs">
            <button
              onClick={onTriggerTestPush}
              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-[11px]"
            >
              <Send className="w-3 h-3 flex-shrink-0" /> Send Test Alert
            </button>

            <button
              onClick={onToggleSound}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Chime: {soundEnabled ? 'Active' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{notifications.length} recent events</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Mark read
            </button>
            <span>•</span>
            <button
              onClick={onClearNotifications}
              className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-all ${
                notif.read
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-750 text-slate-600 dark:text-slate-400'
                  : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/60 shadow-2xs text-slate-900 dark:text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {notif.type === 'streak' ? (
                    <Flame className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  ) : notif.type === 'reminder' ? (
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {notif.time}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 pl-6">
                {notif.message}
              </p>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No new notifications</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Task due reminders and streak milestones will appear here.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
