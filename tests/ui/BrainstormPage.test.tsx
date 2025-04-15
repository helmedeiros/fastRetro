import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrainstormPage } from '../../src/ui/pages/BrainstormPage';
import { createTimer } from '../../src/domain/retro/Timer';
import type { Card } from '../../src/domain/retro/Card';

function noop(): void {
  // intentionally empty
}

const timer = createTimer(5 * 60 * 1000);

describe('BrainstormPage', () => {
  it('renders both columns and the timer at 5:00', () => {
    render(
      <BrainstormPage
        timer={timer}
        cards={[]}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onAddCard={noop}
        onRemoveCard={noop}
      />,
    );
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('5:00');
    expect(screen.getByRole('region', { name: /start column/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /stop column/i })).toBeInTheDocument();
  });

  it('calls onAddCard with the typed text and clears the input', () => {
    const onAdd = vi.fn();
    render(
      <BrainstormPage
        timer={timer}
        cards={[]}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onAddCard={onAdd}
        onRemoveCard={noop}
      />,
    );
    const startCol = screen.getByRole('region', { name: /start column/i });
    const input = within(startCol).getByLabelText(/start card text/i);
    fireEvent.change(input, { target: { value: 'ship faster' } });
    fireEvent.click(within(startCol).getByRole('button', { name: /add start card/i }));
    expect(onAdd).toHaveBeenCalledWith('start', 'ship faster');
    expect(input).toHaveValue('');
  });

  it('disables Add when empty or over 140 chars and shows over-limit counter', () => {
    render(
      <BrainstormPage
        timer={timer}
        cards={[]}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onAddCard={noop}
        onRemoveCard={noop}
      />,
    );
    const startCol = screen.getByRole('region', { name: /start column/i });
    const addBtn = within(startCol).getByRole('button', { name: /add start card/i });
    expect(addBtn).toBeDisabled();

    const input = within(startCol).getByLabelText(/start card text/i);
    fireEvent.change(input, { target: { value: 'a'.repeat(141) } });
    expect(addBtn).toBeDisabled();
    const counter = within(startCol).getByTestId('card-counter-start');
    expect(counter).toHaveAttribute('data-over-limit', 'true');
    expect(counter).toHaveTextContent('141/140');

    fireEvent.change(input, { target: { value: 'short' } });
    expect(addBtn).toBeEnabled();
  });

  it('renders cards in their column and removes one when × clicked', () => {
    const cards: readonly Card[] = [
      { id: 'c1', columnId: 'start', text: 'ship faster' },
      { id: 'c2', columnId: 'stop', text: 'long meetings' },
    ];
    const onRemove = vi.fn();
    render(
      <BrainstormPage
        timer={timer}
        cards={cards}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
        onAddCard={noop}
        onRemoveCard={onRemove}
      />,
    );
    const startList = screen.getByRole('list', { name: /start cards/i });
    const stopList = screen.getByRole('list', { name: /stop cards/i });
    expect(within(startList).getByText('ship faster')).toBeInTheDocument();
    expect(within(stopList).getByText('long meetings')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /remove card ship faster/i }),
    );
    expect(onRemove).toHaveBeenCalledWith('c1');
  });
});
