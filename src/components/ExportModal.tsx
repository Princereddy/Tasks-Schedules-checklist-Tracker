import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Eye, 
  FileText, 
  Check, 
  Layers,
  ChevronRight,
  Clock,
  Flame
} from 'lucide-react';
import { TaskCategory, TaskDailyProgress, TaskItem } from '../types';
import { AVAILABLE_YEARS, MONTH_NAMES, WEEKDAY_LABELS, formatTime12h } from '../utils/dates';
import { 
  calculateMonthlyReportData, 
  generateExecutiveHTMLReport, 
  generateMonthlyCSV, 
  openReportInNewWindow, 
  triggerFileDownload 
} from '../utils/exportReport';
import { soundFx } from '../utils/audio';

interface ExportModalProps {
  isOpen: boolean;
  tasks: TaskItem[];
  progress: Record<string, TaskDailyProgress>;
  categories: TaskCategory[];
  selectedYear: number;
  selectedMonth: number;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  tasks,
  progress,
  categories,
  selectedYear: initialYear,
  selectedMonth: initialMonth,
  onClose,
}) => {
  // Target report month and year (defaults to active navigation)
  const [reportYear, setReportYear] = useState<number>(initialYear);
  const [reportMonth, setReportMonth] = useState<number>(initialMonth); // -1 = Full Year, 0-11 = specific month
  const [activePreviewTab, setActivePreviewTab] = useState<'export' | 'preview_summary' | 'preview_schedule' | 'preview_matrix'>('export');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Compute report data dynamically whenever reportYear or reportMonth changes
  const reportData = useMemo(() => {
    return calculateMonthlyReportData(tasks, progress, categories, reportYear, reportMonth);
  }, [tasks, progress, categories, reportYear, reportMonth]);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    soundFx.playClickBeep();
    setIsExporting(true);
    setTimeout(() => {
      const csvContent = generateMonthlyCSV(reportData);
      const filename = `PLANVEXA_AuditReport_${reportYear}_${reportMonth >= 0 ? MONTH_NAMES[reportMonth] : 'FullYear'}.csv`;
      triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8');
      setIsExporting(false);
      soundFx.playSuccessChime();
    }, 300);
  };

  const handleDownloadHTML = () => {
    soundFx.playClickBeep();
    setIsExporting(true);
    setTimeout(() => {
      const htmlContent = generateExecutiveHTMLReport(reportData);
      const filename = `PLANVEXA_Executive_Report_${reportYear}_${reportMonth >= 0 ? MONTH_NAMES[reportMonth] : 'FullYear'}.html`;
      triggerFileDownload(htmlContent, filename, 'text/html;charset=utf-8');
      setIsExporting(false);
      soundFx.playSuccessChime();
    }, 300);
  };

  const handlePrintPDF = () => {
    soundFx.playClickBeep();
    const htmlContent = generateExecutiveHTMLReport(reportData);
    openReportInNewWindow(htmlContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col animate-scale-up transition-colors duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Executive Report & Audit Export</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  MS 365 Professional
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select reporting period, preview live analytics, and export formatted Excel sheets or print-ready PDF audits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 flex-shrink-0" />
          </button>
        </div>

        {/* Period Selector Controls Ribbon */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          
          {/* Year & Month Selection */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Reporting Scope:</span>
            </div>

            {/* Year Dropdown */}
            <select
              id="export-year-select"
              aria-label="Select report year"
              value={reportYear}
              onChange={(e) => {
                setReportYear(Number(e.target.value));
                soundFx.playClickBeep();
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {AVAILABLE_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Month Selector Dropdown / Pills */}
            <select
              id="export-month-select"
              aria-label="Select report month"
              value={reportMonth}
              onChange={(e) => {
                setReportMonth(Number(e.target.value));
                soundFx.playClickBeep();
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="-1">📅 Full Year (All 12 Months)</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Real-time Metrics Pill */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <span>Success:</span>
              <span className="text-sm font-black">{reportData.overallCompletionRate}%</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <span>Completed:</span>
              <span className="text-sm font-black">{reportData.totalCompletedInstances}/{reportData.totalScheduledInstances}</span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs for Preview & Actions */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 flex-shrink-0">
          <button
            onClick={() => setActivePreviewTab('export')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activePreviewTab === 'export'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Export Formats & Print</span>
          </button>

          <button
            onClick={() => setActivePreviewTab('preview_summary')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activePreviewTab === 'preview_summary'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Executive KPI Preview</span>
          </button>

          <button
            onClick={() => setActivePreviewTab('preview_schedule')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activePreviewTab === 'preview_schedule'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Detailed Tasks ({reportData.taskStats.length})</span>
          </button>

          {reportMonth >= 0 && (
            <button
              onClick={() => setActivePreviewTab('preview_matrix')}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activePreviewTab === 'preview_matrix'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Daily Habit Matrix</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: EXPORT OPTIONS & DOWNLOADS */}
          {activePreviewTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Selected Report Period
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{reportData.monthName}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({reportData.totalScheduledInstances} scheduled activity slots across {reportData.taskStats.length} tasks)
                  </span>
                </h4>
              </div>

              {/* Action 1: Executive Print / PDF */}
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
                    <Printer className="w-6 h-6 flex-shrink-0" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Executive PDF / Print Audit</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300">
                        High-Resolution Template
                      </span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Formatted MS 365 executive report with KPI cards, field breakdown progress bars, master task table, and daily habit attendance matrix.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                  <button
                    id="btn-print-executive-pdf"
                    onClick={handlePrintPDF}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 flex-shrink-0" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    id="btn-download-executive-html"
                    onClick={handleDownloadHTML}
                    title="Download standalone HTML report file"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                  </button>
                </div>
              </div>

              {/* Action 2: Microsoft Excel / CSV */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
                    XL
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Microsoft Excel Spreadsheet (.csv)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                        UTF-8 BOM Optimized
                      </span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Raw and tabulated dataset with headers, field summaries, task schedules, sub-tasks counts, and day-by-day attendance columns.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-download-monthly-csv"
                  onClick={handleDownloadCSV}
                  disabled={isExporting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer flex-shrink-0"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span>Download Excel File</span>
                </button>
              </div>

              {/* Month Quick-Access Switcher */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Quick Month Switch:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => (
                    <button
                      key={name}
                      onClick={() => {
                        setReportMonth(idx);
                        soundFx.playClickBeep();
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold text-center transition-all ${
                        reportMonth === idx
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTIVE SUMMARY PREVIEW */}
          {activePreviewTab === 'preview_summary' && (
            <div className="space-y-5">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Completion Rate
                  </span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
                    {reportData.overallCompletionRate}%
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {reportData.totalCompletedInstances} of {reportData.totalScheduledInstances} fulfilled
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mastery Days
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {reportData.perfectDaysCount}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    100% scheduled completed
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    In-Flight / Progress
                  </span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                    {reportData.totalInProgressInstances}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Active task slots
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pending / Missed
                  </span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                    {reportData.totalPendingInstances}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Unfinished slots
                  </span>
                </div>
              </div>

              {/* Discipline Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Discipline & Field Breakdown ({reportData.monthName})
                </h5>
                <div className="space-y-2.5">
                  {reportData.categoryStats.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                        <span style={{ color: cat.color }}>
                          {cat.completedCount} / {cat.scheduledCount} ({cat.rate}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${cat.rate}%`, backgroundColor: cat.color }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED TASK BREAKDOWN PREVIEW */}
          {activePreviewTab === 'preview_schedule' && (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Task Title</th>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3 text-center">Scheduled</th>
                    <th className="py-2.5 px-3 text-center">Completed</th>
                    <th className="py-2.5 px-3 text-right">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData.taskStats.map((item) => (
                    <tr key={item.task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {item.task.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold" style={{ color: item.category.color }}>
                          {item.category.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.task.priority === 'high' 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-900' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.task.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium">
                        {formatTime12h(item.task.defaultStartTime)} - {formatTime12h(item.task.defaultEndTime)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.scheduledDaysCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.completedDaysCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        <span className={item.rate >= 80 ? 'text-emerald-600' : item.rate >= 50 ? 'text-blue-600' : 'text-amber-600'}>
                          {item.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: DAILY HABIT MATRIX PREVIEW */}
          {activePreviewTab === 'preview_matrix' && reportMonth >= 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Attendance Matrix for {reportData.monthName}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✔</span> Done</span>
                  <span className="flex items-center gap-1"><span className="text-blue-600 font-bold">⏳</span> Active</span>
                  <span className="flex items-center gap-1"><span className="text-rose-600 font-bold">✖</span> Missed</span>
                  <span className="flex items-center gap-1"><span className="text-slate-400 font-bold">—</span> Off</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-center text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3 text-left font-bold text-slate-700 dark:text-slate-300 min-w-[140px]">
                        Task Name
                      </th>
                      {Array.from({ length: reportData.totalDays }, (_, i) => (
                        <th key={i} className="py-1 px-1 font-bold text-slate-500 text-[10px] w-6">
                          {i + 1}
                        </th>
                      ))}
                      <th className="py-2 px-2 font-bold text-slate-700 dark:text-slate-300">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.taskStats.map((item) => (
                      <tr key={item.task.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 text-left font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {item.task.title}
                        </td>
                        {item.dailyStatuses.map((st) => (
                          <td 
                            key={st.day} 
                            className={`py-1 px-0.5 text-[10px] font-bold ${
                              st.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                : st.status === 'in-progress'
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                : st.status === 'pending'
                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          >
                            {st.status === 'completed' ? '✔' : st.status === 'in-progress' ? '⏳' : st.status === 'pending' ? '✖' : '·'}
                          </td>
                        ))}
                        <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                          {item.completedDaysCount}/{item.scheduledDaysCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>Executive template automatically optimizes for A4/Letter print and Excel viewing</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Print Audit</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Download Excel</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
