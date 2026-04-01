import { describe, it, expect } from 'vitest';
import { InMemoryTeamRepository } from '../../src/adapters/storage/InMemoryTeamRepository';
import { ReturnToDashboard } from '../../src/application/usecases/ReturnToDashboard';
import {
  createRetro,
  addParticipant,
  startIcebreaker,
  startBrainstorm,
  addCardToBrainstorm,
  startGroup,
  startVote,
  castVote,
  startDiscuss,
  addDiscussNote,
  advanceDiscussSegment,
  startReview,
  assignActionOwner,
  startClose,
  startSurvey,
  submitSurveyResponse,
} from '../../src/domain/retro/Retro';

let counter = 0;
const ids = { next: () => `id-${String(++counter)}` };
const picker = { pick: (items: readonly string[]) => items[0] };
const noop = (): (() => void) => () => undefined;
const clock = { now: () => Date.parse('2025-04-25T12:00:00Z'), subscribe: noop };

function buildClosedRetro() {
  let s = createRetro();
  s = addParticipant(s, 'p1', 'Alice');
  s = startIcebreaker(s, picker);
  s = startBrainstorm(s);
  s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
  s = startGroup(s);
  s = startVote(s);
  s = castVote(s, 'p1', s.cards[0].id);
  s = startDiscuss(s);
  s = addDiscussNote(s, s.cards[0].id, 'context', 'CI flaky', ids);
  s = advanceDiscussSegment(s);
  s = addDiscussNote(s, s.cards[0].id, 'actions', 'fix tests', ids);
  s = startReview(s);
  s = assignActionOwner(s, s.discussNotes.find((n) => n.lane === 'actions')!.id, 'p1');
  s = startClose(s);
  return s;
}

describe('ReturnToDashboard', () => {
  it('archives a closed retro to history and clears active', () => {
    const repo = new InMemoryTeamRepository();
    const closed = buildClosedRetro();
    repo.saveActiveRetro(closed);
    new ReturnToDashboard(repo, ids, clock).execute();
    expect(repo.loadActiveRetro()).toBeNull();
    const history = repo.loadHistory();
    expect(history.completed).toHaveLength(1);
    expect(history.completed[0].actionItems).toHaveLength(1);
    expect(history.completed[0].actionItems[0].text).toBe('fix tests');
    expect(history.completed[0].actionItems[0].ownerName).toBe('Alice');
  });

  it('does nothing when no active retro', () => {
    const repo = new InMemoryTeamRepository();
    new ReturnToDashboard(repo, ids, clock).execute();
    expect(repo.loadHistory().completed).toHaveLength(0);
  });

  it('archives a closed check with question-based action items', () => {
    let s = createRetro({
      type: 'check',
      name: 'Health Check',
      date: '2026-04-01',
      context: '',
      templateId: 'health-check',
    });
    s = addParticipant(s, 'p1', 'Alice');
    s = startIcebreaker(s, picker);
    s = startSurvey(s);
    s = submitSurveyResponse(s, 'p1', 'ownership', 2, '', ids);
    s = startDiscuss(s);
    s = addDiscussNote(s, 'ownership', 'actions', 'Clarify ownership', ids);
    s = startReview(s);
    s = assignActionOwner(
      s,
      s.discussNotes.find((n) => n.lane === 'actions')!.id,
      'p1',
    );
    s = startClose(s);

    const repo = new InMemoryTeamRepository();
    repo.saveActiveRetro(s);
    new ReturnToDashboard(repo, ids, clock).execute();

    expect(repo.loadActiveRetro()).toBeNull();
    const history = repo.loadHistory();
    expect(history.completed).toHaveLength(1);
    expect(history.completed[0].actionItems).toHaveLength(1);
    expect(history.completed[0].actionItems[0].text).toBe('Clarify ownership');
    expect(history.completed[0].actionItems[0].parentText).toBe('Ownership');
    expect(history.completed[0].actionItems[0].ownerName).toBe('Alice');
  });
});
