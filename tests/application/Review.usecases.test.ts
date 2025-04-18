import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartReview } from '../../src/application/usecases/StartReview';
import { AssignActionOwner } from '../../src/application/usecases/AssignActionOwner';
import {
  addCardToBrainstorm,
  addDiscussNote,
  addParticipant,
  advanceDiscussSegment,
  castVote,
  createRetro,
  startBrainstorm,
  startDiscuss,
  startGroup,
  startIcebreaker,
  startVote,
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
    return `c-${String(this.n)}`;
  }
}

describe('Review use cases', () => {
  let repo: InMemoryRetroRepository;

  beforeEach(() => {
    const ids = new SeqIds();
    let s = createRetro();
    s = addParticipant(s, 'p-1', 'Alice');
    s = startIcebreaker(s, firstPicker);
    s = startBrainstorm(s);
    s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
    s = startGroup(s);
    s = startVote(s);
    s = castVote(s, 'p-1', 'c-1');
    s = startDiscuss(s);
    s = advanceDiscussSegment(s);
    s = addDiscussNote(s, 'c-1', 'actions', 'fix flaky test', ids);
    repo = new InMemoryRetroRepository(s);
  });

  it('StartReview transitions to review', () => {
    new StartReview(repo).execute();
    expect(repo.load().stage).toBe('review');
  });

  it('AssignActionOwner sets and clears owner', () => {
    new StartReview(repo).execute();
    const noteId = repo.load().discussNotes[0].id;
    new AssignActionOwner(repo).execute(noteId, 'p-1');
    expect(repo.load().actionItemOwners[noteId]).toBe('p-1');
    new AssignActionOwner(repo).execute(noteId, null);
    expect(repo.load().actionItemOwners[noteId]).toBeUndefined();
  });
});
