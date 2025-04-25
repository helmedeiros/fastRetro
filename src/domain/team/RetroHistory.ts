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
