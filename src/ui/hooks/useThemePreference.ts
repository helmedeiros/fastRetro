import { useState, useCallback, useLayoutEffect } from 'react';

const STORAGE_KEY = 'fastretro:theme';

export type Theme = 'dark' | 'light';

export interface UseThemePreference {
  theme: Theme;
  toggleTheme: () => void;
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

export function useThemePreference(): UseThemePreference {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  // Layout effect (not a plain effect) so the attribute is set before the
  // browser paints — otherwise a returning light-theme user would see a
  // flash of the dark theme (index.html's static default) on every load.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
