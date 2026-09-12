import React from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Plus, 
  Flame, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { TaskCategory, TaskDailyProgress, TaskItem, TaskPriority, TaskStatus } from '../types';
import { StatsCharts } from './StatsCharts';
import { 
  formatDateKey, 
  getDayOfWeek, 
  WEEKDAY_LABELS, 
  formatTime12h, 
  getFormattedDisplayDate,
  isCurrentTimeWithin
} from '../utils/dates';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  tasks: TaskItem[];
  progress: Record<string, TaskDailyProgress>;
  categories: TaskCategory[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onGoToChecklistTab: () => void;
  onOpenNewTaskModal: () => void;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const getTaskTiming = (task: TaskItem, dayIdx: number) => {
  const start = task.customDayTimes?.[dayIdx]?.startTime || task.defaultStartTime || '09:00';
  const end = task.customDayTimes?.[dayIdx]?.endTime || task.defaultEndTime || '10:00';
  return { start, end };
};

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  tasks,
  progress,
  categories,
  onUpdateStatus,
  onGoToChecklistTab,
  onOpenNewTaskModal,
}) => {
  const dateKey = formatDateKey(selectedYear, selectedMonth, selectedDay);
  const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, selectedDay);
  const weekdayInfo = WEEKDAY_LABELS[dayOfWeek];

  const rawTodayTasks = tasks.filter((t) => t.activeWeekdays.includes(dayOfWeek));

  // Sort today's tasks orderwise by Priority (High -> Medium -> Low), then by earliest timing schedule
  const todayTasks = [...rawTodayTasks].sort((a, b) => {
    const pWeightA = PRIORITY_WEIGHT[a.priority || 'medium'] || 2;
    const pWeightB = PRIORITY_WEIGHT[b.priority || 'medium'] || 2;
    if (pWeightB !== pWeightA) {
      return pWeightB - pWeightA; // High (3) -> Medium (2) -> Low (1)
    }

    // Secondary sort: Timing schedule (earliest start time first)
    const timeA = getTaskTiming(a, dayOfWeek);
    const timeB = getTaskTiming(b, dayOfWeek);
    return timeToMinutes(timeA.start) - timeToMinutes(timeB.start);
  });

  const handleToggleComplete = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    if (nextStatus === 'completed') {
      soundFx.playSuccessChime();
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {}
    } else {
      soundFx.playClickBeep();
    }
    onUpdateStatus(taskId, nextStatus);
  };

  // Find currently active task based on clock time
  const currentActiveTask = todayTasks.find((t) => {
    const timing = getTaskTiming(t, dayOfWeek);
    return isCurrentTimeWithin(timing.start, timing.end);
  });

  // Calculate upcoming priority tasks ordered High to Low
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const pendingTasks = todayTasks.filter(
    (t) => progress[`${t.id}_${dateKey}`]?.status !== 'completed'
  );

  // Identify upcoming schedule tasks (not yet completed, start or end in future today)
  const upcomingTasks = pendingTasks.filter((t) => {
    const timing = getTaskTiming(t, dayOfWeek);
    return timeToMinutes(timing.end) >= currentMinutes;
  });

  // Top candidate for Current Priority: Active now, or top upcoming by priority High -> Low, or first pending
  const topPriorityTask = currentActiveTask || upcomingTasks[0] || pendingTasks[0] || todayTasks[0];
  const otherUpcomingTasks = (upcomingTasks.length > 0 ? upcomingTasks : pendingTasks)
    .filter((t) => t.id !== topPriorityTask?.id)
    .slice(0, 3);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      
      {/* Welcome & Context Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-2xl text-white p-5 sm:p-7 shadow-md relative overflow-hidden w-full min-w-0">
        {/* Background Decorative Circles */}
        <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-36 -top-12 w-32 h-32 rounded-full bg-cyan-400/15 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs border border-white/20 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PLANVEXA Productivity Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
              {getFormattedDisplayDate(selectedYear, selectedMonth, selectedDay)}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              You have {todayTasks.length} scheduled work and habit items planned for this {weekdayInfo.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap w-full sm:w-auto">
            <button
              id="btn-dash-quick-checklist"
              onClick={onGoToChecklistTab}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Day Checklist</span>
            </button>
            <button
              id="btn-dash-add-task"
              onClick={onOpenNewTaskModal}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all backdrop-blur-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Charts & Streaks Suite */}
      <StatsCharts
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedDay={selectedDay}
        tasks={tasks}
        progress={progress}
        categories={categories}
      />

      {/* Two-Column Section: Active Focus Card & Today's Checklist Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* Left Column (2 cols): Today's Active Schedule & Interactive Quick-Checklist */}
        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 sm:p-6 space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Today's Priority Checklist ({weekdayInfo.letter})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly check off tasks in real time with audio chime and status tracking
              </p>
            </div>
            <button
              onClick={onGoToChecklistTab}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 group flex-shrink-0"
            >
              <span>View Full Checklist</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayTasks.map((task) => {
              const taskProg = progress[`${task.id}_${dateKey}`];
              const status: TaskStatus = taskProg?.status || 'pending';
              const isCompleted = status === 'completed';
              const category = categories.find((c) => c.id === task.categoryId) || categories[0];
              const timing = getTaskTiming(task, dayOfWeek);
              const startTime = timing.start;
              const endTime = timing.end;
              const taskPriority = task.priority || 'medium';

              return (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/70 dark:hover:bg-slate-800/60 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      id={`dash-check-${task.id}`}
                      aria-label={`Mark ${task.title} complete`}
                      onClick={() => handleToggleComplete(task.id, status)}
                      className="focus:outline-none transition-transform active:scale-90 flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-500 flex-shrink-0" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`block text-xs font-bold truncate ${
                          isCompleted ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {task.title}
                        </span>
                        {/* Priority Badge High to Low */}
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border flex-shrink-0 ${
                          taskPriority === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                            : taskPriority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {taskPriority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span
                          className="font-bold text-[10px] flex-shrink-0"
                          style={{ color: category.color }}
                        >
                          {category.name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          {formatTime12h(startTime)} - {formatTime12h(endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : status === 'in-progress'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              );
            })}

            {todayTasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No tasks scheduled for this day of the week.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Current Priority Block & Upcoming Schedules */}
        <div className="space-y-4 min-w-0">
          {/* Active Now or Current Priority Focus Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                {currentActiveTask ? '⚡ Active Now' : 'Current Priority'}
              </span>
              {topPriorityTask && (
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  topPriorityTask.priority === 'high'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : topPriorityTask.priority === 'medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                }`}>
                  {topPriorityTask.priority || 'medium'} priority
                </span>
              )}
            </div>

            {topPriorityTask ? (
              (() => {
                const timing = getTaskTiming(topPriorityTask, dayOfWeek);
                const isCompleted = progress[`${topPriorityTask.id}_${dateKey}`]?.status === 'completed';
                const cat = categories.find((c) => c.id === topPriorityTask.categoryId) || categories[0];

                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[11px] font-semibold text-slate-300">
                        {cat.name}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-white">
                      {topPriorityTask.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {topPriorityTask.description || 'Upcoming scheduled focus block ranked by priority.'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <span className="font-medium text-slate-200">
                        {formatTime12h(timing.start)} - {formatTime12h(timing.end)}
                      </span>
                      <button
                        onClick={() => handleToggleComplete(topPriorityTask.id, isCompleted ? 'completed' : 'pending')}
                        className={`font-bold transition-colors cursor-pointer ${
                          isCompleted
                            ? 'text-slate-400 hover:text-slate-300'
                            : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {isCompleted ? 'Completed ✓' : 'Mark Done ✓'}
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : todayTasks.length > 0 ? (
              <div className="py-4 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All priority tasks for today completed!</span>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400">
                No active tasks scheduled right now. Use + New Task to set your schedule.
              </div>
            )}
          </div>

          {/* Upcoming Priority Queue (Orderwise High to Low) */}
          {otherUpcomingTasks.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Upcoming Timing Queue
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  High to Low
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {otherUpcomingTasks.map((t) => {
                  const timing = getTaskTiming(t, dayOfWeek);
                  const pLevel = t.priority || 'medium';
                  const cat = categories.find((c) => c.id === t.categoryId) || categories[0];
                  return (
                    <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span style={{ color: cat.color }} className="font-bold truncate max-w-[80px]">
                            {cat.name}
                          </span>
                          <span>•</span>
                          <span>{formatTime12h(timing.start)}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${
                        pLevel === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                          : pLevel === 'medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        {pLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Streak Booster Callout */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Flame className="w-5 h-5 fill-amber-500/20 stroke-[2.2] flex-shrink-0" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Streak Multiplier Active
              </h5>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Complete at least 80% of today's scheduled weekday items to maintain your consecutive consistency score.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
