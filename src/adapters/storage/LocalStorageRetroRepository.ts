import { RetroRepository } from '../../domain/ports/RetroRepository';
import {
  RetroState,
  RetroStage,
  createRetro,
} from '../../domain/retro/Retro';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer, TimerStatus } from '../../domain/retro/Timer';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';
import type { Card, ColumnId } from '../../domain/retro/Card';

export const STORAGE_KEY = 'fastretro:state:v4';
export const SCHEMA_VERSION = 4;

interface PersistedParticipantV4 {
  readonly id: string;
  readonly name: string;
}

interface PersistedTimerV4 {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

interface PersistedIcebreakerV4 {
  readonly question: string;
  readonly participantIds: readonly string[];
  readonly currentIndex: number;
}

interface PersistedCardV4 {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly text: string;
}

interface PersistedRetroStateV4 {
  readonly stage: RetroStage;
  readonly participants: readonly PersistedParticipantV4[];
  readonly timer: PersistedTimerV4 | null;
  readonly icebreaker: PersistedIcebreakerV4 | null;
  readonly cards: readonly PersistedCardV4[];
}

interface PersistedRetroV4 {
  readonly version: 4;
  readonly retro: PersistedRetroStateV4;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV4 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isStage(value: unknown): value is RetroStage {
  return value === 'setup' || value === 'icebreaker' || value === 'brainstorm';
}

function isColumnId(value: unknown): value is ColumnId {
  return value === 'start' || value === 'stop';
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === 'idle' || value === 'running' || value === 'paused';
}

function isPersistedTimer(value: unknown): value is PersistedTimerV4 {
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
): value is PersistedIcebreakerV4 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.question !== 'string') return false;
  if (typeof v.currentIndex !== 'number') return false;
  if (!Array.isArray(v.participantIds)) return false;
  if (!v.participantIds.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedCard(value: unknown): value is PersistedCardV4 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    isColumnId(v.columnId)
  );
}

function isPersistedRetroV4(value: unknown): value is PersistedRetroV4 {
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
  if (!Array.isArray(retro.cards)) return false;
  if (!retro.cards.every(isPersistedCard)) return false;
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
    if (!isPersistedRetroV4(parsed)) {
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
    const cards: readonly Card[] = parsed.retro.cards.map((c) => ({
      id: c.id,
      columnId: c.columnId,
      text: c.text,
    }));
    return {
      stage: parsed.retro.stage,
      participants,
      timer,
      icebreaker,
      cards,
    };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV4 = {
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
        cards: state.cards.map((c) => ({
          id: c.id,
          columnId: c.columnId,
          text: c.text,
        })),
      },
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}
