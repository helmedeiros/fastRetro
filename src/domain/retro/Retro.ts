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
import {
  Group,
  createGroup,
  renameGroup as renameGroupDomain,
} from './Group';
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
  | 'group'
  | 'vote'
  | 'discuss'
  | 'review'
  | 'close';

export const STAGE_DURATIONS: Readonly<
  Record<
    'icebreaker' | 'brainstorm' | 'group' | 'vote' | 'discuss' | 'review',
    number
  >
> = {
  icebreaker: 10 * 60 * 1000,
  brainstorm: 5 * 60 * 1000,
  group: 5 * 60 * 1000,
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

export interface RetroMeta {
  readonly name: string;
  readonly date: string;
  readonly context: string;
  readonly templateId: string;
}

export interface RetroState {
  readonly stage: RetroStage;
  readonly meta: RetroMeta;
  readonly participants: readonly Participant[];
  readonly timer: Timer | null;
  readonly icebreaker: IcebreakerState | null;
  readonly cards: readonly Card[];
  readonly groups: readonly Group[];
  readonly votes: readonly Vote[];
  readonly voteBudget: number;
  readonly discuss: DiscussState | null;
  readonly discussNotes: readonly DiscussNote[];
  readonly actionItemOwners: Readonly<Record<string, string>>;
}

export interface VotableSummary {
  readonly id: string;
  readonly text: string;
  readonly columnId: ColumnId;
}

export interface ActionItem {
  readonly note: DiscussNote;
  readonly parentCard: VotableSummary;
  readonly ownerId: string | null;
}

export type Votable =
  | { readonly kind: 'card'; readonly card: Card }
  | {
      readonly kind: 'group';
      readonly group: Group;
      readonly cards: readonly Card[];
    };

export function createRetro(meta?: RetroMeta): RetroState {
  return {
    stage: 'setup',
    meta: meta ?? { name: '', date: '', context: '', templateId: 'start-stop' },
    participants: [],
    timer: null,
    icebreaker: null,
    cards: [],
    groups: [],
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

export function addIcebreakerParticipant(
  state: RetroState,
  id: string,
  name: string,
  picker: Picker<string>,
): RetroState {
  if (state.stage !== 'icebreaker' || state.icebreaker === null) {
    throw new Error('Can only add participants during icebreaker');
  }
  const withParticipant = addParticipant(state, id, name);
  const question = picker.pick(ICEBREAKER_QUESTIONS);
  return {
    ...withParticipant,
    icebreaker: {
      ...state.icebreaker,
      participantIds: [...state.icebreaker.participantIds, id],
      questions: [...state.icebreaker.questions, question],
    },
  };
}

export function removeIcebreakerParticipant(
  state: RetroState,
  id: string,
): RetroState {
  if (state.stage !== 'icebreaker' || state.icebreaker === null) {
    throw new Error('Can only remove participants during icebreaker');
  }
  const idx = state.icebreaker.participantIds.indexOf(id);
  if (idx < 0) return state;
  // Don't allow removing the current or already-passed participants
  if (idx <= state.icebreaker.currentIndex) return state;
  const withRemoved = removeParticipant(state, id);
  const nextIds = state.icebreaker.participantIds.filter((pid) => pid !== id);
  const nextQuestions = state.icebreaker.questions.filter((_, i) =>
    state.icebreaker!.participantIds[i] !== id,
  );
  return {
    ...withRemoved,
    icebreaker: {
      ...state.icebreaker,
      participantIds: nextIds,
      questions: nextQuestions,
    },
  };
}

export function advanceIcebreakerParticipant(state: RetroState): RetroState {
  if (state.icebreaker === null) {
    throw new Error('No active icebreaker');
  }
  return { ...state, icebreaker: nextIcebreakerParticipant(state.icebreaker) };
}

export function startBrainstorm(state: RetroState): RetroState {
  if (state.stage === 'setup') {
    throw new Error('Brainstorm can only start after the icebreaker stage');
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

export function moveCard(
  state: RetroState,
  cardId: string,
  targetColumnId: ColumnId,
  targetIndex: number,
): RetroState {
  if (state.stage !== 'brainstorm') {
    throw new Error('Cards can only be moved during brainstorm');
  }
  const card = state.cards.find((c) => c.id === cardId);
  if (card === undefined) return state;
  const movedCard = { ...card, columnId: targetColumnId };
  const without = state.cards.filter((c) => c.id !== cardId);
  const targetCards = without.filter((c) => c.columnId === targetColumnId);
  const otherCards = without.filter((c) => c.columnId !== targetColumnId);
  const clampedIdx = Math.max(0, Math.min(targetIndex, targetCards.length));
  targetCards.splice(clampedIdx, 0, movedCard);
  return { ...state, cards: [...otherCards, ...targetCards] };
}

export function startGroup(state: RetroState): RetroState {
  if (state.stage === 'setup') {
    throw new Error('Group can only start after the icebreaker stage');
  }
  return {
    ...state,
    stage: 'group',
    timer: createTimer(STAGE_DURATIONS.group),
  };
}

function requireCard(state: RetroState, cardId: string): Card {
  const card = state.cards.find((c) => c.id === cardId);
  if (card === undefined) {
    throw new Error(`Card with id "${cardId}" not found`);
  }
  return card;
}

export function groupOfCard(
  state: RetroState,
  cardId: string,
): Group | undefined {
  return state.groups.find((g) => g.cardIds.includes(cardId));
}

function defaultGroupName(cards: readonly Card[]): string {
  return cards.map((c) => c.text).join(' + ');
}

export function createGroupByDrop(
  state: RetroState,
  sourceCardId: string,
  targetCardId: string,
  ids: IdGenerator,
): RetroState {
  if (state.stage !== 'group') {
    throw new Error('Groups can only be formed during the group stage');
  }
  if (sourceCardId === targetCardId) return state;
  const source = requireCard(state, sourceCardId);
  const target = requireCard(state, targetCardId);
  if (source.columnId !== target.columnId) {
    throw new Error('Cards can only be grouped within the same column');
  }
  const sourceGroup = groupOfCard(state, sourceCardId);
  if (sourceGroup !== undefined) {
    // Already in a group — no-op to keep the domain simple.
    return state;
  }
  const targetGroup = groupOfCard(state, targetCardId);
  if (targetGroup !== undefined) {
    const nextGroups = state.groups.map((g) =>
      g.id === targetGroup.id
        ? { ...g, cardIds: [...g.cardIds, sourceCardId] }
        : g,
    );
    return {
      ...state,
      groups: nextGroups,
      votes: state.votes.filter((v) => v.cardId !== sourceCardId),
    };
  }
  const group = createGroup(
    ids.next(),
    source.columnId,
    defaultGroupName([target, source]),
    [targetCardId, sourceCardId],
  );
  return {
    ...state,
    groups: [...state.groups, group],
    votes: state.votes.filter(
      (v) => v.cardId !== sourceCardId && v.cardId !== targetCardId,
    ),
  };
}

export function renameRetroGroup(
  state: RetroState,
  groupId: string,
  name: string,
): RetroState {
  const next = state.groups.map((g) =>
    g.id === groupId ? renameGroupDomain(g, name) : g,
  );
  return { ...state, groups: next };
}

export function ungroupCard(
  state: RetroState,
  cardId: string,
): RetroState {
  const group = groupOfCard(state, cardId);
  if (group === undefined) return state;
  const nextCardIds = group.cardIds.filter((id) => id !== cardId);
  const nextGroups =
    nextCardIds.length < 2
      ? state.groups.filter((g) => g.id !== group.id)
      : state.groups.map((g) =>
          g.id === group.id ? { ...g, cardIds: nextCardIds } : g,
        );
  // Drop any votes that were on the (now-removed) group, since the group is gone.
  const removedGroupId = nextCardIds.length < 2 ? group.id : null;
  const nextVotes =
    removedGroupId === null
      ? state.votes
      : state.votes.filter((v) => v.cardId !== removedGroupId);
  return { ...state, groups: nextGroups, votes: nextVotes };
}

export function startVote(state: RetroState): RetroState {
  if (state.stage === 'setup') {
    throw new Error('Vote can only start after the icebreaker stage');
  }
  return {
    ...state,
    stage: 'vote',
    timer: createTimer(STAGE_DURATIONS.vote),
  };
}

export function getVotables(state: RetroState): readonly Votable[] {
  const groupOfCardId = new Map<string, Group>();
  for (const g of state.groups) {
    for (const cid of g.cardIds) groupOfCardId.set(cid, g);
  }
  const emittedGroupIds = new Set<string>();
  const votables: Votable[] = [];
  for (const card of state.cards) {
    const g = groupOfCardId.get(card.id);
    if (g === undefined) {
      votables.push({ kind: 'card', card });
    } else if (!emittedGroupIds.has(g.id)) {
      emittedGroupIds.add(g.id);
      const cards = g.cardIds
        .map((id) => state.cards.find((c) => c.id === id))
        .filter((c): c is Card => c !== undefined);
      votables.push({ kind: 'group', group: g, cards });
    }
  }
  return votables;
}

export function votableIdOf(v: Votable): string {
  return v.kind === 'card' ? v.card.id : v.group.id;
}

export function votableTitleOf(v: Votable): string {
  return v.kind === 'card' ? v.card.text : v.group.name;
}

export function votableColumnOf(v: Votable): ColumnId {
  return v.kind === 'card' ? v.card.columnId : v.group.columnId;
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

export function votesForCard(state: RetroState, votableId: string): number {
  return state.votes.filter((v) => v.cardId === votableId).length;
}

export function votesForVotable(state: RetroState, votableId: string): number {
  return state.votes.filter((v) => v.cardId === votableId).length;
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
  votableId: string,
): RetroState {
  if (state.stage !== 'vote') {
    throw new Error('Votes can only be cast during vote stage');
  }
  const participantExists = state.participants.some(
    (p) => p.id === participantId,
  );
  if (!participantExists) return state;
  const groupExists = state.groups.some((g) => g.id === votableId);
  const card = state.cards.find((c) => c.id === votableId);
  if (!groupExists && card === undefined) return state;
  if (card !== undefined && groupOfCard(state, card.id) !== undefined) {
    // Voting on a grouped card is disallowed — vote on the group instead.
    return state;
  }
  const cardId = votableId;
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
  if (state.stage === 'setup') {
    throw new Error('Discuss can only start after the icebreaker stage');
  }
  const votables = getVotables(state);
  const insertionIndex = new Map<string, number>();
  votables.forEach((v, i) => insertionIndex.set(votableIdOf(v), i));
  const order = [...votables]
    .sort((a, b) => {
      const ida = votableIdOf(a);
      const idb = votableIdOf(b);
      const va = votesForVotable(state, ida);
      const vb = votesForVotable(state, idb);
      if (vb !== va) return vb - va;
      return (
        (insertionIndex.get(ida) ?? 0) - (insertionIndex.get(idb) ?? 0)
      );
    })
    .map((v) => votableIdOf(v));
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
  const groupExists = state.groups.some((g) => g.id === parentCardId);
  if (!cardExists && !groupExists) {
    throw new Error(`Votable with id "${parentCardId}" not found`);
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
  if (state.stage === 'setup') {
    throw new Error('Review can only start after the icebreaker stage');
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

export function startClose(state: RetroState): RetroState {
  if (state.stage === 'setup') {
    throw new Error('Close can only start after the icebreaker stage');
  }
  return { ...state, stage: 'close', timer: null };
}

export interface CloseSummaryCardEntry {
  readonly kind: 'card';
  readonly card: {
    readonly id: string;
    readonly columnId: ColumnId;
    readonly text: string;
    readonly votes: number;
  };
  readonly contextNotes: readonly DiscussNote[];
  readonly actionItems: readonly {
    readonly note: DiscussNote;
    readonly owner: Participant | null;
  }[];
}

export interface CloseSummaryGroupEntry {
  readonly kind: 'group';
  readonly group: {
    readonly id: string;
    readonly columnId: ColumnId;
    readonly name: string;
    readonly votes: number;
  };
  readonly cards: readonly Card[];
  readonly contextNotes: readonly DiscussNote[];
  readonly actionItems: readonly {
    readonly note: DiscussNote;
    readonly owner: Participant | null;
  }[];
}

export type CloseSummaryDiscussedItem =
  | CloseSummaryCardEntry
  | CloseSummaryGroupEntry;

export interface CloseSummary {
  readonly discussed: readonly CloseSummaryDiscussedItem[];
  readonly allActionItems: readonly {
    readonly note: DiscussNote;
    readonly parentCard: VotableSummary;
    readonly owner: Participant | null;
  }[];
}

function orderedVotablesByVotes(state: RetroState): readonly Votable[] {
  const votables = getVotables(state);
  const insertionIndex = new Map<string, number>();
  votables.forEach((v, i) => insertionIndex.set(votableIdOf(v), i));
  return [...votables].sort((a, b) => {
    const ida = votableIdOf(a);
    const idb = votableIdOf(b);
    const va = votesForVotable(state, ida);
    const vb = votesForVotable(state, idb);
    if (vb !== va) return vb - va;
    return (insertionIndex.get(ida) ?? 0) - (insertionIndex.get(idb) ?? 0);
  });
}

function summarizeVotable(v: Votable): VotableSummary {
  if (v.kind === 'card') {
    return { id: v.card.id, text: v.card.text, columnId: v.card.columnId };
  }
  return { id: v.group.id, text: v.group.name, columnId: v.group.columnId };
}

export function getCloseSummary(state: RetroState): CloseSummary {
  const participantById = new Map<string, Participant>();
  for (const p of state.participants) participantById.set(p.id, p);
  const ownerFor = (noteId: string): Participant | null => {
    const ownerId = state.actionItemOwners[noteId];
    if (ownerId === undefined) return null;
    return participantById.get(ownerId) ?? null;
  };
  const ordered = orderedVotablesByVotes(state);
  const discussed: CloseSummaryDiscussedItem[] = ordered.map((v) => {
    const id = votableIdOf(v);
    const contextNotes = state.discussNotes.filter(
      (n) => n.parentCardId === id && n.lane === 'context',
    );
    const actionItems = state.discussNotes
      .filter((n) => n.parentCardId === id && n.lane === 'actions')
      .map((note) => ({ note, owner: ownerFor(note.id) }));
    if (v.kind === 'card') {
      return {
        kind: 'card',
        card: {
          id: v.card.id,
          columnId: v.card.columnId,
          text: v.card.text,
          votes: votesForVotable(state, id),
        },
        contextNotes,
        actionItems,
      };
    }
    return {
      kind: 'group',
      group: {
        id: v.group.id,
        columnId: v.group.columnId,
        name: v.group.name,
        votes: votesForVotable(state, id),
      },
      cards: v.cards,
      contextNotes,
      actionItems,
    };
  });
  const allActionItems = getActionItems(state).map((item) => ({
    note: item.note,
    parentCard: item.parentCard,
    owner: item.ownerId === null ? null : (participantById.get(item.ownerId) ?? null),
  }));
  return { discussed, allActionItems };
}

export interface ExportJsonV1 {
  readonly version: 1;
  readonly createdAt: string;
  readonly participants: readonly { readonly id: string; readonly name: string }[];
  readonly icebreaker:
    | { readonly question: string; readonly rotation: readonly string[] }
    | null;
  readonly columns: {
    readonly start: readonly Card[];
    readonly stop: readonly Card[];
  };
  readonly groups: readonly {
    readonly id: string;
    readonly name: string;
    readonly cardIds: readonly string[];
  }[];
  readonly votes: readonly { readonly participantId: string; readonly cardId: string }[];
  readonly discussion: readonly {
    readonly cardId: string;
    readonly context: readonly DiscussNote[];
    readonly actionItems: readonly DiscussNote[];
  }[];
  readonly actionItems: readonly {
    readonly id: string;
    readonly text: string;
    readonly ownerId: string | null;
  }[];
}

export function serializeRetroToExportJson(
  state: RetroState,
  isoNow: string,
): ExportJsonV1 {
  const summary = getCloseSummary(state);
  return {
    version: 1,
    createdAt: isoNow,
    participants: state.participants.map((p) => ({ id: p.id, name: p.name })),
    icebreaker:
      state.icebreaker === null
        ? null
        : {
            question: state.icebreaker.question,
            rotation: [...state.icebreaker.participantIds],
          },
    columns: {
      start: state.cards.filter((c) => c.columnId === 'start'),
      stop: state.cards.filter((c) => c.columnId === 'stop'),
    },
    groups: state.groups.map((g) => ({
      id: g.id,
      name: g.name,
      cardIds: [...g.cardIds],
    })),
    votes: state.votes.map((v) => ({
      participantId: v.participantId,
      cardId: v.cardId,
    })),
    discussion: summary.discussed.map((d) => ({
      cardId: d.kind === 'card' ? d.card.id : d.group.id,
      context: d.contextNotes,
      actionItems: d.actionItems.map((a) => a.note),
    })),
    actionItems: summary.allActionItems.map((a) => ({
      id: a.note.id,
      text: a.note.text,
      ownerId: a.owner === null ? null : a.owner.id,
    })),
  };
}

export function getActionItems(state: RetroState): readonly ActionItem[] {
  // Determine parent votable order: by votes desc, insertion order tie-break.
  const ordered = orderedVotablesByVotes(state);
  const rank = new Map<string, number>();
  ordered.forEach((v, i) => rank.set(votableIdOf(v), i));
  const summaryById = new Map<string, VotableSummary>();
  for (const v of ordered) summaryById.set(votableIdOf(v), summarizeVotable(v));

  const actionNotes = state.discussNotes.filter((n) => n.lane === 'actions');
  const withIndex = actionNotes.map((n, i) => ({ n, i }));
  withIndex.sort((a, b) => {
    const ra = rank.get(a.n.parentCardId) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.n.parentCardId) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.i - b.i;
  });
  const items: ActionItem[] = [];
  for (const { n } of withIndex) {
    const parent = summaryById.get(n.parentCardId);
    if (parent === undefined) continue;
    items.push({
      note: n,
      parentCard: parent,
      ownerId: state.actionItemOwners[n.id] ?? null,
    });
  }
  return items;
}
