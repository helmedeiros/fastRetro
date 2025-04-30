import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PresentTimer } from '../../src/ui/components/PresentTimer';
import { createTimer, startTimer, pauseTimer } from '../../src/domain/retro/Timer';

function noop(): void {
  // intentionally empty
}

function openDropdown(): void {
  fireEvent.click(screen.getByRole('button', { name: /time remaining/i }));
}

describe('PresentTimer', () => {
  it('renders compact time in the toggle', () => {
    const timer = createTimer(10 * 60 * 1000);
    render(
      <PresentTimer
        timer={timer}
        onStart={noop}
        onPause={noop}
        onResume={noop}
        onReset={noop}
      />,
    );
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10m 00s');
  });

  it('shows Start when idle after opening dropdown and fires onStart', () => {
    const onStart = vi.fn();
    render(
      <PresentTimer
        timer={createTimer(60_000)}
        onStart={onStart}
        onPause={noop}
        onResume={noop}
        onReset={noop}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows Pause when running after opening dropdown and fires onPause', () => {
    const onPause = vi.fn();
    render(
      <PresentTimer
        timer={startTimer(createTimer(60_000))}
        onStart={noop}
        onPause={onPause}
        onResume={noop}
        onReset={noop}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('shows Resume when paused after opening dropdown and fires onResume', () => {
    const onResume = vi.fn();
    render(
      <PresentTimer
        timer={pauseTimer(startTimer(createTimer(60_000)))}
        onStart={noop}
        onPause={noop}
        onResume={onResume}
        onReset={noop}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('Reset is available in dropdown and fires onReset', () => {
    const onReset = vi.fn();
    render(
      <PresentTimer
        timer={createTimer(60_000)}
        onStart={noop}
        onPause={noop}
        onResume={noop}
        onReset={onReset}
      />,
    );
    openDropdown();
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
