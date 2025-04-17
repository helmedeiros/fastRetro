import type { Timer } from '../../domain/retro/Timer';
import type { Participant } from '../../domain/retro/Participant';
import type { ActionItem } from '../../domain/retro/Retro';
import { PresentTimer } from '../components/PresentTimer';

export interface ReviewPageProps {
  timer: Timer;
  participants: readonly Participant[];
  actionItems: readonly ActionItem[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onAssignOwner: (noteId: string, participantId: string | null) => void;
  onContinueToClose: () => void;
}

export function ReviewPage({
  timer,
  participants,
  actionItems,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onAssignOwner,
  onContinueToClose,
}: ReviewPageProps): JSX.Element {
  return (
    <section aria-label="Review">
      <h2>Review</h2>
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <section aria-label="Action items">
        <ul aria-label="Action items list">
          {actionItems.map((item) => {
            const selectId = `owner-${item.note.id}`;
            return (
              <li
                key={item.note.id}
                data-testid={`action-item-${item.note.id}`}
              >
                <p data-testid={`action-parent-${item.note.id}`}>
                  <small>{item.parentCard.text}</small>
                </p>
                <p data-testid={`action-text-${item.note.id}`}>
                  {item.note.text}
                </p>
                <label htmlFor={selectId}>Owner</label>
                <select
                  id={selectId}
                  aria-label={`Owner for ${item.note.text}`}
                  value={item.ownerId ?? ''}
                  onChange={(e): void => {
                    const value = e.target.value;
                    onAssignOwner(item.note.id, value === '' ? null : value);
                  }}
                >
                  <option value="">— unassigned —</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      </section>
      <button type="button" onClick={onContinueToClose}>
        Continue to close
      </button>
    </section>
  );
}
