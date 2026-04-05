import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClosePage } from '../../src/ui/pages/ClosePage';
import type { CloseSummary } from '../../src/domain/retro/Retro';
import type { DiscussItem } from '../../src/domain/retro/DiscussItem';

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
          note: { id: 'c-4', parentCardId: 'c-1', lane: 'actions', text: 'fix flaky test' },
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
          note: { id: 'c-6', parentCardId: 'c-2', lane: 'actions', text: 'timebox meetings' },
          owner: null,
        },
      ],
    },
  ],
  allActionItems: [
    {
      note: { id: 'c-4', parentCardId: 'c-1', lane: 'actions', text: 'fix flaky test' },
      parentCard: { id: 'c-1', columnId: 'start', text: 'ship faster' },
      owner: { id: 'p-1', name: 'Alice' },
    },
    {
      note: { id: 'c-6', parentCardId: 'c-2', lane: 'actions', text: 'timebox meetings' },
      parentCard: { id: 'c-2', columnId: 'stop', text: 'long meetings' },
      owner: null,
    },
  ],
};

const cards = [
  { id: 'c-1', columnId: 'start', text: 'ship faster' },
  { id: 'c-2', columnId: 'stop', text: 'long meetings' },
];

describe('ClosePage', () => {
  it('renders board overview and action items', () => {
    render(<ClosePage summary={summary} cards={cards} onExport={() => undefined} />);
    expect(screen.getByRole('heading', { name: /retro complete/i })).toBeInTheDocument();
    expect(screen.getByText('fix flaky test')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('timebox meetings')).toBeInTheDocument();
    expect(screen.getByText(/unassigned/i)).toBeInTheDocument();
  });

  it('fires export callback on button click', () => {
    const onExport = vi.fn();
    render(<ClosePage summary={summary} onExport={onExport} />);
    fireEvent.click(screen.getByRole('button', { name: /export retro as json/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('renders check results with question medians', () => {
    const checkSummary: CloseSummary = {
      discussed: [
        {
          kind: 'question',
          question: { id: 'ownership', title: 'Ownership', description: 'Team ownership', median: 3.5 },
          actionItems: [
            { note: { id: 'a1', parentCardId: 'ownership', lane: 'actions', text: 'Clarify roles' }, owner: { id: 'p1', name: 'Alice' } },
          ],
        },
      ],
      allActionItems: [
        {
          note: { id: 'a1', parentCardId: 'ownership', lane: 'actions', text: 'Clarify roles' },
          parentCard: { id: 'ownership', text: 'Ownership', columnId: '' },
          owner: { id: 'p1', name: 'Alice' },
        },
      ],
    };
    const checkItems: DiscussItem[] = [
      { id: 'ownership', title: 'Ownership', description: 'Team ownership', score: 3.5, scoreLabel: '3.5', participantIds: ['p1', 'p2'] },
      { id: 'value', title: 'Value', description: 'Value delivery', score: 0, scoreLabel: 'No ratings', participantIds: [] },
    ];
    render(
      <ClosePage
        summary={checkSummary}
        retroType="check"
        discussItems={checkItems}
        stats={{ ideas: 0, participants: 2, votes: 0, groups: 0, actions: 1 }}
      />,
    );
    expect(screen.getByRole('heading', { name: /check complete/i })).toBeInTheDocument();
    expect(screen.getByText('Survey results')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getAllByText('Ownership').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Clarify roles')).toBeInTheDocument();
    // No board overview for checks
    expect(screen.queryByText('Board overview')).not.toBeInTheDocument();
  });
});
