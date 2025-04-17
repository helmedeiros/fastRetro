import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageRetroRepository,
  STORAGE_KEY,
} from '../../src/adapters/storage/LocalStorageRetroRepository';
import {
  addCardToBrainstorm,
  addDiscussNote,
  addParticipant,
  advanceDiscussSegment,
  advanceIcebreakerParticipant,
  assignActionOwner,
  castVote,
  createRetro,
  setVoteBudget,
  startReview,
  startBrainstorm,
  startDiscuss,
  startIcebreaker,
  startRetroTimer,
  startVote,
  tickRetroTimer,
  pauseRetroTimer,
} from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';
import type { IdGenerator } from '../../src/domain/ports/IdGenerator';

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `c-${String(this.n)}`;
  }
}

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('LocalStorageRetroRepository', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('returns a fresh empty Retro when storage is empty', () => {
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('round-trips state through save() and load()', () => {
    const repo = new LocalStorageRetroRepository(storage);
    let state = createRetro();
    state = addParticipant(state, 'id-1', 'Alice');
    state = addParticipant(state, 'id-2', 'Bob');
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
  });

  it('returns a fresh empty Retro when stored JSON is corrupt', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('returns a fresh empty Retro when schema version mismatches', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, retro: { participants: [] } }),
    );
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('returns a fresh empty Retro when prior v6 payload is found', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 6, retro: { participants: [] } }),
    );
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('round-trips review stage with action item owners', () => {
    const repo = new LocalStorageRetroRepository(storage);
    const ids = new SeqIds();
    let state = createRetro();
    state = addParticipant(state, 'p-1', 'Alice');
    state = startIcebreaker(state, firstPicker);
    state = startBrainstorm(state);
    state = addCardToBrainstorm(state, 'start', 'ship faster', ids);
    state = startVote(state);
    state = castVote(state, 'p-1', 'c-1');
    state = startDiscuss(state);
    state = advanceDiscussSegment(state);
    state = addDiscussNote(state, 'c-1', 'actions', 'fix flaky test', ids);
    const noteId = state.discussNotes[0].id;
    state = startReview(state);
    state = assignActionOwner(state, noteId, 'p-1');
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
    expect(loaded.stage).toBe('review');
    expect(loaded.actionItemOwners[noteId]).toBe('p-1');
  });

  it('returns a fresh empty Retro when payload shape is invalid', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 5, retro: { participants: 'nope' } }),
    );
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('persists under the versioned key', () => {
    const repo = new LocalStorageRetroRepository(storage);
    repo.save(addParticipant(createRetro(), 'id-1', 'Alice'));
    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(STORAGE_KEY).toBe('fastretro:state:v7');
    const parsed = JSON.parse(raw as string) as { version: number };
    expect(parsed.version).toBe(7);
  });

  it('round-trips stage, timer, and icebreaker state', () => {
    const repo = new LocalStorageRetroRepository(storage);
    let state = createRetro();
    state = addParticipant(state, 'id-1', 'Alice');
    state = addParticipant(state, 'id-2', 'Bob');
    state = startIcebreaker(state, firstPicker);
    state = startRetroTimer(state);
    state = tickRetroTimer(state, 2500);
    state = pauseRetroTimer(state);
    state = advanceIcebreakerParticipant(state);
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
    expect(loaded.stage).toBe('icebreaker');
    expect(loaded.timer?.status).toBe('paused');
    expect(loaded.timer?.elapsedMs).toBe(2500);
    expect(loaded.icebreaker?.currentIndex).toBe(1);
    expect(loaded.icebreaker?.question).toBeTruthy();
  });

  it('round-trips brainstorm stage and cards', () => {
    const repo = new LocalStorageRetroRepository(storage);
    const ids = new SeqIds();
    let state = createRetro();
    state = addParticipant(state, 'p-1', 'Alice');
    state = startIcebreaker(state, firstPicker);
    state = startBrainstorm(state);
    state = addCardToBrainstorm(state, 'start', 'ship faster', ids);
    state = addCardToBrainstorm(state, 'stop', 'long meetings', ids);
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
    expect(loaded.stage).toBe('brainstorm');
    expect(loaded.cards.map((c) => c.text)).toEqual([
      'ship faster',
      'long meetings',
    ]);
    expect(loaded.cards.map((c) => c.columnId)).toEqual(['start', 'stop']);
  });

  it('round-trips vote stage with votes and budget', () => {
    const repo = new LocalStorageRetroRepository(storage);
    const ids = new SeqIds();
    let state = createRetro();
    state = addParticipant(state, 'p-1', 'Alice');
    state = addParticipant(state, 'p-2', 'Bob');
    state = startIcebreaker(state, firstPicker);
    state = startBrainstorm(state);
    state = addCardToBrainstorm(state, 'start', 'ship faster', ids);
    state = addCardToBrainstorm(state, 'stop', 'long meetings', ids);
    state = startVote(state);
    state = setVoteBudget(state, 2);
    state = castVote(state, 'p-1', 'c-1');
    state = castVote(state, 'p-2', 'c-1');
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
    expect(loaded.stage).toBe('vote');
    expect(loaded.voteBudget).toBe(2);
    expect(loaded.votes).toHaveLength(2);
  });

  it('round-trips discuss stage with notes', () => {
    const repo = new LocalStorageRetroRepository(storage);
    const ids = new SeqIds();
    let state = createRetro();
    state = addParticipant(state, 'p-1', 'Alice');
    state = startIcebreaker(state, firstPicker);
    state = startBrainstorm(state);
    state = addCardToBrainstorm(state, 'start', 'ship faster', ids);
    state = addCardToBrainstorm(state, 'stop', 'long meetings', ids);
    state = startVote(state);
    state = castVote(state, 'p-1', 'c-1');
    state = startDiscuss(state);
    state = addDiscussNote(state, 'c-1', 'context', 'we have CI flakes', ids);
    state = advanceDiscussSegment(state);
    state = addDiscussNote(state, 'c-1', 'actions', 'fix flaky test', ids);
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
    expect(loaded.stage).toBe('discuss');
    expect(loaded.discuss?.segment).toBe('actions');
    expect(loaded.discussNotes).toHaveLength(2);
  });
});
