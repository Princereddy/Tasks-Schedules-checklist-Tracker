import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'planvexa_theme_mode';
const LEGACY_THEME_KEY = 'taskflow_theme_mode';

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Fallback if localStorage blocked
  }
  return 'light'; // Default to clean light mode
}

export function applyTheme(mode: ThemeMode): boolean {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore storage issues
  }

  const root = document.documentElement;
  let isDark = false;

  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else {
    // System
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  return isDark;
}
