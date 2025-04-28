import { describe, it, expect } from 'vitest';
import {
  ICEBREAKER_QUESTIONS,
  createIcebreaker,
  currentQuestion,
  isAtEnd,
  nextParticipant,
} from '../../src/domain/retro/stages/Icebreaker';
import type { Picker } from '../../src/domain/ports/Picker';
import type { Participant } from '../../src/domain/retro/Participant';

let pickIndex = 0;
const sequentialPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[pickIndex++ % items.length] as T,
};

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

const lastPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[items.length - 1] as T,
};

const participants: readonly Participant[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Carol' },
];

describe('ICEBREAKER_QUESTIONS', () => {
  it('has at least 10 non-empty entries', () => {
    expect(ICEBREAKER_QUESTIONS.length).toBeGreaterThanOrEqual(10);
    for (const q of ICEBREAKER_QUESTIONS) {
      expect(typeof q).toBe('string');
      expect(q.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('createIcebreaker', () => {
  it('picks a question per participant and starts at index 0', () => {
    const s = createIcebreaker(participants, ICEBREAKER_QUESTIONS, firstPicker);
    expect(s.question).toBe(ICEBREAKER_QUESTIONS[0]);
    expect(s.questions).toHaveLength(3);
    expect(s.currentIndex).toBe(0);
    expect(s.participantIds).toEqual(['a', 'b', 'c']);
  });

  it('uses the picker deterministically', () => {
    const s = createIcebreaker(participants, ICEBREAKER_QUESTIONS, lastPicker);
    expect(s.question).toBe(
      ICEBREAKER_QUESTIONS[ICEBREAKER_QUESTIONS.length - 1],
    );
  });

  it('throws on empty participants', () => {
    expect(() =>
      createIcebreaker([], ICEBREAKER_QUESTIONS, firstPicker),
    ).toThrow(/participant/i);
  });

  it('throws on empty question pool', () => {
    expect(() => createIcebreaker(participants, [], firstPicker)).toThrow(
      /question/i,
    );
  });
});

describe('nextParticipant / isAtEnd / currentQuestion', () => {
  it('advances the index and changes the question', () => {
    pickIndex = 0;
    let s = createIcebreaker(participants, ICEBREAKER_QUESTIONS, sequentialPicker);
    const q0 = currentQuestion(s);
    expect(q0).toBe(s.questions[0]);
    expect(isAtEnd(s)).toBe(false);

    s = nextParticipant(s);
    const q1 = currentQuestion(s);
    expect(s.currentIndex).toBe(1);
    expect(q1).toBe(s.questions[1]);
    expect(q1).not.toBe(q0);
    expect(isAtEnd(s)).toBe(false);

    s = nextParticipant(s);
    const q2 = currentQuestion(s);
    expect(s.currentIndex).toBe(2);
    expect(q2).toBe(s.questions[2]);
    expect(isAtEnd(s)).toBe(true);
  });

  it('clamps at the last participant', () => {
    let s = createIcebreaker(
      [{ id: 'x', name: 'Only' }],
      ICEBREAKER_QUESTIONS,
      firstPicker,
    );
    expect(isAtEnd(s)).toBe(true);
    s = nextParticipant(s);
    expect(s.currentIndex).toBe(0);
  });
});
