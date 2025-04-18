import type { ColumnId } from './Card';

export interface Group {
  readonly id: string;
  readonly columnId: ColumnId;
  readonly name: string;
  readonly cardIds: readonly string[];
}

export function createGroup(
  id: string,
  columnId: ColumnId,
  name: string,
  cardIds: readonly string[],
): Group {
  if (cardIds.length < 1) {
    throw new Error('A group must contain at least one card');
  }
  const unique = new Set(cardIds);
  if (unique.size !== cardIds.length) {
    throw new Error('A group cannot contain duplicate card ids');
  }
  return Object.freeze({
    id,
    columnId,
    name: name.trim(),
    cardIds: Object.freeze([...cardIds]),
  });
}

export function renameGroup(group: Group, name: string): Group {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Group name must not be empty');
  }
  return { ...group, name: trimmed };
}

export function addCardToGroup(group: Group, cardId: string): Group {
  if (group.cardIds.includes(cardId)) {
    return group;
  }
  return { ...group, cardIds: [...group.cardIds, cardId] };
}

export function removeCardFromGroup(group: Group, cardId: string): Group {
  return {
    ...group,
    cardIds: group.cardIds.filter((id) => id !== cardId),
  };
}
