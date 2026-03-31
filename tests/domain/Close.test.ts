import { describe, it, expect } from 'vitest';
import {
  addCardToBrainstorm,
  addDiscussNote,
  addParticipant,
  advanceDiscussSegment,
  assignActionOwner,
  castVote,
  createRetro,
  getCloseSummary,
  serializeRetroToExportJson,
  setVoteBudget,
  startBrainstorm,
  startClose,
  startDiscuss,
  startGroup,
  startIcebreaker,
  startReview,
  startVote,
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

function fixture(): RetroState {
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
  s = startDiscuss(s);
  s = addDiscussNote(s, 'c-1', 'context', 'CI is flaky', ids); // c-3
  s = advanceDiscussSegment(s);
  s = addDiscussNote(s, 'c-1', 'actions', 'fix flaky test', ids); // c-4
  s = advanceDiscussSegment(s);
  s = addDiscussNote(s, 'c-2', 'context', 'too many topics', ids); // c-5
  s = advanceDiscussSegment(s);
  s = addDiscussNote(s, 'c-2', 'actions', 'timebox meetings', ids); // c-6
  s = startReview(s);
  s = assignActionOwner(s, 'c-4', 'p-1');
  return s;
}

describe('Close stage', () => {
  it('startClose transitions review -> close with no timer', () => {
    const s = startClose(fixture());
    expect(s.stage).toBe('close');
    expect(s.timer).toBeNull();
  });

  it('startClose throws from non-review stages', () => {
    expect(() => startClose(createRetro())).toThrow();
  });

  it('getCloseSummary groups cards by votes with context + actions + owners', () => {
    const s = startClose(fixture());
    const summary = getCloseSummary(s);
    const idOf = (d: (typeof summary.discussed)[number]): string => {
      if (d.kind === 'card') return d.card.id;
      if (d.kind === 'group') return d.group.id;
      return d.question.id;
    };
    const votesOf = (d: (typeof summary.discussed)[number]): number => {
      if (d.kind === 'card') return d.card.votes;
      if (d.kind === 'group') return d.group.votes;
      return 0;
    };
    expect(summary.discussed.map(idOf)).toEqual(['c-1', 'c-2']);
    expect(votesOf(summary.discussed[0])).toBe(2);
    expect(votesOf(summary.discussed[1])).toBe(1);
    const first = summary.discussed[0];
    expect(first.kind !== 'question' && first.contextNotes.map((n) => n.id)).toEqual(['c-3']);
    expect(summary.discussed[0].actionItems.map((a) => a.note.id)).toEqual([
      'c-4',
    ]);
    expect(summary.discussed[0].actionItems[0].owner?.name).toBe('Alice');
    expect(summary.discussed[1].actionItems[0].owner).toBeNull();
    expect(summary.allActionItems.map((a) => a.note.id)).toEqual([
      'c-4',
      'c-6',
    ]);
    expect(summary.allActionItems[0].owner?.id).toBe('p-1');
  });

  it('getCloseSummary resolves null owner when assigned participant was removed', () => {
    let s = fixture();
    // Simulate dangling owner id by manually mutating — instead, assign then rely on remove path
    s = startClose(s);
    // assignActionOwner earlier set c-4 -> p-1; craft a state with a stale owner
    const stale: RetroState = {
      ...s,
      actionItemOwners: { ...s.actionItemOwners, 'c-4': 'ghost' },
    };
    const summary = getCloseSummary(stale);
    expect(summary.discussed[0].actionItems[0].owner).toBeNull();
    expect(summary.allActionItems[0].owner).toBeNull();
  });

  it('serializeRetroToExportJson produces schema v1', () => {
    const s = startClose(fixture());
    const json = serializeRetroToExportJson(s, '2025-01-01T00:00:00.000Z');
    expect(json).toEqual({
      version: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      participants: [
        { id: 'p-1', name: 'Alice' },
        { id: 'p-2', name: 'Bob' },
      ],
      icebreaker: {
        question: s.icebreaker?.question,
        rotation: ['p-1', 'p-2'],
      },
      columns: {
        start: [{ id: 'c-1', columnId: 'start', text: 'ship faster' }],
        stop: [{ id: 'c-2', columnId: 'stop', text: 'long meetings' }],
      },
      groups: [],
      votes: [
        { participantId: 'p-1', cardId: 'c-1' },
        { participantId: 'p-2', cardId: 'c-1' },
        { participantId: 'p-1', cardId: 'c-2' },
      ],
      discussion: [
        {
          cardId: 'c-1',
          context: [
            {
              id: 'c-3',
              parentCardId: 'c-1',
              lane: 'context',
              text: 'CI is flaky',
            },
          ],
          actionItems: [
            {
              id: 'c-4',
              parentCardId: 'c-1',
              lane: 'actions',
              text: 'fix flaky test',
            },
          ],
        },
        {
          cardId: 'c-2',
          context: [
            {
              id: 'c-5',
              parentCardId: 'c-2',
              lane: 'context',
              text: 'too many topics',
            },
          ],
          actionItems: [
            {
              id: 'c-6',
              parentCardId: 'c-2',
              lane: 'actions',
              text: 'timebox meetings',
            },
          ],
        },
      ],
      actionItems: [
        { id: 'c-4', text: 'fix flaky test', ownerId: 'p-1' },
        { id: 'c-6', text: 'timebox meetings', ownerId: null },
      ],
    });
  });

  it('serializeRetroToExportJson handles empty icebreaker', () => {
    const json = serializeRetroToExportJson(
      createRetro(),
      '2025-01-01T00:00:00.000Z',
    );
    expect(json.icebreaker).toBeNull();
    expect(json.participants).toEqual([]);
    expect(json.columns).toEqual({ start: [], stop: [] });
    expect(json.groups).toEqual([]);
  });

  it('getCloseSummary produces question entries for check type', () => {
    const state: RetroState = {
      ...createRetro({ type: 'check', name: 'HC', date: '', context: '', templateId: 'health-check' }),
      stage: 'close',
      participants: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      surveyResponses: [
        { id: 'r1', participantId: 'p1', questionId: 'ownership', rating: 4, comment: '' },
        { id: 'r2', participantId: 'p2', questionId: 'ownership', rating: 2, comment: '' },
        { id: 'r3', participantId: 'p1', questionId: 'value', rating: 5, comment: '' },
      ],
      discussNotes: [
        { id: 'n1', parentCardId: 'ownership', lane: 'actions', text: 'Clarify ownership' },
      ],
      actionItemOwners: { n1: 'p1' },
    };
    const summary = getCloseSummary(state);
    expect(summary.discussed.length).toBe(9);
    const ownership = summary.discussed.find(
      (d) => d.kind === 'question' && d.question.id === 'ownership',
    );
    expect(ownership).toBeDefined();
    if (ownership?.kind === 'question') {
      expect(ownership.question.median).toBe(3);
      expect(ownership.actionItems).toHaveLength(1);
      expect(ownership.actionItems[0].owner?.name).toBe('Alice');
    }
    expect(summary.allActionItems).toHaveLength(1);
    expect(summary.allActionItems[0].parentCard.text).toBe('Ownership');
  });
});
