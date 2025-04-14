import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../src/ui/App';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';

describe('App', () => {
  it('renders the fastRetro heading', () => {
    render(<App repository={new InMemoryRetroRepository()} />);
    expect(
      screen.getByRole('heading', { name: /fastRetro/i }),
    ).toBeInTheDocument();
  });

  it('disables Start retro when there are no participants', () => {
    render(<App repository={new InMemoryRetroRepository()} />);
    expect(
      screen.getByRole('button', { name: /start retro/i }),
    ).toBeDisabled();
  });

  it('transitions to the StagePage after adding a participant and starting', () => {
    render(<App repository={new InMemoryRetroRepository()} />);
    const input = screen.getByLabelText(/participant name/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    fireEvent.click(screen.getByRole('button', { name: /start retro/i }));

    expect(
      screen.getByRole('heading', { name: /retro in progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10:00');
  });
});
