import { useState } from 'react';
import type { Timer } from '../../domain/retro/Timer';

export interface PresentTimerProps {
  timer: Timer;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

function formatCompact(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${String(minutes)}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(seconds)}s`;
}

function formatFull(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PresentTimer({
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
}: PresentTimerProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Present timer" className="timer-corner">
      <button
        type="button"
        className="timer-toggle"
        onClick={(): void => { setOpen(!open); }}
        aria-expanded={open}
        data-running={timer.status === 'running' ? 'true' : 'false'}
      >
        <span className="timer-icon">&#9201;</span>
        <span
          aria-label="Time remaining"
          data-testid="time-remaining"
        >
          {formatCompact(timer.remainingMs)}
        </span>
      </button>
      {open && (
        <div className="timer-dropdown" role="group" aria-label="Timer controls">
          <p className="timer-display">{formatFull(timer.remainingMs)}</p>
          <div className="timer-buttons">
            {timer.status === 'idle' && (
              <button type="button" className="primary" onClick={onStart}>
                Start
              </button>
            )}
            {timer.status === 'running' && (
              <button type="button" onClick={onPause}>
                Pause
              </button>
            )}
            {timer.status === 'paused' && (
              <button type="button" className="primary" onClick={onResume}>
                Resume
              </button>
            )}
            <button type="button" onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
