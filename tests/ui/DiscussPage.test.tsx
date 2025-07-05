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
    />
  );
}

describe('DiscussPage', () => {
  it('renders carousel with active card and timer', () => {
    render(<Harness />);
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('2m 30s');
    expect(screen.getByTestId('discuss-card-text')).toHaveTextContent('ship faster');
  });

  it('adds a context note and an action note in the timeline', () => {
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
