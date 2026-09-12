import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Check, 
  Plus, 
  Trash2, 
  Bell, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { TaskCategory, TaskItem, TaskPriority, TaskSubItem } from '../types';
import { WEEKDAY_LABELS } from '../utils/dates';

interface TaskFormModalProps {
  isOpen: boolean;
  editingTask: TaskItem | null;
  categories: TaskCategory[];
  onClose: () => void;
  onSave: (taskData: Omit<TaskItem, 'id' | 'createdAt'>, taskId?: string) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  editingTask,
  categories,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [categoryId, setCategoryId] = useState(editingTask?.categoryId || categories[0]?.id || 'cat_work');
  const [priority, setPriority] = useState<TaskPriority>(editingTask?.priority || 'medium');
  
  // Weekday selection (Default to all 7 days for maximum visibility)
  const [activeWeekdays, setActiveWeekdays] = useState<number[]>(
    editingTask?.activeWeekdays || [0, 1, 2, 3, 4, 5, 6]
  );

  // Timings
  const [startTime, setStartTime] = useState(editingTask?.defaultStartTime || '09:00');
  const [endTime, setEndTime] = useState(editingTask?.defaultEndTime || '10:00');
  
  // Separate timings per weekday
  const hasExistingCustomTimes = Boolean(
    editingTask?.customDayTimes && Object.keys(editingTask.customDayTimes).length > 0
  );
  const [useSeparateDayTimings, setUseSeparateDayTimings] = useState<boolean>(hasExistingCustomTimes);
  const [customDayTimes, setCustomDayTimes] = useState<Record<number, { startTime: string; endTime: string }>>(() => {
    if (editingTask?.customDayTimes && Object.keys(editingTask.customDayTimes).length > 0) {
      return { ...editingTask.customDayTimes };
    }
    const initial: Record<number, { startTime: string; endTime: string }> = {};
    const baseStart = editingTask?.defaultStartTime || '09:00';
    const baseEnd = editingTask?.defaultEndTime || '10:00';
    (editingTask?.activeWeekdays || [0, 1, 2, 3, 4, 5, 6]).forEach((d) => {
      initial[d] = { startTime: baseStart, endTime: baseEnd };
    });
    return initial;
  });

