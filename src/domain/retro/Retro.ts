import { Participant, createParticipant } from './Participant';
import {
  Timer,
  createTimer,
  startTimer as startTimerState,
  pauseTimer as pauseTimerState,
  resumeTimer as resumeTimerState,
  tickTimer as tickTimerState,
  resetTimer as resetTimerState,
} from './Timer';
import type { Picker } from '../ports/Picker';
import type { IdGenerator } from '../ports/IdGenerator';
import { Card, ColumnId, createCard } from './Card';
import { Vote } from './Vote';
import {
  DiscussLane,
  DiscussNote,
  createDiscussNote,
} from './DiscussNote';
import {
  ICEBREAKER_QUESTIONS,
  IcebreakerState,
  createIcebreaker,
  nextParticipant as nextIcebreakerParticipant,
} from './stages/Icebreaker';

export type RetroStage =
  | 'setup'
  | 'icebreaker'
  | 'brainstorm'
  | 'vote'
  | 'discuss'
  | 'review';

export const STAGE_DURATIONS: Readonly<
  Record<'icebreaker' | 'brainstorm' | 'vote' | 'discuss' | 'review', number>
> = {
  icebreaker: 10 * 60 * 1000,
  brainstorm: 5 * 60 * 1000,
  vote: 5 * 60 * 1000,
  discuss: 2.5 * 60 * 1000,
  review: 5 * 60 * 1000,
};

export type DiscussSegment = 'context' | 'actions';

export interface DiscussState {
  readonly order: readonly string[];
  readonly currentIndex: number;
  readonly segment: DiscussSegment;
}

export const DEFAULT_VOTE_BUDGET = 3;

export interface RetroState {
  readonly stage: RetroStage;
  readonly participants: readonly Participant[];
  readonly timer: Timer | null;
  readonly icebreaker: IcebreakerState | null;
  readonly cards: readonly Card[];
  readonly votes: readonly Vote[];
  readonly voteBudget: number;
  readonly discuss: DiscussState | null;
  readonly discussNotes: readonly DiscussNote[];
  readonly actionItemOwners: Readonly<Record<string, string>>;
}

export interface ActionItem {
  readonly note: DiscussNote;
  readonly parentCard: Card;
  readonly ownerId: string | null;
}

export function createRetro(): RetroState {
  return {
    stage: 'setup',
    participants: [],
    timer: null,
    icebreaker: null,
    cards: [],
    votes: [],
    voteBudget: DEFAULT_VOTE_BUDGET,
    discuss: null,
    discussNotes: [],
    actionItemOwners: {},
  };
}

export function addParticipant(
  state: RetroState,
  id: string,
  name: string,
): RetroState {
  const participant = createParticipant(id, name);
  const exists = state.participants.some(
    (p) => p.name.toLowerCase() === participant.name.toLowerCase(),
  );
  if (exists) {
    throw new Error(`Participant "${participant.name}" already exists`);
  }
  return { ...state, participants: [...state.participants, participant] };
}

export function removeParticipant(
  state: RetroState,
  id: string,
): RetroState {
  const next = state.participants.filter((p) => p.id !== id);
  if (next.length === state.participants.length) {
    throw new Error(`Participant with id "${id}" not found`);
  }
  return { ...state, participants: next };
}

export function startIcebreaker(
  state: RetroState,
  picker: Picker<string>,
): RetroState {
  if (state.stage !== 'setup') {
    throw new Error('Retro has already started');
  }
  if (state.participants.length < 1) {
    throw new Error('At least one participant is required to start the retro');
  }
  return {
    ...state,
    stage: 'icebreaker',
    timer: createTimer(STAGE_DURATIONS.icebreaker),
    icebreaker: createIcebreaker(
      state.participants,
      ICEBREAKER_QUESTIONS,
      picker,
    ),
  };
}

export function advanceIcebreakerParticipant(state: RetroState): RetroState {
  if (state.icebreaker === null) {
    throw new Error('No active icebreaker');
  }
  return { ...state, icebreaker: nextIcebreakerParticipant(state.icebreaker) };
}

export function startBrainstorm(state: RetroState): RetroState {
  if (state.stage !== 'icebreaker') {
    throw new Error('Brainstorm can only start from the icebreaker stage');
  }
  return {
    ...state,
    stage: 'brainstorm',
    timer: createTimer(STAGE_DURATIONS.brainstorm),
  };
}

