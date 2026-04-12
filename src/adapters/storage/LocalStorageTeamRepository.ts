import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { TeamState } from '../../domain/team/Team';
import type { RetroHistoryState, CompletedRetro, FlatActionItem } from '../../domain/team/RetroHistory';
import type { RetroState } from '../../domain/retro/Retro';
import { createTeam } from '../../domain/team/Team';
import { createHistory } from '../../domain/team/RetroHistory';
import {
  LocalStorageRetroRepository,
  STORAGE_KEY as V9_KEY,
} from './LocalStorageRetroRepository';

export const TEAM_STORAGE_KEY = 'fastretro:team:v10';
export const HISTORY_STORAGE_KEY = 'fastretro:history:v10';
export const ACTIVE_RETRO_STORAGE_KEY = 'fastretro:active:v10';
const MIGRATED_KEY = 'fastretro:migrated:v10';

interface PersistedAgreementV10 {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
}

interface PersistedTeamV10 {
  readonly version: 10;
  readonly members: readonly { readonly id: string; readonly name: string }[];
  readonly agreements?: readonly PersistedAgreementV10[];
}

interface PersistedFlatActionItem {
  readonly noteId: string;
  readonly text: string;
  readonly parentText: string;
  readonly ownerName: string | null;
  readonly completedAt: string;
  readonly done?: boolean;
}

interface PersistedCompletedRetro {
  readonly id: string;
  readonly completedAt: string;
  readonly actionItems: readonly PersistedFlatActionItem[];
  readonly fullStateJson: string;
}

interface PersistedHistoryV10 {
  readonly version: 10;
  readonly completed: readonly PersistedCompletedRetro[];
}

function isPersistedTeamV10(value: unknown): value is PersistedTeamV10 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 10) return false;
  if (!Array.isArray(v.members)) return false;
  return v.members.every(
    (m) =>
      typeof m === 'object' &&
      m !== null &&
      typeof (m as Record<string, unknown>).id === 'string' &&
      typeof (m as Record<string, unknown>).name === 'string',
  );
}

function isPersistedHistoryV10(value: unknown): value is PersistedHistoryV10 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 10) return false;
  if (!Array.isArray(v.completed)) return false;
  return v.completed.every((c) => {
    if (typeof c !== 'object' || c === null) return false;
    const r = c as Record<string, unknown>;
    return (
      typeof r.id === 'string' &&
      typeof r.completedAt === 'string' &&
      Array.isArray(r.actionItems) &&
      typeof r.fullStateJson === 'string'
    );
  });
}

export class LocalStorageTeamRepository implements TeamRepository {
  private readonly retroRepo: LocalStorageRetroRepository;
  private migrated = false;
  private readonly teamKey: string;
  private readonly historyKey: string;
  private readonly activeKey: string;
  private readonly migratedKey: string;

  constructor(private readonly storage: Storage, teamId?: string) {
    this.retroRepo = new LocalStorageRetroRepository(storage);
    if (teamId !== undefined) {
      this.teamKey = `fastretro:team:${teamId}`;
      this.historyKey = `fastretro:history:${teamId}`;
      this.activeKey = `fastretro:active:${teamId}`;
      this.migratedKey = `fastretro:migrated:${teamId}`;
    } else {
      this.teamKey = TEAM_STORAGE_KEY;
      this.historyKey = HISTORY_STORAGE_KEY;
      this.activeKey = ACTIVE_RETRO_STORAGE_KEY;
      this.migratedKey = MIGRATED_KEY;
    }
  }

  private ensureMigrated(): void {
    if (this.migrated) return;
    this.migrated = true;

    if (this.storage.getItem(this.migratedKey) !== null) return;
    if (this.storage.getItem(this.teamKey) !== null) {
      this.storage.setItem(this.migratedKey, '1');
      return;
    }

    const v9Raw = this.storage.getItem(V9_KEY);
    if (v9Raw === null) {
      this.storage.setItem(this.migratedKey, '1');
      return;
    }

    const v9State = this.retroRepo.load();
    const members = v9State.participants.map((p) => ({ id: p.id, name: p.name }));
    this.saveTeamRaw({ version: 10, members });

    if (v9State.stage === 'close') {
      this.saveActiveRetroRaw(null);
    } else if (v9State.stage === 'setup' && v9State.cards.length === 0) {
      this.saveActiveRetroRaw(null);
    } else {
      this.saveActiveRetroRaw(v9State);
    }

    this.storage.setItem(this.migratedKey, '1');
  }

