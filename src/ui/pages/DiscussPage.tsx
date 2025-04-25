import { useState } from 'react';
import type { Card } from '../../domain/retro/Card';
import { MAX_CARD_LENGTH } from '../../domain/retro/Card';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';
import type { DiscussState } from '../../domain/retro/Retro';
import type { DiscussLane, DiscussNote } from '../../domain/retro/DiscussNote';
import { PresentTimer } from '../components/PresentTimer';

export interface DiscussPageProps {
  timer: Timer;
  cards: readonly Card[];
  votes: readonly Vote[];
  discuss: DiscussState;
  notes: readonly DiscussNote[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onPreviousSegment: () => void;
  onNextSegment: () => void;
  onAddNote: (parentCardId: string, lane: DiscussLane, text: string) => void;
  onRemoveNote: (noteId: string) => void;
  onContinueToReview: () => void;
}

interface LaneProps {
  lane: DiscussLane;
  title: string;
  notes: readonly DiscussNote[];
  active: boolean;
  onAdd: (text: string) => void;
  onRemove: (noteId: string) => void;
}

function Lane({
  lane,
  title,
  notes,
  active,
  onAdd,
  onRemove,
}: LaneProps): JSX.Element {
  const [text, setText] = useState('');
  const trimmed = text.trim().length;
  const tooLong = text.length > MAX_CARD_LENGTH;
  const disabled = !active || trimmed === 0 || tooLong;
  const inputId = `discuss-input-${lane}`;
  const submit = (): void => {
    if (disabled) return;
    onAdd(text);
    setText('');
  };
  return (
    <section aria-label={`${title} notes`} data-active={active ? 'true' : 'false'}>
      <h3>{title}</h3>
      {active && (
        <>
          <label htmlFor={inputId}>{`${title} note text`}</label>
          <input
            id={inputId}
            type="text"
            value={text}
            onChange={(e): void => {
              setText(e.target.value);
            }}
            aria-invalid={tooLong}
          />
          <button
            type="button"
            onClick={submit}
            disabled={disabled}
            aria-label={`Add ${title} note`}
          >
            Add
          </button>
        </>
      )}
      <ul aria-label={`${title} notes list`}>
        {notes.map((n) => (
          <li key={n.id} data-testid={`discuss-note-${n.id}`}>
            <span>{n.text}</span>
            <button
              type="button"
              onClick={(): void => {
                onRemove(n.id);
              }}
              aria-label={`Remove ${title} note ${n.text}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DiscussPage({
  timer,
  cards,
  votes,
  discuss,
  notes,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onPreviousSegment,
  onNextSegment,
  onAddNote,
  onRemoveNote,
  onContinueToReview,
}: DiscussPageProps): JSX.Element {
  const total = discuss.order.length;
  const activeCardId = discuss.order[discuss.currentIndex];
  const activeCard = cards.find((c) => c.id === activeCardId);
  const voteCount = votes.filter((v) => v.cardId === activeCardId).length;
  const isFirst = discuss.currentIndex === 0 && discuss.segment === 'context';
  const isLast =
    discuss.currentIndex === total - 1 && discuss.segment === 'actions';
  const contextNotes = notes.filter(
    (n) => n.parentCardId === activeCardId && n.lane === 'context',
  );
  const actionNotes = notes.filter(
    (n) => n.parentCardId === activeCardId && n.lane === 'actions',
  );

  return (
    <section aria-label="Discuss">
      <h2>Discuss</h2>
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      {activeCard !== undefined && (
        <section aria-label="Active card">
          <p data-testid="discuss-card-index">
            {`Card ${String(discuss.currentIndex + 1)} of ${String(total)}`}
          </p>
          <h3 data-testid="discuss-card-text">{activeCard.text}</h3>
          <p data-testid="discuss-card-votes">{`★ ${String(voteCount)}`}</p>
          <p data-testid="discuss-segment">
            <span data-active={discuss.segment === 'context' ? 'true' : 'false'}>
              Context
            </span>
            {' / '}
            <span data-active={discuss.segment === 'actions' ? 'true' : 'false'}>
              Actions
            </span>
          </p>
          <div role="group" aria-label="Segment navigation">
            <button
              type="button"
              aria-label="Previous segment"
              onClick={onPreviousSegment}
              disabled={isFirst}
            >
              ← Previous
            </button>
            <button
              type="button"
              aria-label="Next segment"
              onClick={onNextSegment}
              disabled={isLast}
            >
              Next →
            </button>
          </div>
          <div className="columns">
            <Lane
              lane="context"
              title="Context"
              notes={contextNotes}
              active={discuss.segment === 'context'}
              onAdd={(text): void => {
                onAddNote(activeCard.id, 'context', text);
              }}
              onRemove={onRemoveNote}
            />
            <Lane
              lane="actions"
              title="Actions"
              notes={actionNotes}
              active={discuss.segment === 'actions'}
              onAdd={(text): void => {
                onAddNote(activeCard.id, 'actions', text);
              }}
              onRemove={onRemoveNote}
            />
          </div>
        </section>
      )}
      <button type="button" className="primary" onClick={onContinueToReview}>
        Continue to review
      </button>
    </section>
  );
}
