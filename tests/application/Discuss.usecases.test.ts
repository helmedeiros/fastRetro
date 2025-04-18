import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartDiscuss } from '../../src/application/usecases/StartDiscuss';
import { AdvanceDiscussSegment } from '../../src/application/usecases/AdvanceDiscussSegment';
import { PreviousDiscussSegment } from '../../src/application/usecases/PreviousDiscussSegment';
import { AddDiscussNote } from '../../src/application/usecases/AddDiscussNote';
import { RemoveDiscussNote } from '../../src/application/usecases/RemoveDiscussNote';
import {
  addCardToBrainstorm,
  addParticipant,
  castVote,
  createRetro,
  startBrainstorm,
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

describe('Discuss use cases', () => {
  let repo: InMemoryRetroRepository;
  let ids: SeqIds;

  beforeEach(() => {
    ids = new SeqIds();
    let s = createRetro();
    s = addParticipant(s, 'p-1', 'Alice');
    s = startIcebreaker(s, firstPicker);
    s = startBrainstorm(s);
    s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
    s = addCardToBrainstorm(s, 'stop', 'long meetings', ids);
    s = startGroup(s);
    s = startVote(s);
    s = castVote(s, 'p-1', 'c-1');
    repo = new InMemoryRetroRepository(s);
  });

  it('StartDiscuss transitions to discuss', () => {
    new StartDiscuss(repo).execute();
    expect(repo.load().stage).toBe('discuss');
    expect(repo.load().discuss?.order[0]).toBe('c-1');
  });

  it('Advance and Previous segment use cases work', () => {
    new StartDiscuss(repo).execute();
    new AdvanceDiscussSegment(repo).execute();
    expect(repo.load().discuss?.segment).toBe('actions');
    new PreviousDiscussSegment(repo).execute();
    expect(repo.load().discuss?.segment).toBe('context');
  });

  it('AddDiscussNote and RemoveDiscussNote', () => {
    new StartDiscuss(repo).execute();
    new AddDiscussNote(repo, ids).execute('c-1', 'context', 'hi');
    expect(repo.load().discussNotes).toHaveLength(1);
    const id = repo.load().discussNotes[0].id;
    new RemoveDiscussNote(repo).execute(id);
    expect(repo.load().discussNotes).toHaveLength(0);
  });
});
