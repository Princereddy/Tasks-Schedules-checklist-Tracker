import { TaskCategory, TaskDailyProgress, TaskItem } from '../types';
import { 
  MONTH_NAMES, 
  WEEKDAY_LABELS, 
  formatDateKey, 
  formatTime12h, 
  getDayOfWeek, 
  getDaysInMonth 
} from './dates';

export interface MonthlyReportData {
  year: number;
  monthIndex: number; // -1 for full year, 0-11 for specific month
  monthName: string;
  totalDays: number;
  totalScheduledInstances: number;
  totalCompletedInstances: number;
  totalInProgressInstances: number;
  totalPendingInstances: number;
  overallCompletionRate: number;
  perfectDaysCount: number;
  categoryStats: {
    id: string;
    name: string;
    color: string;
    scheduledCount: number;
    completedCount: number;
    rate: number;
  }[];
  taskStats: {
    task: TaskItem;
    category: TaskCategory;
    scheduledDaysCount: number;
    completedDaysCount: number;
    inProgressDaysCount: number;
    pendingDaysCount: number;
    rate: number;
    dailyStatuses: { day: number; dateKey: string; isScheduled: boolean; status: string }[];
  }[];
}

/**
 * Calculates comprehensive monthly (or annual) productivity report data
 */
export function calculateMonthlyReportData(
  tasks: TaskItem[],
  progress: Record<string, TaskDailyProgress>,
  categories: TaskCategory[],
  year: number,
  monthIndex: number // -1 for full year, 0-11 for month
): MonthlyReportData {
  const isFullYear = monthIndex === -1;
  const startMonth = isFullYear ? 0 : monthIndex;
  const endMonth = isFullYear ? 11 : monthIndex;

  let totalScheduledInstances = 0;
  let totalCompletedInstances = 0;
  let totalInProgressInstances = 0;
  let totalPendingInstances = 0;

  // Track daily completion for perfect days calculation
  const dayCompletionMap: Record<string, { scheduled: number; completed: number }> = {};

  const taskStats = tasks.map((task) => {
    const category = categories.find((c) => c.id === task.categoryId) || categories[0];
    let scheduledDaysCount = 0;
    let completedDaysCount = 0;
    let inProgressDaysCount = 0;
    let pendingDaysCount = 0;

    const dailyStatuses: { day: number; dateKey: string; isScheduled: boolean; status: string }[] = [];

    for (let m = startMonth; m <= endMonth; m++) {
      const daysInM = getDaysInMonth(year, m);

      for (let day = 1; day <= daysInM; day++) {
        const dateKey = formatDateKey(year, m, day);
        const dayOfWeek = getDayOfWeek(year, m, day);
        const isScheduled = task.activeWeekdays.includes(dayOfWeek);

        const prog = progress[`${task.id}_${dateKey}`];
        const status = prog?.status || 'pending';

        if (!dayCompletionMap[dateKey]) {
          dayCompletionMap[dateKey] = { scheduled: 0, completed: 0 };
        }

        if (isScheduled) {
          scheduledDaysCount++;
          dayCompletionMap[dateKey].scheduled++;

          if (status === 'completed') {
            completedDaysCount++;
            dayCompletionMap[dateKey].completed++;
          } else if (status === 'in-progress') {
            inProgressDaysCount++;
          } else {
            pendingDaysCount++;
          }
        }

        // Only store daily statuses for the matrix if single month view
        if (!isFullYear) {
          dailyStatuses.push({
            day,
            dateKey,
            isScheduled,
            status: isScheduled ? status : 'off',
          });
        }
      }
    }

    const rate = scheduledDaysCount > 0 ? Math.round((completedDaysCount / scheduledDaysCount) * 100) : 0;

    totalScheduledInstances += scheduledDaysCount;
    totalCompletedInstances += completedDaysCount;
    totalInProgressInstances += inProgressDaysCount;
    totalPendingInstances += pendingDaysCount;

    return {
      task,
      category,
      scheduledDaysCount,
      completedDaysCount,
      inProgressDaysCount,
      pendingDaysCount,
      rate,
      dailyStatuses,
    };
  });

  // Calculate Category Stats
  const categoryStats = categories.map((cat) => {
    const catTasks = taskStats.filter((t) => t.task.categoryId === cat.id);
    const scheduled = catTasks.reduce((acc, t) => acc + t.scheduledDaysCount, 0);
    const completed = catTasks.reduce((acc, t) => acc + t.completedDaysCount, 0);
    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      scheduledCount: scheduled,
      completedCount: completed,
      rate,
    };
  }).filter((c) => c.scheduledCount > 0);

  // Perfect days count
  let perfectDaysCount = 0;
  Object.values(dayCompletionMap).forEach((day) => {
    if (day.scheduled > 0 && day.completed === day.scheduled) {
      perfectDaysCount++;
    }
  });

  const overallCompletionRate = totalScheduledInstances > 0 
    ? Math.round((totalCompletedInstances / totalScheduledInstances) * 100) 
    : 0;

  const totalDays = isFullYear ? 365 : getDaysInMonth(year, monthIndex);
  const monthName = isFullYear ? `Full Year ${year}` : `${MONTH_NAMES[monthIndex]} ${year}`;

  return {
    year,
    monthIndex,
    monthName,
    totalDays,
    totalScheduledInstances,
    totalCompletedInstances,
    totalInProgressInstances,
    totalPendingInstances,
    overallCompletionRate,
    perfectDaysCount,
    categoryStats,
    taskStats,
  };
}

