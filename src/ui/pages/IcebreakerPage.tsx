import type { Participant } from '../../domain/retro/Participant';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';
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
      <p data-testid="icebreaker-question">{icebreaker.question}</p>
      <ul aria-label="Icebreaker rotation">
        {orderedParticipants.map((p) => {
          const isCurrent = p.id === currentId;
          return (
            <li
              key={p.id}
              aria-current={isCurrent ? 'true' : undefined}
              data-current={isCurrent ? 'true' : 'false'}
            >
              {p.name}
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={onNextParticipant} disabled={atEnd}>
        Next
      </button>
      <button type="button" className="primary" onClick={onContinueToBrainstorm}>
        Continue to brainstorm
      </button>
    </section>
  );
}
