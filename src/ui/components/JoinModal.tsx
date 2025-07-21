import { useState } from 'react';
import type { Participant } from '../../domain/retro/Participant';

export interface JoinModalProps {
  participants: readonly Participant[];
  takenParticipantIds?: ReadonlySet<string>;
  onSelectParticipant: (participantId: string) => void;
  onAddParticipant: (name: string) => void;
}

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

export function JoinModal({ participants, takenParticipantIds, onSelectParticipant, onAddParticipant }: JoinModalProps): JSX.Element {
  const taken = takenParticipantIds ?? new Set<string>();
  const [newName, setNewName] = useState('');

  return (
    <div className="join-modal-overlay">
      <div className="join-modal">
        <h2 className="join-modal-title">Join Retrospective</h2>
        <p className="join-modal-desc">Who are you?</p>

        {participants.length > 0 && (
          <div className="join-modal-section">
            <h4 className="join-modal-label">Pick your name</h4>
            <ul className="join-modal-list">
              {participants.map((p) => {
                const isTaken = taken.has(p.id);
                return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`join-modal-participant${isTaken ? ' join-modal-taken' : ''}`}
                    disabled={isTaken}
                    onClick={(): void => { if (!isTaken) onSelectParticipant(p.id); }}
                  >
                    <span className="join-modal-avatar" style={{ background: avatarColor(p.name) }}>
                      {initials(p.name)}
                    </span>
                    <span>{p.name}</span>
                    {isTaken && <span className="join-modal-taken-label">taken</span>}
                  </button>
                </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="join-modal-section">
          <h4 className="join-modal-label">Or join as someone new</h4>
          <div className="join-modal-add">
            <input
              type="text"
              value={newName}
              onChange={(e): void => { setNewName(e.target.value); }}
              onKeyDown={(e): void => {
                if (e.key === 'Enter' && newName.trim().length > 0) {
                  onAddParticipant(newName.trim());
                }
              }}
              placeholder="Your name..."
              className="join-modal-input"
            />
            <button
              type="button"
              className="join-modal-btn"
              disabled={newName.trim().length === 0}
              onClick={(): void => { onAddParticipant(newName.trim()); }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
