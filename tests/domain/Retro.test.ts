import { describe, it, expect } from 'vitest';
import {
  createRetro,
  addParticipant,
  removeParticipant,
  startIcebreaker,
  advanceIcebreakerParticipant,
  startRetroTimer,
  pauseRetroTimer,
  resumeRetroTimer,
  tickRetroTimer,
  resetRetroTimer,
  STAGE_DURATIONS,
  startBrainstorm,
  addCardToBrainstorm,
  removeCardFromBrainstorm,
} from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';
import type { IdGenerator } from '../../src/domain/ports/IdGenerator';

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `card-${String(this.n)}`;
  }
}

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

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
  it('createRetro starts in setup stage with no timer or icebreaker', () => {
    const s = createRetro();
    expect(s.stage).toBe('setup');
    expect(s.timer).toBeNull();
    expect(s.icebreaker).toBeNull();
  });

  it('startIcebreaker requires at least one participant', () => {
    expect(() => startIcebreaker(createRetro(), firstPicker)).toThrow(
      /participant/i,
    );
  });

  it('startIcebreaker transitions to icebreaker with timer and icebreaker state', () => {
    const s = startIcebreaker(
      addParticipant(createRetro(), 'id-1', 'Alice'),
      firstPicker,
    );
    expect(s.stage).toBe('icebreaker');
    expect(s.timer).not.toBeNull();
    expect(s.timer?.durationMs).toBe(STAGE_DURATIONS.icebreaker);
    expect(s.timer?.status).toBe('idle');
    expect(s.icebreaker).not.toBeNull();
    expect(s.icebreaker?.currentIndex).toBe(0);
    expect(s.icebreaker?.participantIds).toEqual(['id-1']);
  });

  it('startIcebreaker is rejected when already started', () => {
    const s = startIcebreaker(
      addParticipant(createRetro(), 'id-1', 'Alice'),
      firstPicker,
    );
    expect(() => startIcebreaker(s, firstPicker)).toThrow(/already/i);
  });

  it('advanceIcebreakerParticipant rotates through participants', () => {
    let s = createRetro();
    s = addParticipant(s, 'id-1', 'Alice');
    s = addParticipant(s, 'id-2', 'Bob');
    s = startIcebreaker(s, firstPicker);
    expect(s.icebreaker?.currentIndex).toBe(0);
    s = advanceIcebreakerParticipant(s);
    expect(s.icebreaker?.currentIndex).toBe(1);
    s = advanceIcebreakerParticipant(s);
    expect(s.icebreaker?.currentIndex).toBe(1);
  });

  it('advanceIcebreakerParticipant throws without an active icebreaker', () => {
    expect(() => advanceIcebreakerParticipant(createRetro())).toThrow();
  });

  it('start/pause/resume/tick/reset mutate the timer immutably', () => {
    let s = startIcebreaker(
      addParticipant(createRetro(), 'id-1', 'Alice'),
      firstPicker,
    );
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

describe('Retro brainstorm stage', () => {
  function ready(): ReturnType<typeof createRetro> {
    let s = createRetro();
    s = addParticipant(s, 'p-1', 'Alice');
    s = startIcebreaker(s, firstPicker);
    return s;
  }

  it('createRetro starts with no cards', () => {
    expect(createRetro().cards).toEqual([]);
  });

  it('startBrainstorm transitions from icebreaker with a fresh 5-min timer', () => {
    const s = startBrainstorm(ready());
    expect(s.stage).toBe('brainstorm');
    expect(s.timer?.durationMs).toBe(STAGE_DURATIONS.brainstorm);
    expect(s.timer?.status).toBe('idle');
    expect(s.cards).toEqual([]);
  });

  it('startBrainstorm rejects when not in icebreaker stage', () => {
    expect(() => startBrainstorm(createRetro())).toThrow(/icebreaker/);
  });

  it('addCardToBrainstorm appends a card in insertion order', () => {
    const ids = new SeqIds();
    let s = startBrainstorm(ready());
    s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
    s = addCardToBrainstorm(s, 'stop', 'long meetings', ids);
    expect(s.cards.map((c) => c.text)).toEqual([
      'ship faster',
      'long meetings',
    ]);
    expect(s.cards.map((c) => c.columnId)).toEqual(['start', 'stop']);
  });

  it('addCardToBrainstorm requires brainstorm stage', () => {
    expect(() =>
      addCardToBrainstorm(createRetro(), 'start', 'x', new SeqIds()),
    ).toThrow(/brainstorm/);
  });

  it('removeCardFromBrainstorm removes by id', () => {
    const ids = new SeqIds();
    let s = startBrainstorm(ready());
    s = addCardToBrainstorm(s, 'start', 'a', ids);
    s = addCardToBrainstorm(s, 'start', 'b', ids);
    s = removeCardFromBrainstorm(s, 'card-1');
    expect(s.cards.map((c) => c.id)).toEqual(['card-2']);
  });

  it('removeCardFromBrainstorm throws when card id not found', () => {
    const s = startBrainstorm(ready());
    expect(() => removeCardFromBrainstorm(s, 'missing')).toThrow(/not found/);
  });

  it('removeCardFromBrainstorm requires brainstorm stage', () => {
    expect(() => removeCardFromBrainstorm(createRetro(), 'x')).toThrow(
      /brainstorm/,
    );
  });
});
