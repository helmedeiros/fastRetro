import type { Clock, ClockUnsubscribe } from '../../domain/ports/Clock';

export class BrowserClock implements Clock {
  now(): number {
    return Date.now();
  }

  subscribe(
    callback: (nowMs: number) => void,
    intervalMs: number,
  ): ClockUnsubscribe {
    const handle = setInterval(() => {
      callback(Date.now());
    }, intervalMs);
    return () => {
      clearInterval(handle);
    };
  }
}
