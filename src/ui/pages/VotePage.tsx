import { useState } from 'react';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { PresentTimer } from '../components/PresentTimer';

export interface VotePageProps {
  timer: Timer;
  participants: readonly Participant[];
  cards: readonly Card[];
  votes: readonly Vote[];
  voteBudget: number;
  templateId?: string;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onSetVoteBudget: (budget: number) => void;
  onCastVote: (participantId: string, cardId: string) => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  description: string;
  color: string;
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
  description,
  color,
  cards,
  votes,
  activeParticipantId,
  onCastVote,
}: ColumnProps): JSX.Element {
  return (
    <section aria-label={`${title} column`} className="brainstorm-column" style={{ '--col-color': color } as React.CSSProperties}>
      <h3>{title}</h3>
      <p className="column-desc">{description}</p>
      <ul aria-label={`${title} cards`} className="brainstorm-card-list">
        {cards
          .filter((c) => c.columnId === columnId)
          .map((c) => {
            const count = countFor(votes, c.id);
            return (
              <li key={c.id} data-testid={`vote-card-${c.id}`}>
                <button
                  type="button"
                  className="brainstorm-card brainstorm-card-btn vote-card-btn"
                  aria-label={`Vote for ${c.text}`}
                  disabled={activeParticipantId === null}
                  onClick={(): void => {
                    if (activeParticipantId === null) return;
                    onCastVote(activeParticipantId, c.id);
                  }}
                >
                  <span className="brainstorm-card-text">{c.text}</span>
                  {count > 0 && (
                    <span className="vote-badge" data-testid={`vote-count-${c.id}`}>
                      +{String(count)}
                    </span>
                  )}
                  {count === 0 && (
                    <span className="vote-add" data-testid={`vote-count-${c.id}`}>
                      +
                    </span>
                  )}
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
  templateId,
}: VotePageProps): JSX.Element {
  const template = getTemplate(templateId ?? 'start-stop');
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
      <p className="stage-instruction">Vote on the items you want to discuss. Click a card to vote.</p>
      <div className="vote-controls">
        <div className="vote-budget-row">
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
        <div role="group" aria-label="Active voter" className="voter-pills">
          {participants.map((p) => {
            const remaining = voteBudget - usedBy(p.id);
            const selected = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                className={`voter-pill${selected ? ' active' : ''}`}
                onClick={(): void => { setActiveId(p.id); }}
              >
                {p.name}
                <span className="voter-remaining">{String(remaining)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="columns">
        {template.columns.map((col) => (
          <Column
            key={col.id}
            columnId={col.id}
            title={col.title}
            description={col.description}
            color={col.color}
            cards={cards}
            votes={votes}
            activeParticipantId={activeId}
            onCastVote={onCastVote}
          />
        ))}
      </div>
    </section>
  );
}
