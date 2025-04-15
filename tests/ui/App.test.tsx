import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../src/ui/App';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import type { Picker } from '../../src/domain/ports/Picker';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

describe('App', () => {
  it('renders the fastRetro heading', () => {
    render(
      <App
        repository={new InMemoryRetroRepository()}
        picker={firstPicker}
      />,
    );
    expect(
      screen.getByRole('heading', { name: /fastRetro/i }),
    ).toBeInTheDocument();
  });

  it('disables Start retro when there are no participants', () => {
    render(
      <App
        repository={new InMemoryRetroRepository()}
        picker={firstPicker}
      />,
    );
    expect(
      screen.getByRole('button', { name: /start retro/i }),
    ).toBeDisabled();
  });

  it('transitions to the IcebreakerPage after adding a participant and starting', () => {
    render(
      <App
        repository={new InMemoryRetroRepository()}
        picker={firstPicker}
      />,
    );
    const input = screen.getByLabelText(/participant name/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    fireEvent.click(screen.getByRole('button', { name: /start retro/i }));

    expect(
      screen.getByRole('heading', { name: /icebreaker/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10:00');
    expect(screen.getByTestId('icebreaker-question')).toBeInTheDocument();
    const rotation = screen.getByRole('list', {
      name: /icebreaker rotation/i,
    });
    expect(within(rotation).getByText('Alice')).toBeInTheDocument();
  });

  it('transitions from icebreaker to brainstorm with a 5:00 timer', () => {
    render(
      <App
        repository={new InMemoryRetroRepository()}
        picker={firstPicker}
      />,
    );
    const input = screen.getByLabelText(/participant name/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    fireEvent.click(screen.getByRole('button', { name: /start retro/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /continue to brainstorm/i }),
    );
    expect(
      screen.getByRole('heading', { name: /brainstorm/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('5:00');
    expect(
      screen.getByRole('region', { name: /start column/i }),
    ).toBeInTheDocument();
  });
});
