import type { Clock } from '../domain/ports/Clock';
import type { Picker } from '../domain/ports/Picker';
import type { RetroRepository } from '../domain/ports/RetroRepository';
import { RandomPicker } from '../adapters/random/RandomPicker';
import { useRetro } from './hooks/useRetro';
import { SetupPage } from './pages/SetupPage';
import { IcebreakerPage } from './pages/IcebreakerPage';

export interface AppProps {
  repository: RetroRepository;
  clock?: Clock;
  picker?: Picker<string>;
}

const defaultPicker = new RandomPicker<string>();

export function App({
  repository,
  clock,
  picker = defaultPicker,
}: AppProps): JSX.Element {
  const retro = useRetro(repository, picker, clock);

  return (
    <main>
      <h1>fastRetro</h1>
      {retro.stage === 'setup' ? (
        <SetupPage
          participants={retro.participants}
          onAddParticipant={retro.addParticipant}
          onRemoveParticipant={retro.removeParticipant}
          onStartRetro={retro.startIcebreaker}
        />
      ) : retro.timer !== null && retro.icebreaker !== null ? (
        <IcebreakerPage
          timer={retro.timer}
          icebreaker={retro.icebreaker}
          participants={retro.participants}
          onStartTimer={retro.startTimer}
          onPauseTimer={retro.pauseTimer}
          onResumeTimer={retro.resumeTimer}
          onResetTimer={retro.resetTimer}
          onNextParticipant={retro.advanceIcebreaker}
        />
      ) : null}
    </main>
  );
}
