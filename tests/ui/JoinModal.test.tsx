import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JoinModal } from '../../src/ui/components/JoinModal';

const participants = [
  { id: 'p-1', name: 'Alice' },
  { id: 'p-2', name: 'Bob' },
];

describe('JoinModal', () => {
  it('renders participant list', () => {
    render(
      <JoinModal
        participants={participants}
        onSelectParticipant={vi.fn()}
        onAddParticipant={vi.fn()}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('fires onSelectParticipant when clicking a name', () => {
    const onSelect = vi.fn();
    render(
      <JoinModal
        participants={participants}
        onSelectParticipant={onSelect}
        onAddParticipant={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Alice'));
    expect(onSelect).toHaveBeenCalledWith('p-1');
  });

  it('fires onAddParticipant when typing and clicking Join', () => {
    const onAdd = vi.fn();
    render(
      <JoinModal
        participants={participants}
        onSelectParticipant={vi.fn()}
        onAddParticipant={onAdd}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Your name...'), { target: { value: 'Carol' } });
    fireEvent.click(screen.getByRole('button', { name: /join/i }));
    expect(onAdd).toHaveBeenCalledWith('Carol');
  });

  it('disables Join button when input is empty', () => {
    render(
      <JoinModal
        participants={[]}
        onSelectParticipant={vi.fn()}
        onAddParticipant={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /join/i })).toBeDisabled();
  });

  it('fires onAddParticipant on Enter key', () => {
    const onAdd = vi.fn();
    render(
      <JoinModal
        participants={[]}
        onSelectParticipant={vi.fn()}
        onAddParticipant={onAdd}
      />,
    );
    const input = screen.getByPlaceholderText('Your name...');
    fireEvent.change(input, { target: { value: 'Dave' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith('Dave');
  });
});
