import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageTeamRepository } from '../../src/adapters/storage/LocalStorageTeamRepository';
import { createRetro, addParticipant, startIcebreaker } from '../../src/domain/retro/Retro';

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

describe('LocalStorageTeamRepository', () => {
  let storage: MemoryStorage;
  let repo: LocalStorageTeamRepository;

  beforeEach(() => {
    storage = new MemoryStorage();
    repo = new LocalStorageTeamRepository(storage);
  });

  describe('team', () => {
    it('returns empty team when nothing stored', () => {
      expect(repo.loadTeam().members).toEqual([]);
    });

    it('round-trips team members', () => {
      repo.saveTeam({
        members: [
          { id: 'm1', name: 'Alice' },
          { id: 'm2', name: 'Bob' },
        ],
        agreements: [],
      });
      // Create fresh instance to test from storage
      const repo2 = new LocalStorageTeamRepository(storage);
      const team = repo2.loadTeam();
      expect(team.members).toEqual([
        { id: 'm1', name: 'Alice' },
        { id: 'm2', name: 'Bob' },
      ]);
    });
  });

  describe('history', () => {
    it('returns empty history when nothing stored', () => {
      expect(repo.loadHistory().completed).toEqual([]);
    });

    it('round-trips completed retros', () => {
      const fullState = createRetro();
      repo.saveHistory({
        completed: [
          {
            id: 'r1',
            completedAt: '2025-01-01T00:00:00Z',
            actionItems: [
              {
                noteId: 'n1',
                text: 'fix tests',
                parentText: 'quality',
                ownerName: 'Alice',
                completedAt: '2025-01-01T00:00:00Z',
              },
            ],
            fullState,
          },
        ],
      });
      const repo2 = new LocalStorageTeamRepository(storage);
      const history = repo2.loadHistory();
      expect(history.completed).toHaveLength(1);
      expect(history.completed[0].id).toBe('r1');
      expect(history.completed[0].actionItems[0].text).toBe('fix tests');
    });
  });

  describe('activeRetro', () => {
    it('returns null when nothing stored', () => {
      expect(repo.loadActiveRetro()).toBeNull();
    });

    it('round-trips an active retro', () => {
      let state = createRetro();
      state = addParticipant(state, 'p1', 'Alice');
      state = startIcebreaker(state, { pick: (items) => items[0] });
      repo.saveActiveRetro(state);
      const repo2 = new LocalStorageTeamRepository(storage);
      const loaded = repo2.loadActiveRetro();
      expect(loaded).not.toBeNull();
      expect(loaded!.stage).toBe('icebreaker');
      expect(loaded!.participants).toHaveLength(1);
    });

    it('returns null after saving null', () => {
      let state = createRetro();
      state = addParticipant(state, 'p1', 'Alice');
      state = startIcebreaker(state, { pick: (items) => items[0] });
      repo.saveActiveRetro(state);
      repo.saveActiveRetro(null);
      const repo2 = new LocalStorageTeamRepository(storage);
      expect(repo2.loadActiveRetro()).toBeNull();
    });
  });

  describe('v9 migration', () => {
    it('migrates v9 participants to team members', () => {
      const v9State = {
        version: 9,
        retro: {
          stage: 'setup',
          participants: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
          ],
          timer: null,
          icebreaker: null,
          cards: [],
          groups: [],
          votes: [],
          voteBudget: 3,
          discuss: null,
          discussNotes: [],
          actionItemOwners: {},
        },
      };
      storage.setItem('fastretro:state:v9', JSON.stringify(v9State));
      const team = repo.loadTeam();
      expect(team.members).toEqual([
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ]);
    });

    it('sets activeRetro to null for v9 in setup with no cards', () => {
      const v9State = {
        version: 9,
        retro: {
          stage: 'setup',
          participants: [{ id: 'p1', name: 'Alice' }],
          timer: null,
          icebreaker: null,
          cards: [],
          groups: [],
          votes: [],
          voteBudget: 3,
          discuss: null,
          discussNotes: [],
          actionItemOwners: {},
        },
      };
      storage.setItem('fastretro:state:v9', JSON.stringify(v9State));
      expect(repo.loadActiveRetro()).toBeNull();
    });
  });
});
