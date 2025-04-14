export type ClockUnsubscribe = () => void;

export interface Clock {
  now(): number;
  subscribe(callback: (nowMs: number) => void, intervalMs: number): ClockUnsubscribe;
}