  loadTeam(): TeamState {
    this.ensureMigrated();
    const raw = this.storage.getItem(this.teamKey);
    if (raw === null) return createTeam();
    try {
      const parsed = JSON.parse(raw);
      if (!isPersistedTeamV10(parsed)) return createTeam();
      return {
        members: parsed.members.map((m) => ({ id: m.id, name: m.name })),
        agreements: (parsed.agreements ?? []).map((a) => ({
          id: a.id,
          text: a.text,
          createdAt: a.createdAt,
        })),
      };
    } catch {
      return createTeam();
    }
  }

  saveTeam(state: TeamState): void {
    this.saveTeamRaw({
      version: 10,
      members: state.members.map((m) => ({ id: m.id, name: m.name })),
      agreements: state.agreements.map((a) => ({
        id: a.id,
        text: a.text,
        createdAt: a.createdAt,
      })),
    });
  }

  private saveTeamRaw(payload: PersistedTeamV10): void {
    this.storage.setItem(this.teamKey, JSON.stringify(payload));
  }

  loadHistory(): RetroHistoryState {
    this.ensureMigrated();
    const raw = this.storage.getItem(this.historyKey);
    if (raw === null) return createHistory();
    try {
      const parsed = JSON.parse(raw);
      if (!isPersistedHistoryV10(parsed)) return createHistory();
      const completed: CompletedRetro[] = parsed.completed.map((c) => {
        const fakeStorage = this.createFakeStorage();
        fakeStorage.setItem('fastretro:state:v9', c.fullStateJson);
        const stateRepo = new LocalStorageRetroRepository(fakeStorage);
        const fullState = stateRepo.load();
        const normalizedState = fullState.meta.date
          ? fullState
          : { ...fullState, meta: { ...fullState.meta, date: c.completedAt.slice(0, 10) } };
        return {
          id: c.id,
          completedAt: c.completedAt,
          actionItems: c.actionItems.map((a): FlatActionItem => ({
            noteId: a.noteId,
            text: a.text,
            parentText: a.parentText,
            ownerName: a.ownerName,
            completedAt: a.completedAt,
            done: a.done ?? false,
          })),
          fullState: normalizedState,
        };
      });
      return { completed };
    } catch {
      return createHistory();
    }
  }

  saveHistory(state: RetroHistoryState): void {
    const completed: PersistedCompletedRetro[] = state.completed.map((c) => {
      const fakeStorage = this.createFakeStorage();
      const stateRepo = new LocalStorageRetroRepository(fakeStorage);
      stateRepo.save(c.fullState);
      const fullStateJson = fakeStorage.getItem('fastretro:state:v9') ?? '';
      return {
        id: c.id,
        completedAt: c.completedAt,
        actionItems: c.actionItems.map((a) => ({
          noteId: a.noteId,
          text: a.text,
          parentText: a.parentText,
          ownerName: a.ownerName,
          completedAt: a.completedAt,
          done: a.done ?? false,
        })),
        fullStateJson,
      };
    });
    const payload: PersistedHistoryV10 = { version: 10, completed };
    this.storage.setItem(this.historyKey, JSON.stringify(payload));
  }

  loadActiveRetro(): RetroState | null {
    this.ensureMigrated();
    const raw = this.storage.getItem(this.activeKey);
    if (raw === null) return null;
    if (raw === 'null') return null;
    try {
      const fakeStorage = this.createFakeStorage();
      fakeStorage.setItem('fastretro:state:v9', raw);
      const stateRepo = new LocalStorageRetroRepository(fakeStorage);
      const state = stateRepo.load();
      if (state.stage === 'setup' && state.participants.length === 0) return null;
      return state;
    } catch {
      return null;
    }
  }

  saveActiveRetro(state: RetroState | null): void {
    this.saveActiveRetroRaw(state);
  }

  private saveActiveRetroRaw(state: RetroState | null): void {
    if (state === null) {
      this.storage.setItem(this.activeKey, 'null');
      return;
    }
    const fakeStorage = this.createFakeStorage();
    const stateRepo = new LocalStorageRetroRepository(fakeStorage);
    stateRepo.save(state);
    const serialized = fakeStorage.getItem('fastretro:state:v9') ?? '';
    this.storage.setItem(this.activeKey, serialized);
  }

  private createFakeStorage(): Storage {
    const store: Record<string, string> = {};
    return {
      getItem(key: string): string | null {
        return store[key] ?? null;
      },
      setItem(key: string, value: string): void {
        store[key] = value;
      },
      removeItem(key: string): void {
        delete store[key];
      },
      clear(): void {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      get length(): number {
        return Object.keys(store).length;
      },
      key(index: number): string | null {
        return Object.keys(store)[index] ?? null;
      },
    };
  }
}
