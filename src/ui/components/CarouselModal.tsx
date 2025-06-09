import { useRef, useEffect, useState } from 'react';
import { OwnerPicker } from './OwnerPicker';

export interface CarouselItem {
  id: string;
  icon: JSX.Element;
  title: string;
  meta: string;
  detail?: string;
  inspiredBy?: string;
  assignedTo?: string | null;
  onInspiredByClick?: () => void;
}

export interface CarouselActions {
  onDelete?: (id: string) => void;
  onPromote?: (id: string) => void;
  onAssign?: (id: string, ownerName: string | null) => void;
  onEditTitle?: (id: string, newText: string) => void;
  promoteLabel?: string;
  members?: readonly { id: string; name: string }[];
}

export interface CarouselModalProps {
  items: readonly CarouselItem[];
  initialIndex: number;
  onClose: () => void;
  actions?: CarouselActions;
}

function CardContent({
  item,
  actions,
}: {
  item: CarouselItem;
  actions?: CarouselActions;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.title);

  return (
    <div className="carousel-card">
      <div className="carousel-card-header">
        <span className="carousel-card-icon">{item.icon}</span>
        {editing ? (
          <div className="carousel-edit-row">
            <input
              type="text"
              value={editText}
              onChange={(e): void => { setEditText(e.target.value); }}
              className="carousel-edit-input"
              autoFocus
              onKeyDown={(e): void => {
                if (e.key === 'Enter' && editText.trim().length > 0) {
                  actions?.onEditTitle?.(item.id, editText.trim());
                  setEditing(false);
                }
                if (e.key === 'Escape') setEditing(false);
              }}
            />
            <button
              type="button"
              className="carousel-edit-save"
              onClick={(): void => {
                if (editText.trim().length > 0) {
                  actions?.onEditTitle?.(item.id, editText.trim());
                }
                setEditing(false);
              }}
            >
              &#10003;
            </button>
          </div>
        ) : (
          <h3 className="carousel-card-title">
            {item.title}
            {actions?.onEditTitle !== undefined && (
              <button
                type="button"
                className="carousel-edit-btn"
                onClick={(): void => { setEditText(item.title); setEditing(true); }}
              >
                &#9998;
              </button>
            )}
          </h3>
        )}
      </div>

      {item.inspiredBy !== undefined && (
        <div className="carousel-field">
          <span className="carousel-field-label">Inspired by</span>
          {item.onInspiredByClick !== undefined ? (
            <button type="button" className="carousel-field-link" onClick={item.onInspiredByClick}>
              {item.inspiredBy}
            </button>
          ) : (
            <span className="carousel-field-value carousel-field-accent">{item.inspiredBy}</span>
          )}
        </div>
      )}

      <div className="carousel-field">
        <span className="carousel-field-label">Added</span>
        <span className="carousel-field-value carousel-field-accent">{item.meta}</span>
      </div>

      {item.assignedTo !== undefined && (
        <div className="carousel-field">
          <span className="carousel-field-label">Assigned to</span>
          {actions?.members !== undefined && actions.onAssign !== undefined ? (
            <OwnerPicker
              ownerName={item.assignedTo}
              members={actions.members}
              onAssign={(name): void => { actions.onAssign?.(item.id, name); }}
            />
          ) : (
            <span className="carousel-field-value">{item.assignedTo ?? 'Unassigned'}</span>
          )}
        </div>
      )}

      <div className="carousel-card-footer">
        {actions?.onPromote !== undefined && (
          <button
            type="button"
            className="carousel-action-btn"
            onClick={(): void => { actions.onPromote?.(item.id); }}
          >
            {actions.promoteLabel ?? 'Convert'}
          </button>
        )}
        {actions?.onDelete !== undefined && (
          <button
            type="button"
            className="carousel-delete-btn"
            onClick={(): void => { actions.onDelete?.(item.id); }}
          >
            &#128465;
          </button>
        )}
      </div>
    </div>
  );
}

export function CarouselModal({
  items,
  initialIndex,
  onClose,
  actions,
}: CarouselModalProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = 340;
      const gap = 16;
      scrollRef.current.scrollLeft = initialIndex * (cardWidth + gap);
    }
  }, [initialIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); };
  }, [onClose]);

  return (
    <div className="carousel-overlay" onClick={onClose}>
      <div className="carousel-container" onClick={(e): void => { e.stopPropagation(); }}>
        <button type="button" className="carousel-close" onClick={onClose}>
          &times;
        </button>
        <div className="carousel-dots">
          {items.map((_, i) => (
            <span key={String(i)} className={`carousel-dot${i === initialIndex ? ' active' : ''}`} />
          ))}
        </div>
        <div className="carousel-scroll" ref={scrollRef}>
          {items.map((item) => (
            <CardContent key={item.id} item={item} actions={actions} />
          ))}
        </div>
      </div>
    </div>
  );
}
