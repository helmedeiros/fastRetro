import { describe, it, expect } from 'vitest';
import {
  createTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  tickTimer,
  resetTimer,
  isFinished,
} from '../../src/domain/retro/Timer';

const TEN_MIN = 10 * 60 * 1000;

describe('Timer', () => {
  it('createTimer is idle with full remaining', () => {
    const t = createTimer(TEN_MIN);
    expect(t.status).toBe('idle');
    expect(t.elapsedMs).toBe(0);
    expect(t.remainingMs).toBe(TEN_MIN);
    expect(t.durationMs).toBe(TEN_MIN);
  });

  it('rejects non-positive duration', () => {
    expect(() => createTimer(0)).toThrow();
    expect(() => createTimer(-1)).toThrow();
  });

  it('start transitions to running', () => {
    const t = startTimer(createTimer(TEN_MIN));
    expect(t.status).toBe('running');
  });

  it('tick advances elapsed and reduces remaining when running', () => {
    let t = startTimer(createTimer(TEN_MIN));
    t = tickTimer(t, 1500);
    expect(t.elapsedMs).toBe(1500);
    expect(t.remainingMs).toBe(TEN_MIN - 1500);
  });

  it('tick is ignored when idle', () => {
    const t = tickTimer(createTimer(TEN_MIN), 1000);
    expect(t.elapsedMs).toBe(0);
  });

  it('pause stops accepting ticks until resume', () => {
    let t = startTimer(createTimer(TEN_MIN));
    t = tickTimer(t, 1000);
    t = pauseTimer(t);
    expect(t.status).toBe('paused');
    t = tickTimer(t, 5000);
    expect(t.elapsedMs).toBe(1000);
    t = resumeTimer(t);
    expect(t.status).toBe('running');
    t = tickTimer(t, 2000);
    expect(t.elapsedMs).toBe(3000);
  });

  it('pause is a no-op when not running', () => {
    const idle = createTimer(TEN_MIN);
    expect(pauseTimer(idle)).toBe(idle);
  });

  it('resume is a no-op when not paused', () => {
    const idle = createTimer(TEN_MIN);
    expect(resumeTimer(idle)).toBe(idle);
  });

  it('elapsed clamps at duration; remaining clamps at 0', () => {
    let t = startTimer(createTimer(1000));
    t = tickTimer(t, 5000);
    expect(t.elapsedMs).toBe(1000);
    expect(t.remainingMs).toBe(0);
    expect(isFinished(t)).toBe(true);
  });

  it('isFinished is false while time remains', () => {
    const t = startTimer(createTimer(TEN_MIN));
    expect(isFinished(t)).toBe(false);
  });

  it('reset returns to idle with full remaining', () => {
    let t = startTimer(createTimer(TEN_MIN));
    t = tickTimer(t, 4321);
    t = resetTimer(t);
    expect(t.status).toBe('idle');
    expect(t.elapsedMs).toBe(0);
    expect(t.remainingMs).toBe(TEN_MIN);
  });

  it('start is a no-op when already running', () => {
    const running = startTimer(createTimer(TEN_MIN));
    expect(startTimer(running)).toBe(running);
  });

  it('tickTimer with non-positive delta is a no-op', () => {
    let t = startTimer(createTimer(TEN_MIN));
    t = tickTimer(t, 0);
    expect(t.elapsedMs).toBe(0);
    t = tickTimer(t, -100);
    expect(t.elapsedMs).toBe(0);
  });
});
