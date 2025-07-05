import { useState, useRef, useEffect } from 'react';
import type { Card } from '../../domain/retro/Card';
import { MAX_CARD_LENGTH } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';
import type { DiscussState } from '../../domain/retro/Retro';
import type { DiscussLane, DiscussNote } from '../../domain/retro/DiscussNote';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { PresentTimer } from '../components/PresentTimer';

export interface DiscussPageProps {
  timer: Timer;
  cards: readonly Card[];
  groups?: readonly Group[];
  votes: readonly Vote[];
  templateId?: string;
  discuss: DiscussState;
  notes: readonly DiscussNote[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onPreviousSegment: () => void;
  onNextSegment: () => void;
  onJumpToItem?: (index: number) => void;
  onAddNote: (parentCardId: string, lane: DiscussLane, text: string) => void;
  onRemoveNote: (noteId: string) => void;
}

interface VotableItem {
  id: string;
  label: string;
  columnId: string;
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
      childCards: children,
      votes: votes.filter((v) => v.cardId === group.id).length,
    };
  }
  const card = cards.find((c) => c.id === id);
  return {
    id,
    label: card?.text ?? id,
    columnId: card?.columnId ?? '',
    votes: votes.filter((v) => v.cardId === id).length,
  };
}

interface LaneProps {
  title: string;
  notes: readonly DiscussNote[];
  active: boolean;
  onAdd: (text: string) => void;
  onRemove: (noteId: string) => void;
}

function Lane({ title, notes, active, onAdd, onRemove }: LaneProps): JSX.Element {
  const [text, setText] = useState('');
  const trimmed = text.trim().length;
  const tooLong = text.length > MAX_CARD_LENGTH;
  const disabled = !active || trimmed === 0 || tooLong;
  const submit = (): void => {
    if (disabled) return;
    onAdd(text);
    setText('');
  };
  return (
    <section aria-label={`${title} notes`} data-active={active ? 'true' : 'false'}>
      <h4>{title}</h4>
      {active && (
        <div className="brainstorm-input-row">
          <span className="brainstorm-input-plus">+</span>
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
            className="brainstorm-input-add"
            onClick={submit}
            disabled={disabled}
            aria-label={`Add ${title} note`}
          >
            Add
          </button>
        </div>
      )}
      <ul aria-label={`${title} notes list`} className="brainstorm-card-list">
        {notes.map((n) => (
          <li key={n.id} data-testid={`discuss-note-${n.id}`} className="brainstorm-card">
            <span className="brainstorm-card-text">{n.text}</span>
            <button
              type="button"
              className="brainstorm-card-remove"
              onClick={(): void => { onRemove(n.id); }}
              aria-label={`Remove ${title} note ${n.text}`}
            >
              &times;
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
  groups = [],
  votes,
  templateId,
  discuss,
  notes,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onPreviousSegment,
  onNextSegment,
  onJumpToItem,
  onAddNote,
  onRemoveNote,
}: DiscussPageProps): JSX.Element {
  const total = discuss.order.length;
  const activeId = discuss.order[discuss.currentIndex];
  const isFirst = discuss.currentIndex === 0 && discuss.segment === 'context';
  const isLast = discuss.currentIndex === total - 1 && discuss.segment === 'actions';

  const template = getTemplate(templateId ?? 'start-stop');
  const colorByColumnId = new Map(template.columns.map((col) => [col.id, col.color]));
  const items = discuss.order.map((id) => resolveVotable(id, cards, groups, votes));
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
          const colColor = colorByColumnId.get(item.columnId);
          return (
            <div
              key={item.id}
              className={`discuss-carousel-card${isCurrent ? ' discuss-carousel-active' : ''}`}
              data-testid={isCurrent ? 'discuss-card-text' : undefined}
              style={colColor ? { '--col-color': colColor } as React.CSSProperties : undefined}
              onClick={(): void => { if (!isCurrent && onJumpToItem) onJumpToItem(i); }}
              role={!isCurrent ? 'button' : undefined}
            >
              <div className="discuss-carousel-label">{item.label}</div>
              {item.votes > 0 && (
                <span className="discuss-carousel-votes">+{String(item.votes)}</span>
              )}
              {item.childCards !== undefined && item.childCards.length > 0 && (
                <ul className="discuss-carousel-children">
                  {item.childCards.map((c) => (
                    <li key={c.id}>{c.text}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        <div className="discuss-carousel-spacer" />
      </div>

      {activeItem !== undefined && (
        <section aria-label="Active card" className="discuss-active-card">
          <p data-testid="discuss-segment" className="discuss-segment-indicator">
            <span data-active={discuss.segment === 'context' ? 'true' : 'false'}>Context</span>
            {' / '}
            <span data-active={discuss.segment === 'actions' ? 'true' : 'false'}>Actions</span>
          </p>
          <div role="group" aria-label="Segment navigation" className="discuss-nav">
            <button type="button" aria-label="Previous segment" onClick={onPreviousSegment} disabled={isFirst}>
              &#8592; Previous
            </button>
            <button type="button" aria-label="Next segment" onClick={onNextSegment} disabled={isLast}>
              Next &#8594;
            </button>
          </div>
          <div className="columns">
            <Lane
              title="Context"
              notes={contextNotes}
              active={discuss.segment === 'context'}
              onAdd={(text): void => { onAddNote(activeId, 'context', text); }}
              onRemove={onRemoveNote}
            />
            <Lane
              title="Actions"
              notes={actionNotes}
              active={discuss.segment === 'actions'}
              onAdd={(text): void => { onAddNote(activeId, 'actions', text); }}
              onRemove={onRemoveNote}
            />
          </div>
        </section>
      )}
    </section>
  );
}
