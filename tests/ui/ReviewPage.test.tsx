import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReviewPage } from '../../src/ui/pages/ReviewPage';
import type { Timer } from '../../src/domain/retro/Timer';
import type { ActionItem } from '../../src/domain/retro/Retro';

const timer: Timer = {
  status: 'idle',
  durationMs: 5 * 60 * 1000,
  elapsedMs: 0,
  remainingMs: 5 * 60 * 1000,
};

const participants = [
  { id: 'p-1', name: 'Alice' },
  { id: 'p-2', name: 'Bob' },
];

const actionItems: ActionItem[] = [
  {
    note: { id: 'n-1', parentCardId: 'c-1', lane: 'actions', text: 'fix flaky test' },
    parentCard: { id: 'c-1', columnId: 'start', text: 'ship faster' },
    ownerId: null,
  },
  {
    note: { id: 'n-2', parentCardId: 'c-2', lane: 'actions', text: 'timebox meetings' },
    parentCard: { id: 'c-2', columnId: 'stop', text: 'long meetings' },
    ownerId: 'p-1',
  },
];

function renderPage(): void {
  render(
    <ReviewPage
      timer={timer}
      participants={participants}
      actionItems={actionItems}
      onStartTimer={vi.fn()}
      onPauseTimer={vi.fn()}
      onResumeTimer={vi.fn()}
      onResetTimer={vi.fn()}
      onAssignOwner={vi.fn()}
    />,
  );
}

describe('ReviewPage', () => {
  it('renders all action notes with parent card text', () => {
    renderPage();
    const region = screen.getByRole('region', { name: /^action items$/i });
    expect(within(region).getByText('fix flaky test')).toBeInTheDocument();
    expect(within(region).getByText('ship faster')).toBeInTheDocument();
    expect(within(region).getByText('timebox meetings')).toBeInTheDocument();
    expect(within(region).getByText('long meetings')).toBeInTheDocument();
  });

  it('renders timer', () => {
    renderPage();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('5m 00s');
  });

  it('renders team agreements section', () => {
    render(
      <ReviewPage
        timer={timer}
        participants={participants}
        actionItems={[]}
        agreements={[{ id: 'a-1', text: 'timebox to 30min', createdAt: '2025-01-01' }]}
        onStartTimer={vi.fn()}
        onPauseTimer={vi.fn()}
        onResumeTimer={vi.fn()}
        onResetTimer={vi.fn()}
        onAssignOwner={vi.fn()}
      />,
    );
    expect(screen.getByText('timebox to 30min')).toBeInTheDocument();
  });

  it('shows empty states when no items', () => {
    render(
      <ReviewPage
        timer={timer}
        participants={participants}
        actionItems={[]}
        onStartTimer={vi.fn()}
        onPauseTimer={vi.fn()}
        onResumeTimer={vi.fn()}
        onResetTimer={vi.fn()}
        onAssignOwner={vi.fn()}
      />,
    );
    expect(screen.getByText('No actions yet')).toBeInTheDocument();
    expect(screen.getByText('No agreements yet')).toBeInTheDocument();
  });
});
