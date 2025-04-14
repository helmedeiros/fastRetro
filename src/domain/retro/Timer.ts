export type TimerStatus = 'idle' | 'running' | 'paused';

export interface Timer {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

function build(
  status: TimerStatus,
  durationMs: number,
  elapsedMs: number,
): Timer {
  const clamped = Math.min(elapsedMs, durationMs);
  return {
    status,
    durationMs,
    elapsedMs: clamped,
    remainingMs: durationMs - clamped,
  };
}

export function createTimer(durationMs: number): Timer {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error('Timer duration must be a positive number of milliseconds');
  }
  return build('idle', durationMs, 0);
}

export function startTimer(timer: Timer): Timer {
  if (timer.status === 'running') return timer;
  return build('running', timer.durationMs, timer.elapsedMs);
}

export function pauseTimer(timer: Timer): Timer {
  if (timer.status !== 'running') return timer;
  return build('paused', timer.durationMs, timer.elapsedMs);
}

export function resumeTimer(timer: Timer): Timer {
  if (timer.status !== 'paused') return timer;
  return build('running', timer.durationMs, timer.elapsedMs);
}

export function tickTimer(timer: Timer, deltaMs: number): Timer {
  if (timer.status !== 'running') return timer;
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return timer;
  return build('running', timer.durationMs, timer.elapsedMs + deltaMs);
}

export function resetTimer(timer: Timer): Timer {
  return build('idle', timer.durationMs, 0);
}

export function isFinished(timer: Timer): boolean {
  return timer.remainingMs === 0;
}
