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
  onContinueToBrainstorm: () => void;
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
  onContinueToBrainstorm,
}: IcebreakerPageProps): JSX.Element {
  const currentId = icebreaker.participantIds[icebreaker.currentIndex];
  const atEnd = icebreaker.currentIndex >= icebreaker.participantIds.length - 1;

  const orderedParticipants = icebreaker.participantIds
    .map((id) => participants.find((p) => p.id === id))
    .filter((p): p is Participant => p !== undefined);

  const currentParticipant = participants.find((p) => p.id === currentId);

  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState(currentParticipant?.name ?? '');
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayName(currentParticipant?.name ?? '');
  }, [currentParticipant]);

  const handleSpin = (): void => {
    if (atEnd || spinning) return;
    setSpinning(true);
    let ticks = 0;
    const totalTicks = 12 + Math.floor(Math.random() * 6);
    spinRef.current = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * orderedParticipants.length);
      setDisplayName(orderedParticipants[randomIdx].name);
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
      <h2>Icebreaker</h2>
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
        {orderedParticipants.map((p) => {
          const isCurrent = p.id === currentId;
          return (
            <li
              key={p.id}
              aria-current={isCurrent ? 'true' : undefined}
              data-current={isCurrent ? 'true' : 'false'}
              className="participant-pill"
            >
              <span>{p.name}</span>
            </li>
          );
        })}
      </ul>

      <div className="icebreaker-actions">
        <button
          type="button"
          className="spin-btn"
          onClick={handleSpin}
          disabled={atEnd || spinning}
        >
          {spinning ? 'Spinning...' : 'SPIN'}
        </button>
      </div>

      <button type="button" className="primary" onClick={onContinueToBrainstorm}>
        Continue to brainstorm
      </button>
    </section>
  );
}
