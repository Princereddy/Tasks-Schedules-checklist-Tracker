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
  
  // Weekday selection
  const [activeWeekdays, setActiveWeekdays] = useState<number[]>(
    editingTask?.activeWeekdays || [1, 2, 3, 4, 5]
  );

  // Timings
  const [startTime, setStartTime] = useState(editingTask?.defaultStartTime || '09:00');
  const [endTime, setEndTime] = useState(editingTask?.defaultEndTime || '10:00');
  
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
      setActiveWeekdays([...activeWeekdays, dayIndex].sort());
    }
  };

  const handleSetPreset = (preset: 'all' | 'workdays' | 'weekend') => {
    if (preset === 'all') setActiveWeekdays([0, 1, 2, 3, 4, 5, 6]);
    else if (preset === 'workdays') setActiveWeekdays([1, 2, 3, 4, 5]);
    else if (preset === 'weekend') setActiveWeekdays([0, 6]);
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

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        priority,
        activeWeekdays,
        defaultStartTime: startTime,
        defaultEndTime: endTime,
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
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              Day Timings & Schedule Slot
            </label>

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
