import { useState, useRef, useEffect } from 'react';
import type { Card } from '../../domain/retro/Card';
import { MAX_CARD_LENGTH } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';
import type { DiscussState, RetroType } from '../../domain/retro/Retro';
import type { DiscussLane, DiscussNote } from '../../domain/retro/DiscussNote';
import type { DiscussItem } from '../../domain/retro/DiscussItem';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { PresentTimer } from '../components/PresentTimer';

export interface DiscussPageProps {
  timer: Timer;
  cards: readonly Card[];
  groups?: readonly Group[];
  votes: readonly Vote[];
  templateId?: string;
  retroType?: RetroType;
  discussItems?: readonly DiscussItem[];
  discuss: DiscussState;
  notes: readonly DiscussNote[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onPreviousSegment: () => void;
  onNextSegment: () => void;
  onJumpToItem?: (index: number) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  onAddNote: (parentCardId: string, lane: DiscussLane, text: string) => void;
  onRemoveNote: (noteId: string) => void;
}

interface VotableItem {
  id: string;
  label: string;
  columnId: string;
  isGroup: boolean;
  childCards?: readonly Card[];
  votes: number;
}

function resolveVotable(
  id: string,
  cards: readonly Card[],
  groups: readonly Group[],
  votes: readonly Vote[],
): VotableItem {
  const group = groups.find((g) => g.id === id);
  if (group !== undefined) {
    const children = group.cardIds
      .map((cid) => cards.find((c) => c.id === cid))
      .filter((c): c is Card => c !== undefined);
    return {
      id: group.id,
      label: group.name || children.map((c) => c.text).join(' + '),
      columnId: group.columnId,
      isGroup: true,
      childCards: children,
      votes: votes.filter((v) => v.cardId === group.id).length,
    };
  }
  const card = cards.find((c) => c.id === id);
  return {
    id,
    label: card?.text ?? id,
    columnId: card?.columnId ?? '',
    isGroup: false,
    votes: votes.filter((v) => v.cardId === id).length,
  };
}

interface LaneProps {
  title: string;
  side: 'left' | 'right';
  active?: boolean;
  notes: readonly DiscussNote[];
  onAdd: (text: string) => void;
  onRemove: (noteId: string) => void;
}

function Lane({ title, side, active = false, notes, onAdd, onRemove }: LaneProps): JSX.Element {
  const [text, setText] = useState('');
  const trimmed = text.trim().length;
  const tooLong = text.length > MAX_CARD_LENGTH;
  const disabled = trimmed === 0 || tooLong;
  const submit = (): void => {
    if (disabled) return;
    onAdd(text);
    setText('');
  };
  return (
    <section aria-label={`${title} notes`} className={`discuss-lane discuss-lane-${side}${active ? ' discuss-lane-active' : ''}`}>
      <h4 className="discuss-lane-title">{title}</h4>
      <div className="discuss-lane-messages">
        {notes.map((n) => (
          <div key={n.id} data-testid={`discuss-note-${n.id}`} className={`discuss-bubble discuss-bubble-${side}`}>
            <span className="discuss-bubble-text">{n.text}</span>
            <button
              type="button"
              className="discuss-bubble-remove"
              onClick={(): void => { onRemove(n.id); }}
              aria-label={`Remove ${title} note ${n.text}`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="discuss-lane-input">
        <input
          type="text"
          value={text}
          onChange={(e): void => { setText(e.target.value); }}
          onKeyDown={(e): void => { if (e.key === 'Enter') submit(); }}
          placeholder={`Add ${title.toLowerCase()}...`}
          aria-label={`${title} note text`}
          aria-invalid={tooLong}
        />
        <button
          type="button"
          className="discuss-lane-add"
          onClick={submit}
          disabled={disabled}
          aria-label={`Add ${title} note`}
        >
          &#10148;
        </button>
      </div>
    </section>
  );
}

export function DiscussPage({
  timer,
  cards,
  groups = [],
  votes,
  templateId,
  retroType = 'retro',
  discussItems,
  discuss,
  notes,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onPreviousSegment,
  onNextSegment,
  onJumpToItem,
  onRenameGroup,
  onAddNote,
  onRemoveNote,
}: DiscussPageProps): JSX.Element {
  const total = discuss.order.length;
  const activeId = discuss.order[discuss.currentIndex];
  const isCheck = retroType === 'check';
  const isFirst = discuss.currentIndex === 0 && (isCheck || discuss.segment === 'context');
  const isLast = discuss.currentIndex === total - 1 && discuss.segment === 'actions';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const template = getTemplate(templateId ?? 'start-stop');
  const colorByColumnId = new Map(template.columns.map((col) => [col.id, col.color]));
  const votableItems = discuss.order.map((id) => resolveVotable(id, cards, groups, votes));
  const discussItemById = new Map((discussItems ?? []).map((di) => [di.id, di]));
  const items = votableItems;
  const activeItem = items[discuss.currentIndex];

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current || typeof scrollRef.current.scrollTo !== 'function') return;
    // +1 to skip the leading spacer div
    const cardEl = scrollRef.current.children[discuss.currentIndex + 1] as HTMLElement | undefined;
    if (!cardEl) return;
    const containerWidth = scrollRef.current.offsetWidth;
    const targetScroll = cardEl.offsetLeft - (containerWidth - cardEl.offsetWidth) / 2;
    scrollRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
  }, [discuss.currentIndex]);

  const contextNotes = notes.filter((n) => n.parentCardId === activeId && n.lane === 'context');
  const actionNotes = notes.filter((n) => n.parentCardId === activeId && n.lane === 'actions');

  return (
    <section aria-label="Discuss">
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />

      <div className="discuss-carousel-dots">
        {items.map((item, i) => (
          <span
            key={item.id}
            className={`discuss-dot${i === discuss.currentIndex ? ' current' : ''}`}
          />
        ))}
      </div>

      <div className="discuss-carousel" ref={scrollRef}>
        <div className="discuss-carousel-spacer" />
        {items.map((item, i) => {
          const isCurrent = i === discuss.currentIndex;
          const di = discussItemById.get(item.id);
          const colColor = isCheck ? undefined : colorByColumnId.get(item.columnId);
          const displayTitle = di?.title ?? item.label;
          const displayDescription = di?.description ?? '';
          const displayScore = di?.scoreLabel ?? `${String(item.votes)} vote${item.votes !== 1 ? 's' : ''}`;
          return (
            <div
              key={item.id}
              className={`discuss-carousel-card${isCurrent ? ' discuss-carousel-active' : ''}${isCheck ? ' discuss-carousel-check' : ''}`}
              data-testid={isCurrent ? 'discuss-card-text' : undefined}
              style={colColor ? { '--col-color': colColor } as React.CSSProperties : undefined}
              onClick={(): void => { if (!isCurrent && onJumpToItem) onJumpToItem(i); }}
              role={!isCurrent ? 'button' : undefined}
            >
              {isCheck && di !== undefined ? (
                <>
                  <div className="discuss-carousel-score">{di.score === 0 ? '—' : di.score.toFixed(1)}</div>
                  <div className="discuss-carousel-label">{displayTitle}</div>
                  {displayDescription && (
                    <p className="discuss-carousel-description">{displayDescription}</p>
                  )}
                </>
              ) : editingId === item.id ? (
                <div className="discuss-carousel-edit" onClick={(e): void => { e.stopPropagation(); }}>
                  <input
                    type="text"
                    value={editDraft}
                    onChange={(e): void => { setEditDraft(e.target.value); }}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter' && editDraft.trim().length > 0) {
                        onRenameGroup?.(item.id, editDraft.trim());
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="discuss-carousel-edit-input"
                  />
                  <button
                    type="button"
                    className="discuss-carousel-edit-save"
                    onClick={(): void => {
                      if (editDraft.trim().length > 0) onRenameGroup?.(item.id, editDraft.trim());
                      setEditingId(null);
                    }}
                  >&#10003;</button>
                </div>
              ) : (
                <div
                  className="discuss-carousel-label"
                  onClick={(e): void => {
                    if (item.isGroup && onRenameGroup && isCurrent) {
                      e.stopPropagation();
                      setEditDraft(item.label);
                      setEditingId(item.id);
                    }
                  }}
                >
                  {displayTitle}
                  {item.isGroup && onRenameGroup !== undefined && isCurrent && (
                    <span className="discuss-carousel-edit-icon">&#9998;</span>
                  )}
                </div>
              )}
              {!isCheck && item.childCards !== undefined && item.childCards.length > 0 && (
                <ul className="discuss-carousel-children">
                  {item.childCards.map((c) => (
                    <li key={c.id}>{c.text}</li>
                  ))}
                </ul>
              )}
              <div className="discuss-carousel-votes-row">
                <span className="discuss-carousel-votes-label">{isCheck ? 'Median:' : 'Votes:'}</span>
                <span className="discuss-carousel-votes">{displayScore}</span>
              </div>
            </div>
          );
        })}
        <div className="discuss-carousel-spacer" />
      </div>

      {activeItem !== undefined && (
        <section aria-label="Active card" className="discuss-active-card">
          <div role="group" aria-label="Segment navigation" className="discuss-nav" data-testid="discuss-segment">
            <button type="button" aria-label="Previous segment" onClick={onPreviousSegment} disabled={isFirst}>
              &#8592; Prev
            </button>
            <button type="button" aria-label="Next segment" onClick={onNextSegment} disabled={isLast}>
              Next &#8594;
            </button>
          </div>
          <div className="discuss-timeline">
            {!isCheck && (
              <>
                <Lane
                  title="Context"
                  side="left"
                  active={discuss.segment === 'context'}
                  notes={contextNotes}
                  onAdd={(text): void => { onAddNote(activeId, 'context', text); }}
                  onRemove={onRemoveNote}
                />
                <div className="discuss-timeline-divider" />
              </>
            )}
            <Lane
              title="Actions"
              side={isCheck ? 'left' : 'right'}
              active={isCheck || discuss.segment === 'actions'}
              notes={actionNotes}
              onAdd={(text): void => { onAddNote(activeId, 'actions', text); }}
              onRemove={onRemoveNote}
            />
          </div>
        </section>
      )}
    </section>
  );
}
