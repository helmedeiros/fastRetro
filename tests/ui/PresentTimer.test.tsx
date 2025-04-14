import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PresentTimer } from '../../src/ui/components/PresentTimer';
import { createTimer, startTimer, pauseTimer } from '../../src/domain/retro/Timer';

function noop(): void {
  // intentionally empty
}

describe('PresentTimer', () => {
  it('renders mm:ss for the remaining time', () => {
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
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10:00');
  });

  it('shows Start when idle and fires onStart', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows Pause when running and fires onPause', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('shows Resume when paused and fires onResume', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /resume/i }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('Reset is always available and fires onReset', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
