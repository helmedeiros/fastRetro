import type { Theme } from '../hooks/useThemePreference';

export interface ThemeToggleButtonProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggleButton({ theme, onToggle }: ThemeToggleButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}
