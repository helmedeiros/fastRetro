import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { DiscussPage } from '../../src/ui/pages/DiscussPage';
import { createTimer } from '../../src/domain/retro/Timer';
import type { Card } from '../../src/domain/retro/Card';
import type { Vote } from '../../src/domain/retro/Vote';
import type { DiscussState } from '../../src/domain/retro/Retro';
import type {
  DiscussLane,
  DiscussNote,
} from '../../src/domain/retro/DiscussNote';

function noop(): void {
  // intentionally empty
}

const timer = createTimer(2.5 * 60 * 1000);
const cards: readonly Card[] = [
  { id: 'c-1', columnId: 'start', text: 'ship faster' },
  { id: 'c-2', columnId: 'stop', text: 'long meetings' },
];
const votes: readonly Vote[] = [{ participantId: 'p-1', cardId: 'c-1' }];

function Harness(): JSX.Element {
  const [discuss, setDiscuss] = useState<DiscussState>({
    order: ['c-1', 'c-2'],
    currentIndex: 0,
    segment: 'context',
  });
  const [notes, setNotes] = useState<readonly DiscussNote[]>([]);
  let nextId = notes.length;
  const nid = (): string => {
    nextId += 1;
    return `n-${String(nextId)}`;
  };
  return (
    <DiscussPage
      timer={timer}
      cards={cards}
      votes={votes}
      discuss={discuss}
      notes={notes}
      onStartTimer={noop}
      onPauseTimer={noop}
      onResumeTimer={noop}
      onResetTimer={noop}
      onPreviousSegment={(): void => {
        setDiscuss((d) => {
          if (d.segment === 'actions') return { ...d, segment: 'context' };
          if (d.currentIndex === 0) return d;
          return {
            ...d,
            currentIndex: d.currentIndex - 1,
            segment: 'actions',
          };
        });
      }}
      onNextSegment={(): void => {
        setDiscuss((d) => {
          if (d.segment === 'context') return { ...d, segment: 'actions' };
          if (d.currentIndex >= d.order.length - 1) return d;
          return {
            ...d,
            currentIndex: d.currentIndex + 1,
            segment: 'context',
          };
        });
      }}
      onAddNote={(cardId, lane: DiscussLane, text): void => {
        setNotes((n) => [
          ...n,
          { id: nid(), parentCardId: cardId, lane, text },
        ]);
      }}
      onRemoveNote={(id): void => {
        setNotes((n) => n.filter((x) => x.id !== id));
      }}
      onContinueToReview={noop}
    />
  );
}

describe('DiscussPage', () => {
  it('renders active card, timer, and context active', () => {
    render(<Harness />);
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('2m 30s');
    const active = screen.getByRole('region', { name: /active card/i });
    expect(within(active).getByText('ship faster')).toBeInTheDocument();
    expect(within(active).getByTestId('discuss-card-index')).toHaveTextContent(
      'Card 1 of 2',
    );
    const segment = screen.getByTestId('discuss-segment');
    expect(
      within(segment).getByText('Context').getAttribute('data-active'),
    ).toBe('true');
  });

  it('adds a context note, then switches to actions and adds an action note', () => {
    render(<Harness />);
    const contextSection = screen.getByRole('region', {
      name: /context notes/i,
    });
    fireEvent.change(
      within(contextSection).getByLabelText(/context note text/i),
      { target: { value: 'we have CI flakes' } },
    );
    fireEvent.click(
      within(contextSection).getByRole('button', { name: /add context note/i }),
    );
    expect(
      within(contextSection).getByText('we have CI flakes'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next segment/i }));
    const segment = screen.getByTestId('discuss-segment');
    expect(
      within(segment).getByText('Actions').getAttribute('data-active'),
    ).toBe('true');

    const actionSection = screen.getByRole('region', {
      name: /actions notes/i,
    });
    fireEvent.change(
      within(actionSection).getByLabelText(/actions note text/i),
      { target: { value: 'fix flaky test' } },
    );
    fireEvent.click(
      within(actionSection).getByRole('button', { name: /add actions note/i }),
    );
    expect(within(actionSection).getByText('fix flaky test')).toBeInTheDocument();
  });

  it('previous segment disabled at first card context', () => {
    render(<Harness />);
    expect(
      screen.getByRole('button', { name: /previous segment/i }),
    ).toBeDisabled();
  });
});
