import { useState, type DragEvent } from 'react';
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
  onMoveCard?: (cardId: string, targetColumnId: ColumnId, targetIndex: number) => void;
  onContinueToGroup: () => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  cards: readonly Card[];
  onAddCard: (columnId: ColumnId, text: string) => void;
  onRemoveCard: (cardId: string) => void;
  onDrop: (cardId: string, targetIndex: number) => void;
}

function Column({
  columnId,
  title,
  cards,
  onAddCard,
  onRemoveCard,
  onDrop,
}: ColumnProps): JSX.Element {
  const [text, setText] = useState('');
  const [dropTarget, setDropTarget] = useState<number | null>(null);
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

  const handleDragOver = (e: DragEvent, index: number): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(index);
  };

  const handleColumnDragOver = (e: DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(cards.length);
  };

  const handleDrop = (e: DragEvent, index: number): void => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) onDrop(cardId, index);
    setDropTarget(null);
  };

  const handleColumnDrop = (e: DragEvent): void => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) onDrop(cardId, cards.length);
    setDropTarget(null);
  };

  return (
    <section
      aria-label={`${title} column`}
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
      onDragLeave={(): void => { setDropTarget(null); }}
    >
      <h3>{title}</h3>
      <label htmlFor={inputId}>{`${title} card text`}</label>
      <input
        id={inputId}
        type="text"
        value={text}
        onChange={(e): void => {
          setText(e.target.value);
        }}
        onKeyDown={(e): void => {
          if (e.key === 'Enter') submit();
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
        {cards.map((c, i) => (
          <li
            key={c.id}
            data-testid={`card-${c.id}`}
            draggable
            className={`brainstorm-card${dropTarget === i ? ' drop-above' : ''}`}
            onDragStart={(e): void => {
              e.dataTransfer.setData('text/plain', c.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e): void => { handleDragOver(e, i); }}
            onDrop={(e): void => { handleDrop(e, i); }}
          >
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
  onMoveCard,
  onContinueToGroup,
}: BrainstormPageProps): JSX.Element {
  const startCards = cards.filter((c) => c.columnId === 'start');
  const stopCards = cards.filter((c) => c.columnId === 'stop');

  const handleDrop = (targetColumnId: ColumnId) => (cardId: string, targetIndex: number): void => {
    if (onMoveCard) onMoveCard(cardId, targetColumnId, targetIndex);
  };

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
      <div className="columns">
        <Column
          columnId="start"
          title="Start"
          cards={startCards}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
          onDrop={handleDrop('start')}
        />
        <Column
          columnId="stop"
          title="Stop"
          cards={stopCards}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
          onDrop={handleDrop('stop')}
        />
      </div>
      <button type="button" className="primary" onClick={onContinueToGroup}>
        Continue to group
      </button>
    </section>
  );
}
