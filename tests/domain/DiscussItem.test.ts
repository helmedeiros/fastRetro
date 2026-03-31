import { describe, it, expect } from 'vitest';
import { medianForQuestion, getDiscussItems } from '../../src/domain/retro/DiscussItem';
import { createRetro, addParticipant, addCardToBrainstorm, startBrainstorm, startIcebreaker, castVote, startVote } from '../../src/domain/retro/Retro';
import type { RetroState } from '../../src/domain/retro/Retro';
import type { SurveyResponse } from '../../src/domain/retro/SurveyResponse';

const ids = (() => {
  let c = 0;
  return { next: () => `id-${String(++c)}` };
})();
const picker = { pick: (items: readonly string[]) => items[0] };

function buildRetroWithVotes(): RetroState {
  let state = createRetro({ type: 'retro', name: 'Test', date: '', context: '', templateId: 'start-stop' });
  state = addParticipant(state, 'p1', 'Alice');
  state = addParticipant(state, 'p2', 'Bob');
  state = startIcebreaker(state, picker);
  state = startBrainstorm(state);
  state = addCardToBrainstorm(state, 'start', 'Card A', ids);
  state = addCardToBrainstorm(state, 'stop', 'Card B', ids);
  state = addCardToBrainstorm(state, 'start', 'Card C', ids);
  state = startVote(state);
  const cardA = state.cards[0];
  const cardB = state.cards[1];
  state = castVote(state, 'p1', cardA.id);
  state = castVote(state, 'p2', cardA.id);
  state = castVote(state, 'p1', cardB.id);
  return state;
}

function buildCheckState(): RetroState {
  const responses: SurveyResponse[] = [
    { id: 'r1', participantId: 'p1', questionId: 'ownership', rating: 3, comment: '' },
    { id: 'r2', participantId: 'p2', questionId: 'ownership', rating: 5, comment: '' },
    { id: 'r3', participantId: 'p3', questionId: 'ownership', rating: 4, comment: '' },
    { id: 'r4', participantId: 'p1', questionId: 'value', rating: 1, comment: '' },
    { id: 'r5', participantId: 'p2', questionId: 'value', rating: 2, comment: '' },
    { id: 'r6', participantId: 'p1', questionId: 'fun', rating: 5, comment: '' },
    { id: 'r7', participantId: 'p2', questionId: 'fun', rating: 5, comment: '' },
  ];
  return {
    ...createRetro({ type: 'check', name: 'Health', date: '', context: '', templateId: 'health-check' }),
    stage: 'survey',
    participants: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Charlie' },
    ],
    surveyResponses: responses,
  };
}

describe('medianForQuestion', () => {
  const responses: SurveyResponse[] = [
    { id: 'r1', participantId: 'p1', questionId: 'q1', rating: 1, comment: '' },
    { id: 'r2', participantId: 'p2', questionId: 'q1', rating: 3, comment: '' },
    { id: 'r3', participantId: 'p3', questionId: 'q1', rating: 5, comment: '' },
    { id: 'r4', participantId: 'p1', questionId: 'q2', rating: 2, comment: '' },
    { id: 'r5', participantId: 'p2', questionId: 'q2', rating: 4, comment: '' },
  ];

  it('computes median for odd count', () => {
    expect(medianForQuestion(responses, 'q1')).toBe(3);
  });

  it('computes median for even count', () => {
    expect(medianForQuestion(responses, 'q2')).toBe(3);
  });

  it('returns 0 for no responses', () => {
    expect(medianForQuestion(responses, 'q-missing')).toBe(0);
  });

  it('returns the single rating for one response', () => {
    const single: SurveyResponse[] = [
      { id: 'r1', participantId: 'p1', questionId: 'q1', rating: 4, comment: '' },
    ];
    expect(medianForQuestion(single, 'q1')).toBe(4);
  });

  it('computes median correctly for two responses', () => {
    const two: SurveyResponse[] = [
      { id: 'r1', participantId: 'p1', questionId: 'q1', rating: 2, comment: '' },
      { id: 'r2', participantId: 'p2', questionId: 'q1', rating: 4, comment: '' },
    ];
    expect(medianForQuestion(two, 'q1')).toBe(3);
  });

  it('handles unsorted ratings correctly', () => {
    const unsorted: SurveyResponse[] = [
      { id: 'r1', participantId: 'p1', questionId: 'q1', rating: 5, comment: '' },
      { id: 'r2', participantId: 'p2', questionId: 'q1', rating: 1, comment: '' },
      { id: 'r3', participantId: 'p3', questionId: 'q1', rating: 3, comment: '' },
    ];
    expect(medianForQuestion(unsorted, 'q1')).toBe(3);
  });
});

