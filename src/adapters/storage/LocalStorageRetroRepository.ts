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
import type { Group } from '../../domain/retro/Group';
import type { Vote } from '../../domain/retro/Vote';
import type { DiscussLane, DiscussNote } from '../../domain/retro/DiscussNote';

export const STORAGE_KEY = 'fastretro:state:v9';
export const SCHEMA_VERSION = 9;

interface PersistedParticipantV9 {
  readonly id: string;
  readonly name: string;
}

interface PersistedTimerV9 {
  readonly status: TimerStatus;
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly remainingMs: number;
}

interface PersistedIcebreakerV9 {
  readonly question: string;
  readonly questions?: readonly string[];
  readonly participantIds: readonly string[];
  readonly currentIndex: number;
}

interface PersistedCardV9 {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly text: string;
}

interface PersistedGroupV9 {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly name: string;
  readonly cardIds: readonly string[];
}

interface PersistedVoteV9 {
  readonly participantId: string;
  readonly cardId: string;
}

interface PersistedDiscussV9 {
  readonly order: readonly string[];
  readonly currentIndex: number;
  readonly segment: DiscussSegment;
}

interface PersistedDiscussNoteV9 {
  readonly id: string;
  readonly parentCardId: string;
  readonly lane: DiscussLane;
  readonly text: string;
}

interface PersistedMetaV9 {
  readonly name?: string;
  readonly date?: string;
  readonly context?: string;
  readonly templateId?: string;
}

interface PersistedRetroStateV9 {
  readonly stage: RetroStage;
  readonly meta?: PersistedMetaV9;
  readonly participants: readonly PersistedParticipantV9[];
  readonly timer: PersistedTimerV9 | null;
  readonly icebreaker: PersistedIcebreakerV9 | null;
  readonly cards: readonly PersistedCardV9[];
  readonly groups: readonly PersistedGroupV9[];
  readonly votes: readonly PersistedVoteV9[];
  readonly voteBudget: number;
  readonly discuss: PersistedDiscussV9 | null;
  readonly discussNotes: readonly PersistedDiscussNoteV9[];
  readonly actionItemOwners: Readonly<Record<string, string>>;
}

interface PersistedRetroV9 {
  readonly version: 9;
  readonly retro: PersistedRetroStateV9;
}

function isPersistedParticipant(value: unknown): value is PersistedParticipantV9 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isStage(value: unknown): value is RetroStage {
  return (
    value === 'setup' ||
    value === 'icebreaker' ||
    value === 'brainstorm' ||
    value === 'group' ||
    value === 'vote' ||
    value === 'discuss' ||
    value === 'review' ||
    value === 'close'
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

function isPersistedTimer(value: unknown): value is PersistedTimerV9 {
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
): value is PersistedIcebreakerV9 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.question !== 'string') return false;
  if (typeof v.currentIndex !== 'number') return false;
  if (!Array.isArray(v.participantIds)) return false;
  if (!v.participantIds.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedCard(value: unknown): value is PersistedCardV9 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    isColumnId(v.columnId)
  );
}

function isPersistedGroup(value: unknown): value is PersistedGroupV9 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string') return false;
  if (!isColumnId(v.columnId)) return false;
  if (typeof v.name !== 'string') return false;
  if (!Array.isArray(v.cardIds)) return false;
  if (!v.cardIds.every((id) => typeof id === 'string')) return false;
  return true;
}

function isPersistedVote(value: unknown): value is PersistedVoteV9 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.participantId === 'string' && typeof v.cardId === 'string';
}

function isPersistedDiscuss(value: unknown): value is PersistedDiscussV9 {
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
): value is PersistedDiscussNoteV9 {
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

function isPersistedRetroV9(value: unknown): value is PersistedRetroV9 {
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
  if (!Array.isArray(retro.groups)) return false;
  if (!retro.groups.every(isPersistedGroup)) return false;
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
    if (!isPersistedRetroV9(parsed)) {
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
            questions: parsed.retro.icebreaker.questions
              ? [...parsed.retro.icebreaker.questions]
              : [parsed.retro.icebreaker.question],
            participantIds: [...parsed.retro.icebreaker.participantIds],
            currentIndex: parsed.retro.icebreaker.currentIndex,
          };
    const cards: readonly Card[] = parsed.retro.cards.map((c) => ({
      id: c.id,
      columnId: c.columnId,
      text: c.text,
    }));
    const groups: readonly Group[] = parsed.retro.groups.map((g) => ({
      id: g.id,
      columnId: g.columnId,
      name: g.name,
      cardIds: [...g.cardIds],
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
    const meta = {
      name: parsed.retro.meta?.name ?? '',
      date: parsed.retro.meta?.date ?? '',
      context: parsed.retro.meta?.context ?? '',
      templateId: parsed.retro.meta?.templateId ?? 'start-stop',
    };
    return {
      stage: parsed.retro.stage,
      meta,
      participants,
      timer,
      icebreaker,
      cards,
      groups,
      votes,
      voteBudget: parsed.retro.voteBudget,
      discuss,
      discussNotes,
      actionItemOwners: { ...parsed.retro.actionItemOwners },
    };
  }

  save(state: RetroState): void {
    const payload: PersistedRetroV9 = {
      version: SCHEMA_VERSION,
      retro: {
        stage: state.stage,
        meta: {
          name: state.meta.name,
          date: state.meta.date,
          context: state.meta.context,
          templateId: state.meta.templateId,
        },
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
                questions: [...state.icebreaker.questions],
                participantIds: [...state.icebreaker.participantIds],
                currentIndex: state.icebreaker.currentIndex,
              },
        cards: state.cards.map((c) => ({
          id: c.id,
          columnId: c.columnId,
          text: c.text,
        })),
        groups: state.groups.map((g) => ({
          id: g.id,
          columnId: g.columnId,
          name: g.name,
          cardIds: [...g.cardIds],
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
