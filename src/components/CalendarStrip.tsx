import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { 
  getDaysInMonth, 
  getDayOfWeek, 
  WEEKDAY_LABELS, 
  MONTH_NAMES, 
  formatDateKey, 
  getTodayDateParts,
  getFormattedDisplayDate
} from '../utils/dates';
import { TaskDailyProgress, TaskItem } from '../types';

interface CalendarStripProps {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  tasks: TaskItem[];
  progress: Record<string, TaskDailyProgress>;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  tasks,
  progress,
}) => {
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const today = getTodayDateParts();
  const isCurrentMonthThisYear = today.year === selectedYear && today.monthIndex === selectedMonth;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active day into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`[data-day="${selectedDay}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  // Calculate stats for each day to render micro completion dots
  const getDayCompletionSummary = (day: number) => {
    const dateKey = formatDateKey(selectedYear, selectedMonth, day);
    const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, day);

    // Active tasks scheduled on this weekday
    const scheduled = tasks.filter((t) => t.activeWeekdays.includes(dayOfWeek));
    if (scheduled.length === 0) return { total: 0, completed: 0, percent: 0 };

    let completed = 0;
    scheduled.forEach((task) => {
      const record = progress[`${task.id}_${dateKey}`];
      if (record && record.status === 'completed') {
        completed++;
      }
    });

    return {
      total: scheduled.length,
      completed,
      percent: Math.round((completed / scheduled.length) * 100),
    };
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-2xs py-2 sm:py-3 px-3 sm:px-6 lg:px-8 transition-colors duration-200 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5 sm:gap-2 w-full min-w-0">
        
        {/* Strip Top Row: Current month navigation and formatted date */}
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <CalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
              <h2 className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight flex-shrink-0">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:inline sm:inline">
                • {getFormattedDisplayDate(selectedYear, selectedMonth, selectedDay)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              id="btn-prev-month"
              aria-label="Previous month"
              onClick={onPrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all flex-shrink-0"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            </button>
            <button
              id="btn-next-month"
              aria-label="Next month"
              onClick={onNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all flex-shrink-0"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Days of Month Horizontal Scrubber with improved touch sizing and no cropping */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 px-1.5 no-scrollbar scroll-smooth w-full max-w-full min-w-0"
        >
          {daysArray.map((day) => {
            const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, day);
            const weekdayInfo = WEEKDAY_LABELS[dayOfWeek];
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSelected = selectedDay === day;
            const isToday = isCurrentMonthThisYear && today.day === day;
            const summary = getDayCompletionSummary(day);

            return (
              <button
                key={day}
                data-day={day}
                id={`calendar-day-${day}`}
                onClick={() => onSelectDay(day)}
                className={`flex-shrink-0 flex flex-col items-center justify-between min-w-[46px] sm:min-w-[56px] py-1.5 sm:py-2 px-1 sm:px-1.5 rounded-xl border transition-all text-center group cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40 scale-102 z-10'
                    : isToday
                    ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold'
                    : isWeekend
                    ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                    : 'bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={`Day ${day}, ${weekdayInfo.name} (${summary.completed}/${summary.total} completed)`}
              >
                {/* Weekday initial */}
                <span className={`text-[10px] font-bold tracking-tight uppercase ${
                  isSelected ? 'text-blue-100' : isWeekend ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {weekdayInfo.letter}
                </span>

                {/* Day number */}
                <span className={`text-sm sm:text-base font-black my-0.5 ${
                  isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {day}
                </span>

                {/* Micro completion indicator dots */}
                <div className="flex items-center gap-0.5 h-1.5 mt-0.5">
                  {summary.total === 0 ? (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-300/40' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  ) : summary.percent === 100 ? (
                    <span className={`w-2 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300 ring-1 ring-white' : 'bg-emerald-500 dark:bg-emerald-400'}`} />
                  ) : summary.completed > 0 ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500 dark:bg-amber-400'}`} />
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
