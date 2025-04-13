export interface Participant {
  readonly id: string;
  readonly name: string;
}

export function createParticipant(id: string, name: string): Participant {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Participant name must not be empty');
  }
  if (id.trim().length === 0) {
    throw new Error('Participant id must not be empty');
  }
  return { id, name: trimmed };
}
