import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Clock, 
  Search, 
  Briefcase, 
  CalendarDays,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  Bell,
  Calendar,
  CheckCheck,
  Download,
  User as UserIcon
} from 'lucide-react';
import { TaskCategory, TaskItem, UserProfile } from '../types';
import { WEEKDAY_LABELS, formatTime12h } from '../utils/dates';
import { soundFx } from '../utils/audio';

interface ManageTasksViewProps {
  tasks: TaskItem[];
  categories: TaskCategory[];
  currentUser?: UserProfile | null;
  customDisplayName?: string | null;
  onOpenAuthModal?: () => void;
  onOpenNewTaskModal: () => void;
  onOpenExport?: () => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onBatchDeleteTasks?: (taskIds: string[]) => void;
  onDuplicateTask: (task: TaskItem) => void;
  onBatchDuplicateTasks?: (taskIds: string[]) => void;
  onToggleTaskWeekday: (taskId: string, weekdayIndex: number) => void;
  onBatchSetWeekdays?: (taskIds: string[], weekdays: number[]) => void;
  onBatchToggleReminders?: (taskIds: string[], enabled: boolean) => void;
}

export const ManageTasksView: React.FC<ManageTasksViewProps> = ({
  tasks,
  categories,
  currentUser,
  customDisplayName,
  onOpenAuthModal,
  onOpenNewTaskModal,
  onOpenExport,
  onEditTask,
  onDeleteTask,
  onBatchDeleteTasks,
  onDuplicateTask,
  onBatchDuplicateTasks,
  onToggleTaskWeekday,
  onBatchSetWeekdays,
  onBatchToggleReminders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategoryFilter === 'all' || task.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const allFilteredSelected = filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length;

  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    soundFx.playClickBeep();
  };

  const handleSelectAllFiltered = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
    soundFx.playClickBeep();
  };

  const handleBatchDelete = () => {
    if (selectedTaskIds.length === 0) return;
    if (onBatchDeleteTasks) {
      onBatchDeleteTasks(selectedTaskIds);
    } else {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
    }
    setSelectedTaskIds([]);
    soundFx.playClickBeep();
  };

  const handleBatchDuplicate = () => {
    if (selectedTaskIds.length === 0) return;
    if (onBatchDuplicateTasks) {
      onBatchDuplicateTasks(selectedTaskIds);
    } else {
      const selected = tasks.filter((t) => selectedTaskIds.includes(t.id));
      selected.forEach((t) => onDuplicateTask(t));
    }
    setSelectedTaskIds([]);
    soundFx.playSuccessChime();
  };

  const handleBatchSetSchedule = (weekdays: number[]) => {
    if (selectedTaskIds.length === 0) return;
    if (onBatchSetWeekdays) {
      onBatchSetWeekdays(selectedTaskIds, weekdays);
    }
    soundFx.playSuccessChime();
  };

  const handleBatchToggleRemindersAction = (enabled: boolean) => {
    if (selectedTaskIds.length === 0) return;
    if (onBatchToggleReminders) {
      onBatchToggleReminders(selectedTaskIds, enabled);
    }
    soundFx.playSuccessChime();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 sm:p-6 space-y-5 transition-colors duration-200">
      
      {/* Account & Profile Card */}
      {currentUser && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:via-indigo-950/20 dark:to-slate-800/60 border border-blue-100/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={customDisplayName || currentUser.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
                {((customDisplayName || currentUser.displayName || currentUser.email || 'U'))[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {customDisplayName || currentUser.displayName || 'My Account'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                  Cloud Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            {onOpenAuthModal && (
              <button
                id="btn-manage-open-profile"
                type="button"
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Profile &amp; Cloud Status</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex-shrink-0">
              <Layers className="w-5 h-5 flex-shrink-0" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Manage Tasks & Weekday Schedules
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure working weekdays, batch update schedules, and manage all {tasks.length} master discipline items.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              soundFx.playClickBeep();
            }}
            className={`flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isMultiSelectMode || selectedTaskIds.length > 0
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <span>{isMultiSelectMode ? 'Selecting' : 'Multi-Select'}</span>
          </button>

          {onOpenExport && (
            <button
              id="btn-manage-export"
              onClick={onOpenExport}
              className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer flex-shrink-0"
              title="Export schedule to Excel, CSV, or Audit Report"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span>Export</span>
            </button>
          )}

          <button
            id="btn-manage-add-task"
            onClick={onOpenNewTaskModal}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* DOCKED MULTI-ACTIONS BAR FOR MASTER TASKS */}
      {(selectedTaskIds.length > 0 || isMultiSelectMode) && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span>{allFilteredSelected ? 'Deselect All' : 'Select All'} ({filteredTasks.length})</span>
            </button>

            {selectedTaskIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-2xs">
                {selectedTaskIds.length} Selected
              </span>
            )}
          </div>

          {/* Batch Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Set Schedule to Mon-Fri (1,2,3,4,5) */}
            <button
              onClick={() => handleBatchSetSchedule([1, 2, 3, 4, 5])}
              disabled={selectedTaskIds.length === 0}
              title="Set active weekdays to Monday through Friday"
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Set Mon-Fri</span>
            </button>

            {/* Set Schedule to Everyday (0,1,2,3,4,5,6) */}
            <button
              onClick={() => handleBatchSetSchedule([0, 1, 2, 3, 4, 5, 6])}
              disabled={selectedTaskIds.length === 0}
              title="Set active weekdays to all 7 days (Daily Habit)"
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Set Everyday</span>
            </button>

            {/* Toggle Reminders On */}
            <button
              onClick={() => handleBatchToggleRemindersAction(true)}
              disabled={selectedTaskIds.length === 0}
              title="Enable push & browser reminders for selected tasks"
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Enable Reminders</span>
            </button>

            {/* Duplicate Selected */}
            <button
              onClick={handleBatchDuplicate}
              disabled={selectedTaskIds.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Duplicate</span>
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleBatchDelete}
              disabled={selectedTaskIds.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Delete</span>
            </button>

            {selectedTaskIds.length > 0 && (
              <button
                onClick={() => setSelectedTaskIds([])}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search task names or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Filter Domain:</span>
          <select
            aria-label="Filter tasks by domain"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="all">All Fields ({tasks.length})</option>
            {categories.map((cat) => {
              const count = tasks.filter((t) => t.categoryId === cat.id).length;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredTasks.map((task) => {
          const category = categories.find((c) => c.id === task.categoryId) || categories[0];
          const isSelected = selectedTaskIds.includes(task.id);

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-400/80 dark:border-blue-500/80 shadow-xs ring-1 ring-blue-400/50'
                  : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-2xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Checkbox + Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  
                  {/* Select Checkbox */}
                  {(isMultiSelectMode || selectedTaskIds.length > 0) && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelectTask(task.id)}
                      className="mt-1 p-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex-shrink-0 cursor-pointer"
                      title={isSelected ? 'Deselect task' : 'Select task for batch operations'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-blue-100 dark:fill-blue-950/60 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      )}
                    </button>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {task.title}
                      </h4>

                      {/* Category */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${category.color}15`,
                          borderColor: `${category.color}35`,
                          color: category.color,
                        }}
                      >
                        {category.name}
                      </span>

                      {/* Priority */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        task.priority === 'high'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>

                      {task.reminderEnabled && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">
                          🔔 Reminder on
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Timings */}
                    {task.customDayTimes && Object.keys(task.customDayTimes).length > 0 ? (
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Separate Weekday Timings:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {task.activeWeekdays.map((dayIdx) => {
                            const dayMeta = WEEKDAY_LABELS[dayIdx];
                            const dayTime = task.customDayTimes?.[dayIdx] || {
                              startTime: task.defaultStartTime,
                              endTime: task.defaultEndTime,
                            };
                            return (
                              <span
                                key={dayIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-medium border border-slate-200/80 dark:border-slate-700"
                              >
                                <strong className="font-bold text-blue-700 dark:text-blue-300">{dayMeta.short}:</strong>
                                <span>{formatTime12h(dayTime.startTime)} – {formatTime12h(dayTime.endTime)}</span>
                              </span>
                            );
                          })}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                              • {task.subtasks.length} sub-steps
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          <span>{formatTime12h(task.defaultStartTime)} – {formatTime12h(task.defaultEndTime)}</span>
                        </div>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-slate-400 dark:text-slate-500">
                            • {task.subtasks.length} sub-steps
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Weekday Selector Buttons (S, M, T, W, T, F, S) */}
                <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 w-full sm:w-auto overflow-x-auto min-w-0 flex-shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Weekdays:
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {WEEKDAY_LABELS.map((day) => {
                      const isDayActive = task.activeWeekdays.includes(day.dayIndex);

                      return (
                        <button
                          key={day.dayIndex}
                          id={`toggle-task-${task.id}-day-${day.dayIndex}`}
                          aria-label={`Toggle ${day.name} for ${task.title}`}
                          onClick={() => onToggleTaskWeekday(task.id, day.dayIndex)}
                          title={`${day.name}: ${isDayActive ? 'Active' : 'Off'} (Click to toggle)`}
                          className={`w-7 h-7 rounded-lg text-xs font-extrabold transition-all flex-shrink-0 ${
                            isDayActive
                              ? 'bg-blue-600 text-white shadow-2xs scale-105 ring-1 ring-blue-500'
                              : 'bg-white dark:bg-slate-750 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {day.letter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Actions (Edit, Duplicate, Delete) */}
                <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto flex-shrink-0">
                  <button
                    id={`btn-manage-edit-${task.id}`}
                    aria-label={`Edit ${task.title}`}
                    onClick={() => onEditTask(task)}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Edit task and details"
                  >
                    <Edit3 className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button
                    id={`btn-manage-duplicate-${task.id}`}
                    aria-label={`Duplicate ${task.title}`}
                    onClick={() => onDuplicateTask(task)}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    title="Duplicate this task"
                  >
                    <Copy className="w-4 h-4 flex-shrink-0" />
                  </button>

                  <button
                    id={`btn-manage-delete-${task.id}`}
                    aria-label={`Delete ${task.title}`}
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}

        {/* Empty States */}
        {tasks.length === 0 ? (
          <div className="py-14 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 flex-shrink-0" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No tasks or routines yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Your schedule is fresh and clean. Add your first routine, habit, or workflow with custom weekday timings.
            </p>
            <button
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Your First Task</span>
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No tasks match your filter criteria.
            </p>
          </div>
        ) : null}
      </div>

    </div>
  );
};
