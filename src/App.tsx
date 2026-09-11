/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HeaderRibbon } from './components/HeaderRibbon';
import { CalendarStrip } from './components/CalendarStrip';
import { DashboardView } from './components/DashboardView';
import { TasksChecklistView } from './components/TasksChecklistView';
import { HabitMatrixView } from './components/HabitMatrixView';
import { ManageTasksView } from './components/ManageTasksView';
import { TaskFormModal } from './components/TaskFormModal';
import { NotificationCenter } from './components/NotificationCenter';
import { ExportModal } from './components/ExportModal';
import { BottomNavBar } from './components/BottomNavBar';
import { AuthModal } from './components/AuthModal';
import { CloudSyncBanner } from './components/CloudSyncBanner';
import { RedirectAuthBridge } from './components/RedirectAuthBridge';

import { 
  TaskItem, 
  TaskDailyProgress, 
  TaskCategory, 
  AppNotification, 
  TaskStatus,
  ThemeMode,
  SyncStatus
} from './types';

import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadProgressFromStorage, 
  saveProgressToStorage, 
  loadCategoriesFromStorage, 
  loadNotificationsFromStorage, 
  saveNotificationsToStorage 
} from './utils/storage';

import { 
  getTodayDateParts, 
  formatDateKey, 
  getDaysInMonth, 
  getDayOfWeek,
  formatTime12h 
} from './utils/dates';

import { soundFx } from './utils/audio';
import { notificationService } from './utils/notifications';
import { getStoredTheme, applyTheme } from './utils/theme';

import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  ensureUserDataInitialized,
  subscribeToUserTasks,
  subscribeToUserProgress,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  saveProgressToFirestore,
  batchSaveTasksToFirestore,
  batchDeleteTasksFromFirestore,
  batchSaveProgressToFirestore,
  updateUserDisplayName,
  checkRedirectResult,
} from './lib/firebase';

