import { useState, useRef, useEffect } from 'react';
import type { TeamMember } from '../../domain/team/Team';

const AVATAR_COLORS = [
  '#5ec4c8', '#e06060', '#6ec76e', '#d4a84e',
  '#7a8fe0', '#c87ae0', '#e09060', '#60c4e0',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface OwnerPickerProps {
  ownerName: string | null;
  members: readonly TeamMember[];
  onAssign: (ownerName: string | null) => void;
}

export function OwnerPicker({
  ownerName,
  members,
  onAssign,
}: OwnerPickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); };
  }, [open]);

  return (
    <div className="owner-picker" ref={ref}>
      <button
        type="button"
        ref={triggerRef}
        className="owner-picker-trigger"
        onClick={(e): void => {
          e.stopPropagation();
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 220) });
          }
          setOpen(!open);
        }}
        title={ownerName ?? 'Unassigned'}
      >
        {ownerName !== null ? (
          <span
            className="owner-picker-avatar"
            style={{ background: avatarColor(ownerName) }}
          >
            {initials(ownerName)}
          </span>
        ) : (
          <span className="owner-picker-empty">?</span>
        )}
      </button>
      {open && (
        <div className="owner-picker-dropdown" style={{ top: pos.top, left: pos.left }} onClick={(e): void => { e.stopPropagation(); }}>
          <div className="owner-picker-header">
            <span>Assign to</span>
            <button
              type="button"
              className={`owner-picker-opt${ownerName === null ? ' active' : ''}`}
              onClick={(): void => { onAssign(null); setOpen(false); }}
            >
              None
            </button>
          </div>
          <ul className="owner-picker-list">
            {members.map((m) => {
              const selected = m.name.toLowerCase() === ownerName?.toLowerCase();
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`owner-picker-member${selected ? ' selected' : ''}`}
                    onClick={(): void => { onAssign(m.name); setOpen(false); }}
                  >
                    <span
                      className="owner-picker-member-avatar"
                      style={{ background: avatarColor(m.name) }}
                    >
                      {initials(m.name)}
                    </span>
                    <span>{m.name}</span>
                    {selected && <span className="owner-picker-check">&#10003;</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
