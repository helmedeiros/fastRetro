import { render, screen, fireEvent, within } from '@testing-library/react';
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

function renderPage(): {
  onAssignOwner: ReturnType<typeof vi.fn>;
} {
  const onAssignOwner = vi.fn();
  render(
    <ReviewPage
      timer={timer}
      participants={participants}
      actionItems={actionItems}
      onStartTimer={vi.fn()}
      onPauseTimer={vi.fn()}
      onResumeTimer={vi.fn()}
      onResetTimer={vi.fn()}
      onAssignOwner={onAssignOwner}
    />,
  );
  return { onAssignOwner };
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

  it('reflects current owner in select value', () => {
    renderPage();
    const select = screen.getByLabelText(/owner for timebox meetings/i);
    expect((select as HTMLSelectElement).value).toBe('p-1');
  });

  it('fires onAssignOwner with participant id when selecting an owner', () => {
    const { onAssignOwner } = renderPage();
    const select = screen.getByLabelText(/owner for fix flaky test/i);
    fireEvent.change(select, { target: { value: 'p-2' } });
    expect(onAssignOwner).toHaveBeenCalledWith('n-1', 'p-2');
  });

  it('fires onAssignOwner with null when selecting unassigned', () => {
    const { onAssignOwner } = renderPage();
    const select = screen.getByLabelText(/owner for timebox meetings/i);
    fireEvent.change(select, { target: { value: '' } });
    expect(onAssignOwner).toHaveBeenCalledWith('n-2', null);
  });
});
