import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartIcebreaker } from '../../src/application/usecases/StartIcebreaker';
import { StartTimer } from '../../src/application/usecases/StartTimer';
import { PauseTimer } from '../../src/application/usecases/PauseTimer';
import { ResumeTimer } from '../../src/application/usecases/ResumeTimer';
import { ResetTimer } from '../../src/application/usecases/ResetTimer';
import { TickTimer } from '../../src/application/usecases/TickTimer';
import { addParticipant, createRetro } from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

function seededRepo(): InMemoryRetroRepository {
  return new InMemoryRetroRepository(
    addParticipant(createRetro(), 'id-1', 'Alice'),
  );
}

describe('Timer use cases', () => {
  let repo: InMemoryRetroRepository;

  beforeEach(() => {
    repo = seededRepo();
    new StartIcebreaker(repo, firstPicker).execute();
  });

  it('StartIcebreaker moves stage to icebreaker with an idle timer', () => {
    const s = repo.load();
    expect(s.stage).toBe('icebreaker');
    expect(s.timer?.status).toBe('idle');
  });

  it('StartTimer starts the running timer', () => {
    new StartTimer(repo).execute();
    expect(repo.load().timer?.status).toBe('running');
  });

  it('TickTimer advances elapsed when running', () => {
    new StartTimer(repo).execute();
    new TickTimer(repo).execute(1500);
    expect(repo.load().timer?.elapsedMs).toBe(1500);
  });

  it('PauseTimer/ResumeTimer cycle works', () => {
    new StartTimer(repo).execute();
    new TickTimer(repo).execute(1000);
    new PauseTimer(repo).execute();
    expect(repo.load().timer?.status).toBe('paused');
    new TickTimer(repo).execute(5000);
    expect(repo.load().timer?.elapsedMs).toBe(1000);
    new ResumeTimer(repo).execute();
    expect(repo.load().timer?.status).toBe('running');
  });

  it('ResetTimer returns the timer to idle', () => {
    new StartTimer(repo).execute();
    new TickTimer(repo).execute(2500);
    new ResetTimer(repo).execute();
    const t = repo.load().timer;
    expect(t?.status).toBe('idle');
    expect(t?.elapsedMs).toBe(0);
  });
});

describe('StartIcebreaker guard', () => {
  it('throws when there are no participants', () => {
    const repo = new InMemoryRetroRepository();
    expect(() => new StartIcebreaker(repo, firstPicker).execute()).toThrow();
  });
});
