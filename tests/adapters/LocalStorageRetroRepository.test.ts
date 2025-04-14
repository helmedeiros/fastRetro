import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStorageRetroRepository,
  STORAGE_KEY,
} from '../../src/adapters/storage/LocalStorageRetroRepository';
import {
  addParticipant,
  createRetro,
  startRetro,
  startRetroTimer,
  tickRetroTimer,
  pauseRetroTimer,
} from '../../src/domain/retro/Retro';

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
      JSON.stringify({ version: 1, retro: { participants: 'nope' } }),
    );
    const repo = new LocalStorageRetroRepository(storage);
    expect(repo.load()).toEqual(createRetro());
  });

  it('persists under the versioned key', () => {
    const repo = new LocalStorageRetroRepository(storage);
    repo.save(addParticipant(createRetro(), 'id-1', 'Alice'));
    const raw = storage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as { version: number };
    expect(parsed.version).toBe(2);
  });

  it('round-trips stage and timer state', () => {
    const repo = new LocalStorageRetroRepository(storage);
    let state = createRetro();
    state = addParticipant(state, 'id-1', 'Alice');
    state = startRetro(state);
    state = startRetroTimer(state);
    state = tickRetroTimer(state, 2500);
    state = pauseRetroTimer(state);
    repo.save(state);

    const loaded = new LocalStorageRetroRepository(storage).load();
    expect(loaded).toEqual(state);
    expect(loaded.stage).toBe('running');
    expect(loaded.timer?.status).toBe('paused');
    expect(loaded.timer?.elapsedMs).toBe(2500);
  });
});
