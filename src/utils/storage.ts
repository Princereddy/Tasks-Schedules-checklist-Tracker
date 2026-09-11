import { TaskCategory, TaskItem, TaskDailyProgress, AppNotification } from '../types';
import { formatDateKey } from './dates';

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

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task_1',
    title: 'Daily Standup & Priority Sync',
    description: 'Review project roadmap, resolve blockers, and align team deliverables in MS Teams.',
    categoryId: 'cat_work',
    priority: 'high',
    activeWeekdays: [1, 2, 3, 4, 5], // Mon to Fri
    defaultStartTime: '09:00',
    defaultEndTime: '09:30',
    reminderEnabled: true,
    reminderMinutesBefore: 10,
    subtasks: [
      { id: 'sub_1_1', title: 'Review unread emails & urgent tickets', completed: true },
      { id: 'sub_1_2', title: 'Post daily blockers in status channel', completed: true },
      { id: 'sub_1_3', title: 'Update project sprint board', completed: false },
    ],
    colorTag: '#0078D4',
    createdAt: '2026-08-01',
  },
  {
    id: 'task_2',
    title: 'Deep Work: Core Architecture Sprint',
    description: 'Uninterrupted flow block for high-impact coding and technical specs.',
    categoryId: 'cat_tech',
    priority: 'high',
    activeWeekdays: [1, 2, 3, 4, 5], // Mon to Fri
    defaultStartTime: '10:00',
    defaultEndTime: '12:30',
    reminderEnabled: true,
    reminderMinutesBefore: 5,
    subtasks: [
      { id: 'sub_2_1', title: 'Profile database query speeds', completed: false },
      { id: 'sub_2_2', title: 'Implement reactive UI state sync', completed: false },
    ],
    colorTag: '#5C2D91',
    createdAt: '2026-08-01',
  },
  {
    id: 'task_3',
    title: 'Hydration & Posture Reset (Habit)',
    description: 'Drink 500ml water and complete 5-minute thoracic stretch routine.',
    categoryId: 'cat_health',
    priority: 'medium',
    activeWeekdays: [0, 1, 2, 3, 4, 5, 6], // All 7 days
    defaultStartTime: '12:30',
    defaultEndTime: '12:45',
    reminderEnabled: true,
    reminderMinutesBefore: 0,
    subtasks: [
      { id: 'sub_3_1', title: 'Drink water (500ml)', completed: true },
      { id: 'sub_3_2', title: 'Perform neck & wrist stretches', completed: true },
    ],
    colorTag: '#107C41',
    createdAt: '2026-08-01',
  },
  {
    id: 'task_4',
    title: 'Client Proposals & Pipeline Review',
    description: 'Verify quarterly revenue targets, follow up on key proposals, and update CRM.',
    categoryId: 'cat_growth',
    priority: 'high',
    activeWeekdays: [1, 3, 5], // Mon, Wed, Fri
    defaultStartTime: '14:00',
    defaultEndTime: '15:15',
    reminderEnabled: false,
    reminderMinutesBefore: 15,
    subtasks: [
      { id: 'sub_4_1', title: 'Send revised contract to Enterprise partner', completed: false },
      { id: 'sub_4_2', title: 'Schedule demo for prospective accounts', completed: false },
    ],
    colorTag: '#008272',
    createdAt: '2026-08-05',
  },
  {
    id: 'task_5',
    title: 'Cardio & Strength Training Session',
    description: '45-minute structured workout: 20 min interval cardio + 25 min strength.',
    categoryId: 'cat_health',
    priority: 'medium',
    activeWeekdays: [1, 2, 4, 6], // Mon, Tue, Thu, Sat
    defaultStartTime: '17:30',
    defaultEndTime: '18:30',
    reminderEnabled: true,
    reminderMinutesBefore: 15,
    subtasks: [
      { id: 'sub_5_1', title: 'Warm-up jog (10 mins)', completed: false },
      { id: 'sub_5_2', title: 'Core circuit & recovery', completed: false },
    ],
    colorTag: '#107C41',
    createdAt: '2026-08-10',
  },
  {
    id: 'task_6',
    title: 'Evening Technical Reading & Skill Mastery',
    description: '30 minutes reading research papers, systems design books, or industry whitepapers.',
    categoryId: 'cat_study',
    priority: 'low',
    activeWeekdays: [0, 1, 2, 3, 4, 5, 6], // All 7 days
    defaultStartTime: '21:00',
    defaultEndTime: '21:45',
    reminderEnabled: true,
    reminderMinutesBefore: 10,
    subtasks: [
      { id: 'sub_6_1', title: 'Read 20 pages', completed: false },
      { id: 'sub_6_2', title: 'Write 3 key bullet takeaways in notebook', completed: false },
    ],
    colorTag: '#D83B01',
    createdAt: '2026-08-12',
  },
];

// Generate initial sample completion progress for the current month so charts are instantly populated!
export function getInitialProgress(): Record<string, TaskDailyProgress> {
  const progress: Record<string, TaskDailyProgress> = {};
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDay = now.getDate();

  // Populate last 14 days with realistic completions
  for (let day = Math.max(1, todayDay - 14); day <= todayDay; day++) {
    const dateKey = formatDateKey(year, month, day);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();

    INITIAL_TASKS.forEach((task, idx) => {
      // Check if task is active on this day
      if (task.activeWeekdays.includes(dayOfWeek)) {
        const key = `${task.id}_${dateKey}`;
        // Give higher completion for past days to demonstrate streak
        const isPast = day < todayDay;
        const isCompleted = isPast ? (idx !== 4 || day % 3 !== 0) : (idx === 0 || idx === 2); // on today, first 2 are done

        progress[key] = {
          taskId: task.id,
          dateKey,
          status: isCompleted ? 'completed' : (day === todayDay && idx === 1 ? 'in-progress' : 'pending'),
          completedAt: isCompleted ? `${dateKey}T${task.defaultEndTime}:00` : undefined,
          completedSubtasks: isCompleted ? (task.subtasks?.map(s => s.id) || []) : [],
        };
      }
    });
  }

  return progress;
}

const STORAGE_KEY_TASKS = 'msoffice_tasktracker_tasks_v1';
const STORAGE_KEY_PROGRESS = 'msoffice_tasktracker_progress_v1';
const STORAGE_KEY_CATEGORIES = 'msoffice_tasktracker_cats_v1';
const STORAGE_KEY_NOTIFS = 'msoffice_tasktracker_notifs_v1';

export function loadTasksFromStorage(): TaskItem[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const data = localStorage.getItem(STORAGE_KEY_TASKS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
  return INITIAL_TASKS;
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
  if (typeof window === 'undefined') return getInitialProgress();
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
  return getInitialProgress();
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
  return [
    {
      id: 'notif_welcome',
      title: 'PLANVEXA Workspace Activated',
      message: 'Plan your year, configure weekday schedules & timings, track daily habits, and review real-time analytics.',
      time: '09:00',
      type: 'info',
      read: false,
    },
  ];
}

export function saveNotificationsToStorage(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}
