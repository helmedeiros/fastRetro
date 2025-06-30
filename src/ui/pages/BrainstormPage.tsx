import { useState, type DragEvent } from 'react';
import type { Card, ColumnId } from '../../domain/retro/Card';
import { MAX_CARD_LENGTH } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Timer } from '../../domain/retro/Timer';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { PresentTimer } from '../components/PresentTimer';

export interface BrainstormPageProps {
  timer: Timer;
  cards: readonly Card[];
  groups?: readonly Group[];
  templateId?: string;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onAddCard: (columnId: ColumnId, text: string) => void;
  onRemoveCard: (cardId: string) => void;
  onMoveCard?: (cardId: string, targetColumnId: ColumnId, targetIndex: number) => void;
  onCreateGroup?: (sourceCardId: string, targetCardId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onUngroupCard?: (cardId: string) => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  description: string;
  color: string;
  cards: readonly Card[];
  groups: readonly Group[];
  onAddCard: (columnId: ColumnId, text: string) => void;
  onRemoveCard: (cardId: string) => void;
  onDrop: (cardId: string, targetIndex: number) => void;
  onCreateGroup?: (sourceCardId: string, targetCardId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onUngroupCard?: (cardId: string) => void;
}

function Column({
  columnId,
  title,
  description,
  color,
  cards,
  groups,
  onAddCard,
  onRemoveCard,
  onDrop,
  onCreateGroup,
  onRenameGroup,
  onUngroupCard,
}: ColumnProps): JSX.Element {
  const [text, setText] = useState('');
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameDraft, setGroupNameDraft] = useState('');

  const columnGroups = groups.filter((g) => g.columnId === columnId);
  const groupedCardIds = new Set(columnGroups.flatMap((g) => g.cardIds));
  const ungroupedCards = cards.filter((c) => !groupedCardIds.has(c.id));

  const submit = (): void => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_CARD_LENGTH) return;
    onAddCard(columnId, trimmed);
    setText('');
  };

  const handleColumnDragOver = (e: DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(cards.length);
  };

  const handleColumnDrop = (e: DragEvent): void => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) onDrop(cardId, cards.length);
    setDropTarget(null);
  };

  const handleCardDrop = (e: DragEvent, targetCardId: string): void => {
    e.preventDefault();
    e.stopPropagation();
    const sourceCardId = e.dataTransfer.getData('text/plain');
    if (!sourceCardId || sourceCardId === targetCardId) return;
    if (onCreateGroup) {
      onCreateGroup(sourceCardId, targetCardId);
    } else {
      onDrop(sourceCardId, 0);
    }
    setDropTarget(null);
  };

  return (
    <section
      aria-label={`${title} column`}
      className="brainstorm-column"
      style={{ '--col-color': color } as React.CSSProperties}
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
        {ungroupedCards.map((c, i) => (
          <li
            key={c.id}
            data-testid={`card-${c.id}`}
            draggable
            className={`brainstorm-card${dropTarget === i ? ' drop-above' : ''}`}
            onDragStart={(e): void => {
              e.dataTransfer.setData('text/plain', c.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e): void => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDropTarget(i);
            }}
            onDrop={(e): void => { handleCardDrop(e, c.id); }}
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

      {columnGroups.map((g) => {
        const groupCards = g.cardIds
          .map((cid) => cards.find((c) => c.id === cid))
          .filter((c): c is Card => c !== undefined);
        return (
          <div key={g.id} className="brainstorm-group">
            <div className="brainstorm-group-header">
              {editingGroupId === g.id ? (
                <div className="brainstorm-group-edit">
                  <input
                    type="text"
                    value={groupNameDraft}
                    onChange={(e): void => { setGroupNameDraft(e.target.value); }}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter' && groupNameDraft.trim().length > 0) {
                        onRenameGroup?.(g.id, groupNameDraft.trim());
                        setEditingGroupId(null);
                      }
                      if (e.key === 'Escape') setEditingGroupId(null);
                    }}
                    placeholder="Group title..."
                    autoFocus
                    className="brainstorm-group-input"
                  />
                  <button
                    type="button"
                    className="brainstorm-group-save"
                    onClick={(): void => {
                      if (groupNameDraft.trim().length > 0) {
                        onRenameGroup?.(g.id, groupNameDraft.trim());
                      }
                      setEditingGroupId(null);
                    }}
                  >
                    &#10003;
                  </button>
                  <button
                    type="button"
                    className="brainstorm-group-cancel"
                    onClick={(): void => { setEditingGroupId(null); }}
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <span
                  className="brainstorm-group-name"
                  onClick={(): void => {
                    setGroupNameDraft(g.name);
                    setEditingGroupId(g.id);
                  }}
                >
                  {g.name || 'Group title...'}
                  {onRenameGroup !== undefined && <span className="brainstorm-group-edit-icon">&#9998;</span>}
                </span>
              )}
            </div>
            <ul className="brainstorm-group-cards">
              {groupCards.map((c) => (
                <li key={c.id} className="brainstorm-card">
                  <span className="brainstorm-card-text">{c.text}</span>
                  {onUngroupCard !== undefined && (
                    <button
                      type="button"
                      className="brainstorm-card-remove"
                      onClick={(): void => { onUngroupCard(c.id); }}
                      aria-label={`Ungroup card ${c.text}`}
                    >
                      &times;
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

export function BrainstormPage({
  timer,
  cards,
  groups = [],
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onAddCard,
  onRemoveCard,
  onMoveCard,
  onCreateGroup,
  onRenameGroup,
  onUngroupCard,
  templateId,
}: BrainstormPageProps): JSX.Element {
  const template = getTemplate(templateId ?? 'start-stop');

  const handleDrop = (targetColumnId: ColumnId) => (cardId: string, targetIndex: number): void => {
    if (onMoveCard) onMoveCard(cardId, targetColumnId, targetIndex);
  };

  return (
    <section aria-label="Brainstorm">
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <div className="columns">
        {template.columns.map((col) => (
          <Column
            key={col.id}
            columnId={col.id}
            title={col.title}
            description={col.description}
            color={col.color}
            cards={cards.filter((c) => c.columnId === col.id)}
            groups={groups}
            onAddCard={onAddCard}
            onRemoveCard={onRemoveCard}
            onDrop={handleDrop(col.id)}
            onCreateGroup={onCreateGroup}
            onRenameGroup={onRenameGroup}
            onUngroupCard={onUngroupCard}
          />
        ))}
      </div>
    </section>
  );
}
