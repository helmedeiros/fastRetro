import type { RetroState } from '../retro/Retro';

export interface FlatActionItem {
  readonly noteId: string;
  readonly text: string;
  readonly parentText: string;
  readonly ownerName: string | null;
  readonly completedAt: string;
}

export interface CompletedRetro {
  readonly id: string;
  readonly completedAt: string;
  readonly actionItems: readonly FlatActionItem[];
  readonly fullState: RetroState;
}

export interface RetroHistoryState {
  readonly completed: readonly CompletedRetro[];
}

export function createHistory(): RetroHistoryState {
  return { completed: [] };
}

export function addCompletedRetro(
  history: RetroHistoryState,
  entry: CompletedRetro,
): RetroHistoryState {
  return { completed: [entry, ...history.completed] };
}

export function getAllActionItems(
  history: RetroHistoryState,
): readonly FlatActionItem[] {
  return history.completed.flatMap((r) => r.actionItems);
}

export function clearOwnerFromHistory(
  history: RetroHistoryState,
  ownerName: string,
): RetroHistoryState {
  return {
    completed: history.completed.map((r) => ({
      ...r,
      actionItems: r.actionItems.map((a) =>
        a.ownerName?.toLowerCase() === ownerName.toLowerCase()
          ? { ...a, ownerName: null }
          : a,
      ),
    })),
  };
}

export function addManualActionItem(
  history: RetroHistoryState,
  item: FlatActionItem,
): RetroHistoryState {
  const manualId = '__manual__';
  const existing = history.completed.find((r) => r.id === manualId);
  if (existing !== undefined) {
    return {
      completed: history.completed.map((r) =>
        r.id === manualId
          ? { ...r, actionItems: [item, ...r.actionItems] }
          : r,
      ),
    };
  }
  return {
    completed: [
      { id: manualId, completedAt: item.completedAt, actionItems: [item], fullState: null as unknown as RetroState },
      ...history.completed,
    ],
  };
}

export function removeActionItem(
  history: RetroHistoryState,
  noteId: string,
): RetroHistoryState {
  return {
    completed: history.completed.map((r) => ({
      ...r,
      actionItems: r.actionItems.filter((a) => a.noteId !== noteId),
    })),
  };
}

export function editActionItemText(
  history: RetroHistoryState,
  noteId: string,
  newText: string,
): RetroHistoryState {
  return {
    completed: history.completed.map((r) => ({
      ...r,
      actionItems: r.actionItems.map((a) =>
        a.noteId === noteId ? { ...a, text: newText } : a,
      ),
    })),
  };
}

export function reassignActionItem(
  history: RetroHistoryState,
  noteId: string,
  ownerName: string | null,
): RetroHistoryState {
  return {
    completed: history.completed.map((r) => ({
      ...r,
      actionItems: r.actionItems.map((a) =>
        a.noteId === noteId ? { ...a, ownerName } : a,
      ),
    })),
  };
}
