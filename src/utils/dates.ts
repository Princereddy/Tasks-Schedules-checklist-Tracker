export const WEEKDAY_LABELS = [
  { dayIndex: 0, letter: 'S', name: 'Sunday', short: 'Sun' },
  { dayIndex: 1, letter: 'M', name: 'Monday', short: 'Mon' },
  { dayIndex: 2, letter: 'T', name: 'Tuesday', short: 'Tue' },
  { dayIndex: 3, letter: 'W', name: 'Wednesday', short: 'Wed' },
  { dayIndex: 4, letter: 'T', name: 'Thursday', short: 'Thu' },
  { dayIndex: 5, letter: 'F', name: 'Friday', short: 'Fri' },
  { dayIndex: 6, letter: 'S', name: 'Saturday', short: 'Sat' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Available years range (can be extended)
export const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export function formatDateKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): { year: number; monthIndex: number; day: number } {
  const parts = dateKey.split('-').map(Number);
  return {
    year: parts[0] || 2026,
    monthIndex: (parts[1] || 1) - 1,
    day: parts[2] || 1,
  };
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getDayOfWeek(year: number, monthIndex: number, day: number): number {
  return new Date(year, monthIndex, day).getDay();
}

export function getFormattedDisplayDate(year: number, monthIndex: number, day: number): string {
  const dateObj = new Date(year, monthIndex, day);
  const weekday = WEEKDAY_LABELS[dateObj.getDay()].name;
  const month = MONTH_NAMES[monthIndex];
  return `${weekday}, ${month} ${day}, ${year}`;
}

export function getTodayDateParts(): { year: number; monthIndex: number; day: number; dateKey: string } {
  // Use today's system time or default to 2026-09-10
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const day = now.getDate();
  const dateKey = formatDateKey(year, monthIndex, day);
  return { year, monthIndex, day, dateKey };
}

// Convert "09:00" to "9:00 AM"
export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const minutes = minStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // 0 -> 12
  return `${hour}:${minutes} ${ampm}`;
}

// Check if current time is within slot
export function isCurrentTimeWithin(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;
  
  return currentMinutes >= startMin && currentMinutes <= endMin;
}
