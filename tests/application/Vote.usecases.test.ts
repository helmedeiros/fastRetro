import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartVote } from '../../src/application/usecases/StartVote';
import { CastVote } from '../../src/application/usecases/CastVote';
import { SetVoteBudget } from '../../src/application/usecases/SetVoteBudget';
import {
  addCardToBrainstorm,
  addParticipant,
  createRetro,
  startBrainstorm,
  startIcebreaker,
  votesForCard,
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

describe('Vote use cases', () => {
  let repo: InMemoryRetroRepository;

  beforeEach(() => {
    let s = createRetro();
    s = addParticipant(s, 'p-1', 'Alice');
    s = addParticipant(s, 'p-2', 'Bob');
    s = startIcebreaker(s, firstPicker);
    s = startBrainstorm(s);
    const ids = new SeqIds();
    s = addCardToBrainstorm(s, 'start', 'ship faster', ids);
    s = addCardToBrainstorm(s, 'stop', 'long meetings', ids);
    repo = new InMemoryRetroRepository(s);
  });

  it('StartVote advances stage and creates 5-min timer', () => {
    new StartVote(repo).execute();
    const s = repo.load();
    expect(s.stage).toBe('vote');
    expect(s.timer?.durationMs).toBe(5 * 60 * 1000);
  });

  it('CastVote toggles a vote', () => {
    new StartVote(repo).execute();
    const cast = new CastVote(repo);
    cast.execute('p-1', 'id-1');
    expect(votesForCard(repo.load(), 'id-1')).toBe(1);
    cast.execute('p-1', 'id-1');
    expect(votesForCard(repo.load(), 'id-1')).toBe(0);
  });

  it('SetVoteBudget persists', () => {
    new StartVote(repo).execute();
    new SetVoteBudget(repo).execute(1);
    expect(repo.load().voteBudget).toBe(1);
    const cast = new CastVote(repo);
    cast.execute('p-1', 'id-1');
    cast.execute('p-1', 'id-2');
    expect(votesForCard(repo.load(), 'id-2')).toBe(0);
  });
});
