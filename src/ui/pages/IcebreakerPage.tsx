import { useState, useEffect, useRef } from 'react';
import type { Participant } from '../../domain/retro/Participant';
import { currentQuestion, type IcebreakerState } from '../../domain/retro/stages/Icebreaker';
import type { Timer } from '../../domain/retro/Timer';
import { PresentTimer } from '../components/PresentTimer';

export interface IcebreakerPageProps {
  timer: Timer;
  icebreaker: IcebreakerState;
  participants: readonly Participant[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onNextParticipant: () => void;
  onAddParticipant?: (name: string) => void;
  onRemoveParticipant?: (id: string) => void;
  onContinue: () => void;
}

export function IcebreakerPage({
  timer,
  icebreaker,
  participants,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onNextParticipant,
  onAddParticipant,
  onRemoveParticipant,
  onContinue,
}: IcebreakerPageProps): JSX.Element {
  const [newName, setNewName] = useState('');
  const currentId = icebreaker.participantIds[icebreaker.currentIndex];
  const atEnd = icebreaker.currentIndex >= icebreaker.participantIds.length - 1;

  const orderedParticipants = icebreaker.participantIds
    .map((id) => participants.find((p) => p.id === id))
    .filter((p): p is Participant => p !== undefined);

  // Already picked = indices 0..currentIndex (inclusive)
  const pickedIds = new Set(
    icebreaker.participantIds.slice(0, icebreaker.currentIndex + 1),
  );

  // Remaining = everyone not yet picked
  const remaining = orderedParticipants.filter((p) => !pickedIds.has(p.id));

  const currentParticipant = participants.find((p) => p.id === currentId);

  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState(currentParticipant?.name ?? '');
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!spinning) {
      setDisplayName(currentParticipant?.name ?? '');
    }
  }, [currentParticipant, spinning]);

  const handleSpin = (): void => {
    if (atEnd || spinning || remaining.length === 0) return;
    setSpinning(true);
    let ticks = 0;
    const totalTicks = 12 + Math.floor(Math.random() * 6);
    spinRef.current = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * remaining.length);
      setDisplayName(remaining[randomIdx].name);
      ticks++;
      if (ticks >= totalTicks) {
        if (spinRef.current !== null) clearInterval(spinRef.current);
        spinRef.current = null;
        onNextParticipant();
        setSpinning(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (spinRef.current !== null) clearInterval(spinRef.current);
    };
  }, []);

  return (
    <section aria-label="Icebreaker">
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <p data-testid="icebreaker-question">{currentQuestion(icebreaker)}</p>

      <div className="icebreaker-speaker" data-testid="icebreaker-speaker">
        <span className={`speaker-name${spinning ? ' spinning' : ''}`}>
          {displayName}
        </span>
      </div>

      <ul aria-label="Icebreaker rotation">
        {remaining.map((p) => (
          <li
            key={p.id}
            data-current="false"
            className="participant-pill"
          >
            <span>{p.name}</span>
            {onRemoveParticipant !== undefined && (
              <button
                type="button"
                className="pill-remove"
                aria-label={`Remove ${p.name}`}
                onClick={(): void => { onRemoveParticipant(p.id); }}
              >
                &times;
              </button>
            )}
          </li>
        ))}
        {onAddParticipant !== undefined && (
          <li className="participant-pill add-pill">
            <input
              type="text"
              value={newName}
              onChange={(e): void => { setNewName(e.target.value); }}
              placeholder="Add names..."
              aria-label="Add participant name"
              onKeyDown={(e): void => {
                if (e.key === 'Enter' && newName.trim().length > 0) {
                  onAddParticipant(newName.trim());
                  setNewName('');
                }
              }}
            />
          </li>
        )}
      </ul>

      <div className="icebreaker-actions">
        {atEnd && !spinning ? (
          <button type="button" className="primary" onClick={onContinue}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="spin-btn"
            onClick={handleSpin}
            disabled={spinning}
          >
            {spinning ? 'Spinning...' : 'SPIN'}
          </button>
        )}
      </div>
    </section>
  );
}