export function addCardToBrainstorm(
  state: RetroState,
  columnId: ColumnId,
  text: string,
  ids: IdGenerator,
): RetroState {
  if (state.stage !== 'brainstorm') {
    throw new Error('Cards can only be added during brainstorm');
  }
  const card = createCard(ids.next(), columnId, text);
  return { ...state, cards: [...state.cards, card] };
}

export function removeCardFromBrainstorm(
  state: RetroState,
  cardId: string,
): RetroState {
  if (state.stage !== 'brainstorm') {
    throw new Error('Cards can only be removed during brainstorm');
  }
  const next = state.cards.filter((c) => c.id !== cardId);
  if (next.length === state.cards.length) {
    throw new Error(`Card with id "${cardId}" not found`);
  }
  return { ...state, cards: next };
}

export function startVote(state: RetroState): RetroState {
  if (state.stage !== 'brainstorm') {
    throw new Error('Vote can only start from the brainstorm stage');
  }
  return {
    ...state,
    stage: 'vote',
    timer: createTimer(STAGE_DURATIONS.vote),
  };
}

export function setVoteBudget(state: RetroState, budget: number): RetroState {
  if (state.stage !== 'vote') {
    throw new Error('Vote budget can only be set during vote stage');
  }
  if (!Number.isFinite(budget) || budget < 0) {
    throw new Error('Vote budget must be a non-negative number');
  }
  return { ...state, voteBudget: Math.floor(budget) };
}

export function votesForCard(state: RetroState, cardId: string): number {
  return state.votes.filter((v) => v.cardId === cardId).length;
}

export function votesUsedBy(state: RetroState, participantId: string): number {
  return state.votes.filter((v) => v.participantId === participantId).length;
}

export function remainingBudget(
  state: RetroState,
  participantId: string,
): number {
  return state.voteBudget - votesUsedBy(state, participantId);
}

export function castVote(
  state: RetroState,
  participantId: string,
  cardId: string,
): RetroState {
  if (state.stage !== 'vote') {
    throw new Error('Votes can only be cast during vote stage');
  }
  const participantExists = state.participants.some(
    (p) => p.id === participantId,
  );
  if (!participantExists) return state;
  const cardExists = state.cards.some((c) => c.id === cardId);
  if (!cardExists) return state;
  const existingIndex = state.votes.findIndex(
    (v) => v.participantId === participantId && v.cardId === cardId,
  );
  if (existingIndex >= 0) {
    const next = state.votes.filter((_, i) => i !== existingIndex);
    return { ...state, votes: next };
  }
  if (remainingBudget(state, participantId) <= 0) {
    return state;
  }
  return { ...state, votes: [...state.votes, { participantId, cardId }] };
}

export function startDiscuss(state: RetroState): RetroState {
  if (state.stage !== 'vote') {
    throw new Error('Discuss can only start from the vote stage');
  }
  const insertionIndex = new Map<string, number>();
  state.cards.forEach((c, i) => insertionIndex.set(c.id, i));
  const order = [...state.cards]
    .sort((a, b) => {
      const va = votesForCard(state, a.id);
      const vb = votesForCard(state, b.id);
      if (vb !== va) return vb - va;
      return (
        (insertionIndex.get(a.id) ?? 0) - (insertionIndex.get(b.id) ?? 0)
      );
    })
    .map((c) => c.id);
  return {
    ...state,
    stage: 'discuss',
    timer: createTimer(STAGE_DURATIONS.discuss),
    discuss: {
      order,
      currentIndex: 0,
      segment: 'context',
    },
  };
}

function requireDiscuss(state: RetroState): DiscussState {
  if (state.discuss === null) {
    throw new Error('No active discuss state');
  }
  return state.discuss;
}

export function advanceDiscussSegment(state: RetroState): RetroState {
  const d = requireDiscuss(state);
  if (d.segment === 'context') {
    return {
      ...state,
      discuss: { ...d, segment: 'actions' },
      timer: createTimer(STAGE_DURATIONS.discuss),
    };
  }
  if (d.currentIndex >= d.order.length - 1) {
    return state;
  }
  return {
    ...state,
    discuss: {
      ...d,
      currentIndex: d.currentIndex + 1,
      segment: 'context',
    },
    timer: createTimer(STAGE_DURATIONS.discuss),
  };
}

export function previousDiscussSegment(state: RetroState): RetroState {
  const d = requireDiscuss(state);
  if (d.segment === 'actions') {
    return {
      ...state,
      discuss: { ...d, segment: 'context' },
      timer: createTimer(STAGE_DURATIONS.discuss),
    };
  }
  if (d.currentIndex === 0) {
    return state;
  }
  return {
    ...state,
    discuss: {
      ...d,
      currentIndex: d.currentIndex - 1,
      segment: 'actions',
    },
    timer: createTimer(STAGE_DURATIONS.discuss),
  };
}

