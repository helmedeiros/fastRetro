import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { VotePage } from '../../src/ui/pages/VotePage';
import { createTimer } from '../../src/domain/retro/Timer';
import type { Card } from '../../src/domain/retro/Card';
import type { Participant } from '../../src/domain/retro/Participant';
import type { Vote } from '../../src/domain/retro/Vote';

function noop(): void {
  // intentionally empty
}

const timer = createTimer(5 * 60 * 1000);
const participants: readonly Participant[] = [
  { id: 'p-1', name: 'Alice' },
  { id: 'p-2', name: 'Bob' },
];
const cards: readonly Card[] = [
  { id: 'c-1', columnId: 'start', text: 'ship faster' },
  { id: 'c-2', columnId: 'stop', text: 'long meetings' },
];

interface HarnessProps {
  initialBudget?: number;
}

function Harness({ initialBudget = 3 }: HarnessProps): JSX.Element {
  const [votes, setVotes] = useState<readonly Vote[]>([]);
  const [budget, setBudget] = useState<number>(initialBudget);
  const used = (pid: string): number =>
    votes.filter((v) => v.participantId === pid).length;
  return (
    <VotePage
      timer={timer}
      participants={participants}
      cards={cards}
      votes={votes}
      voteBudget={budget}
      onStartTimer={noop}
      onPauseTimer={noop}
      onResumeTimer={noop}
      onResetTimer={noop}
      onSetVoteBudget={setBudget}
      onCastVote={(pid, cid): void => {
        const idx = votes.findIndex(
          (v) => v.participantId === pid && v.cardId === cid,
        );
        if (idx >= 0) {
          setVotes(votes.filter((_, i) => i !== idx));
          return;
        }
        if (budget - used(pid) <= 0) return;
        setVotes([...votes, { participantId: pid, cardId: cid }]);
      }}
      onContinueToDiscuss={noop}
    />
  );
}

describe('VotePage', () => {
  it('renders timer at 5:00 and both columns', () => {
    render(<Harness />);
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('5m 00s');
    expect(
      screen.getByRole('region', { name: /start column/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /stop column/i }),
    ).toBeInTheDocument();
  });

  it('clicking a card toggles the vote count', () => {
    render(<Harness />);
    const voteBtn = screen.getByRole('button', { name: /vote for ship faster/i });
    expect(screen.getByTestId('vote-count-c-1')).toHaveTextContent('★ 0');
    fireEvent.click(voteBtn);
    expect(screen.getByTestId('vote-count-c-1')).toHaveTextContent('★ 1');
    fireEvent.click(voteBtn);
    expect(screen.getByTestId('vote-count-c-1')).toHaveTextContent('★ 0');
  });

  it('enforces the per-participant budget', () => {
    render(<Harness initialBudget={1} />);
    fireEvent.click(screen.getByRole('button', { name: /vote for ship faster/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /vote for long meetings/i }),
    );
    expect(screen.getByTestId('vote-count-c-1')).toHaveTextContent('★ 1');
    expect(screen.getByTestId('vote-count-c-2')).toHaveTextContent('★ 0');
  });

  it('switching active voter updates remaining budget display', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /vote for ship faster/i }));
    const voters = screen.getByRole('group', { name: /active voter/i });
    expect(within(voters).getByRole('button', { name: /alice \(2 left\)/i })).toBeInTheDocument();
    expect(within(voters).getByRole('button', { name: /bob \(3 left\)/i })).toBeInTheDocument();
    fireEvent.click(within(voters).getByRole('button', { name: /bob/i }));
    fireEvent.click(screen.getByRole('button', { name: /vote for ship faster/i }));
    expect(screen.getByTestId('vote-count-c-1')).toHaveTextContent('★ 2');
  });
});
