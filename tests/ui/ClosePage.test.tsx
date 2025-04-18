import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClosePage } from '../../src/ui/pages/ClosePage';
import type { CloseSummary } from '../../src/domain/retro/Retro';

const summary: CloseSummary = {
  discussed: [
    {
      kind: 'card',
      card: { id: 'c-1', columnId: 'start', text: 'ship faster', votes: 2 },
      contextNotes: [
        { id: 'c-3', parentCardId: 'c-1', lane: 'context', text: 'CI flaky' },
      ],
      actionItems: [
        {
          note: {
            id: 'c-4',
            parentCardId: 'c-1',
            lane: 'actions',
            text: 'fix flaky test',
          },
          owner: { id: 'p-1', name: 'Alice' },
        },
      ],
    },
    {
      kind: 'card',
      card: { id: 'c-2', columnId: 'stop', text: 'long meetings', votes: 0 },
      contextNotes: [],
      actionItems: [
        {
          note: {
            id: 'c-6',
            parentCardId: 'c-2',
            lane: 'actions',
            text: 'timebox meetings',
          },
          owner: null,
        },
      ],
    },
  ],
  allActionItems: [],
};

describe('ClosePage', () => {
  it('renders each discussed card with context, actions, and owners', () => {
    render(<ClosePage summary={summary} onExport={() => undefined} />);
    expect(
      screen.getByRole('heading', { name: /retro complete/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('ship faster')).toBeInTheDocument();
    expect(screen.getByText('CI flaky')).toBeInTheDocument();
    expect(screen.getByText('fix flaky test')).toBeInTheDocument();
    expect(screen.getByText(/owned by Alice/i)).toBeInTheDocument();
    expect(screen.getByText('timebox meetings')).toBeInTheDocument();
    expect(screen.getByText(/unassigned/i)).toBeInTheDocument();
  });

  it('fires export callback on button click', () => {
    const onExport = vi.fn();
    render(<ClosePage summary={summary} onExport={onExport} />);
    fireEvent.click(
      screen.getByRole('button', { name: /export retro as json/i }),
    );
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
