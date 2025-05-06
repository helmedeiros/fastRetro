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
];

function baseState(currentIndex: number): IcebreakerState {
  return {
    question: currentIndex === 0 ? 'What made you laugh today?' : 'What is your favorite hobby?',
    questions: ['What made you laugh today?', 'What is your favorite hobby?'],
    participantIds: ['a', 'b'],
    currentIndex,
  };
}

describe('IcebreakerPage', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

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
        onContinueToBrainstorm={noop}
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
    // Advance enough time for all spin ticks (max ~18 ticks * 100ms)
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('disables SPIN at the last participant', () => {
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
        onContinueToBrainstorm={noop}
      />,
    );
    expect(screen.getByRole('button', { name: /spin/i })).toBeDisabled();
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
        icebreaker={baseState(0)}
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