export function addDiscussNote(
  state: RetroState,
  parentCardId: string,
  lane: DiscussLane,
  text: string,
  ids: IdGenerator,
): RetroState {
  if (state.stage !== 'discuss') {
    throw new Error('Discuss notes can only be added during discuss');
  }
  const cardExists = state.cards.some((c) => c.id === parentCardId);
  if (!cardExists) {
    throw new Error(`Card with id "${parentCardId}" not found`);
  }
  const note = createDiscussNote(ids.next(), parentCardId, lane, text);
  return { ...state, discussNotes: [...state.discussNotes, note] };
}

export function removeDiscussNote(
  state: RetroState,
  noteId: string,
): RetroState {
  if (state.stage !== 'discuss') {
    throw new Error('Discuss notes can only be removed during discuss');
  }
  const next = state.discussNotes.filter((n) => n.id !== noteId);
  if (next.length === state.discussNotes.length) {
    throw new Error(`Discuss note with id "${noteId}" not found`);
  }
  return { ...state, discussNotes: next };
}

function requireTimer(state: RetroState): Timer {
  if (state.timer === null) {
    throw new Error('Retro has no active timer');
  }
  return state.timer;
}

export function startRetroTimer(state: RetroState): RetroState {
  return { ...state, timer: startTimerState(requireTimer(state)) };
}

export function pauseRetroTimer(state: RetroState): RetroState {
  return { ...state, timer: pauseTimerState(requireTimer(state)) };
}

export function resumeRetroTimer(state: RetroState): RetroState {
  return { ...state, timer: resumeTimerState(requireTimer(state)) };
}

export function tickRetroTimer(state: RetroState, deltaMs: number): RetroState {
  if (state.timer === null) return state;
  return { ...state, timer: tickTimerState(state.timer, deltaMs) };
}

export function resetRetroTimer(state: RetroState): RetroState {
  return { ...state, timer: resetTimerState(requireTimer(state)) };
}

export function startReview(state: RetroState): RetroState {
  if (state.stage !== 'discuss') {
    throw new Error('Review can only start from the discuss stage');
  }
  return {
    ...state,
    stage: 'review',
    timer: createTimer(STAGE_DURATIONS.review),
    discuss: null,
  };
}

export function assignActionOwner(
  state: RetroState,
  noteId: string,
  participantId: string | null,
): RetroState {
  const noteExists = state.discussNotes.some(
    (n) => n.id === noteId && n.lane === 'actions',
  );
  if (!noteExists) return state;
  if (participantId !== null) {
    const participantExists = state.participants.some(
      (p) => p.id === participantId,
    );
    if (!participantExists) return state;
  }
  const next: Record<string, string> = { ...state.actionItemOwners };
  if (participantId === null) {
    delete next[noteId];
  } else {
    next[noteId] = participantId;
  }
  return { ...state, actionItemOwners: next };
}

export function getActionItems(state: RetroState): readonly ActionItem[] {
  // Determine parent card order: by votes desc, insertion order tie-break.
  const insertionIndex = new Map<string, number>();
  state.cards.forEach((c, i) => insertionIndex.set(c.id, i));
  const orderedCards = [...state.cards].sort((a, b) => {
    const va = votesForCard(state, a.id);
    const vb = votesForCard(state, b.id);
    if (vb !== va) return vb - va;
    return (insertionIndex.get(a.id) ?? 0) - (insertionIndex.get(b.id) ?? 0);
  });
  const cardRank = new Map<string, number>();
  orderedCards.forEach((c, i) => cardRank.set(c.id, i));

  const actionNotes = state.discussNotes.filter((n) => n.lane === 'actions');
  // Preserve original note insertion order; stable sort by parent card rank.
  const withIndex = actionNotes.map((n, i) => ({ n, i }));
  withIndex.sort((a, b) => {
    const ra = cardRank.get(a.n.parentCardId) ?? Number.MAX_SAFE_INTEGER;
    const rb = cardRank.get(b.n.parentCardId) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.i - b.i;
  });
  const items: ActionItem[] = [];
  for (const { n } of withIndex) {
    const parent = state.cards.find((c) => c.id === n.parentCardId);
    if (parent === undefined) continue;
    items.push({
      note: n,
      parentCard: parent,
      ownerId: state.actionItemOwners[n.id] ?? null,
    });
  }
  return items;
}
