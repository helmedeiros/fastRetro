import { describe, it, expect } from 'vitest';
import {
  addCardToBrainstorm,
  addDiscussNote,
  addParticipant,
  advanceDiscussSegment,
  assignActionOwner,
  castVote,
  createRetro,
  getActionItems,
  setVoteBudget,
  startBrainstorm,
  startDiscuss,
  startGroup,
  startIcebreaker,
  startReview,
  startVote,
  STAGE_DURATIONS,
} from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';
import type { IdGenerator } from '../../src/domain/ports/IdGenerator';
import type { RetroState } from '../../src/domain/retro/Retro';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `c-${String(this.n)}`;
  }
}

function baseInDiscuss(): RetroState {
  let s = createRetro();
  s = addParticipant(s, 'p-1', 'Alice');
  s = addParticipant(s, 'p-2', 'Bob');
  s = startIcebreaker(s, firstPicker);
  s = startBrainstorm(s);
  const ids = new SeqIds();
  s = addCardToBrainstorm(s, 'start', 'ship faster', ids); // c-1
  s = addCardToBrainstorm(s, 'stop', 'long meetings', ids); // c-2
  s = startGroup(s);
  s = startVote(s);
  s = setVoteBudget(s, 3);
  s = castVote(s, 'p-1', 'c-1');
  s = castVote(s, 'p-2', 'c-1');
  s = castVote(s, 'p-1', 'c-2');
  s = startDiscuss(s); // order: c-1, c-2
  // add actions on c-1
  s = advanceDiscussSegment(s);
  s = addDiscussNote(s, 'c-1', 'actions', 'fix flaky test', ids); // c-3
  s = addDiscussNote(s, 'c-1', 'actions', 'split payment service', ids); // c-4
  // move to next card context + actions
  s = advanceDiscussSegment(s); // c-2 context
  s = addDiscussNote(s, 'c-2', 'context', 'context note', ids); // c-5
  s = advanceDiscussSegment(s); // c-2 actions
  s = addDiscussNote(s, 'c-2', 'actions', 'timebox meetings', ids); // c-6
  return s;
}

describe('Review stage', () => {
  it('startReview transitions discuss -> review with 5:00 timer', () => {
    const s = startReview(baseInDiscuss());
    expect(s.stage).toBe('review');
    expect(s.timer?.durationMs).toBe(STAGE_DURATIONS.review);
    expect(STAGE_DURATIONS.review).toBe(5 * 60 * 1000);
    expect(s.discuss).toBeNull();
  });

  it('startReview only allowed from discuss', () => {
    expect(() => startReview(createRetro())).toThrow();
  });

  it('assignActionOwner sets owner', () => {
    let s = startReview(baseInDiscuss());
    s = assignActionOwner(s, 'c-3', 'p-1');
    expect(s.actionItemOwners['c-3']).toBe('p-1');
  });

  it('assignActionOwner(null) clears owner', () => {
    let s = startReview(baseInDiscuss());
    s = assignActionOwner(s, 'c-3', 'p-1');
    s = assignActionOwner(s, 'c-3', null);
    expect(s.actionItemOwners['c-3']).toBeUndefined();
  });

  it('assignActionOwner no-op for unknown note', () => {
    const s = startReview(baseInDiscuss());
    const next = assignActionOwner(s, 'nope', 'p-1');
    expect(next).toBe(s);
  });

  it('assignActionOwner no-op for unknown participant', () => {
    const s = startReview(baseInDiscuss());
    const next = assignActionOwner(s, 'c-3', 'nobody');
    expect(next).toBe(s);
  });

  it('assignActionOwner no-op for context note id', () => {
    const s = startReview(baseInDiscuss());
    const next = assignActionOwner(s, 'c-5', 'p-1');
    expect(next).toBe(s);
  });

  it('getActionItems returns ordered list with parent card and owner', () => {
    let s = startReview(baseInDiscuss());
    s = assignActionOwner(s, 'c-4', 'p-2');
    const items = getActionItems(s);
    expect(items.map((i) => i.note.id)).toEqual(['c-3', 'c-4', 'c-6']);
    expect(items.map((i) => i.parentCard.id)).toEqual(['c-1', 'c-1', 'c-2']);
    expect(items[0].ownerId).toBeNull();
    expect(items[1].ownerId).toBe('p-2');
    expect(items[2].ownerId).toBeNull();
  });
});
