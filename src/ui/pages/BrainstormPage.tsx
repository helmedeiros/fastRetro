import { useState } from 'react';
import type { Card, ColumnId } from '../../domain/retro/Card';
import { MAX_CARD_LENGTH } from '../../domain/retro/Card';
import type { Timer } from '../../domain/retro/Timer';
import { PresentTimer } from '../components/PresentTimer';

export interface BrainstormPageProps {
  timer: Timer;
  cards: readonly Card[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onAddCard: (columnId: ColumnId, text: string) => void;
  onRemoveCard: (cardId: string) => void;
  onContinueToVote: () => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  cards: readonly Card[];
  onAddCard: (columnId: ColumnId, text: string) => void;
  onRemoveCard: (cardId: string) => void;
}

function Column({
  columnId,
  title,
  cards,
  onAddCard,
  onRemoveCard,
}: ColumnProps): JSX.Element {
  const [text, setText] = useState('');
  const trimmedLength = text.trim().length;
  const tooLong = text.length > MAX_CARD_LENGTH;
  const disabled = trimmedLength === 0 || tooLong;
  const inputId = `card-input-${columnId}`;
  const counterId = `card-counter-${columnId}`;

  const submit = (): void => {
    if (disabled) return;
    onAddCard(columnId, text);
    setText('');
  };

  return (
    <section aria-label={`${title} column`}>
      <h3>{title}</h3>
      <label htmlFor={inputId}>{`${title} card text`}</label>
      <input
        id={inputId}
        type="text"
        value={text}
        onChange={(e): void => {
          setText(e.target.value);
        }}
        aria-describedby={counterId}
        aria-invalid={tooLong}
      />
      <span
        id={counterId}
        data-testid={`card-counter-${columnId}`}
        data-over-limit={tooLong ? 'true' : 'false'}
      >
        {`${String(text.length)}/${String(MAX_CARD_LENGTH)}`}
      </span>
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        aria-label={`Add ${title} card`}
      >
        Add
      </button>
      <ul aria-label={`${title} cards`}>
        {cards.map((c) => (
          <li key={c.id} data-testid={`card-${c.id}`}>
            <span>{c.text}</span>
            <button
              type="button"
              onClick={(): void => {
                onRemoveCard(c.id);
              }}
              aria-label={`Remove card ${c.text}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BrainstormPage({
  timer,
  cards,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onAddCard,
  onRemoveCard,
  onContinueToVote,
}: BrainstormPageProps): JSX.Element {
  const startCards = cards.filter((c) => c.columnId === 'start');
  const stopCards = cards.filter((c) => c.columnId === 'stop');

  return (
    <section aria-label="Brainstorm">
      <h2>Brainstorm</h2>
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <div>
        <Column
          columnId="start"
          title="Start"
          cards={startCards}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
        />
        <Column
          columnId="stop"
          title="Stop"
          cards={stopCards}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
        />
      </div>
      <button type="button" onClick={onContinueToVote}>
        Continue to vote
      </button>
    </section>
  );
}
