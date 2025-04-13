import { describe, it, expect } from 'vitest';
import { AddParticipant } from '../../src/application/usecases/AddParticipant';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { IdGenerator } from '../../src/domain/ports/IdGenerator';

class SequentialIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

describe('AddParticipant use case', () => {
  it('adds a participant to the repository', () => {
    const repo = new InMemoryRetroRepository();
    const uc = new AddParticipant(repo, new SequentialIds());

    uc.execute('Alice');

    expect(repo.load().participants).toEqual([{ id: 'id-1', name: 'Alice' }]);
  });

  it('adds multiple participants', () => {
    const repo = new InMemoryRetroRepository();
    const uc = new AddParticipant(repo, new SequentialIds());

    uc.execute('Alice');
    uc.execute('Bob');

    expect(repo.load().participants.map((p) => p.name)).toEqual([
      'Alice',
      'Bob',
    ]);
  });

  it('propagates domain errors on duplicates', () => {
    const repo = new InMemoryRetroRepository();
    const uc = new AddParticipant(repo, new SequentialIds());
    uc.execute('Alice');
    expect(() => uc.execute('Alice')).toThrow();
  });
});
