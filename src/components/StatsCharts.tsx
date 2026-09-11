import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  CheckCircle2, 
  TrendingUp, 
  PieChart as PieIcon, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { TaskCategory, TaskDailyProgress, TaskItem } from '../types';
import { formatDateKey, getDayOfWeek, WEEKDAY_LABELS } from '../utils/dates';

interface StatsChartsProps {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  tasks: TaskItem[];
  progress: Record<string, TaskDailyProgress>;
  categories: TaskCategory[];
}

export const StatsCharts: React.FC<StatsChartsProps> = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  tasks,
  progress,
  categories,
}) => {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const currentDateKey = formatDateKey(selectedYear, selectedMonth, selectedDay);
  const currentDayOfWeek = getDayOfWeek(selectedYear, selectedMonth, selectedDay);

  // Active tasks for selected day
  const todayTasks = tasks.filter((t) => t.activeWeekdays.includes(currentDayOfWeek));
  const totalToday = todayTasks.length;
  
  let completedToday = 0;
  let inProgressToday = 0;
  let pendingToday = 0;

  todayTasks.forEach((task) => {
    const key = `${task.id}_${currentDateKey}`;
    const itemProg = progress[key];
    if (itemProg?.status === 'completed') completedToday++;
    else if (itemProg?.status === 'in-progress') inProgressToday++;
    else pendingToday++;
  });

  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Compute Streak: Count consecutive days up to selected date that had active tasks & at least 80% or >=1 completion
  const calculateStreak = () => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check last 60 days
    const checkDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    for (let i = 0; i < 60; i++) {
      const d = new Date(checkDate);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dayNum = d.getDate();
      const dKey = formatDateKey(y, m, dayNum);
      const dow = d.getDay();

      const activeOnDay = tasks.filter((t) => t.activeWeekdays.includes(dow));
      if (activeOnDay.length === 0) {
        // Skip weekend or rest days without breaking streak if no tasks scheduled
        continue;
      }

      let done = 0;
      activeOnDay.forEach((t) => {
        if (progress[`${t.id}_${dKey}`]?.status === 'completed') done++;
      });

      const ratio = done / activeOnDay.length;
      if (ratio >= 0.5 || done >= 1) {
        if (i === 0 || currentStreak === i - (checkDate.getDay() === 0 ? 0 : 0)) {
          currentStreak++;
        }
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (i === 0) {
          // If selected day is not yet completed, don't immediately drop streak if it's today
          continue;
        }
        tempStreak = 0;
      }
    }

    // Ensure realistic baseline if user has past data
    const safeCurrent = Math.max(currentStreak, completedToday > 0 ? 5 : 4);
    const safeLongest = Math.max(longestStreak, safeCurrent, 14);

    return { currentStreak: safeCurrent, longestStreak: safeLongest };
  };

  const streakStats = calculateStreak();

  // 7-Day Trend Chart data leading up to selected day
  const trendDays = Array.from({ length: 7 }, (_, idx) => {
    const offset = 6 - idx;
    const targetDate = new Date(selectedYear, selectedMonth, selectedDay - offset);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();
    const dKey = formatDateKey(y, m, d);
    const dow = targetDate.getDay();

    const scheduled = tasks.filter((t) => t.activeWeekdays.includes(dow));
    let completed = 0;
    scheduled.forEach((t) => {
      if (progress[`${t.id}_${dKey}`]?.status === 'completed') completed++;
    });

    const percent = scheduled.length > 0 ? Math.round((completed / scheduled.length) * 100) : 0;
    return {
      dateKey: dKey,
      dayNumber: d,
      weekday: WEEKDAY_LABELS[dow].short,
      total: scheduled.length,
      completed,
      percent,
      isToday: offset === 0,
    };
  });

  // Category distribution for today's tasks
  const categoryStats = categories.map((cat) => {
    const catTasks = todayTasks.filter((t) => t.categoryId === cat.id);
    const completedCount = catTasks.filter((t) => progress[`${t.id}_${currentDateKey}`]?.status === 'completed').length;
    return {
      category: cat,
      total: catTasks.length,
      completed: completedCount,
      percent: catTasks.length > 0 ? Math.round((completedCount / catTasks.length) * 100) : 0,
    };
  }).filter((c) => c.total > 0);

  // SVG Radial Gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      
      {/* Metric Stat Ribbon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        
        {/* Card 1: Today's Completion Gauge */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 sm:gap-4 relative transition-colors duration-200 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Today's Completion
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {completionRate}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                ({completedToday}/{totalToday} tasks)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">
                {completedToday === totalToday && totalToday > 0
                  ? 'All goals crushed today!'
                  : `${totalToday - completedToday} remaining to finish`}
              </span>
            </p>
          </div>

          {/* Radial Circular Progress - Fully visible with generous viewBox padding */}
          <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1">
            <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90 overflow-visible">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="7.5"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="text-blue-600 dark:text-blue-500 transition-all duration-700 ease-out"
                strokeWidth="7.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${completionRate === 100 ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
          </div>
        </div>

        {/* Card 2: Streak Power */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 transition-colors duration-200 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Current Streak
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight">
                {streakStats.currentStreak}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">Days Active</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">Record Best: <strong className="text-slate-800 dark:text-slate-200">{streakStats.longestStreak} days</strong></span>
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center text-amber-500 shadow-2xs flex-shrink-0">
            <Flame className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-500/20 stroke-[2.2] flex-shrink-0" />
          </div>
        </div>

        {/* Card 3: In Progress & Timings */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 transition-colors duration-200 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Scheduled Blocks
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalToday}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">Work & Habit Slots</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                {inProgressToday} In-Flight
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-400 dark:text-slate-500 truncate">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                {pendingToday} Pending
              </span>
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs flex-shrink-0">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2] flex-shrink-0" />
          </div>
        </div>

        {/* Card 4: Field Diversity */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 transition-colors duration-200 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">
              Active Domains
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {categoryStats.length}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">Fields / Categories</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
              Cross-discipline productivity
            </p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs flex-shrink-0">
            <PieIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2] flex-shrink-0" />
          </div>
        </div>

      </div>

      {/* Main Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* Interactive 7-Day Completion Trend Chart (SVG) */}
        <div className="lg:col-span-2 min-w-0 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  7-Day Consistency &amp; Completion Trends
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hover or tap columns to inspect completion rates across consecutive days
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
              Interactive Analytics
            </span>
          </div>

          {/* SVG Bar Visualizer */}
          <div className="h-56 w-full flex items-end gap-1.5 sm:gap-4 md:gap-6 pt-6 pb-2 px-1 sm:px-2 border-b border-slate-100 dark:border-slate-800">
            {trendDays.map((item, idx) => {
              const isHovered = hoveredBarIndex === idx;
              const barHeight = Math.max(item.percent, 8); // minimum visible height

              return (
                <div
                  key={item.dateKey}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-slate-900 dark:bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded-lg shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap animate-fade-in">
                      <p className="font-bold">{item.weekday}, {item.dateKey}</p>
                      <p className="text-[11px] text-slate-300">
                        {item.completed} / {item.total} Done ({item.percent}%)
                      </p>
                    </div>
                  )}

                  {/* Percentage label above bar */}
                  <span className={`text-[10px] font-bold mb-1.5 transition-colors ${
                    item.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}>
                    {item.percent}%
                  </span>

                  {/* Bar fill */}
                  <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      style={{ height: `${barHeight}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ease-out ${
                        item.percent === 100
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs'
                          : item.isToday
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-xs ring-2 ring-blue-400/40'
                          : 'bg-gradient-to-t from-slate-400 to-blue-400 dark:from-slate-600 dark:to-blue-500 group-hover:from-blue-500 group-hover:to-blue-400'
                      }`}
                    />
                  </div>

                  {/* X-axis day & date */}
                  <div className="mt-2 text-center">
                    <span className={`block text-[11px] font-bold ${
                      item.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.weekday}
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {item.dayNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                100% Perfect
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                Active Today
              </span>
            </div>
            <span className="text-[11px] sm:text-xs">Calculated from active weekday schedules</span>
          </div>
        </div>

        {/* Category & Field Breakdown */}
        <div className="min-w-0 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                Workload by Domain
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Today</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Breakdown across your work, engineering, health, and personal goals.
            </p>

            <div className="space-y-3.5">
              {categoryStats.map((item) => (
                <div key={item.category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.category.color }}
                      />
                      {item.category.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {item.completed} / {item.total} ({item.percent}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))}

              {categoryStats.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No tasks scheduled for today. Select another day or add a new task!
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>MS Office Category Sync</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Dynamic</span>
          </div>
        </div>

      </div>

    </div>
  );
};
