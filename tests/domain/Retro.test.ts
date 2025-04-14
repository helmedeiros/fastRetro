import { describe, it, expect } from 'vitest';
import {
  createRetro,
  addParticipant,
  removeParticipant,
  startRetro,
  startRetroTimer,
  pauseRetroTimer,
  resumeRetroTimer,
  tickRetroTimer,
  resetRetroTimer,
  DEFAULT_TIMER_DURATION_MS,
} from '../../src/domain/retro/Retro';

describe('Retro.addParticipant', () => {
  it('starts with no participants', () => {
    expect(createRetro().participants).toEqual([]);
  });

  it('adds a participant', () => {
    const s = addParticipant(createRetro(), 'id-1', 'Alice');
    expect(s.participants).toHaveLength(1);
    expect(s.participants[0]).toEqual({ id: 'id-1', name: 'Alice' });
  });

  it('is immutable — returns new state', () => {
    const s0 = createRetro();
    const s1 = addParticipant(s0, 'id-1', 'Alice');
    expect(s0.participants).toHaveLength(0);
    expect(s1).not.toBe(s0);
  });

  it('rejects duplicate names (case-insensitive)', () => {
    const s = addParticipant(createRetro(), 'id-1', 'Alice');
    expect(() => addParticipant(s, 'id-2', 'alice')).toThrow(/already/);
  });

  it('rejects empty names', () => {
    expect(() => addParticipant(createRetro(), 'id-1', '   ')).toThrow();
  });
});

describe('Retro.removeParticipant', () => {
  it('removes a participant by id', () => {
    let s = createRetro();
    s = addParticipant(s, 'id-1', 'Alice');
    s = addParticipant(s, 'id-2', 'Bob');
    s = removeParticipant(s, 'id-1');
    expect(s.participants.map((p) => p.name)).toEqual(['Bob']);
  });

  it('throws when id not found', () => {
    const s = addParticipant(createRetro(), 'id-1', 'Alice');
    expect(() => removeParticipant(s, 'missing')).toThrow(/not found/);
  });
});

describe('Retro stage + timer', () => {
  it('createRetro starts in setup stage with no timer', () => {
    const s = createRetro();
    expect(s.stage).toBe('setup');
    expect(s.timer).toBeNull();
  });

  it('startRetro requires at least one participant', () => {
    expect(() => startRetro(createRetro())).toThrow(/participant/i);
  });

  it('startRetro transitions to running with a default timer', () => {
    const s = startRetro(addParticipant(createRetro(), 'id-1', 'Alice'));
    expect(s.stage).toBe('running');
    expect(s.timer).not.toBeNull();
    expect(s.timer?.durationMs).toBe(DEFAULT_TIMER_DURATION_MS);
    expect(s.timer?.status).toBe('idle');
  });

  it('startRetro is rejected when already running', () => {
    const s = startRetro(addParticipant(createRetro(), 'id-1', 'Alice'));
    expect(() => startRetro(s)).toThrow(/already/i);
  });

  it('start/pause/resume/tick/reset mutate the timer immutably', () => {
    let s = startRetro(addParticipant(createRetro(), 'id-1', 'Alice'));
    s = startRetroTimer(s);
    expect(s.timer?.status).toBe('running');
    s = tickRetroTimer(s, 1000);
    expect(s.timer?.elapsedMs).toBe(1000);
    s = pauseRetroTimer(s);
    expect(s.timer?.status).toBe('paused');
    s = tickRetroTimer(s, 5000);
    expect(s.timer?.elapsedMs).toBe(1000);
    s = resumeRetroTimer(s);
    expect(s.timer?.status).toBe('running');
    s = resetRetroTimer(s);
    expect(s.timer?.status).toBe('idle');
    expect(s.timer?.elapsedMs).toBe(0);
  });

  it('tickRetroTimer is a no-op when there is no timer', () => {
    const s = createRetro();
    expect(tickRetroTimer(s, 1000)).toBe(s);
  });

  it('timer mutators throw when there is no active timer', () => {
    const s = createRetro();
    expect(() => startRetroTimer(s)).toThrow();
    expect(() => pauseRetroTimer(s)).toThrow();
    expect(() => resumeRetroTimer(s)).toThrow();
    expect(() => resetRetroTimer(s)).toThrow();
  });
});
