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
  description: string;
  cards: readonly Card[];
  onAddCard: (columnId: ColumnId, text: string) => void;
  onRemoveCard: (cardId: string) => void;
  onDrop: (cardId: string, targetIndex: number) => void;
}

function Column({
  columnId,
  title,
  description,
  cards,
  onAddCard,
  onRemoveCard,
  onDrop,
}: ColumnProps): JSX.Element {
  const [text, setText] = useState('');
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const submit = (): void => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_CARD_LENGTH) return;
    onAddCard(columnId, trimmed);
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
      className={`brainstorm-column brainstorm-col-${columnId}`}
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
      onDragLeave={(): void => { setDropTarget(null); }}
    >
      <h3>{title}</h3>
      <p className="column-desc">{description}</p>

      <div className="brainstorm-input-row">
        <span className="brainstorm-input-plus">+</span>
        <input
          type="text"
          value={text}
          onChange={(e): void => { setText(e.target.value); }}
          onKeyDown={(e): void => { if (e.key === 'Enter') submit(); }}
          placeholder="Add idea..."
          aria-label={`${title} card text`}
          data-testid={`card-input-${columnId}`}
        />
        <span
          className="brainstorm-input-counter"
          data-testid={`card-counter-${columnId}`}
          data-over-limit={text.length > MAX_CARD_LENGTH ? 'true' : 'false'}
        >
          {text.length > 0 ? `${String(text.length)}/${String(MAX_CARD_LENGTH)}` : ''}
        </span>
        <button
          type="button"
          className="brainstorm-input-add"
          onClick={submit}
          disabled={text.trim().length === 0 || text.length > MAX_CARD_LENGTH}
          aria-label={`Add ${title} card`}
        >
          Add
        </button>
      </div>

      <ul aria-label={`${title} cards`} className="brainstorm-card-list">
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
            <span className="brainstorm-card-text">{c.text}</span>
            <button
              type="button"
              className="brainstorm-card-remove"
              onClick={(): void => { onRemoveCard(c.id); }}
              aria-label={`Remove card ${c.text}`}
            >
              &times;
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
          columnId="stop"
          title="Stop"
          description="What factors are slowing us down or holding us back?"
          cards={stopCards}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
          onDrop={handleDrop('stop')}
        />
        <Column
          columnId="start"
          title="Start"
          description="What factors are driving us forward and enabling our success?"
          cards={startCards}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
          onDrop={handleDrop('start')}
        />
      </div>
      <button type="button" className="primary" onClick={onContinueToGroup}>
        Continue to group
      </button>
    </section>
  );
}
