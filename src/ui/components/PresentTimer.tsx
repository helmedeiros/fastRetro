import type { Timer } from '../../domain/retro/Timer';

export interface PresentTimerProps {
  timer: Timer;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function PresentTimer({
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
}: PresentTimerProps): JSX.Element {
  return (
    <section aria-label="Present timer">
      <p
        aria-label="Time remaining"
        data-testid="time-remaining"
      >
        {formatRemaining(timer.remainingMs)}
      </p>
      <div role="group" aria-label="Timer controls">
        {timer.status === 'idle' && (
          <button type="button" onClick={onStart}>
            Start
          </button>
        )}
        {timer.status === 'running' && (
          <button type="button" onClick={onPause}>
            Pause
          </button>
        )}
        {timer.status === 'paused' && (
          <button type="button" onClick={onResume}>
            Resume
          </button>
        )}
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </section>
  );
}
