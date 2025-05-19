import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../src/ui/App';
import { InMemoryTeamRepository } from '../../src/adapters/storage/InMemoryTeamRepository';
import type { Clock } from '../../src/domain/ports/Clock';

const fakeClock: Clock = {
  now: () => Date.now(),
  subscribe: () => () => undefined,
};

let counter = 0;
const ids = { next: () => `id-${String(++counter)}` };

function addMember(name: string): void {
  const membersSection = screen.getByRole('region', { name: /members/i });
  const input = within(membersSection).getByLabelText(/name/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value: name } });
  fireEvent.click(within(membersSection).getByRole('button', { name: /^add$/i }));
}

describe('Team members (via Dashboard)', () => {
  it('adds and removes members', () => {
    render(<App teamRepository={new InMemoryTeamRepository()} clock={fakeClock} idGenerator={ids} />);

    addMember('Alice');
    addMember('Bob');

    const list = screen.getByRole('list', { name: /team members/i });
    expect(within(list).getByText('Alice')).toBeInTheDocument();
    expect(within(list).getByText('Bob')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove alice/i }));

    expect(within(list).queryByText('Alice')).not.toBeInTheDocument();
    expect(within(list).getByText('Bob')).toBeInTheDocument();
  });

  it('shows an error on duplicate names', () => {
    render(<App teamRepository={new InMemoryTeamRepository()} clock={fakeClock} idGenerator={ids} />);

    addMember('Alice');
    addMember('Alice');

    expect(screen.getByRole('alert')).toHaveTextContent(/already/i);
    const list = screen.getByRole('list', { name: /team members/i });
    expect(within(list).getAllByText('Alice')).toHaveLength(1);
  });
});
