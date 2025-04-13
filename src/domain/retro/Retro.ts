import { Participant, createParticipant } from './Participant';

export interface RetroState {
  readonly participants: readonly Participant[];
}

export function createRetro(): RetroState {
  return { participants: [] };
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
