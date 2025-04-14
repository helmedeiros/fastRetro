import { RetroRepository } from '../../domain/ports/RetroRepository';
import { RetroState, createRetro } from '../../domain/retro/Retro';
import type { Participant } from '../../domain/retro/Participant';

export const STORAGE_KEY = 'fastretro:state:v1';
export const SCHEMA_VERSION = 1;

interface PersistedParticipantV1 {
  readonly id: string;
  readonly name: string;
}

interface PersistedRetroStateV1 {
  readonly participants: readonly PersistedParticipantV1[];
}

interface PersistedRetroV1 {
  readonly version: 1;
  readonly retro: PersistedRetroStateV1;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV1 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isPersistedRetroV1(value: unknown): value is PersistedRetroV1 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== SCHEMA_VERSION) return false;
  if (typeof v.retro !== 'object' || v.retro === null) return false;
  const retro = v.retro as Record<string, unknown>;
  if (!Array.isArray(retro.participants)) return false;
  return retro.participants.every(isPersistedParticipant);
}

export class LocalStorageRetroRepository implements RetroRepository {
  constructor(private readonly storage: Storage) {}

  load(): RetroState {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return createRetro();
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return createRetro();
    }
    if (!isPersistedRetroV1(parsed)) {
      return createRetro();
    }
    const participants: readonly Participant[] = parsed.retro.participants.map(
      (p) => ({ id: p.id, name: p.name }),
    );
    return { participants };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV1 = {
      version: SCHEMA_VERSION,
      retro: {
        participants: state.participants.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      },
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}
