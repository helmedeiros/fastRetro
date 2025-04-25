import { describe, it, expect } from 'vitest';
import {
  createHistory,
  addCompletedRetro,
  getAllActionItems,
  CompletedRetro,
} from '../../src/domain/team/RetroHistory';
import { createRetro } from '../../src/domain/retro/Retro';

function fakeCompleted(
  id: string,
  completedAt: string,
  items: { noteId: string; text: string; parentText: string; ownerName: string | null }[],
): CompletedRetro {
  return {
    id,
    completedAt,
    actionItems: items.map((i) => ({ ...i, completedAt })),
    fullState: createRetro(),
  };
}

describe('RetroHistory', () => {
  it('starts empty', () => {
    expect(createHistory().completed).toEqual([]);
  });

  it('prepends a completed retro (newest first)', () => {
    let history = createHistory();
    history = addCompletedRetro(
      history,
      fakeCompleted('r1', '2025-01-01T00:00:00Z', []),
    );
    history = addCompletedRetro(
      history,
      fakeCompleted('r2', '2025-02-01T00:00:00Z', []),
    );
    expect(history.completed.map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('getAllActionItems returns items from all retros, newest first', () => {
    let history = createHistory();
    history = addCompletedRetro(
      history,
      fakeCompleted('r1', '2025-01-01T00:00:00Z', [
        { noteId: 'n1', text: 'old action', parentText: 'card A', ownerName: 'Alice' },
      ]),
    );
    history = addCompletedRetro(
      history,
      fakeCompleted('r2', '2025-02-01T00:00:00Z', [
        { noteId: 'n2', text: 'new action', parentText: 'card B', ownerName: null },
      ]),
    );
    const items = getAllActionItems(history);
    expect(items).toHaveLength(2);
    expect(items[0].text).toBe('new action');
    expect(items[1].text).toBe('old action');
  });

  it('returns empty when no retros', () => {
    expect(getAllActionItems(createHistory())).toEqual([]);
  });
});