describe('getDiscussItems', () => {
  describe('retro type', () => {
    it('returns items from votables ordered by votes descending', () => {
      const state = buildRetroWithVotes();
      const items = getDiscussItems(state);
      expect(items.length).toBe(3);
      expect(items[0].score).toBeGreaterThanOrEqual(items[1].score);
      expect(items[1].score).toBeGreaterThanOrEqual(items[2].score);
    });

    it('produces correct titles from card text', () => {
      const state = buildRetroWithVotes();
      const items = getDiscussItems(state);
      const titles = items.map((i) => i.title);
      expect(titles).toContain('Card A');
      expect(titles).toContain('Card B');
      expect(titles).toContain('Card C');
    });

    it('includes score label with vote count', () => {
      const state = buildRetroWithVotes();
      const items = getDiscussItems(state);
      const topItem = items[0];
      expect(topItem.scoreLabel).toBe('2 votes');
    });

    it('uses singular "vote" for 1 vote', () => {
      const state = buildRetroWithVotes();
      const items = getDiscussItems(state);
      const oneVote = items.find((i) => i.score === 1);
      expect(oneVote?.scoreLabel).toBe('1 vote');
    });

    it('includes participant ids of voters', () => {
      const state = buildRetroWithVotes();
      const items = getDiscussItems(state);
      const topItem = items[0];
      expect(topItem.participantIds).toContain('p1');
      expect(topItem.participantIds).toContain('p2');
    });

    it('returns empty description for retro items', () => {
      const state = buildRetroWithVotes();
      const items = getDiscussItems(state);
      for (const item of items) {
        expect(item.description).toBe('');
      }
    });
  });

  describe('check type', () => {
    it('returns items from template questions', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      expect(items.length).toBe(9);
    });

    it('orders by median ascending (worst first)', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      for (let i = 1; i < items.length; i++) {
        expect(items[i].score).toBeGreaterThanOrEqual(items[i - 1].score);
      }
    });

    it('uses question title as item title', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const titles = items.map((i) => i.title);
      expect(titles).toContain('Ownership');
      expect(titles).toContain('Value');
      expect(titles).toContain('Fun');
    });

    it('includes question description', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const ownership = items.find((i) => i.title === 'Ownership');
      expect(ownership?.description.length).toBeGreaterThan(0);
    });

    it('computes median score for each question', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const ownership = items.find((i) => i.id === 'ownership');
      expect(ownership?.score).toBe(4);
      const value = items.find((i) => i.id === 'value');
      expect(value?.score).toBe(1.5);
    });

    it('shows "No ratings" for unrated questions', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const communication = items.find((i) => i.id === 'communication');
      expect(communication?.score).toBe(0);
      expect(communication?.scoreLabel).toBe('No ratings');
    });

    it('formats score label as decimal', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const ownership = items.find((i) => i.id === 'ownership');
      expect(ownership?.scoreLabel).toBe('4.0');
    });

    it('includes participant ids who rated each question', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const ownership = items.find((i) => i.id === 'ownership');
      expect(ownership?.participantIds).toHaveLength(3);
      expect(ownership?.participantIds).toContain('p1');
    });

    it('returns empty participants for unrated questions', () => {
      const state = buildCheckState();
      const items = getDiscussItems(state);
      const communication = items.find((i) => i.id === 'communication');
      expect(communication?.participantIds).toHaveLength(0);
    });
  });
});