export default function App() {
  // Check if we are in direct OAuth redirect bridge mode
  const isAuthRedirectMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('auth_mode') === 'redirect' ||
    new URLSearchParams(window.location.search).get('action') === 'google_redirect'
  );

  if (isAuthRedirectMode) {
    return <RedirectAuthBridge />;
  }

  const todayParts = getTodayDateParts();

  // State: Theme Mode (Light / Dark / System)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());

  // Apply theme class to document root
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  // Firebase Authentication & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customDisplayName, setCustomDisplayName] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const unsubTasksRef = useRef<(() => void) | null>(null);
  const unsubProgressRef = useRef<(() => void) | null>(null);

  // State: Year, Month, Day selection
  const [selectedYear, setSelectedYear] = useState<number>(todayParts.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayParts.monthIndex);
  const [selectedDay, setSelectedDay] = useState<number>(todayParts.day);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checklist' | 'matrix' | 'manage'>('dashboard');

  // Core data state
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasksFromStorage());
  const [progress, setProgress] = useState<Record<string, TaskDailyProgress>>(() => loadProgressFromStorage());
  const [categories] = useState<TaskCategory[]>(() => loadCategoriesFromStorage());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotificationsFromStorage());

  // UI modal toggles
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Firebase Auth Observer & Real-time Cloud Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clear any prior Firestore subscriptions
      if (unsubTasksRef.current) {
        unsubTasksRef.current();
        unsubTasksRef.current = null;
      }
      if (unsubProgressRef.current) {
        unsubProgressRef.current();
        unsubProgressRef.current = null;
      }

      if (user) {
        setCurrentUser(user);
        setIsSyncing(true);
        setSyncStatus('saving');
        try {
          // Initialize user's personal cloud partition in Firestore (no demo data for new users)
          const cloudData = await ensureUserDataInitialized(user.uid);
          setTasks(cloudData.tasks);
          setProgress(cloudData.progress);
          saveTasksToStorage(cloudData.tasks);
          saveProgressToStorage(cloudData.progress);
          if (cloudData.profile?.displayName) {
            setCustomDisplayName(cloudData.profile.displayName);
          } else if (user.displayName) {
            setCustomDisplayName(user.displayName);
          }
          setLastSyncedAt(new Date());
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus((s) => (s === 'synced' ? 'idle' : s)), 2000);

          // Real-time listener for tasks
          unsubTasksRef.current = subscribeToUserTasks(user.uid, (updatedTasks) => {
            setTasks(updatedTasks);
            setLastSyncedAt(new Date());
          });

          // Real-time listener for daily progress
          unsubProgressRef.current = subscribeToUserProgress(user.uid, (updatedProgress) => {
            setProgress(updatedProgress);
            setLastSyncedAt(new Date());
          });

          // Add welcome sync notification
          const notif = notificationService.createNotification(
            '☁️ Cloud Firestore Connected',
            `Signed in as ${user.email}. Your tasks and habits are safely backed up and auto-sync is active.`,
            'info'
          );
          setNotifications((prev) => [notif, ...prev]);
        } catch (err) {
          console.error('Failed to sync Firestore data for user:', err);
          setSyncStatus('error');
        } finally {
          setIsSyncing(false);
        }
      } else {
        setCurrentUser(null);
        setCustomDisplayName(null);
        setSyncStatus('idle');
        // On logout, fallback to local storage
        setTasks(loadTasksFromStorage());
        setProgress(loadProgressFromStorage());
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubTasksRef.current) unsubTasksRef.current();
      if (unsubProgressRef.current) unsubProgressRef.current();
    };
  }, []);

  // Check redirect result on app initialization for standalone windows
  useEffect(() => {
    checkRedirectResult().catch((err) => {
      console.warn('Silent checkRedirectResult:', err);
    });
  }, []);

  // Listen for auth success postMessage from standalone auth window
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLANVEXA_AUTH_SUCCESS') {
        setIsAuthModalOpen(false);
        soundFx.playSuccessChime();
        const notif = notificationService.createNotification(
          '☁️ Google Account Connected',
          `Signed in successfully! Your tasks and habits are syncing with Cloud Firestore.`,
          'info'
        );
        setNotifications((prev) => [notif, ...prev]);
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Auto-close auth modal as soon as currentUser is detected
  useEffect(() => {
    if (currentUser && isAuthModalOpen) {
      setIsAuthModalOpen(false);
    }
  }, [currentUser, isAuthModalOpen]);

  // Check for ?action=signin query parameter (e.g. from popup-blocked new-tab fallback)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('action') === 'signin') {
        setIsAuthModalOpen(true);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, []);

  // Sync state to localStorage (offline safety cache)
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveProgressToStorage(progress);
  }, [progress]);

  useEffect(() => {
    saveNotificationsToStorage(notifications);
  }, [notifications]);

  // Handle month boundary when changing year/month
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  // Periodic Reminder Engine (Runs every 30 seconds to alert upcoming tasks)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();
      const currentDayOfWeek = now.getDay();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const nowMinutesOfDay = currentHours * 60 + currentMinutes;
      const todayKey = formatDateKey(currentYear, currentMonth, currentDay);

      tasks.forEach((task) => {
        if (!task.reminderEnabled || !task.activeWeekdays.includes(currentDayOfWeek)) {
          return;
        }

        const [sH, sM] = (task.defaultStartTime || '09:00').split(':').map(Number);
        const taskStartMinutes = sH * 60 + sM;
        const diff = taskStartMinutes - nowMinutesOfDay;

        // Trigger when within reminder window
        if (diff === task.reminderMinutesBefore || diff === 0) {
          const notifKey = `reminded_${task.id}_${todayKey}_${diff}`;
          if (!sessionStorage.getItem(notifKey)) {
            sessionStorage.setItem(notifKey, 'true');
            
            const newNotif = notificationService.createNotification(
              diff === 0 ? `Starting Now: ${task.title}` : `Upcoming Task in ${diff}m: ${task.title}`,
              `Scheduled at ${formatTime12h(task.defaultStartTime)}. Open PLANVEXA to check off items.`,
              'reminder',
              task.id
            );

            setNotifications((prev) => [newNotif, ...prev]);
            soundFx.playSuccessChime();
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Date Navigation Handlers
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = getTodayDateParts();
    setSelectedYear(today.year);
    setSelectedMonth(today.monthIndex);
    setSelectedDay(today.day);
    soundFx.playClickBeep();
  };

  // Auth Operations
  const handleLogin = async () => {
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  // Generalized Auto-Sync Trigger to keep Firestore continuously updated on every single user change
  const triggerAutoSync = async (saveOp: () => Promise<any>) => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncStatus('saving');
    try {
      await saveOp();
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      setTimeout(() => {
        setSyncStatus((curr) => (curr === 'synced' ? 'idle' : curr));
      }, 2000);
    } catch (err) {
      console.warn('Auto-sync error:', err);
      setSyncStatus('error');
      setTimeout(() => {
        setSyncStatus((curr) => (curr === 'error' ? 'idle' : curr));
      }, 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateDisplayName = async (newName: string) => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncStatus('saving');
    try {
      const updated = await updateUserDisplayName(newName);
      setCustomDisplayName(updated);
      if (auth.currentUser) {
        setCurrentUser({ ...auth.currentUser } as User);
      }
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      const notif = notificationService.createNotification(
        '👤 Display Name Changed',
        `Your account display name was changed to "${updated}" and auto-synced to Cloud Firestore.`,
        'info'
      );
      setNotifications((prev) => [notif, ...prev]);
      soundFx.playSuccessChime();
      setTimeout(() => {
        setSyncStatus((curr) => (curr === 'synced' ? 'idle' : curr));
      }, 2500);
    } catch (err: any) {
      console.error('Failed to change display name:', err);
      setSyncStatus('error');
      setTimeout(() => {
        setSyncStatus((curr) => (curr === 'error' ? 'idle' : curr));
      }, 4000);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) return;
    await triggerAutoSync(async () => {
      const cloudData = await ensureUserDataInitialized(currentUser.uid);
      setTasks(cloudData.tasks);
      setProgress(cloudData.progress);
      saveTasksToStorage(cloudData.tasks);
      saveProgressToStorage(cloudData.progress);
      if (cloudData.profile?.displayName) {
        setCustomDisplayName(cloudData.profile.displayName);
      }
    });
  };

  // Status & Progress Updates with Cloud Firestore Protection
  const handleUpdateStatus = (taskId: string, status: TaskStatus, customDateKey?: string) => {
    const dateKey = customDateKey || formatDateKey(selectedYear, selectedMonth, selectedDay);
    const key = `${taskId}_${dateKey}`;

    const updatedRecord: TaskDailyProgress = {
      taskId,
      dateKey,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      completedSubtasks: progress[key]?.completedSubtasks || [],
    };

    setProgress((prev) => ({
      ...prev,
      [key]: updatedRecord,
    }));

    // Auto-sync instantly to Firestore database on every change
    if (currentUser) {
      triggerAutoSync(() => saveProgressToFirestore(currentUser.uid, updatedRecord));
    }

    // If completed, add notification alert if all daily tasks are done
    if (status === 'completed') {
      const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, selectedDay);
      const scheduledTasks = tasks.filter((t) => t.activeWeekdays.includes(dayOfWeek));
      const doneCount = scheduledTasks.filter((t) => {
        const p = t.id === taskId ? { status: 'completed' } : progress[`${t.id}_${dateKey}`];
        return p?.status === 'completed';
      }).length;

      if (doneCount === scheduledTasks.length && scheduledTasks.length > 0) {
        const perfectDayNotif = notificationService.createNotification(
          '🎉 Daily Mastery Achieved!',
          `You have completed 100% of your scheduled items for ${dateKey}. Keep your streak blazing!`,
          'streak'
        );
        setNotifications((prev) => [perfectDayNotif, ...prev]);
      }
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const dateKey = formatDateKey(selectedYear, selectedMonth, selectedDay);
    const key = `${taskId}_${dateKey}`;
    const currentSubtasks = progress[key]?.completedSubtasks || [];

    const updatedSubtasks = currentSubtasks.includes(subtaskId)
      ? currentSubtasks.filter((id) => id !== subtaskId)
      : [...currentSubtasks, subtaskId];

    const rec: TaskDailyProgress = {
      taskId,
      dateKey,
      status: progress[key]?.status || 'pending',
      completedSubtasks: updatedSubtasks,
    };

    setProgress((prev) => ({
      ...prev,
      [key]: rec,
    }));

    // Auto-sync instantly to Firestore
    if (currentUser) {
      triggerAutoSync(() => saveProgressToFirestore(currentUser.uid, rec));
    }

    soundFx.playClickBeep();
  };

  // Task CRUD operations with Firestore Persistence & Auto-Sync
  const handleSaveTask = (
    taskData: Omit<TaskItem, 'id' | 'createdAt'>,
    taskId?: string
  ) => {
    let savedTask: TaskItem;
    if (taskId) {
      // Edit existing
      savedTask = {
        ...taskData,
        id: taskId,
        createdAt: tasks.find((t) => t.id === taskId)?.createdAt || new Date().toISOString().split('T')[0],
      };
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? savedTask : t))
      );
    } else {
      // Add new
      savedTask = {
        ...taskData,
        id: 'task_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTasks((prev) => [savedTask, ...prev]);
    }

    // Auto-sync instantly to Firestore
    if (currentUser) {
      triggerAutoSync(() => saveTaskToFirestore(currentUser.uid, savedTask));
    }

    soundFx.playSuccessChime();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    // Auto-sync deletion instantly to Firestore
    if (currentUser) {
      triggerAutoSync(() => deleteTaskFromFirestore(currentUser.uid, taskId));
    }
    soundFx.playClickBeep();
  };

  const handleDuplicateTask = (task: TaskItem) => {
    const copy: TaskItem = {
      ...task,
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: `${task.title} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [copy, ...prev]);
    // Auto-sync duplicate instantly to Firestore
    if (currentUser) {
      triggerAutoSync(() => saveTaskToFirestore(currentUser.uid, copy));
    }
    soundFx.playSuccessChime();
  };

  const handleToggleTaskWeekday = (taskId: string, weekdayIndex: number) => {
    let updatedTaskRef: TaskItem | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const exists = t.activeWeekdays.includes(weekdayIndex);
        if (exists && t.activeWeekdays.length === 1) return t; // Keep at least one
        const updatedDays = exists
          ? t.activeWeekdays.filter((d) => d !== weekdayIndex)
          : [...t.activeWeekdays, weekdayIndex].sort();
        const updated = { ...t, activeWeekdays: updatedDays };
        updatedTaskRef = updated;
        return updated;
      })
    );

    // Auto-sync schedule update to Firestore
    if (currentUser && updatedTaskRef) {
      triggerAutoSync(() => saveTaskToFirestore(currentUser.uid, updatedTaskRef!));
    }
    soundFx.playClickBeep();
  };

  // Multi-actions & Batch Operations with Auto-Sync
  const handleBatchUpdateStatus = (taskIds: string[], status: TaskStatus, customDateKey?: string) => {
    const dateKey = customDateKey || formatDateKey(selectedYear, selectedMonth, selectedDay);
    const updates: Record<string, TaskDailyProgress> = {};
    taskIds.forEach((id) => {
      const key = `${id}_${dateKey}`;
      updates[key] = {
        taskId: id,
        dateKey,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        completedSubtasks: progress[key]?.completedSubtasks || [],
      };
    });
    setProgress((prev) => ({ ...prev, ...updates }));

    if (currentUser) {
      triggerAutoSync(() => batchSaveProgressToFirestore(currentUser.uid, updates));
    }

    if (status === 'completed') {
      soundFx.playSuccessChime();
    } else {
      soundFx.playClickBeep();
    }
  };

  const handleBatchDeleteTasks = (taskIds: string[]) => {
    setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
    if (currentUser) {
      triggerAutoSync(() => batchDeleteTasksFromFirestore(currentUser.uid, taskIds));
    }
    soundFx.playClickBeep();
  };

  const handleBatchDuplicateTasks = (taskIds: string[]) => {
    const toDuplicate = tasks.filter((t) => taskIds.includes(t.id));
    const duplicates: TaskItem[] = toDuplicate.map((task) => ({
      ...task,
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: `${task.title} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    }));
    setTasks((prev) => [...duplicates, ...prev]);

    if (currentUser) {
      triggerAutoSync(() => batchSaveTasksToFirestore(currentUser.uid, duplicates));
    }

    soundFx.playSuccessChime();
  };

  const handleBatchSetWeekdays = (taskIds: string[], weekdays: number[]) => {
    let updatedTasksList: TaskItem[] = [];
    setTasks((prev) => {
      const updated = prev.map((t) => (taskIds.includes(t.id) ? { ...t, activeWeekdays: [...weekdays].sort() } : t));
      updatedTasksList = updated.filter(t => taskIds.includes(t.id));
      return updated;
    });

    if (currentUser && updatedTasksList.length > 0) {
      triggerAutoSync(() => batchSaveTasksToFirestore(currentUser.uid, updatedTasksList));
    }
    soundFx.playClickBeep();
  };

  const handleBatchToggleReminders = (taskIds: string[], enabled: boolean) => {
    let updatedTasksList: TaskItem[] = [];
    setTasks((prev) => {
      const updated = prev.map((t) => (taskIds.includes(t.id) ? { ...t, reminderEnabled: enabled } : t));
      updatedTasksList = updated.filter(t => taskIds.includes(t.id));
      return updated;
    });

    if (currentUser && updatedTasksList.length > 0) {
      triggerAutoSync(() => batchSaveTasksToFirestore(currentUser.uid, updatedTasksList));
    }
    soundFx.playClickBeep();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setSoundEnabled(next);
    if (next) soundFx.playSuccessChime();
  };

  const handleTriggerTestPush = () => {
    const testNotif = notificationService.createNotification(
      'Notification Test Successful',
      'Your task alerts and streak notifications are operating smoothly.',
      'info'
    );
    setNotifications((prev) => [testNotif, ...prev]);
    soundFx.playSuccessChime();
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100/75 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-100 dark:selection:bg-blue-900/40 selection:text-blue-900 dark:selection:text-blue-200 pb-20 md:pb-6 transition-colors duration-200">
      
      {/* MS Office Fluent Command Ribbon Header */}
      <HeaderRibbon
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        activeTab={activeTab}
        unreadNotifsCount={unreadNotifsCount}
        soundEnabled={soundEnabled}
        themeMode={themeMode}
        currentUser={currentUser}
        customDisplayName={customDisplayName}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onJumpToToday={handleJumpToToday}
        onTabChange={setActiveTab}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onToggleSound={handleToggleSound}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onSelectTheme={(mode) => {
          setThemeMode(mode);
          applyTheme(mode);
        }}
      />

      {/* Cloud Firestore & Google Auth Status Ribbon */}
      <CloudSyncBanner
        currentUser={currentUser}
        customDisplayName={customDisplayName}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        tasksCount={tasks.length}
      />

      {/* Interactive Year & Month Calendar Scrubber Strip */}
      <CalendarStrip
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        tasks={tasks}
        progress={progress}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden min-w-0">
        {activeTab === 'dashboard' && (
          <DashboardView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            tasks={tasks}
            progress={progress}
            categories={categories}
            onUpdateStatus={handleUpdateStatus}
            onGoToChecklistTab={() => setActiveTab('checklist')}
            onOpenNewTaskModal={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeTab === 'checklist' && (
          <TasksChecklistView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            tasks={tasks}
            progress={progress}
            categories={categories}
            onUpdateStatus={handleUpdateStatus}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onToggleSubtask={handleToggleSubtask}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onBatchDeleteTasks={handleBatchDeleteTasks}
            onDuplicateTask={handleDuplicateTask}
            onOpenNewTaskModal={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeTab === 'matrix' && (
          <HabitMatrixView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            tasks={tasks}
            progress={progress}
            categories={categories}
            onSelectDay={setSelectedDay}
            onUpdateStatusForDate={(taskId, dateKey, status) => {
              handleUpdateStatus(taskId, status, dateKey);
            }}
          />
        )}

        {activeTab === 'manage' && (
          <ManageTasksView
            tasks={tasks}
            categories={categories}
            onOpenNewTaskModal={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            onOpenExport={() => setIsExportModalOpen(true)}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onBatchDeleteTasks={handleBatchDeleteTasks}
            onDuplicateTask={handleDuplicateTask}
            onBatchDuplicateTasks={handleBatchDuplicateTasks}
            onToggleTaskWeekday={handleToggleTaskWeekday}
            onBatchSetWeekdays={handleBatchSetWeekdays}
            onBatchToggleReminders={handleBatchToggleReminders}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewTaskModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Modals & Slide-over Drawers */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        editingTask={editingTask}
        categories={categories}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        customDisplayName={customDisplayName}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onManualSync={handleManualSync}
        onUpdateDisplayName={handleUpdateDisplayName}
        tasksCount={tasks.length}
      />

      <NotificationCenter
        isOpen={isNotifDrawerOpen}
        notifications={notifications}
        tasks={tasks}
        soundEnabled={soundEnabled}
        onClose={() => setIsNotifDrawerOpen(false)}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onClearNotifications={() => setNotifications([])}
        onToggleSound={handleToggleSound}
        onTriggerTestPush={handleTriggerTestPush}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        tasks={tasks}
        progress={progress}
        categories={categories}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <p>
          PLANVEXA • Multi-field Productivity &amp; Habit Suite • Connected to Firebase Cloud Firestore with Individual Gmail Authentication • Data Protected Permanently
        </p>
      </footer>

    </div>
  );
}
