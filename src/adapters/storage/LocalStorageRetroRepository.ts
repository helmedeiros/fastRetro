import { RetroRepository } from '../../domain/ports/RetroRepository';
import {
  RetroState,
  RetroStage,
  createRetro,
} from '../../domain/retro/Retro';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer, TimerStatus } from '../../domain/retro/Timer';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';

export const STORAGE_KEY = 'fastretro:state:v3';
export const SCHEMA_VERSION = 3;

interface PersistedParticipantV3 {
  readonly id: string;
  readonly name: string;
}

interface PersistedTimerV3 {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

interface PersistedIcebreakerV3 {
  readonly question: string;
  readonly participantIds: readonly string[];
  readonly currentIndex: number;
}

interface PersistedRetroStateV3 {
  readonly stage: RetroStage;
  readonly participants: readonly PersistedParticipantV3[];
  readonly timer: PersistedTimerV3 | null;
  readonly icebreaker: PersistedIcebreakerV3 | null;
}

interface PersistedRetroV3 {
  readonly version: 3;
  readonly retro: PersistedRetroStateV3;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV3 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isStage(value: unknown): value is RetroStage {
  return value === 'setup' || value === 'icebreaker';
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === 'idle' || value === 'running' || value === 'paused';
}

function isPersistedTimer(value: unknown): value is PersistedTimerV3 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isTimerStatus(v.status) &&
    typeof v.durationMs === 'number' &&
    typeof v.elapsedMs === 'number' &&
    typeof v.remainingMs === 'number'
  );
}

function isPersistedIcebreaker(
  value: unknown,
): value is PersistedIcebreakerV3 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.question !== 'string') return false;
  if (typeof v.currentIndex !== 'number') return false;
  if (!Array.isArray(v.participantIds)) return false;
  if (!v.participantIds.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedRetroV3(value: unknown): value is PersistedRetroV3 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.version !== SCHEMA_VERSION) return false;
  if (typeof v.retro !== 'object' || v.retro === null) return false;
  const retro = v.retro as Record<string, unknown>;
  if (!isStage(retro.stage)) return false;
  if (!Array.isArray(retro.participants)) return false;
  if (!retro.participants.every(isPersistedParticipant)) return false;
  if (retro.timer !== null && !isPersistedTimer(retro.timer)) return false;
  if (retro.icebreaker !== null && !isPersistedIcebreaker(retro.icebreaker))
    return false;
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
    if (!isPersistedRetroV3(parsed)) {
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
    const icebreaker: IcebreakerState | null =
      parsed.retro.icebreaker === null
        ? null
        : {
            question: parsed.retro.icebreaker.question,
            participantIds: [...parsed.retro.icebreaker.participantIds],
            currentIndex: parsed.retro.icebreaker.currentIndex,
          };
    return {
      stage: parsed.retro.stage,
      participants,
      timer,
      icebreaker,
    };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV3 = {
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
        icebreaker:
          state.icebreaker === null
            ? null
            : {
                question: state.icebreaker.question,
                participantIds: [...state.icebreaker.participantIds],
                currentIndex: state.icebreaker.currentIndex,
              },
      },
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}
