import { describe, it, expect } from 'vitest';
import {
  addCardToBrainstorm,
  addDiscussNote,
  addParticipant,
  advanceDiscussSegment,
  castVote,
  createRetro,
  previousDiscussSegment,
  removeDiscussNote,
  setVoteBudget,
  startBrainstorm,
  startDiscuss,
  startGroup,
  startIcebreaker,
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

function baseWithCards(): RetroState {
  let s = createRetro();
  s = addParticipant(s, 'p-1', 'Alice');
  s = addParticipant(s, 'p-2', 'Bob');
  s = startIcebreaker(s, firstPicker);
  s = startBrainstorm(s);
  const ids = new SeqIds();
  s = addCardToBrainstorm(s, 'start', 'A', ids); // c-1
  s = addCardToBrainstorm(s, 'start', 'B', ids); // c-2
  s = addCardToBrainstorm(s, 'stop', 'C', ids); // c-3
  s = startGroup(s);
  s = startVote(s);
  s = setVoteBudget(s, 3);
  // A:2 votes, C:1 vote, B:0 votes -> order [c-1, c-3, c-2]
  s = castVote(s, 'p-1', 'c-1');
  s = castVote(s, 'p-2', 'c-1');
  s = castVote(s, 'p-1', 'c-3');
  return s;
}

describe('Discuss stage', () => {
  it('startDiscuss orders cards by votes desc with insertion tie-break', () => {
    const s = startDiscuss(baseWithCards());
    expect(s.stage).toBe('discuss');
    expect(s.discuss?.order).toEqual(['c-1', 'c-3', 'c-2']);
    expect(s.discuss?.currentIndex).toBe(0);
    expect(s.discuss?.segment).toBe('context');
    expect(s.timer?.durationMs).toBe(STAGE_DURATIONS.discuss);
    expect(STAGE_DURATIONS.discuss).toBe(2.5 * 60 * 1000);
  });

  it('startDiscuss only allowed from vote stage', () => {
    expect(() => startDiscuss(createRetro())).toThrow();
  });

  it('advanceDiscussSegment: context -> actions same card, timer reset', () => {
    let s = startDiscuss(baseWithCards());
    s = advanceDiscussSegment(s);
    expect(s.discuss?.segment).toBe('actions');
    expect(s.discuss?.currentIndex).toBe(0);
    expect(s.timer?.durationMs).toBe(STAGE_DURATIONS.discuss);
  });

  it('advanceDiscussSegment: actions -> next card context', () => {
    let s = startDiscuss(baseWithCards());
    s = advanceDiscussSegment(s); // actions of 0
    s = advanceDiscussSegment(s); // context of 1
    expect(s.discuss?.currentIndex).toBe(1);
    expect(s.discuss?.segment).toBe('context');
  });

  it('advanceDiscussSegment: actions of last card is a no-op', () => {
    let s = startDiscuss(baseWithCards());
    // order length 3: navigate to actions of last
    s = advanceDiscussSegment(s); // idx0 actions
    s = advanceDiscussSegment(s); // idx1 context
    s = advanceDiscussSegment(s); // idx1 actions
    s = advanceDiscussSegment(s); // idx2 context
    s = advanceDiscussSegment(s); // idx2 actions
    const before = s;
    s = advanceDiscussSegment(s);
    expect(s).toBe(before);
  });

  it('previousDiscussSegment: actions -> context same card', () => {
    let s = startDiscuss(baseWithCards());
    s = advanceDiscussSegment(s); // actions
    s = previousDiscussSegment(s);
    expect(s.discuss?.segment).toBe('context');
    expect(s.discuss?.currentIndex).toBe(0);
  });

  it('previousDiscussSegment: context non-first -> previous card actions', () => {
    let s = startDiscuss(baseWithCards());
    s = advanceDiscussSegment(s);
    s = advanceDiscussSegment(s); // idx1 context
    s = previousDiscussSegment(s);
    expect(s.discuss?.currentIndex).toBe(0);
    expect(s.discuss?.segment).toBe('actions');
  });

  it('previousDiscussSegment: context of first card is a no-op', () => {
    const s = startDiscuss(baseWithCards());
    const next = previousDiscussSegment(s);
    expect(next).toBe(s);
  });

  it('previousDiscussSegment requires active discuss', () => {
    expect(() => previousDiscussSegment(createRetro())).toThrow();
  });

  it('advanceDiscussSegment requires active discuss', () => {
    expect(() => advanceDiscussSegment(createRetro())).toThrow();
  });

  it('addDiscussNote creates a trimmed note under a card', () => {
    let s = startDiscuss(baseWithCards());
    const ids = new SeqIds();
    s = addDiscussNote(s, 'c-1', 'context', '  hello  ', ids);
    expect(s.discussNotes).toHaveLength(1);
    expect(s.discussNotes[0].text).toBe('hello');
    expect(s.discussNotes[0].lane).toBe('context');
    expect(s.discussNotes[0].parentCardId).toBe('c-1');
  });

  it('addDiscussNote rejects empty text', () => {
    const s = startDiscuss(baseWithCards());
    const ids = new SeqIds();
    expect(() => addDiscussNote(s, 'c-1', 'context', '   ', ids)).toThrow();
  });

  it('addDiscussNote rejects >140 chars', () => {
    const s = startDiscuss(baseWithCards());
    const ids = new SeqIds();
    expect(() =>
      addDiscussNote(s, 'c-1', 'context', 'x'.repeat(141), ids),
    ).toThrow();
  });

  it('addDiscussNote rejects unknown card', () => {
    const s = startDiscuss(baseWithCards());
    const ids = new SeqIds();
    expect(() => addDiscussNote(s, 'nope', 'context', 'hi', ids)).toThrow();
  });

  it('addDiscussNote only in discuss stage', () => {
    const s = baseWithCards();
    const ids = new SeqIds();
    expect(() => addDiscussNote(s, 'c-1', 'context', 'hi', ids)).toThrow();
  });

  it('removeDiscussNote drops the note', () => {
    let s = startDiscuss(baseWithCards());
    const ids = new SeqIds();
    s = addDiscussNote(s, 'c-1', 'context', 'hi', ids);
    const noteId = s.discussNotes[0].id;
    s = removeDiscussNote(s, noteId);
    expect(s.discussNotes).toHaveLength(0);
  });

  it('removeDiscussNote throws for unknown id', () => {
    const s = startDiscuss(baseWithCards());
    expect(() => removeDiscussNote(s, 'nope')).toThrow();
  });

  it('removeDiscussNote only in discuss stage', () => {
    const s = baseWithCards();
    expect(() => removeDiscussNote(s, 'x')).toThrow();
  });
});
