import type { Timer } from '../../domain/retro/Timer';
import { PresentTimer } from '../components/PresentTimer';

export interface StagePageProps {
  timer: Timer;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
}

export function StagePage({
  timer,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
}: StagePageProps): JSX.Element {
  return (
    <section aria-label="Retro stage">
      <h2>Retro in progress</h2>
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
    </section>
  );
}
