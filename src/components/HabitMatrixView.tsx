import React from 'react';
import { 
  Check, 
  Grid3X3, 
  Sparkles, 
  Clock, 
  Calendar 
} from 'lucide-react';
import { TaskCategory, TaskDailyProgress, TaskItem, TaskStatus } from '../types';
import { 
  getDaysInMonth, 
  getDayOfWeek, 
  WEEKDAY_LABELS, 
  MONTH_NAMES, 
  formatDateKey, 
  formatTime12h 
} from '../utils/dates';
import { soundFx } from '../utils/audio';

interface HabitMatrixViewProps {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  tasks: TaskItem[];
  progress: Record<string, TaskDailyProgress>;
  categories: TaskCategory[];
  onSelectDay: (day: number) => void;
  onUpdateStatusForDate: (taskId: string, dateKey: string, status: TaskStatus) => void;
}

export const HabitMatrixView: React.FC<HabitMatrixViewProps> = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  tasks,
  progress,
  categories,
  onSelectDay,
  onUpdateStatusForDate,
}) => {
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleCellClick = (taskId: string, day: number, isScheduled: boolean, currentStatus: TaskStatus) => {
    if (!isScheduled) return;
    const dateKey = formatDateKey(selectedYear, selectedMonth, day);
    const nextStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    if (nextStatus === 'completed') {
      soundFx.playSuccessChime();
    } else {
      soundFx.playClickBeep();
    }

    onUpdateStatusForDate(taskId, dateKey, nextStatus);
  };

  // Calculate row completion rates
  const getTaskMonthCompletionRate = (task: TaskItem) => {
    let scheduledDays = 0;
    let completedDays = 0;

    daysArray.forEach((day) => {
      const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, day);
      if (task.activeWeekdays.includes(dayOfWeek)) {
        scheduledDays++;
        const dateKey = formatDateKey(selectedYear, selectedMonth, day);
        if (progress[`${task.id}_${dateKey}`]?.status === 'completed') {
          completedDays++;
        }
      }
    });

    if (scheduledDays === 0) return 0;
    return Math.round((completedDays / scheduledDays) * 100);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-3 sm:p-6 overflow-hidden transition-colors duration-200 w-full max-w-full min-w-0">
      
      {/* Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
              <Grid3X3 className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Monthly Habit &amp; Task Consistency Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Spreadsheet matrix for {MONTH_NAMES[selectedMonth]} {selectedYear}. Tap cell to toggle.
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-x-auto max-w-full">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              ✓
            </span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex-shrink-0" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-3 h-3 text-slate-300 dark:text-slate-600 text-center font-bold flex-shrink-0">
              –
            </span>
            <span>Rest Day</span>
          </div>
        </div>
      </div>

      {/* Responsive Matrix Grid Table with Horizontal Touch Scroll */}
      <div className="mt-4 overflow-x-auto pb-4 max-w-full touch-pan-x">
        <table className="w-full border-collapse text-left min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 w-64 sticky left-0 bg-slate-50/95 dark:bg-slate-800/95 z-10">
                Task / Habit Name
              </th>
              <th className="py-2.5 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 w-24 text-center">
                Schedule
              </th>
              
              {/* Columns for days 1..31 */}
              {daysArray.map((day) => {
                const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSelected = selectedDay === day;

                return (
                  <th
                    key={day}
                    onClick={() => onSelectDay(day)}
                    className={`py-1.5 px-1 text-center cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100/90 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 font-bold'
                        : isWeekend
                        ? 'bg-slate-100/60 dark:bg-slate-800/40 text-rose-500 dark:text-rose-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                    title={`Day ${day} (${WEEKDAY_LABELS[dayOfWeek].name}) - Click to inspect day`}
                  >
                    <span className="block text-[10px] font-bold uppercase">
                      {WEEKDAY_LABELS[dayOfWeek].letter}
                    </span>
                    <span className="block text-xs font-black">
                      {day}
                    </span>
                  </th>
                );
              })}

              <th className="py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 w-24 text-center">
                Month Rate
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.length === 0 && (
              <tr>
                <td colSpan={daysInMonth + 2} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No habits or tasks configured yet. Add your first routine in the Checklist or Manage tab to track your monthly habit grid.
                </td>
              </tr>
            )}
            {tasks.map((task) => {
              const category = categories.find((c) => c.id === task.categoryId) || categories[0];
              const monthRate = getTaskMonthCompletionRate(task);

              return (
                <tr key={task.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                  
                  {/* Task Name & Category (Sticky Left) */}
                  <td className="py-3 px-3 sticky left-0 bg-white/95 dark:bg-slate-900/95 z-10 border-r border-slate-100 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={task.title}>
                          {task.title}
                        </span>
                        <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                          {category.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Scheduled Timing */}
                  <td className="py-3 px-2 text-center text-[11px] text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span>{formatTime12h(task.defaultStartTime)}</span>
                    </div>
                  </td>

                  {/* Days 1..31 cells */}
                  {daysArray.map((day) => {
                    const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, day);
                    const isScheduled = task.activeWeekdays.includes(dayOfWeek);
                    const dateKey = formatDateKey(selectedYear, selectedMonth, day);
                    const taskProg = progress[`${task.id}_${dateKey}`];
                    const status: TaskStatus = taskProg?.status || 'pending';
                    const isCompleted = status === 'completed';
                    const isSelected = selectedDay === day;

                    return (
                      <td
                        key={day}
                        onClick={() => handleCellClick(task.id, day, isScheduled, status)}
                        className={`py-2 px-0.5 text-center transition-all select-none ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/30' : ''
                        } ${isScheduled ? 'cursor-pointer hover:bg-blue-50/80 dark:hover:bg-blue-900/30' : 'opacity-25 cursor-default'}`}
                        title={
                          isScheduled
                            ? `${task.title} - Day ${day}: ${status.toUpperCase()} (Click to toggle)`
                            : `Not scheduled on ${WEEKDAY_LABELS[dayOfWeek].name}s`
                        }
                      >
                        {isScheduled ? (
                          <div className="flex items-center justify-center">
                            {isCompleted ? (
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs transition-transform active:scale-90 flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3] flex-shrink-0" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0" />
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">–</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Completion Rate % */}
                  <td className="py-3 px-3 text-center border-l border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-xs font-bold ${
                        monthRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : monthRate >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {monthRate}%
                      </span>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <span>Quick checkmark: Click any circular cell to record habit completion for that date.</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span>Click any column header to switch active day</span>
        </div>
      </div>

    </div>
  );
};
