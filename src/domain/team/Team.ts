export interface TeamMember {
  readonly id: string;
  readonly name: string;
}

export interface Agreement {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
}

export interface TeamState {
  readonly members: readonly TeamMember[];
  readonly agreements: readonly Agreement[];
}

export function createTeam(): TeamState {
  return { members: [], agreements: [] };
}

export function addMember(
  state: TeamState,
  id: string,
  name: string,
): TeamState {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Member name must not be empty');
  }
  const exists = state.members.some(
    (m) => m.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exists) {
    throw new Error(`Member "${trimmed}" already exists`);
  }
  return { ...state, members: [...state.members, { id, name: trimmed }] };
}

export function removeMember(state: TeamState, id: string): TeamState {
  const next = state.members.filter((m) => m.id !== id);
  if (next.length === state.members.length) {
    throw new Error(`Member with id "${id}" not found`);
  }
  return { ...state, members: next };
}

export function addAgreement(
  state: TeamState,
  id: string,
  text: string,
  createdAt: string,
): TeamState {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Agreement text must not be empty');
  }
  return {
    ...state,
    agreements: [...state.agreements, { id, text: trimmed, createdAt }],
  };
}

export function removeAgreement(state: TeamState, id: string): TeamState {
  return {
    ...state,
    agreements: state.agreements.filter((a) => a.id !== id),
  };
}
