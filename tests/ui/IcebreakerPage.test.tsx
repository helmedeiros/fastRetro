import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IcebreakerPage } from '../../src/ui/pages/IcebreakerPage';
import { createTimer } from '../../src/domain/retro/Timer';
import type { IcebreakerState } from '../../src/domain/retro/stages/Icebreaker';
import type { Participant } from '../../src/domain/retro/Participant';

function noop(): void {
  // intentionally empty
}

const participants: readonly Participant[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
];

function baseState(currentIndex: number): IcebreakerState {
  return {
    question: 'What made you laugh today?',
    participantIds: ['a', 'b'],
    currentIndex,
  };
}

describe('IcebreakerPage', () => {
  it('renders the question and highlights the current participant', () => {
    render(
      <IcebreakerPage
        timer={createTimer(10 * 60 * 1000)}
        icebreaker={baseState(0)}
        participants={participants}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onNextParticipant={noop}
      />,
    );
    expect(screen.getByTestId('icebreaker-question')).toHaveTextContent(
      'What made you laugh today?',
    );
    const list = screen.getByRole('list', { name: /icebreaker rotation/i });
    const alice = within(list).getByText('Alice').closest('li');
    const bob = within(list).getByText('Bob').closest('li');
    expect(alice).toHaveAttribute('data-current', 'true');
    expect(bob).toHaveAttribute('data-current', 'false');
  });

  it('fires onNextParticipant when Next clicked', () => {
    const onNext = vi.fn();
    render(
      <IcebreakerPage
        timer={createTimer(10 * 60 * 1000)}
        icebreaker={baseState(0)}
        participants={participants}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onNextParticipant={onNext}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('disables Next at the last participant', () => {
    render(
      <IcebreakerPage
        timer={createTimer(10 * 60 * 1000)}
        icebreaker={baseState(1)}
        participants={participants}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onNextParticipant={noop}
      />,
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    const list = screen.getByRole('list', { name: /icebreaker rotation/i });
    const bob = within(list).getByText('Bob').closest('li');
    expect(bob).toHaveAttribute('data-current', 'true');
  });

  it('renders the present timer', () => {
    render(
      <IcebreakerPage
        timer={createTimer(10 * 60 * 1000)}
        icebreaker={baseState(0)}
        participants={participants}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onNextParticipant={noop}
      />,
    );
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10:00');
  });
});
