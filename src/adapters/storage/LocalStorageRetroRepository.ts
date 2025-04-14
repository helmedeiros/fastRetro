import { RetroRepository } from '../../domain/ports/RetroRepository';
import {
  RetroState,
  RetroStage,
  createRetro,
} from '../../domain/retro/Retro';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer, TimerStatus } from '../../domain/retro/Timer';

export const STORAGE_KEY = 'fastretro:state:v2';
export const SCHEMA_VERSION = 2;

interface PersistedParticipantV2 {
  readonly id: string;
  readonly name: string;
}

interface PersistedTimerV2 {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

interface PersistedRetroStateV2 {
  readonly stage: RetroStage;
  readonly participants: readonly PersistedParticipantV2[];
  readonly timer: PersistedTimerV2 | null;
}

interface PersistedRetroV2 {
  readonly version: 2;
  readonly retro: PersistedRetroStateV2;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV2 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isStage(value: unknown): value is RetroStage {
  return value === 'setup' || value === 'running';
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === 'idle' || value === 'running' || value === 'paused';
}

function isPersistedTimer(value: unknown): value is PersistedTimerV2 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isTimerStatus(v.status) &&
    typeof v.durationMs === 'number' &&
    typeof v.elapsedMs === 'number' &&
    typeof v.remainingMs === 'number'
  );
}

function isPersistedRetroV2(value: unknown): value is PersistedRetroV2 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== SCHEMA_VERSION) return false;
  if (typeof v.retro !== 'object' || v.retro === null) return false;
  const retro = v.retro as Record<string, unknown>;
  if (!isStage(retro.stage)) return false;
  if (!Array.isArray(retro.participants)) return false;
  if (!retro.participants.every(isPersistedParticipant)) return false;
  if (retro.timer !== null && !isPersistedTimer(retro.timer)) return false;
  return true;
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
    if (!isPersistedRetroV2(parsed)) {
      return createRetro();
    }
    const participants: readonly Participant[] = parsed.retro.participants.map(
      (p) => ({ id: p.id, name: p.name }),
    );
    const timer: Timer | null =
      parsed.retro.timer === null
        ? null
        : {
            status: parsed.retro.timer.status,
            durationMs: parsed.retro.timer.durationMs,
            elapsedMs: parsed.retro.timer.elapsedMs,
            remainingMs: parsed.retro.timer.remainingMs,
          };
    return { stage: parsed.retro.stage, participants, timer };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV2 = {
      version: SCHEMA_VERSION,
      retro: {
        stage: state.stage,
        participants: state.participants.map((p) => ({
          id: p.id,
          name: p.name,
        })),
        timer:
          state.timer === null
            ? null
            : {
                status: state.timer.status,
                durationMs: state.timer.durationMs,
                elapsedMs: state.timer.elapsedMs,
                remainingMs: state.timer.remainingMs,
              },
      },
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}