/**
 * Generates an executive-grade HTML document for printing or downloading
 */
export function generateExecutiveHTMLReport(data: MonthlyReportData): string {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isFullYear = data.monthIndex === -1;
  const daysInMonth = isFullYear ? 0 : data.totalDays;

  // Grade classification
  let performanceGrade = 'Needs Attention';
  let gradeColor = '#d97706';
  if (data.overallCompletionRate >= 90) {
    performanceGrade = 'Exceptional Mastery (Grade A+)';
    gradeColor = '#059669';
  } else if (data.overallCompletionRate >= 75) {
    performanceGrade = 'High Productivity (Grade A)';
    gradeColor = '#0284c7';
  } else if (data.overallCompletionRate >= 60) {
    performanceGrade = 'Consistent Progress (Grade B)';
    gradeColor = '#6366f1';
  }

  // Days header for matrix
  let matrixDaysHeader = '';
  if (!isFullYear) {
    for (let d = 1; d <= daysInMonth; d++) {
      matrixDaysHeader += `<th style="padding: 4px 2px; font-size: 10px; text-align: center; border: 1px solid #e2e8f0; width: 22px;">${d}</th>`;
    }
  }

  // Task rows for schedule breakdown
  const taskRowsHTML = data.taskStats.map((item, idx) => {
    const weekdaysText = item.task.activeWeekdays.map((w) => WEEKDAY_LABELS[w].short).join(', ');
    const timeText = `${formatTime12h(item.task.defaultStartTime)} – ${formatTime12h(item.task.defaultEndTime)}`;
    
    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 10px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${item.task.title}</td>
        <td style="padding: 8px 10px; color: ${item.category.color}; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${item.category.name}</td>
        <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; background-color: ${item.task.priority === 'high' ? '#ffe4e6' : item.task.priority === 'medium' ? '#fef3c7' : '#f1f5f9'}; color: ${item.task.priority === 'high' ? '#b91c1c' : item.task.priority === 'medium' ? '#b45309' : '#475569'};">
            ${item.task.priority.toUpperCase()}
          </span>
        </td>
        <td style="padding: 8px 10px; font-size: 11px; color: #475569; border-bottom: 1px solid #e2e8f0;">${weekdaysText}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #475569; border-bottom: 1px solid #e2e8f0;">${timeText}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0;">${item.scheduledDaysCount}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: bold; color: #059669; border-bottom: 1px solid #e2e8f0;">${item.completedDaysCount}</td>
        <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: ${item.rate >= 80 ? '#059669' : item.rate >= 50 ? '#0284c7' : '#d97706'}; border-bottom: 1px solid #e2e8f0;">
          ${item.rate}%
        </td>
      </tr>
    `;
  }).join('');

  // Daily matrix rows
  let matrixRowsHTML = '';
  if (!isFullYear) {
    matrixRowsHTML = data.taskStats.map((item, idx) => {
      let cells = '';
      item.dailyStatuses.forEach((st) => {
        let cellBg = '#f8fafc';
        let symbol = '·';
        let color = '#cbd5e1';

        if (st.status === 'completed') {
          cellBg = '#dcfce7';
          symbol = '✔';
          color = '#15803d';
        } else if (st.status === 'in-progress') {
          cellBg = '#dbeafe';
          symbol = '⏳';
          color = '#1d4ed8';
        } else if (st.status === 'pending') {
          cellBg = '#fee2e2';
          symbol = '✖';
          color = '#b91c1c';
        } else {
          // off day
          cellBg = '#ffffff';
          symbol = '—';
          color = '#e2e8f0';
        }

        cells += `<td style="padding: 4px 1px; text-align: center; font-size: 9px; font-weight: bold; background-color: ${cellBg}; color: ${color}; border: 1px solid #e2e8f0;">${symbol}</td>`;
      });

      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 6px 8px; font-weight: 600; font-size: 11px; color: #1e293b; border: 1px solid #e2e8f0; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.task.title}
          </td>
          ${cells}
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; font-size: 11px; border: 1px solid #e2e8f0; color: #0f172a;">
            ${item.completedDaysCount}/${item.scheduledDaysCount}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Category summary cards
  const categoryBarsHTML = data.categoryStats.map((cat) => `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
        <span style="color: #334155;">${cat.name}</span>
        <span style="color: ${cat.color};">${cat.completedCount} / ${cat.scheduledCount} (${cat.rate}%)</span>
      </div>
      <div style="background-color: #e2e8f0; border-radius: 999px; height: 8px; overflow: hidden;">
        <div style="background-color: ${cat.color}; height: 100%; width: ${cat.rate}%; border-radius: 999px;"></div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TaskFlow 365 Executive Report - ${data.monthName}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      padding: 30px;
      line-height: 1.4;
    }
    .report-container {
      max-width: 1040px;
      margin: 0 auto;
    }
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0078d4;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 3px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .period-badge {
      display: inline-block;
      background-color: #0078d4;
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      border-left: 4px solid #0078d4;
    }
    .kpi-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 6px 0 2px 0;
    }
    .kpi-sub {
      font-size: 11px;
      color: #64748b;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14px;
      background-color: #0078d4;
      border-radius: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .signoff-box {
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 16px;
      margin-top: 30px;
      background-color: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    
    <!-- Header Ribbon Banner -->
    <div class="header-banner">
      <div>
        <div class="brand-title">TaskFlow 365</div>
        <div class="brand-subtitle">Executive Productivity, Task Scheduling & Habit Audit Report</div>
      </div>
      <div class="meta-box">
        <div class="period-badge">${data.monthName}</div>
        <div><strong>Generated On:</strong> ${generatedDate}</div>
        <div><strong>Evaluation Scope:</strong> Multi-Discipline Workspace</div>
        <div><strong>Audit Rating:</strong> <span style="color: ${gradeColor}; font-weight: bold;">${performanceGrade}</span></div>
      </div>
    </div>

    <!-- Executive KPI Summary Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" style="border-left-color: #0078d4;">
        <div class="kpi-title">Monthly Completion Rate</div>
        <div class="kpi-value" style="color: #0078d4;">${data.overallCompletionRate}%</div>
        <div class="kpi-sub">${data.totalCompletedInstances} of ${data.totalScheduledInstances} slots fulfilled</div>
      </div>

      <div class="kpi-card" style="border-left-color: #107c41;">
        <div class="kpi-title">Mastery / Perfect Days</div>
        <div class="kpi-value" style="color: #107c41;">${data.perfectDaysCount} Days</div>
        <div class="kpi-sub">100% scheduled tasks completed</div>
      </div>

      <div class="kpi-card" style="border-left-color: #5c2d91;">
        <div class="kpi-title">Active Domains / Fields</div>
        <div class="kpi-value" style="color: #5c2d91;">${data.categoryStats.length} Fields</div>
        <div class="kpi-sub">Cross-functional tracking</div>
      </div>

      <div class="kpi-card" style="border-left-color: #d83b01;">
        <div class="kpi-title">Total Scheduled Items</div>
        <div class="kpi-value" style="color: #d83b01;">${data.taskStats.length} Tasks</div>
        <div class="kpi-sub">Across recurring weekdays</div>
      </div>
    </div>

    <!-- Domain Breakdown & Executive Summary -->
    <div class="grid-2col">
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
        <div class="section-title">Discipline & Field Breakdown</div>
        ${categoryBarsHTML}
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
        <div class="section-title">Audit Assessment Summary</div>
        <p style="font-size: 12px; color: #475569; margin-bottom: 10px;">
          During <strong>${data.monthName}</strong>, a total of <strong>${data.totalScheduledInstances}</strong> scheduled task instances were tracked across ${data.taskStats.length} workflows.
        </p>
        <ul style="font-size: 11px; color: #475569; padding-left: 16px; margin-bottom: 12px;">
          <li><strong>${data.totalCompletedInstances}</strong> tasks were successfully executed to full completion.</li>
          <li><strong>${data.totalInProgressInstances}</strong> tasks logged in-flight or active progress.</li>
          <li><strong>${data.perfectDaysCount}</strong> days achieved zero-defect execution (100% daily checklist).</li>
          <li>Performance Grade: <strong>${performanceGrade}</strong>.</li>
        </ul>
        <div style="font-size: 11px; color: #64748b; font-style: italic;">
          Verified and exported via TaskFlow 365 Professional Suite.
        </div>
      </div>
    </div>

    <!-- Master Task Schedule Table -->
    <div class="section-title">Master Task Scheduling & Completion Performance</div>
    <table>
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Domain</th>
          <th style="text-align: center;">Priority</th>
          <th>Scheduled Weekdays</th>
          <th>Timing Window</th>
          <th style="text-align: center;">Scheduled</th>
          <th style="text-align: center;">Completed</th>
          <th style="text-align: right;">Success Rate</th>
        </tr>
      </thead>
      <tbody>
        ${taskRowsHTML}
      </tbody>
    </table>

    ${!isFullYear ? `
      <!-- Daily Habit & Task Attendance Matrix -->
      <div class="section-title" style="margin-top: 24px;">Daily Attendance & Execution Matrix (${data.monthName})</div>
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table style="font-size: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #cbd5e1; width: 140px;">Task Name</th>
              ${matrixDaysHeader}
              <th style="border: 1px solid #cbd5e1; text-align: center;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRowsHTML}
          </tbody>
        </table>
      </div>
      <div style="display: flex; gap: 14px; font-size: 10px; color: #64748b; margin-bottom: 20px;">
        <span><strong>Legend:</strong></span>
        <span><span style="color: #15803d; font-weight: bold;">✔</span> Completed</span>
        <span><span style="color: #1d4ed8; font-weight: bold;">⏳</span> In-Progress</span>
        <span><span style="color: #b91c1c; font-weight: bold;">✖</span> Missed / Pending</span>
        <span><span style="color: #cbd5e1; font-weight: bold;">—</span> Off Day</span>
      </div>
    ` : ''}

    <!-- Executive Sign-Off -->
    <div class="signoff-box">
      <div>
        <strong>TaskFlow 365 Audit Certification</strong><br />
        Report ID: TF365-${data.year}-${data.monthIndex >= 0 ? data.monthIndex + 1 : 'ALL'}-${Date.now().toString().slice(-6)}
      </div>
      <div>
        <strong>Reviewed & Signed:</strong> ____________________________
      </div>
      <div>
        <strong>Audit Status:</strong> VERIFIED & ARCHIVED
      </div>
    </div>

  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // Auto print if requested via query parameter
      if (window.location.search.includes('print=true')) {
        setTimeout(() => { window.print(); }, 400);
      }
    });
  </script>
</body>
</html>
  `;
}

/**
 * Generates an Excel-compatible CSV file with UTF-8 BOM
 */
export function generateMonthlyCSV(data: MonthlyReportData): string {
  const lines: string[] = [];

  // Metadata block
  lines.push(`"TASKFLOW 365 - EXECUTIVE PRODUCTIVITY AUDIT REPORT"`);
  lines.push(`"Reporting Period:","${data.monthName}"`);
  lines.push(`"Generated Date:","${new Date().toISOString().split('T')[0]}"`);
  lines.push(`"Overall Completion Rate:","${data.overallCompletionRate}%"`);
  lines.push(`"Total Scheduled Slots:","${data.totalScheduledInstances}"`);
  lines.push(`"Total Completed Slots:","${data.totalCompletedInstances}"`);
  lines.push(`"Mastery (Perfect) Days:","${data.perfectDaysCount}"`);
  lines.push('');

  // Category summary table
  lines.push(`"DISCIPLINE / FIELD PERFORMANCE SUMMARY"`);
  lines.push(`"Field Name","Scheduled Slots","Completed Slots","Success Rate"`);
  data.categoryStats.forEach((cat) => {
    lines.push(`"${cat.name}",${cat.scheduledCount},${cat.completedCount},"${cat.rate}%"`);
  });
  lines.push('');

  // Master task performance table
  lines.push(`"DETAILED TASK PERFORMANCE BREAKDOWN"`);
  const headers = [
    'Task Title',
    'Domain / Discipline',
    'Priority',
    'Scheduled Weekdays',
    'Start Time',
    'End Time',
    'Scheduled Days in Period',
    'Completed Days',
    'In-Progress Days',
    'Pending Days',
    'Success Rate %',
    'Reminder Enabled',
    'Sub-tasks Count',
  ];
  lines.push(headers.map((h) => `"${h}"`).join(','));

  data.taskStats.forEach((item) => {
    const weekdays = item.task.activeWeekdays.map((w) => WEEKDAY_LABELS[w].name).join('; ');
    const row = [
      `"${item.task.title.replace(/"/g, '""')}"`,
      `"${item.category.name}"`,
      item.task.priority.toUpperCase(),
      `"${weekdays}"`,
      item.task.defaultStartTime,
      item.task.defaultEndTime,
      item.scheduledDaysCount,
      item.completedDaysCount,
      item.inProgressDaysCount,
      item.pendingDaysCount,
      `"${item.rate}%"`,
      item.task.reminderEnabled ? 'Yes' : 'No',
      item.task.subtasks?.length || 0,
    ];
    lines.push(row.join(','));
  });

  // Daily matrix table if single month
  if (data.monthIndex >= 0) {
    lines.push('');
    lines.push(`"DAILY EXECUTION MATRIX (${data.monthName})"`);
    
    const dayCols = Array.from({ length: data.totalDays }, (_, i) => `Day ${i + 1}`);
    lines.push([`"Task Name"`, ...dayCols.map((d) => `"${d}"`), `"Total Completed"`].join(','));

    data.taskStats.forEach((item) => {
      const dayStatuses = item.dailyStatuses.map((st) => {
        if (st.status === 'completed') return `"Completed"`;
        if (st.status === 'in-progress') return `"In-Progress"`;
        if (st.status === 'pending') return `"Pending"`;
        return `"Off"`;
      });

      lines.push([
        `"${item.task.title.replace(/"/g, '""')}"`,
        ...dayStatuses,
        `"${item.completedDaysCount}/${item.scheduledDaysCount}"`
      ].join(','));
    });
  }

  // Prepend UTF-8 BOM so Microsoft Excel correctly renders symbols and special characters
  return '\uFEFF' + lines.join('\n');
}

/**
 * Downloads a string as a file
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a generated HTML report in a new tab for printing / PDF saving
 */
export function openReportInNewWindow(htmlContent: string) {
  const reportWindow = window.open('', '_blank');
  if (reportWindow) {
    reportWindow.document.open();
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  } else {
    // Fallback if popups blocked: trigger download
    triggerFileDownload(htmlContent, 'TaskFlow365_Executive_Report.html', 'text/html;charset=utf-8');
  }
}
