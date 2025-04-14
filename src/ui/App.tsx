import type { Clock } from '../domain/ports/Clock';
import type { RetroRepository } from '../domain/ports/RetroRepository';
import { useRetro } from './hooks/useRetro';
import { SetupPage } from './pages/SetupPage';
import { StagePage } from './pages/StagePage';

export interface AppProps {
  repository: RetroRepository;
  clock?: Clock;
}

export function App({ repository, clock }: AppProps): JSX.Element {
  const retro = useRetro(repository, clock);

  return (
    <main>
      <h1>fastRetro</h1>
      {retro.stage === 'setup' ? (
        <SetupPage
          participants={retro.participants}
          onAddParticipant={retro.addParticipant}
          onRemoveParticipant={retro.removeParticipant}
          onStartRetro={retro.startRetro}
        />
      ) : retro.timer !== null ? (
        <StagePage
          timer={retro.timer}
          onStartTimer={retro.startTimer}
          onPauseTimer={retro.pauseTimer}
          onResumeTimer={retro.resumeTimer}
          onResetTimer={retro.resetTimer}
        />
      ) : null}
    </main>
  );
}
