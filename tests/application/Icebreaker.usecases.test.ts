import { describe, it, expect } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartIcebreaker } from '../../src/application/usecases/StartIcebreaker';
import { AdvanceIcebreaker } from '../../src/application/usecases/AdvanceIcebreaker';
import { addParticipant, createRetro } from '../../src/domain/retro/Retro';
import { ICEBREAKER_QUESTIONS } from '../../src/domain/retro/stages/Icebreaker';
import type { Picker } from '../../src/domain/ports/Picker';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

function seededRepo(): InMemoryRetroRepository {
  let s = createRetro();
  s = addParticipant(s, 'id-1', 'Alice');
  s = addParticipant(s, 'id-2', 'Bob');
  return new InMemoryRetroRepository(s);
}

describe('Icebreaker use cases', () => {
  it('StartIcebreaker uses the injected picker and saves state', () => {
    const repo = seededRepo();
    new StartIcebreaker(repo, firstPicker).execute();
    const s = repo.load();
    expect(s.stage).toBe('icebreaker');
    expect(s.icebreaker?.question).toBe(ICEBREAKER_QUESTIONS[0]);
    expect(s.icebreaker?.currentIndex).toBe(0);
  });

  it('AdvanceIcebreaker rotates the current participant', () => {
    const repo = seededRepo();
    new StartIcebreaker(repo, firstPicker).execute();
    new AdvanceIcebreaker(repo).execute();
    expect(repo.load().icebreaker?.currentIndex).toBe(1);
  });

  it('AdvanceIcebreaker clamps at the last participant', () => {
    const repo = seededRepo();
    new StartIcebreaker(repo, firstPicker).execute();
    new AdvanceIcebreaker(repo).execute();
    new AdvanceIcebreaker(repo).execute();
    expect(repo.load().icebreaker?.currentIndex).toBe(1);
  });
});
