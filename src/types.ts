export type WeekDay = 'S' | 'M' | 'T' | 'W' | 'TH' | 'F' | 'SA';

export interface DayTimeSlot {
  day: WeekDay;
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
}

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';

export interface TaskSubItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string; // hex or tailwind class
  badgeBg: string;
  badgeText: string;
  iconName: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  priority: TaskPriority;
  
  // Working days of the week: 0=Sun(S), 1=Mon(M), 2=Tue(T), 3=Wed(W), 4=Thu(T), 5=Fri(F), 6=Sat(S)
  activeWeekdays: number[]; // e.g. [1, 2, 3, 4, 5] for Mon-Fri
  
  // Timings per day or default timing
  defaultStartTime: string; // "09:00"
  defaultEndTime: string;   // "10:00"
  customDayTimes?: Record<number, { startTime: string; endTime: string }>; // dayOfWeek -> times
  
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  
  subtasks?: TaskSubItem[];
  colorTag?: string;
  createdAt: string;
}

// Record of a task's state on a specific date (YYYY-MM-DD)
export interface TaskDailyProgress {
  taskId: string;
  dateKey: string; // "2026-09-10"
  status: TaskStatus;
  completedAt?: string;
  notes?: string;
  completedSubtasks?: string[]; // IDs of completed subtasks
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'reminder' | 'streak' | 'achievement' | 'info';
  read: boolean;
  taskId?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'error';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}
