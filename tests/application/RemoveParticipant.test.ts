import { describe, it, expect } from 'vitest';
import { AddParticipant } from '../../src/application/usecases/AddParticipant';
import { RemoveParticipant } from '../../src/application/usecases/RemoveParticipant';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { IdGenerator } from '../../src/domain/ports/IdGenerator';

class SequentialIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

describe('RemoveParticipant use case', () => {
  it('removes a participant by id', () => {
    const repo = new InMemoryRetroRepository();
    const add = new AddParticipant(repo, new SequentialIds());
    const remove = new RemoveParticipant(repo);

    add.execute('Alice');
    add.execute('Bob');
    remove.execute('id-1');

    expect(repo.load().participants.map((p) => p.name)).toEqual(['Bob']);
  });

  it('throws when id is unknown', () => {
    const repo = new InMemoryRetroRepository();
    const remove = new RemoveParticipant(repo);
    expect(() => remove.execute('nope')).toThrow();
  });
});
