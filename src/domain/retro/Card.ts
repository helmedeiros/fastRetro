export const MAX_CARD_LENGTH = 140;

export type ColumnId = 'start' | 'stop';

export interface Card {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly text: string;
}

export function createCard(id: string, columnId: ColumnId, text: string): Card {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Card text must not be empty');
  }
  if (trimmed.length > MAX_CARD_LENGTH) {
    throw new Error(
      `Card text must be at most ${String(MAX_CARD_LENGTH)} characters`,
    );
  }
  return Object.freeze({ id, columnId, text: trimmed });
}
