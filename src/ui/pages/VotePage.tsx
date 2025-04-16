import { useState } from 'react';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';
import { PresentTimer } from '../components/PresentTimer';

export interface VotePageProps {
  timer: Timer;
  participants: readonly Participant[];
  cards: readonly Card[];
  votes: readonly Vote[];
  voteBudget: number;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onSetVoteBudget: (budget: number) => void;
  onCastVote: (participantId: string, cardId: string) => void;
  onContinueToDiscuss: () => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  cards: readonly Card[];
  votes: readonly Vote[];
  activeParticipantId: string | null;
  onCastVote: (participantId: string, cardId: string) => void;
}

function countFor(votes: readonly Vote[], cardId: string): number {
  return votes.filter((v) => v.cardId === cardId).length;
}

function Column({
  columnId,
  title,
  cards,
  votes,
  activeParticipantId,
  onCastVote,
}: ColumnProps): JSX.Element {
  return (
    <section aria-label={`${title} column`}>
      <h3>{title}</h3>
      <ul aria-label={`${title} cards`}>
        {cards
          .filter((c) => c.columnId === columnId)
          .map((c) => {
            const count = countFor(votes, c.id);
            return (
              <li key={c.id} data-testid={`vote-card-${c.id}`}>
                <button
                  type="button"
                  aria-label={`Vote for ${c.text}`}
                  disabled={activeParticipantId === null}
                  onClick={(): void => {
                    if (activeParticipantId === null) return;
                    onCastVote(activeParticipantId, c.id);
                  }}
                >
                  <span>{c.text}</span>
                  <span data-testid={`vote-count-${c.id}`}>
                    {`★ ${String(count)}`}
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
    </section>
  );
}

export function VotePage({
  timer,
  participants,
  cards,
  votes,
  voteBudget,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onSetVoteBudget,
  onCastVote,
  onContinueToDiscuss,
}: VotePageProps): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(
    participants[0]?.id ?? null,
  );
  const usedBy = (pid: string): number =>
    votes.filter((v) => v.participantId === pid).length;

  return (
    <section aria-label="Vote">
      <h2>Vote</h2>
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <div>
        <label htmlFor="vote-budget-input">Votes per person</label>
        <input
          id="vote-budget-input"
          type="number"
          min={0}
          value={voteBudget}
          onChange={(e): void => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) {
              onSetVoteBudget(n);
            }
          }}
        />
      </div>
      <div role="group" aria-label="Active voter">
        {participants.map((p) => {
          const remaining = voteBudget - usedBy(p.id);
          const selected = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              onClick={(): void => {
                setActiveId(p.id);
              }}
            >
              {`${p.name} (${String(remaining)} left)`}
            </button>
          );
        })}
      </div>
      <div>
        <Column
          columnId="start"
          title="Start"
          cards={cards}
          votes={votes}
          activeParticipantId={activeId}
          onCastVote={onCastVote}
        />
        <Column
          columnId="stop"
          title="Stop"
          cards={cards}
          votes={votes}
          activeParticipantId={activeId}
          onCastVote={onCastVote}
        />
      </div>
      <button type="button" onClick={onContinueToDiscuss}>
        Continue to discuss
      </button>
    </section>
  );
}
