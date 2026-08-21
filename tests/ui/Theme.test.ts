import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemePreference } from '../../src/ui/hooks/useThemePreference';

describe('useThemePreference hook', () => {
  afterEach(() => {
    // Guarded: some environments don't provide a working localStorage.
    try { localStorage.removeItem('fastretro:theme'); } catch { /* unavailable */ }
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark theme', () => {
    const { result } = renderHook(() => useThemePreference());
    expect(result.current.theme).toBe('dark');
  });

  it('toggleTheme flips between dark and light', () => {
    const { result } = renderHook(() => useThemePreference());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('light');
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dark');
  });

  it('applies the theme to document.documentElement', () => {
    const { result } = renderHook(() => useThemePreference());
    act(() => { result.current.toggleTheme(); });
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('exposes a stable toggleTheme reference', () => {
    const { result, rerender } = renderHook(() => useThemePreference());
    const first = result.current.toggleTheme;
    rerender();
    expect(result.current.toggleTheme).toBe(first);
  });
});
