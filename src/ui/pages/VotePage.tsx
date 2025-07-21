import { useState } from 'react';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Participant } from '../../domain/retro/Participant';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { PresentTimer } from '../components/PresentTimer';

export interface VotePageProps {
  timer: Timer;
  participants: readonly Participant[];
  cards: readonly Card[];
  groups?: readonly Group[];
  votes: readonly Vote[];
  voteBudget: number;
  templateId?: string;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  currentParticipantId?: string | null;
  onSetVoteBudget: (budget: number) => void;
  onCastVote: (participantId: string, cardId: string) => void;
}

function countFor(votes: readonly Vote[], votableId: string): number {
  return votes.filter((v) => v.cardId === votableId).length;
}

function VoteButton({
  votableId,
  label,
  votes,
  activeParticipantId,
  onCastVote,
  children,
}: {
  votableId: string;
  label: string;
  votes: readonly Vote[];
  activeParticipantId: string | null;
  onCastVote: (participantId: string, votableId: string) => void;
  children?: React.ReactNode;
}): JSX.Element {
  const count = countFor(votes, votableId);
  return (
    <button
      type="button"
      className="brainstorm-card brainstorm-card-btn vote-card-btn"
      aria-label={`Vote for ${label}`}
      disabled={activeParticipantId === null}
      onClick={(): void => {
        if (activeParticipantId === null) return;
        onCastVote(activeParticipantId, votableId);
      }}
    >
      <span className="brainstorm-card-text">{label}</span>
      {count > 0 && (
        <span className="vote-badge" data-testid={`vote-count-${votableId}`}>
          +{String(count)}
        </span>
      )}
      {count === 0 && (
        <span className="vote-add" data-testid={`vote-count-${votableId}`}>
          +
        </span>
      )}
      {children}
    </button>
  );
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  description: string;
  color: string;
  cards: readonly Card[];
  groups: readonly Group[];
  votes: readonly Vote[];
  activeParticipantId: string | null;
  onCastVote: (participantId: string, votableId: string) => void;
}

function Column({
  columnId,
  title,
  description,
  color,
  cards,
  groups,
  votes,
  activeParticipantId,
  onCastVote,
}: ColumnProps): JSX.Element {
  const columnCards = cards.filter((c) => c.columnId === columnId);
  const columnGroups = groups.filter((g) => g.columnId === columnId);
  const groupedCardIds = new Set(columnGroups.flatMap((g) => g.cardIds));
  const ungroupedCards = columnCards.filter((c) => !groupedCardIds.has(c.id));

  return (
    <section aria-label={`${title} column`} className="brainstorm-column" style={{ '--col-color': color } as React.CSSProperties}>
      <h3>{title}</h3>
      <p className="column-desc">{description}</p>

      <ul aria-label={`${title} cards`} className="brainstorm-card-list">
        {ungroupedCards.map((c) => (
          <li key={c.id} data-testid={`vote-card-${c.id}`}>
            <VoteButton
              votableId={c.id}
              label={c.text}
              votes={votes}
              activeParticipantId={activeParticipantId}
              onCastVote={onCastVote}
            />
          </li>
        ))}
      </ul>

      {columnGroups.map((g) => {
        const groupCards = g.cardIds
          .map((cid) => cards.find((c) => c.id === cid))
          .filter((c): c is Card => c !== undefined);
        return (
          <div key={g.id} className="brainstorm-group" data-testid={`vote-group-${g.id}`}>
            <VoteButton
              votableId={g.id}
              label={g.name || groupCards.map((c) => c.text).join(' + ')}
              votes={votes}
              activeParticipantId={activeParticipantId}
              onCastVote={onCastVote}
            >
              <ul className="brainstorm-group-cards vote-group-cards">
                {groupCards.map((c) => (
                  <li key={c.id} className="brainstorm-card vote-group-child">
                    <span className="brainstorm-card-text">{c.text}</span>
                  </li>
                ))}
              </ul>
            </VoteButton>
          </div>
        );
      })}
    </section>
  );
}

export function VotePage({
  timer,
  participants,
  cards,
  groups = [],
  votes,
  voteBudget,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onSetVoteBudget,
  onCastVote,
  templateId,
  currentParticipantId,
}: VotePageProps): JSX.Element {
  const template = getTemplate(templateId ?? 'start-stop');
  const lockedToSelf = currentParticipantId !== undefined && currentParticipantId !== null;
  const [activeId, setActiveId] = useState<string | null>(
    currentParticipantId ?? participants[0]?.id ?? null,
  );
  const usedBy = (pid: string): number =>
    votes.filter((v) => v.participantId === pid).length;

  return (
    <section aria-label="Vote">
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <div className="vote-instruction-row">
        <p className="stage-instruction">Vote on the items you want to discuss. Click a card to vote.</p>
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
      </div>
      <div className="vote-controls">
        <div role="group" aria-label="Active voter" className="voter-pills">
          {participants.map((p) => {
            const remaining = voteBudget - usedBy(p.id);
            const selected = p.id === activeId;
            const disabled = lockedToSelf && p.id !== currentParticipantId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected}
                className={`voter-pill${selected ? ' active' : ''}${disabled ? ' voter-pill-disabled' : ''}`}
                disabled={disabled}
                onClick={(): void => { if (!disabled) setActiveId(p.id); }}
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
            groups={groups}
            votes={votes}
            activeParticipantId={activeId}
            onCastVote={onCastVote}
          />
        ))}
      </div>
    </section>
  );
}
