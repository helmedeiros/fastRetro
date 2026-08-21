import { useState } from 'react';
import type { Participant } from '../../domain/retro/Participant';
import { avatarColor, initials } from '../avatarColor';

export interface JoinModalProps {
  participants: readonly Participant[];
  takenParticipantIds?: ReadonlySet<string>;
  sessionType?: 'retro' | 'check';
  onSelectParticipant: (participantId: string) => void;
  onAddParticipant: (name: string) => void;
}

export function JoinModal({ participants, takenParticipantIds, sessionType, onSelectParticipant, onAddParticipant }: JoinModalProps): JSX.Element {
  const taken = takenParticipantIds ?? new Set<string>();
  const [newName, setNewName] = useState('');
  const title = sessionType === 'check' ? 'Join Check' : 'Join Retrospective';

  return (
    <div className="join-modal-overlay">
      <div className="join-modal">
        <h2 className="join-modal-title">{title}</h2>
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
