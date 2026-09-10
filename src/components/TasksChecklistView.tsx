import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Sparkles,
  AlertCircle,
  Filter,
  Check,
  CheckCheck,
  RotateCcw,
  ListChecks,
  Square,
  CheckSquare,
  Play
} from 'lucide-react';
import { TaskCategory, TaskDailyProgress, TaskItem, TaskStatus } from '../types';
import { formatTime12h, getDayOfWeek, WEEKDAY_LABELS, formatDateKey } from '../utils/dates';
import { soundFx } from '../utils/audio';

interface TasksChecklistViewProps {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  tasks: TaskItem[];
  progress: Record<string, TaskDailyProgress>;
  categories: TaskCategory[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onBatchUpdateStatus?: (taskIds: string[], status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onBatchDeleteTasks?: (taskIds: string[]) => void;
  onDuplicateTask: (task: TaskItem) => void;
  onOpenNewTaskModal: () => void;
}

export const TasksChecklistView: React.FC<TasksChecklistViewProps> = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  tasks,
  progress,
  categories,
  onUpdateStatus,
  onBatchUpdateStatus,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  onBatchDeleteTasks,
  onDuplicateTask,
  onOpenNewTaskModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Multi-Action Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);

  const dateKey = formatDateKey(selectedYear, selectedMonth, selectedDay);
  const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, selectedDay);
  const currentWeekday = WEEKDAY_LABELS[dayOfWeek];

  // Filter tasks that run on this weekday
  const activeTasksToday = tasks.filter((t) => t.activeWeekdays.includes(dayOfWeek));

  // Sort tasks chronologically by start time
  const sortedTasks = [...activeTasksToday].sort((a, b) => {
    const timeA = a.customDayTimes?.[dayOfWeek]?.startTime || a.defaultStartTime || '00:00';
    const timeB = b.customDayTimes?.[dayOfWeek]?.startTime || b.defaultStartTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  // Apply filters
  const filteredTasks = sortedTasks.filter((task) => {
    const taskProg = progress[`${task.id}_${dateKey}`];
    const status = taskProg?.status || 'pending';

    if (filterStatus !== 'all' && status !== filterStatus) return false;
    if (filterCategory !== 'all' && task.categoryId !== filterCategory) return false;
    return true;
  });

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleToggleComplete = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    if (nextStatus === 'completed') {
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0078D4', '#107C41', '#5C2D91', '#D83B01', '#FFB900'],
        });
      } catch {
        // Safe in iframes
      }
    } else {
      soundFx.playClickBeep();
    }

    onUpdateStatus(taskId, nextStatus);
  };

  // --- Multi-Action Handlers ---
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

  const handleBatchStatusChange = (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;

    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(selectedTaskIds, status);
    } else {
      selectedTaskIds.forEach((id) => onUpdateStatus(id, status));
    }

    if (status === 'completed') {
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0078D4', '#107C41', '#5C2D91', '#D83B01', '#FFB900'],
        });
      } catch {
        // safe
      }
    } else {
      soundFx.playClickBeep();
    }

    // Keep selection or clear based on preference
    setSelectedTaskIds([]);
  };

  const handleBatchDelete = () => {
    if (selectedTaskIds.length === 0) return;
    
    if (onBatchDeleteTasks) {
      onBatchDeleteTasks(selectedTaskIds);
    } else {
      selectedTaskIds.forEach((id) => onDeleteTask(id));
    }
    soundFx.playClickBeep();
    setSelectedTaskIds([]);
  };

  // Quick Whole-Day Batch Actions
  const handleQuickCompleteAllToday = () => {
    const ids = filteredTasks.map((t) => t.id);
    if (ids.length === 0) return;

    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(ids, 'completed');
    } else {
      ids.forEach((id) => onUpdateStatus(id, 'completed'));
    }

    soundFx.playSuccessChime();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0078D4', '#107C41', '#5C2D91', '#D83B01', '#FFB900'],
      });
    } catch {
      // safe
    }
  };

  const handleQuickResetAllToday = () => {
    const ids = filteredTasks.map((t) => t.id);
    if (ids.length === 0) return;

    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(ids, 'pending');
    } else {
      ids.forEach((id) => onUpdateStatus(id, 'pending'));
    }
    soundFx.playClickBeep();
  };

  const completedCount = filteredTasks.filter(
    (t) => progress[`${t.id}_${dateKey}`]?.status === 'completed'
  ).length;

  const allFilteredSelected = filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 sm:p-6 space-y-4 transition-colors duration-200 relative">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Day Schedule & Task Checklist
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {currentWeekday.name}s ({currentWeekday.letter})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tracking {activeTasksToday.length} scheduled work & habit items for {dateKey}
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Bulk Multi-Action Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              id="btn-quick-complete-all"
              onClick={handleQuickCompleteAllToday}
              title="Complete all scheduled items for today in one click"
              className="px-2.5 py-1 rounded-md text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Complete All</span>
            </button>

            <button
              id="btn-quick-reset-all"
              onClick={handleQuickResetAllToday}
              title="Reset all items to pending for today"
              className="px-2 py-1 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              id="btn-toggle-multi-select"
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                soundFx.playClickBeep();
              }}
              title="Toggle Multi-Select Mode"
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                isMultiSelectMode || selectedTaskIds.length > 0
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{isMultiSelectMode ? 'Selecting' : 'Multi-Select'}</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              id="filter-status-select"
              aria-label="Filter tasks by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Statuses</option>
              <option value="pending" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Pending</option>
              <option value="in-progress" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">In Progress</option>
              <option value="completed" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Completed</option>
              <option value="skipped" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Skipped</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs">
            <select
              id="filter-category-select"
              aria-label="Filter tasks by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Disciplines</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-add-task-checklist"
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs active:scale-95 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* DOCKED MULTI-ACTIONS BAR (Appears when items are selected or in multi-select mode) */}
      {(selectedTaskIds.length > 0 || isMultiSelectMode) && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex flex-wrap items-center justify-between gap-2.5 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
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

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleBatchStatusChange('completed')}
              disabled={selectedTaskIds.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Mark Completed</span>
            </button>

            <button
              onClick={() => handleBatchStatusChange('in-progress')}
              disabled={selectedTaskIds.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 flex-shrink-0 fill-current" />
              <span>In Progress</span>
            </button>

            <button
              onClick={() => handleBatchStatusChange('pending')}
              disabled={selectedTaskIds.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 flex-shrink-0" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleBatchDelete}
              disabled={selectedTaskIds.length === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Delete</span>
            </button>

            {selectedTaskIds.length > 0 && (
              <button
                onClick={() => setSelectedTaskIds([])}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Task Checklist Items */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredTasks.map((task) => {
          const taskProg = progress[`${task.id}_${dateKey}`];
          const status: TaskStatus = taskProg?.status || 'pending';
          const isCompleted = status === 'completed';
          const category = categories.find((c) => c.id === task.categoryId) || categories[0];
          const isSelected = selectedTaskIds.includes(task.id);

          // Determine time for this day
          const startTime = task.customDayTimes?.[dayOfWeek]?.startTime || task.defaultStartTime;
          const endTime = task.customDayTimes?.[dayOfWeek]?.endTime || task.defaultEndTime;
          const hasSubtasks = task.subtasks && task.subtasks.length > 0;
          const isExpanded = !!expandedTasks[task.id];

          // Count completed subtasks
          const completedSubIds = taskProg?.completedSubtasks || [];
          const subDoneCount = task.subtasks?.filter(s => completedSubIds.includes(s.id) || s.completed).length || 0;

          return (
            <div
              key={task.id}
              className={`py-3 px-2.5 sm:px-3 rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-400/60 dark:ring-blue-500/50 shadow-2xs'
                  : isCompleted
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 opacity-90'
                  : status === 'in-progress'
                  ? 'bg-blue-50/40 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 shadow-2xs'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                
                {/* Left controls: Multi-select checkbox + single complete button + details */}
                <div className="flex items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
                  
                  {/* Multi-Select Checkbox */}
                  {(isMultiSelectMode || selectedTaskIds.length > 0) && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelectTask(task.id)}
                      className="mt-1 p-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex-shrink-0 cursor-pointer"
                      title={isSelected ? 'Deselect task' : 'Select task for batch actions'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-blue-100 dark:fill-blue-950/60 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      )}
                    </button>
                  )}

                  {/* Interactive Status Toggle Checkbox */}
                  <button
                    id={`toggle-task-${task.id}`}
                    aria-label={`Toggle completion for ${task.title}`}
                    onClick={() => handleToggleComplete(task.id, status)}
                    className={`mt-0.5 p-1 -m-1 flex-shrink-0 transition-transform active:scale-90 focus:outline-none rounded-full cursor-pointer ${
                      isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600 hover:text-blue-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 fill-emerald-100 dark:fill-emerald-950/60 stroke-[2.2] flex-shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 stroke-[1.8] flex-shrink-0" />
                    )}
                  </button>

                  {/* Task details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4
                        className={`text-xs sm:text-sm font-bold tracking-tight transition-all break-words ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500 font-medium'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Category Badge */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0"
                        style={{
                          backgroundColor: `${category.color}15`,
                          borderColor: `${category.color}40`,
                          color: category.color,
                        }}
                      >
                        {category.name}
                      </span>

                      {/* Priority Tag */}
                      {task.priority === 'high' && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex-shrink-0">
                          High
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info: Time, Status, Subtasks */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {/* Scheduled Time slot */}
                      <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] sm:text-xs flex-shrink-0">
                        <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <span>
                          {formatTime12h(startTime)} - {formatTime12h(endTime)}
                        </span>
                      </div>

                      {/* Subtasks summary trigger */}
                      {hasSubtasks && (
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[11px] sm:text-xs flex-shrink-0"
                        >
                          <span>
                            {subDoneCount}/{task.subtasks?.length} steps
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                          )}
                        </button>
                      )}

                      {/* Status selector */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <select
                          id={`status-select-${task.id}`}
                          aria-label={`Change status for ${task.title}`}
                          value={status}
                          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                          className={`text-[10px] sm:text-[11px] font-bold rounded-md px-1.5 py-0.5 border cursor-pointer focus:outline-none ${
                            status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : status === 'in-progress'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : status === 'skipped'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="pending" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Pending</option>
                          <option value="in-progress" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">In Progress</option>
                          <option value="completed" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Completed</option>
                          <option value="skipped" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Skipped</option>
                        </select>
                      </div>

                      {/* Multi-action quick select chip if not in multi-select mode */}
                      {!isMultiSelectMode && selectedTaskIds.length === 0 && (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectTask(task.id)}
                          className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                          title="Select for batch actions"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Select</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Menu */}
                <div className="relative flex-shrink-0">
                  <button
                    id={`menu-task-${task.id}`}
                    aria-label={`Options for ${task.title}`}
                    onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex-shrink-0"
                  >
                    <MoreVertical className="w-4 h-4 flex-shrink-0" />
                  </button>

                  {/* Backdrop for click-outside */}
                  {activeMenuTaskId === task.id && (
                    <div 
                      className="fixed inset-0 z-20 cursor-default" 
                      onClick={() => setActiveMenuTaskId(null)} 
                    />
                  )}

                  {/* Dropdown Menu */}
                  {activeMenuTaskId === task.id && (
                    <div className="absolute right-0 top-8 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-scale-up text-xs">
                      <button
                        onClick={() => {
                          setActiveMenuTaskId(null);
                          onEditTask(task);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Edit Task</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuTaskId(null);
                          onDuplicateTask(task);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Duplicate</span>
                      </button>
                      <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-1" />
                      <button
                        onClick={() => {
                          setActiveMenuTaskId(null);
                          onDeleteTask(task.id);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span>Delete Task</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Subtasks Accordion */}
              {hasSubtasks && isExpanded && (
                <div className="mt-2.5 pl-8 sm:pl-9 pr-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Checklist Sub-steps:
                  </span>
                  {task.subtasks?.map((sub) => {
                    const isSubDone = completedSubIds.includes(sub.id) || sub.completed;
                    return (
                      <label
                        key={sub.id}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer group py-0.5"
                      >
                        <input
                          type="checkbox"
                          checked={isSubDone}
                          onChange={() => onToggleSubtask(task.id, sub.id)}
                          className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer flex-shrink-0"
                        />
                        <span className={isSubDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}>
                          {sub.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 flex-shrink-0" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              No tasks scheduled for {currentWeekday.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              None of your active tasks are set for this weekday or match the selected filters.
            </p>
            <button
              id="btn-empty-add-task"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
              <span>Schedule New Task for {currentWeekday.short}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {filteredTasks.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>Select multiple tasks to execute batch actions or click "Complete All" for 1-click mastery</span>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {completedCount} of {filteredTasks.length} Completed ({filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0}%)
          </span>
        </div>
      )}

    </div>
  );
};
