/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

import { 
  TaskItem, 
  TaskDailyProgress, 
  TaskCategory, 
  AppNotification, 
  TaskStatus,
  ThemeMode
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

export default function App() {
  const todayParts = getTodayDateParts();

  // State: Theme Mode (Light / Dark / System)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());

  // Apply theme class to document root
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

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

  // Sync state to localStorage
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
              `Scheduled at ${formatTime12h(task.defaultStartTime)}. Open TaskFlow 365 to check off items.`,
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

  // Status & Progress Updates
  const handleUpdateStatus = (taskId: string, status: TaskStatus, customDateKey?: string) => {
    const dateKey = customDateKey || formatDateKey(selectedYear, selectedMonth, selectedDay);
    const key = `${taskId}_${dateKey}`;

    setProgress((prev) => ({
      ...prev,
      [key]: {
        taskId,
        dateKey,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        completedSubtasks: prev[key]?.completedSubtasks || [],
      },
    }));

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

    setProgress((prev) => ({
      ...prev,
      [key]: {
        taskId,
        dateKey,
        status: prev[key]?.status || 'pending',
        completedSubtasks: updatedSubtasks,
      },
    }));
    soundFx.playClickBeep();
  };

  // Task CRUD operations
  const handleSaveTask = (
    taskData: Omit<TaskItem, 'id' | 'createdAt'>,
    taskId?: string
  ) => {
    if (taskId) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...taskData } : t))
      );
    } else {
      // Add new
      const newTask: TaskItem = {
        ...taskData,
        id: 'task_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    soundFx.playSuccessChime();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
    soundFx.playSuccessChime();
  };

  const handleToggleTaskWeekday = (taskId: string, weekdayIndex: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const exists = t.activeWeekdays.includes(weekdayIndex);
        if (exists && t.activeWeekdays.length === 1) return t; // Keep at least one
        const updatedDays = exists
          ? t.activeWeekdays.filter((d) => d !== weekdayIndex)
          : [...t.activeWeekdays, weekdayIndex].sort();
        return { ...t, activeWeekdays: updatedDays };
      })
    );
    soundFx.playClickBeep();
  };

  // Multi-actions & Batch Operations
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
    if (status === 'completed') {
      soundFx.playSuccessChime();
    } else {
      soundFx.playClickBeep();
    }
  };

  const handleBatchDeleteTasks = (taskIds: string[]) => {
    setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
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
    soundFx.playSuccessChime();
  };

  const handleBatchSetWeekdays = (taskIds: string[], weekdays: number[]) => {
    setTasks((prev) =>
      prev.map((t) => (taskIds.includes(t.id) ? { ...t, activeWeekdays: [...weekdays].sort() } : t))
    );
    soundFx.playClickBeep();
  };

  const handleBatchToggleReminders = (taskIds: string[], enabled: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (taskIds.includes(t.id) ? { ...t, reminderEnabled: enabled } : t))
    );
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
    <div className="min-h-screen bg-slate-100/75 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-100 dark:selection:bg-blue-900/40 selection:text-blue-900 dark:selection:text-blue-200 pb-20 md:pb-6 transition-colors duration-200">
      
      {/* MS Office Fluent Command Ribbon Header */}
      <HeaderRibbon
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        activeTab={activeTab}
        unreadNotifsCount={unreadNotifsCount}
        soundEnabled={soundEnabled}
        themeMode={themeMode}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
          TaskFlow 365 • Multi-field Productivity & Habit Suite • Fluent UI Design • All data persisted locally
        </p>
      </footer>

    </div>
  );
}
