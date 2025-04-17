import { RetroRepository } from '../../domain/ports/RetroRepository';
import {
  DiscussSegment,
  DiscussState,
  RetroState,
  RetroStage,
  createRetro,
} from '../../domain/retro/Retro';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer, TimerStatus } from '../../domain/retro/Timer';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Vote } from '../../domain/retro/Vote';
import type { DiscussLane, DiscussNote } from '../../domain/retro/DiscussNote';

export const STORAGE_KEY = 'fastretro:state:v7';
export const SCHEMA_VERSION = 7;

interface PersistedParticipantV7 {
  readonly id: string;
  readonly name: string;
}

interface PersistedTimerV7 {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

interface PersistedIcebreakerV7 {
  readonly question: string;
  readonly participantIds: readonly string[];
  readonly currentIndex: number;
}

interface PersistedCardV7 {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly text: string;
}

interface PersistedVoteV7 {
  readonly participantId: string;
  readonly cardId: string;
}

interface PersistedDiscussV7 {
  readonly order: readonly string[];
  readonly currentIndex: number;
  readonly segment: DiscussSegment;
}

interface PersistedDiscussNoteV7 {
  readonly id: string;
  readonly parentCardId: string;
  readonly lane: DiscussLane;
  readonly text: string;
}

interface PersistedRetroStateV7 {
  readonly stage: RetroStage;
  readonly participants: readonly PersistedParticipantV7[];
  readonly timer: PersistedTimerV7 | null;
  readonly icebreaker: PersistedIcebreakerV7 | null;
  readonly cards: readonly PersistedCardV7[];
  readonly votes: readonly PersistedVoteV7[];
  readonly voteBudget: number;
  readonly discuss: PersistedDiscussV7 | null;
  readonly discussNotes: readonly PersistedDiscussNoteV7[];
  readonly actionItemOwners: Readonly<Record<string, string>>;
}

interface PersistedRetroV7 {
  readonly version: 7;
  readonly retro: PersistedRetroStateV7;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV7 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isStage(value: unknown): value is RetroStage {
  return (
    value === 'setup' ||
    value === 'icebreaker' ||
    value === 'brainstorm' ||
    value === 'vote' ||
    value === 'discuss' ||
    value === 'review'
  );
}

function isColumnId(value: unknown): value is ColumnId {
  return value === 'start' || value === 'stop';
}

function isLane(value: unknown): value is DiscussLane {
  return value === 'context' || value === 'actions';
}

function isSegment(value: unknown): value is DiscussSegment {
  return value === 'context' || value === 'actions';
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === 'idle' || value === 'running' || value === 'paused';
}

function isPersistedTimer(value: unknown): value is PersistedTimerV7 {
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
): value is PersistedIcebreakerV7 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.question !== 'string') return false;
  if (typeof v.currentIndex !== 'number') return false;
  if (!Array.isArray(v.participantIds)) return false;
  if (!v.participantIds.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedCard(value: unknown): value is PersistedCardV7 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    isColumnId(v.columnId)
  );
}

function isPersistedVote(value: unknown): value is PersistedVoteV7 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.participantId === 'string' && typeof v.cardId === 'string';
}

function isPersistedDiscuss(value: unknown): value is PersistedDiscussV7 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.currentIndex !== 'number') return false;
  if (!isSegment(v.segment)) return false;
  if (!Array.isArray(v.order)) return false;
  if (!v.order.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedDiscussNote(
  value: unknown,
): value is PersistedDiscussNoteV7 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.parentCardId === 'string' &&
    typeof v.text === 'string' &&
    isLane(v.lane)
  );
}

function isActionItemOwners(
  value: unknown,
): value is Readonly<Record<string, string>> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === 'string',
  );
}

function isPersistedRetroV7(value: unknown): value is PersistedRetroV7 {
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
  if (retro.discuss !== null && !isPersistedDiscuss(retro.discuss))
    return false;
  if (!Array.isArray(retro.discussNotes)) return false;
  if (!retro.discussNotes.every(isPersistedDiscussNote)) return false;
  if (!isActionItemOwners(retro.actionItemOwners)) return false;
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
    if (!isPersistedRetroV7(parsed)) {
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
    const discuss: DiscussState | null =
      parsed.retro.discuss === null
        ? null
        : {
            order: [...parsed.retro.discuss.order],
            currentIndex: parsed.retro.discuss.currentIndex,
            segment: parsed.retro.discuss.segment,
          };
    const discussNotes: readonly DiscussNote[] = parsed.retro.discussNotes.map(
      (n) => ({
        id: n.id,
        parentCardId: n.parentCardId,
        lane: n.lane,
        text: n.text,
      }),
    );
    return {
      stage: parsed.retro.stage,
      participants,
      timer,
      icebreaker,
      cards,
      votes,
      voteBudget: parsed.retro.voteBudget,
      discuss,
      discussNotes,
      actionItemOwners: { ...parsed.retro.actionItemOwners },
    };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV7 = {
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
        discuss:
          state.discuss === null
            ? null
            : {
                order: [...state.discuss.order],
                currentIndex: state.discuss.currentIndex,
                segment: state.discuss.segment,
              },
        discussNotes: state.discussNotes.map((n) => ({
          id: n.id,
          parentCardId: n.parentCardId,
          lane: n.lane,
          text: n.text,
        })),
        actionItemOwners: { ...state.actionItemOwners },
      },
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}
