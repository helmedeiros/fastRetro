import { MAX_CARD_LENGTH } from './Card';

export type DiscussLane = 'context' | 'actions';

export interface DiscussNote {
  readonly id: string;
  readonly parentCardId: string;
  readonly lane: DiscussLane;
  readonly text: string;
}

export function createDiscussNote(
  id: string,
  parentCardId: string,
  lane: DiscussLane,
  text: string,
): DiscussNote {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Discuss note text must not be empty');
  }
  if (trimmed.length > MAX_CARD_LENGTH) {
    throw new Error(
      `Discuss note text must be at most ${String(MAX_CARD_LENGTH)} characters`,
    );
  }
  return Object.freeze({ id, parentCardId, lane, text: trimmed });
}
