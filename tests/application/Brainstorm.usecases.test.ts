import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartBrainstorm } from '../../src/application/usecases/StartBrainstorm';
import { AddCard } from '../../src/application/usecases/AddCard';
import { RemoveCard } from '../../src/application/usecases/RemoveCard';
import {
  addParticipant,
  createRetro,
  startIcebreaker,
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

describe('Brainstorm use cases', () => {
  let repo: InMemoryRetroRepository;

  beforeEach(() => {
    let s = createRetro();
    s = addParticipant(s, 'p-1', 'Alice');
    s = startIcebreaker(s, firstPicker);
    repo = new InMemoryRetroRepository(s);
  });

  it('StartBrainstorm advances stage and creates the timer', () => {
    new StartBrainstorm(repo).execute();
    const s = repo.load();
    expect(s.stage).toBe('brainstorm');
    expect(s.timer?.durationMs).toBe(5 * 60 * 1000);
  });

  it('AddCard adds cards in insertion order', () => {
    new StartBrainstorm(repo).execute();
    const add = new AddCard(repo, new SeqIds());
    add.execute('start', 'ship faster');
    add.execute('stop', 'long meetings');
    const cards = repo.load().cards;
    expect(cards.map((c) => c.text)).toEqual(['ship faster', 'long meetings']);
    expect(cards.map((c) => c.columnId)).toEqual(['start', 'stop']);
  });

  it('AddCard rejects empty + over-limit text via the domain', () => {
    new StartBrainstorm(repo).execute();
    const add = new AddCard(repo, new SeqIds());
    expect(() => add.execute('start', '   ')).toThrow();
    expect(() => add.execute('start', 'a'.repeat(141))).toThrow();
  });

  it('RemoveCard removes by id', () => {
    new StartBrainstorm(repo).execute();
    const add = new AddCard(repo, new SeqIds());
    add.execute('start', 'a');
    add.execute('stop', 'b');
    new RemoveCard(repo).execute('id-1');
    expect(repo.load().cards.map((c) => c.id)).toEqual(['id-2']);
  });
});
