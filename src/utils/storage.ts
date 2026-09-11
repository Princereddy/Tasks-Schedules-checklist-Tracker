import { TaskCategory, TaskItem, TaskDailyProgress, AppNotification } from '../types';

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  {
    id: 'cat_work',
    name: 'Office & Operations',
    color: '#0078D4', // MS Fluent Blue
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'text-blue-700',
    iconName: 'Briefcase',
  },
  {
    id: 'cat_tech',
    name: 'Dev & Engineering',
    color: '#5C2D91', // MS OneNote Purple
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-700',
    iconName: 'Code',
  },
  {
    id: 'cat_growth',
    name: 'Sales & Strategy',
    color: '#008272', // MS Planner Teal
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    badgeText: 'text-teal-700',
    iconName: 'TrendingUp',
  },
  {
    id: 'cat_health',
    name: 'Health & Fitness',
    color: '#107C41', // MS Excel Emerald
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    iconName: 'Activity',
  },
  {
    id: 'cat_study',
    name: 'Study & Reading',
    color: '#D83B01', // MS Word/Orange Accent
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    iconName: 'BookOpen',
  },
];

// No demo data - all new users start completely fresh with 0 tasks and 0 records
export const INITIAL_TASKS: TaskItem[] = [];

export function getInitialProgress(): Record<string, TaskDailyProgress> {
  return {};
}

const STORAGE_KEY_TASKS = 'msoffice_tasktracker_tasks_v1';
const STORAGE_KEY_PROGRESS = 'msoffice_tasktracker_progress_v1';
const STORAGE_KEY_CATEGORIES = 'msoffice_tasktracker_cats_v1';
const STORAGE_KEY_NOTIFS = 'msoffice_tasktracker_notifs_v1';

export function loadTasksFromStorage(): TaskItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_TASKS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
  return [];
}

export function saveTasksToStorage(tasks: TaskItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

export function loadProgressFromStorage(): Record<string, TaskDailyProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
  return {};
}

export function saveProgressToStorage(progress: Record<string, TaskDailyProgress>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
}

export function loadCategoriesFromStorage(): TaskCategory[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const data = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategoriesToStorage(categories: TaskCategory[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function loadNotificationsFromStorage(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load notifications', e);
  }
  return [];
}

export function saveNotificationsToStorage(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function clearAllLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_TASKS);
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem('PLANVEXA_USER_PROFILE');
    localStorage.removeItem('PLANVEXA_DISPLAY_NAME');
    localStorage.removeItem('planvexa_user_profile_v1');
    sessionStorage.clear();
  } catch (e) {
    console.error('Failed to clear localStorage', e);
  }
}
