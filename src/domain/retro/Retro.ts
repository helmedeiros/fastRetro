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
  ICEBREAKER_QUESTIONS,
  IcebreakerState,
  createIcebreaker,
  nextParticipant as nextIcebreakerParticipant,
} from './stages/Icebreaker';

export type RetroStage = 'setup' | 'icebreaker' | 'brainstorm';

export const STAGE_DURATIONS: Readonly<Record<'icebreaker' | 'brainstorm', number>> = {
  icebreaker: 10 * 60 * 1000,
  brainstorm: 5 * 60 * 1000,
};

export interface RetroState {
  readonly stage: RetroStage;
  readonly participants: readonly Participant[];
  readonly timer: Timer | null;
  readonly icebreaker: IcebreakerState | null;
  readonly cards: readonly Card[];
}

export function createRetro(): RetroState {
  return {
    stage: 'setup',
    participants: [],
    timer: null,
    icebreaker: null,
    cards: [],
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
