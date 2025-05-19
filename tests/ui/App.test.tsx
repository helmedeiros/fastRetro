import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../src/ui/App';
import { InMemoryTeamRepository } from '../../src/adapters/storage/InMemoryTeamRepository';
import type { Picker } from '../../src/domain/ports/Picker';
import type { Clock } from '../../src/domain/ports/Clock';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

let counter = 0;
const ids = { next: () => `id-${String(++counter)}` };

const fakeClock: Clock = {
  now: () => Date.now(),
  subscribe: () => () => undefined,
};

function renderApp(teamRepo?: InMemoryTeamRepository) {
  const repo = teamRepo ?? new InMemoryTeamRepository();
  return render(
    <App
      teamRepository={repo}
      clock={fakeClock}
      picker={firstPicker}
      idGenerator={ids}
    />,
  );
}

function addMemberAndStartRetro() {
  // Add member on dashboard
  const membersSection = screen.getByRole('region', { name: /members/i });
  const nameInput = within(membersSection).getByLabelText(/name/i);
  fireEvent.change(nameInput, { target: { value: 'Alice' } });
  fireEvent.click(within(membersSection).getByRole('button', { name: /^add$/i }));
  // Click start → setup page
  fireEvent.click(
    screen.getByRole('button', { name: /start retrospective/i }),
  );
  // Fill retro name and start
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: 'Sprint 1 Retro' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: /start retrospective/i }),
  );
}

describe('App', () => {
  it('renders the fastRetro heading', () => {
    renderApp();
    expect(
      screen.getByRole('heading', { name: /fastRetro/i }),
    ).toBeInTheDocument();
  });

  it('lands on the Team Dashboard', () => {
    renderApp();
    expect(
      screen.getByRole('region', { name: /team dashboard/i }),
    ).toBeInTheDocument();
  });

  it('disables Start Retrospective when there are no members', () => {
    renderApp();
    expect(
      screen.getByRole('button', { name: /start retrospective/i }),
    ).toBeDisabled();
  });

  it('transitions to icebreaker after adding a member and starting a retro', () => {
    renderApp();
    addMemberAndStartRetro();
    expect(
      screen.getByRole('heading', { name: /icebreaker/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10m 00s');
  });

  it('transitions from icebreaker to brainstorm', () => {
    renderApp();
    addMemberAndStartRetro();
    fireEvent.click(
      screen.getByRole('button', { name: /continue to brainstorm/i }),
    );
    expect(
      screen.getByRole('heading', { name: /brainstorm/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('5m 00s');
  });

  it('transitions from brainstorm to group', () => {
    renderApp();
    addMemberAndStartRetro();
    fireEvent.click(
      screen.getByRole('button', { name: /continue to brainstorm/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to group/i }),
    );
    expect(
      screen.getByRole('heading', { name: /^group$/i }),
    ).toBeInTheDocument();
  });

  it('transitions from group to vote', () => {
    renderApp();
    addMemberAndStartRetro();
    fireEvent.click(
      screen.getByRole('button', { name: /continue to brainstorm/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to group/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to vote/i }),
    );
    expect(
      screen.getByRole('heading', { name: /^vote$/i }),
    ).toBeInTheDocument();
  });

  it('transitions through full flow to close with Return to Dashboard', () => {
    renderApp();
    addMemberAndStartRetro();
    fireEvent.click(
      screen.getByRole('button', { name: /continue to brainstorm/i }),
    );
    const startCol = screen.getByRole('region', { name: /start column/i });
    fireEvent.change(within(startCol).getByLabelText(/start card text/i), {
      target: { value: 'ship faster' },
    });
    fireEvent.click(
      within(startCol).getByRole('button', { name: /add start card/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to group/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to vote/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /vote for ship faster/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to discuss/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /next segment/i }));
    const actionsSection = screen.getByRole('region', {
      name: /actions notes/i,
    });
    fireEvent.change(
      within(actionsSection).getByLabelText(/actions note text/i),
      { target: { value: 'fix flaky test' } },
    );
    fireEvent.click(
      within(actionsSection).getByRole('button', {
        name: /add actions note/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to review/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /continue to close/i }),
    );
    expect(
      screen.getByRole('heading', { name: /retro complete/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /return to dashboard/i }),
    ).toBeInTheDocument();
  });
});
