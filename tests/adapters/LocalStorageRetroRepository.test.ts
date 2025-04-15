import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageRetroRepository,
  STORAGE_KEY,
} from '../../src/adapters/storage/LocalStorageRetroRepository';
import {
  addParticipant,
  advanceIcebreakerParticipant,
  createRetro,
  startIcebreaker,
  startRetroTimer,
  tickRetroTimer,
  pauseRetroTimer,
} from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';

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

  it('returns a fresh empty Retro when payload shape is invalid', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 3, retro: { participants: 'nope' } }),
    );
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('persists under the versioned key', () => {
    const repo = new LocalStorageRetroRepository(storage);
    repo.save(addParticipant(createRetro(), 'id-1', 'Alice'));
    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(STORAGE_KEY).toBe('fastretro:state:v3');
    const parsed = JSON.parse(raw as string) as { version: number };
    expect(parsed.version).toBe(3);
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
});
