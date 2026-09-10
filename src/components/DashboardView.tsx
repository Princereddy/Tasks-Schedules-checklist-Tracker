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
import { TaskCategory, TaskDailyProgress, TaskItem, TaskStatus } from '../types';
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

  const todayTasks = tasks.filter((t) => t.activeWeekdays.includes(dayOfWeek));

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
    const start = t.customDayTimes?.[dayOfWeek]?.startTime || t.defaultStartTime;
    const end = t.customDayTimes?.[dayOfWeek]?.endTime || t.defaultEndTime;
    return isCurrentTimeWithin(start, end);
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome & Context Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-2xl text-white p-6 sm:p-7 shadow-md relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-36 -top-12 w-32 h-32 rounded-full bg-cyan-400/15 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs border border-white/20 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Productivity Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {getFormattedDisplayDate(selectedYear, selectedMonth, selectedDay)}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              You have {todayTasks.length} scheduled work and habit items planned for this {weekdayInfo.name}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-dash-quick-checklist"
              onClick={onGoToChecklistTab}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 transition-all shadow-sm active:scale-95"
            >
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>Day Checklist</span>
            </button>
            <button
              id="btn-dash-add-task"
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 transition-all backdrop-blur-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Today's Active Schedule & Interactive Quick-Checklist */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 sm:p-6 space-y-4 transition-colors duration-200">
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
            {todayTasks.slice(0, 5).map((task) => {
              const taskProg = progress[`${task.id}_${dateKey}`];
              const status: TaskStatus = taskProg?.status || 'pending';
              const isCompleted = status === 'completed';
              const category = categories.find((c) => c.id === task.categoryId) || categories[0];
              const startTime = task.customDayTimes?.[dayOfWeek]?.startTime || task.defaultStartTime;
              const endTime = task.customDayTimes?.[dayOfWeek]?.endTime || task.defaultEndTime;

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
                      <span className={`block text-xs font-bold truncate ${
                        isCompleted ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {task.title}
                      </span>
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
                          {formatTime12h(startTime)}
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

        {/* Right Column (1 col): Current Focus Block & Quick Tips */}
        <div className="space-y-4">
          {/* Active Now or Next Focus Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                {currentActiveTask ? 'Now in Progress' : 'Current Priority'}
              </span>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                MS Fluent Focus
              </span>
            </div>

            {currentActiveTask ? (
              <div>
                <h4 className="font-bold text-base text-white">
                  {currentActiveTask.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {currentActiveTask.description || 'Focus block running on your scheduled timeline.'}
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>
                    {formatTime12h(currentActiveTask.defaultStartTime)} - {formatTime12h(currentActiveTask.defaultEndTime)}
                  </span>
                  <button
                    onClick={() => handleToggleComplete(currentActiveTask.id, 'pending')}
                    className="font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Finish Now ✓
                  </button>
                </div>
              </div>
            ) : todayTasks.length > 0 ? (
              <div>
                <h4 className="font-bold text-base text-white">
                  {todayTasks[0].title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  Scheduled for {formatTime12h(todayTasks[0].defaultStartTime)}. Stay focused and consistent!
                </p>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>Starts at {formatTime12h(todayTasks[0].defaultStartTime)}</span>
                  <span className="text-cyan-400 font-bold">Upcoming</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400">
                No active tasks scheduled right now. Use + New Task to set your schedule.
              </div>
            )}
          </div>

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
