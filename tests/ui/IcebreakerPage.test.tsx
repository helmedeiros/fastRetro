import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  { id: 'c', name: 'Carol' },
];

function baseState(currentIndex: number): IcebreakerState {
  return {
    question: 'What made you laugh today?',
    questions: ['What made you laugh today?', 'Favorite hobby?', 'Best meal?'],
    participantIds: ['a', 'b', 'c'],
    currentIndex,
  };
}

describe('IcebreakerPage', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows current speaker big and remaining as pills (current removed)', () => {
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
        onContinueToBrainstorm={noop}
      />,
    );
    // Alice is current speaker (index 0) — shown big
    expect(screen.getByTestId('icebreaker-speaker')).toHaveTextContent('Alice');
    // Remaining pills: Bob and Carol (Alice is picked)
    const list = screen.getByRole('list', { name: /icebreaker rotation/i });
    expect(within(list).queryByText('Alice')).not.toBeInTheDocument();
    expect(within(list).getByText('Bob')).toBeInTheDocument();
    expect(within(list).getByText('Carol')).toBeInTheDocument();
  });

  it('calls onNextParticipant after SPIN completes', () => {
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
        onContinueToBrainstorm={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /spin/i }));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows Continue to brainstorm at the last participant and no remaining pills', () => {
    render(
      <IcebreakerPage
        timer={createTimer(10 * 60 * 1000)}
        icebreaker={baseState(2)}
        participants={participants}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onNextParticipant={noop}
        onContinueToBrainstorm={noop}
      />,
    );
    expect(screen.queryByRole('button', { name: /spin/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to brainstorm/i })).toBeInTheDocument();
    expect(screen.getByTestId('icebreaker-speaker')).toHaveTextContent('Carol');
    const list = screen.getByRole('list', { name: /icebreaker rotation/i });
    expect(within(list).queryByText('Alice')).not.toBeInTheDocument();
    expect(within(list).queryByText('Bob')).not.toBeInTheDocument();
    expect(within(list).queryByText('Carol')).not.toBeInTheDocument();
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
        onContinueToBrainstorm={noop}
      />,
    );
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10m 00s');
  });

  it('fires onContinueToBrainstorm when clicked', () => {
    const onContinue = vi.fn();
    render(
      <IcebreakerPage
        timer={createTimer(10 * 60 * 1000)}
        icebreaker={baseState(2)}
        participants={participants}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onNextParticipant={noop}
        onContinueToBrainstorm={onContinue}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to brainstorm/i }),
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
