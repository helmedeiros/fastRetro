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

function renderApp(teamRepo?: InMemoryTeamRepository, storage?: Storage) {
  const repo = teamRepo ?? new InMemoryTeamRepository();
  return render(
    <App
      teamRepository={repo}
      clock={fakeClock}
      picker={firstPicker}
      idGenerator={ids}
      storage={storage}
    />,
  );
}

class InMemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, value); }
}

function addMember(name: string): void {
  const membersSection = screen.getByRole('region', { name: /members/i });
  const nameInput = within(membersSection).getByLabelText(/name/i);
  fireEvent.change(nameInput, { target: { value: name } });
  fireEvent.click(within(membersSection).getByRole('button', { name: /^add$/i }));
}

function addMemberAndStartRetro() {
  // Add member on dashboard
  addMember('Alice');
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

function navigateTo(stage: string): void {
  const nav = screen.getByRole('navigation', { name: /retro stages/i });
  fireEvent.click(within(nav).getByRole('button', { name: new RegExp(stage, 'i') }));
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
      screen.getByRole('region', { name: /icebreaker/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('10m 00s');
  });

  it('asks who you are when starting a local retro, and tags the pick as (me)', () => {
    renderApp();
    addMember('Alice');
    addMember('Bob');
    fireEvent.click(
      screen.getByRole('button', { name: /start retrospective/i }),
    );
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Sprint 1 Retro' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /start retrospective/i }),
    );

    expect(
      screen.getByRole('heading', { name: /join retrospective/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/who are you/i)).toBeInTheDocument();

    const pickList = screen.getByText(/pick your name/i).closest('div') as HTMLElement;
    fireEvent.click(within(pickList).getByRole('button', { name: /bob/i }));
    expect(
      screen.queryByRole('heading', { name: /join retrospective/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Team'));
    const teamPanel = screen.getByRole('heading', { name: /^team$/i }).closest('.side-menu-panel') as HTMLElement;
    expect(teamPanel).not.toBeNull();
    expect(within(teamPanel).getByText(/bob \(me\)/i)).toBeInTheDocument();
  });

  it('skips the who-are-you prompt when a member is already starred as (me)', () => {
    renderApp(undefined, new InMemoryStorage());

    // Team selector (storage is present, so a real team must be created first)
    fireEvent.change(screen.getByPlaceholderText(/new team name/i), {
      target: { value: 'QA Team' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create team/i }));

    addMember('Alice');
    addMember('Bob');

    // Star Bob as "(me)" on the dashboard, before starting the retro
    fireEvent.click(screen.getByRole('button', { name: /set bob as me/i }));

    fireEvent.click(
      screen.getByRole('button', { name: /start retrospective/i }),
    );
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Sprint 1 Retro' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /start retrospective/i }),
    );

    expect(
      screen.queryByRole('heading', { name: /join retrospective/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Team'));
    const teamPanel = screen.getByRole('heading', { name: /^team$/i }).closest('.side-menu-panel') as HTMLElement;
    expect(within(teamPanel).getByText(/bob \(me\)/i)).toBeInTheDocument();
  });

  it('transitions from icebreaker to brainstorm', () => {
    renderApp();
    addMemberAndStartRetro();
    fireEvent.click(
      screen.getByRole('button', { name: /^continue$/i }),
    );
    expect(
      screen.getByRole('region', { name: /brainstorm/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('5m 00s');
  });

  it('transitions from brainstorm to group via stage nav', () => {
    renderApp();
    addMemberAndStartRetro();
    navigateTo('brainstorm');
    navigateTo('group');
    expect(
      screen.getByRole('region', { name: /brainstorm/i }),
    ).toBeInTheDocument();
  });

  it('transitions from group to vote via stage nav', () => {
    renderApp();
    addMemberAndStartRetro();
    navigateTo('brainstorm');
    navigateTo('group');
    navigateTo('vote');
    expect(
      screen.getByRole('region', { name: /^vote$/i }),
    ).toBeInTheDocument();
  });

  it('transitions through full check flow to close', () => {
    renderApp();
    // Add member
    const membersSection = screen.getByRole('region', { name: /members/i });
    const nameInput = within(membersSection).getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(within(membersSection).getByRole('button', { name: /^add$/i }));
    // Click start → setup page
    fireEvent.click(screen.getByRole('button', { name: /start retrospective/i }));
    // Switch to Check type
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }));
    // Fill name and start
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Q2 Health Check' } });
    fireEvent.click(screen.getByRole('button', { name: /start check/i }));
    // Should be in icebreaker
    expect(screen.getByRole('region', { name: /icebreaker/i })).toBeInTheDocument();
    // Navigate to survey
    navigateTo('survey');
    expect(screen.getByRole('region', { name: /survey/i })).toBeInTheDocument();
    // Verify questions are rendered
    expect(screen.getByText('Ownership')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    // Navigate to discuss
    navigateTo('discuss');
    expect(screen.getByRole('region', { name: /discuss/i })).toBeInTheDocument();
    // Navigate to review
    navigateTo('review');
    // Board overview should NOT be shown for checks
    expect(screen.queryByText('Board overview')).not.toBeInTheDocument();
    // Navigate to close
    navigateTo('close');
    expect(screen.getByRole('heading', { name: /check complete/i })).toBeInTheDocument();
    expect(screen.getByText('Survey results')).toBeInTheDocument();
  });

  it('transitions through full flow to close with Return to Dashboard', () => {
    renderApp();
    addMemberAndStartRetro();
    navigateTo('brainstorm');
    const startCol = screen.getByRole('region', { name: /start column/i });
    fireEvent.change(within(startCol).getByLabelText(/start card text/i), {
      target: { value: 'ship faster' },
    });
    fireEvent.click(
      within(startCol).getByRole('button', { name: /add start card/i }),
    );
    navigateTo('group');
    navigateTo('vote');
    fireEvent.click(
      screen.getByRole('button', { name: /vote for ship faster/i }),
    );
    navigateTo('discuss');
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
    navigateTo('review');
    navigateTo('close');
    expect(
      screen.getByRole('heading', { name: /retro complete/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /exit/i }),
    ).toBeInTheDocument();
  });
});
