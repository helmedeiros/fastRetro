import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SetupPage } from '../../src/ui/pages/SetupPage';

function addParticipant(name: string): void {
  const input = screen.getByLabelText(/participant name/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
}

describe('SetupPage', () => {
  it('adds and removes participants', () => {
    render(<SetupPage />);

    addParticipant('Alice');
    addParticipant('Bob');

    const list = screen.getByRole('list', { name: /participants/i });
    expect(within(list).getByText('Alice')).toBeInTheDocument();
    expect(within(list).getByText('Bob')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove alice/i }));

    expect(within(list).queryByText('Alice')).not.toBeInTheDocument();
    expect(within(list).getByText('Bob')).toBeInTheDocument();
  });

  it('shows an error on duplicate names and does not add', () => {
    render(<SetupPage />);

    addParticipant('Alice');
    addParticipant('Alice');

    expect(screen.getByRole('alert')).toHaveTextContent(/already/i);
    const list = screen.getByRole('list', { name: /participants/i });
    expect(within(list).getAllByText('Alice')).toHaveLength(1);
  });
});
