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
import type { Vote } from '../../domain/retro/Vote';

export const STORAGE_KEY = 'fastretro:state:v5';
export const SCHEMA_VERSION = 5;

interface PersistedParticipantV5 {
  readonly id: string;
  readonly name: string;
}

interface PersistedTimerV5 {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

interface PersistedIcebreakerV5 {
  readonly question: string;
  readonly participantIds: readonly string[];
  readonly currentIndex: number;
}

interface PersistedCardV5 {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly text: string;
}

interface PersistedVoteV5 {
  readonly participantId: string;
  readonly cardId: string;
}

interface PersistedRetroStateV5 {
  readonly stage: RetroStage;
  readonly participants: readonly PersistedParticipantV5[];
  readonly timer: PersistedTimerV5 | null;
  readonly icebreaker: PersistedIcebreakerV5 | null;
  readonly cards: readonly PersistedCardV5[];
  readonly votes: readonly PersistedVoteV5[];
  readonly voteBudget: number;
}

interface PersistedRetroV5 {
  readonly version: 5;
  readonly retro: PersistedRetroStateV5;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV5 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isStage(value: unknown): value is RetroStage {
  return (
    value === 'setup' ||
    value === 'icebreaker' ||
    value === 'brainstorm' ||
    value === 'vote'
  );
}

function isColumnId(value: unknown): value is ColumnId {
  return value === 'start' || value === 'stop';
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === 'idle' || value === 'running' || value === 'paused';
}

function isPersistedTimer(value: unknown): value is PersistedTimerV5 {
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
): value is PersistedIcebreakerV5 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.question !== 'string') return false;
  if (typeof v.currentIndex !== 'number') return false;
  if (!Array.isArray(v.participantIds)) return false;
  if (!v.participantIds.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedCard(value: unknown): value is PersistedCardV5 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    isColumnId(v.columnId)
  );
}

function isPersistedVote(value: unknown): value is PersistedVoteV5 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.participantId === 'string' && typeof v.cardId === 'string';
}

function isPersistedRetroV5(value: unknown): value is PersistedRetroV5 {
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
  if (!Array.isArray(retro.votes)) return false;
  if (!retro.votes.every(isPersistedVote)) return false;
  if (typeof retro.voteBudget !== 'number') return false;
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
    if (!isPersistedRetroV5(parsed)) {
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
    const votes: readonly Vote[] = parsed.retro.votes.map((v) => ({
      participantId: v.participantId,
      cardId: v.cardId,
    }));
    return {
      stage: parsed.retro.stage,
      participants,
      timer,
      icebreaker,
      cards,
      votes,
      voteBudget: parsed.retro.voteBudget,
    };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV5 = {
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
        votes: state.votes.map((v) => ({
          participantId: v.participantId,
          cardId: v.cardId,
        })),
        voteBudget: state.voteBudget,
      },
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}