  // Reminders
  const [reminderEnabled, setReminderEnabled] = useState(editingTask?.reminderEnabled ?? true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(
    editingTask?.reminderMinutesBefore ?? 10
  );

  // Subtasks
  const [subtasks, setSubtasks] = useState<TaskSubItem[]>(
    editingTask?.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen) return null;

  const toggleWeekday = (dayIndex: number) => {
    if (activeWeekdays.includes(dayIndex)) {
      if (activeWeekdays.length === 1) return; // Must keep at least one day
      setActiveWeekdays(activeWeekdays.filter((d) => d !== dayIndex));
    } else {
      const nextDays = [...activeWeekdays, dayIndex].sort();
      setActiveWeekdays(nextDays);
      setCustomDayTimes((prev) => {
        if (!prev[dayIndex]) {
          return {
            ...prev,
            [dayIndex]: { startTime, endTime },
          };
        }
        return prev;
      });
    }
  };

  const handleUpdateDayTime = (dayIdx: number, field: 'startTime' | 'endTime', value: string) => {
    setCustomDayTimes((prev) => ({
      ...prev,
      [dayIdx]: {
        startTime: field === 'startTime' ? value : (prev[dayIdx]?.startTime || startTime),
        endTime: field === 'endTime' ? value : (prev[dayIdx]?.endTime || endTime),
      },
    }));
  };

  const handleCopyDayTimeToAll = (sourceDayIdx: number) => {
    const source = customDayTimes[sourceDayIdx] || { startTime, endTime };
    const updated: Record<number, { startTime: string; endTime: string }> = {};
    activeWeekdays.forEach((dayIdx) => {
      updated[dayIdx] = { ...source };
    });
    setCustomDayTimes(updated);
    setStartTime(source.startTime);
    setEndTime(source.endTime);
  };

  const handleSetPreset = (preset: 'all' | 'workdays' | 'weekend') => {
    let days: number[] = [];
    if (preset === 'all') days = [0, 1, 2, 3, 4, 5, 6];
    else if (preset === 'workdays') days = [1, 2, 3, 4, 5];
    else if (preset === 'weekend') days = [0, 6];

    setActiveWeekdays(days);
    setCustomDayTimes((prev) => {
      const updated = { ...prev };
      days.forEach((d) => {
        if (!updated[d]) {
          updated[d] = { startTime, endTime };
        }
      });
      return updated;
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedCategory = categories.find((c) => c.id === categoryId);

    const finalCustomDayTimes = useSeparateDayTimings ? customDayTimes : undefined;
    const finalDefaultStart = useSeparateDayTimings && activeWeekdays.length > 0 && customDayTimes[activeWeekdays[0]]
      ? customDayTimes[activeWeekdays[0]].startTime
      : startTime;
    const finalDefaultEnd = useSeparateDayTimings && activeWeekdays.length > 0 && customDayTimes[activeWeekdays[0]]
      ? customDayTimes[activeWeekdays[0]].endTime
      : endTime;

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        priority,
        activeWeekdays,
        defaultStartTime: finalDefaultStart,
        defaultEndTime: finalDefaultEnd,
        customDayTimes: finalCustomDayTimes,
        reminderEnabled,
        reminderMinutesBefore,
        subtasks,
        colorTag: selectedCategory?.color || '#0078D4',
      },
      editingTask ? editingTask.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {editingTask ? 'Edit Task Schedule & Timings' : 'Schedule New Task or Habit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure working weekdays (S, M, T, W, T, F, S) and active hours
            </p>
          </div>
          <button
            id="btn-close-task-modal"
            aria-label="Close modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 flex-shrink-0" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 flex-1">
          
          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Task or Habit Name *
            </label>
            <input
              type="text"
              id="input-task-title"
              required
              placeholder="e.g. Daily Standup, Code Review, 5km Run, French Lesson..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Field / Domain
              </label>
              <select
                id="select-category"
                aria-label="Task field or domain category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
                          : p === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Working Weekdays Selection (S, M, T, W, T, F, S) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                Working Week Days (S, M, T, W, T, F, S)
              </label>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <button
                  type="button"
                  onClick={() => handleSetPreset('workdays')}
                  className="px-2 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  Mon-Fri
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleSetPreset('all')}
                  className="px-2 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  All 7
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleSetPreset('weekend')}
                  className="px-2 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  Weekend
                </button>
              </div>
            </div>

            {/* Weekday Buttons */}
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((day) => {
                const isSelected = activeWeekdays.includes(day.dayIndex);
                return (
                  <button
                    type="button"
                    key={day.dayIndex}
                    onClick={() => toggleWeekday(day.dayIndex)}
                    className={`py-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 scale-105 font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 font-bold'
                    }`}
                  >
                    <span className="text-sm">{day.letter}</span>
                    <span className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                      {day.short}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Active on: {activeWeekdays.map((idx) => WEEKDAY_LABELS[idx].short).join(', ')}
            </p>
          </div>

          {/* Timings of Day */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                Schedule Timings & Hours
              </label>

              {/* Toggle: Same timing vs Separate timings per weekday */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useSeparateDayTimings}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseSeparateDayTimings(checked);
                    if (checked) {
                      setCustomDayTimes((prev) => {
                        const next = { ...prev };
                        activeWeekdays.forEach((dayIdx) => {
                          if (!next[dayIdx]) {
                            next[dayIdx] = { startTime, endTime };
                          }
                        });
                        return next;
                      });
                    }
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Separate timings for each weekday
                </span>
              </label>
            </div>

            {!useSeparateDayTimings ? (
              /* Uniform Timing for All Active Days */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Start Time</span>
                    <input
                      type="time"
                      id="input-start-time"
                      aria-label="Start time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">End Time</span>
                    <input
                      type="time"
                      id="input-end-time"
                      aria-label="End time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Quick Timing Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Quick Slots:</span>
                  {[
                    { label: 'Morning (9:00 - 10:00)', s: '09:00', e: '10:00' },
                    { label: 'Midday (11:30 - 12:30)', s: '11:30', e: '12:30' },
                    { label: 'Afternoon (14:00 - 15:30)', s: '14:00', e: '15:30' },
                    { label: 'Evening (18:00 - 19:00)', s: '18:00', e: '19:00' },
                  ].map((slot) => (
                    <button
                      type="button"
                      key={slot.label}
                      onClick={() => {
                        setStartTime(slot.s);
                        setEndTime(slot.e);
                      }}
                      className="text-[10px] font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Separate Schedule Timings for Each Active Weekday */
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure specific start and end hours for each working weekday:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeWeekdays.map((dayIdx) => {
                    const dayMeta = WEEKDAY_LABELS[dayIdx];
                    const dayTiming = customDayTimes[dayIdx] || { startTime, endTime };

                    return (
                      <div
                        key={dayIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 sm:w-28 flex-shrink-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center justify-center flex-shrink-0">
                            {dayMeta.letter}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {dayMeta.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1">
                            <span className="sr-only">Start Time for {dayMeta.name}</span>
                            <input
                              type="time"
                              aria-label={`Start time for ${dayMeta.name}`}
                              value={dayTiming.startTime}
                              onChange={(e) => handleUpdateDayTime(dayIdx, 'startTime', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <span className="text-xs text-slate-400 font-bold">–</span>
                          <div className="flex-1">
                            <span className="sr-only">End Time for {dayMeta.name}</span>
                            <input
                              type="time"
                              aria-label={`End time for ${dayMeta.name}`}
                              value={dayTiming.endTime}
                              onChange={(e) => handleUpdateDayTime(dayIdx, 'endTime', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyDayTimeToAll(dayIdx)}
                            title={`Copy ${dayMeta.name}'s timing to all active weekdays`}
                            className="px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors whitespace-nowrap"
                          >
                            Copy to all
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks (Checklist breakdown) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Checklist Sub-Steps (Optional)
            </label>
            
            <div className="space-y-2 mb-2">
              {subtasks.map((sub, index) => (
                <div key={sub.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {index + 1}. {sub.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(sub.id)}
                    className="text-rose-500 hover:text-rose-700 p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a step (e.g. Check backlog, Review specs)..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex-shrink-0"
              >
                + Step
              </button>
            </div>
          </div>

          {/* Reminders & Push Notification config */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Dashboard Reminder Alert
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Notify on dashboard & browser push before start time
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                aria-label="Reminder minutes before start time"
                value={reminderMinutesBefore}
                onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                disabled={!reminderEnabled}
                className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={0}>At start time</option>
                <option value={5}>5 mins before</option>
                <option value={10}>10 mins before</option>
                <option value={15}>15 mins before</option>
                <option value={30}>30 mins before</option>
              </select>
              
              <input
                type="checkbox"
                id="check-reminder-enabled"
                aria-label="Enable reminder alerts"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notes & Outcome Criteria (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add links, meeting notes, target reps, or success criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-task"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95"
            >
              {editingTask ? 'Update Task' : 'Schedule Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
