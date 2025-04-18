import { describe, it, expect } from 'vitest';
import {
  addParticipant,
  addCardToBrainstorm,
  castVote,
  createRetro,
  remainingBudget,
  setVoteBudget,
  startIcebreaker,
  startBrainstorm,
  startGroup,
  startVote,
  votesForCard,
  DEFAULT_VOTE_BUDGET,
  STAGE_DURATIONS,
} from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';
import type { IdGenerator } from '../../src/domain/ports/IdGenerator';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `id-${String(this.n)}`;
  }
}

function seed(): ReturnType<typeof createRetro> {
  let s = createRetro();
  s = addParticipant(s, 'p-1', 'Alice');
  s = addParticipant(s, 'p-2', 'Bob');
  s = startIcebreaker(s, firstPicker);
  s = startBrainstorm(s);
  const ids = new SeqIds();
  s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
  s = addCardToBrainstorm(s, 'stop', 'long meetings', ids);
  s = startGroup(s);
  return s;
}

describe('Vote domain', () => {
  it('default vote budget and starts vote stage with 5-minute timer', () => {
    const s = startVote(seed());
    expect(s.stage).toBe('vote');
    expect(s.voteBudget).toBe(DEFAULT_VOTE_BUDGET);
    expect(s.timer?.durationMs).toBe(STAGE_DURATIONS.vote);
    expect(STAGE_DURATIONS.vote).toBe(5 * 60 * 1000);
    expect(s.votes).toEqual([]);
  });

  it('startVote only transitions from group', () => {
    expect(() => startVote(createRetro())).toThrow();
  });

  it('castVote adds a vote when budget remaining', () => {
    let s = startVote(seed());
    s = castVote(s, 'p-1', 'id-1');
    expect(votesForCard(s, 'id-1')).toBe(1);
    expect(remainingBudget(s, 'p-1')).toBe(DEFAULT_VOTE_BUDGET - 1);
  });

  it('castVote twice on same pair toggles off', () => {
    let s = startVote(seed());
    s = castVote(s, 'p-1', 'id-1');
    s = castVote(s, 'p-1', 'id-1');
    expect(votesForCard(s, 'id-1')).toBe(0);
    expect(remainingBudget(s, 'p-1')).toBe(DEFAULT_VOTE_BUDGET);
  });

  it('budget is enforced per participant', () => {
    let s = startVote(seed());
    s = setVoteBudget(s, 1);
    s = castVote(s, 'p-1', 'id-1');
    // over budget: same state returned
    const before = s;
    s = castVote(s, 'p-1', 'id-2');
    expect(s).toBe(before);
    expect(votesForCard(s, 'id-2')).toBe(0);
    // other participant still has budget
    s = castVote(s, 'p-2', 'id-2');
    expect(votesForCard(s, 'id-2')).toBe(1);
  });

  it('votes accumulate across participants', () => {
    let s = startVote(seed());
    s = castVote(s, 'p-1', 'id-1');
    s = castVote(s, 'p-2', 'id-1');
    expect(votesForCard(s, 'id-1')).toBe(2);
  });

  it('castVote no-op for unknown card', () => {
    const s = startVote(seed());
    const next = castVote(s, 'p-1', 'nope');
    expect(next).toBe(s);
  });

  it('castVote no-op for unknown participant', () => {
    const s = startVote(seed());
    const next = castVote(s, 'ghost', 'id-1');
    expect(next).toBe(s);
  });

  it('setVoteBudget only in vote stage', () => {
    expect(() => setVoteBudget(createRetro(), 5)).toThrow();
  });

  it('setVoteBudget rejects negative', () => {
    const s = startVote(seed());
    expect(() => setVoteBudget(s, -1)).toThrow();
  });

  it('castVote only in vote stage', () => {
    expect(() => castVote(seed(), 'p-1', 'id-1')).toThrow();
  });

  it('remainingBudget for unknown participant returns full budget', () => {
    const s = startVote(seed());
    expect(remainingBudget(s, 'ghost')).toBe(DEFAULT_VOTE_BUDGET);
  });

  it('votesForCard returns 0 for unknown', () => {
    const s = startVote(seed());
    expect(votesForCard(s, 'nope')).toBe(0);
  });
});
