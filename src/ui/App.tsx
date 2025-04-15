import { useMemo } from 'react';
import type { Clock } from '../domain/ports/Clock';
import type { IdGenerator } from '../domain/ports/IdGenerator';
import type { Picker } from '../domain/ports/Picker';
import type { RetroRepository } from '../domain/ports/RetroRepository';
import { CryptoIdGenerator } from '../adapters/id/CryptoIdGenerator';
import { RandomPicker } from '../adapters/random/RandomPicker';
import { useRetro } from './hooks/useRetro';
import { SetupPage } from './pages/SetupPage';
import { IcebreakerPage } from './pages/IcebreakerPage';
import { BrainstormPage } from './pages/BrainstormPage';

export interface AppProps {
  repository: RetroRepository;
  clock?: Clock;
  picker?: Picker<string>;
  idGenerator?: IdGenerator;
}

const defaultPicker = new RandomPicker<string>();

export function App({
  repository,
  clock,
  picker = defaultPicker,
  idGenerator,
}: AppProps): JSX.Element {
  const ids = useMemo(
    () => idGenerator ?? new CryptoIdGenerator(),
    [idGenerator],
  );
  const retro = useRetro(repository, picker, ids, clock);

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
      ) : retro.stage === 'icebreaker' &&
        retro.timer !== null &&
        retro.icebreaker !== null ? (
        <IcebreakerPage
          timer={retro.timer}
          icebreaker={retro.icebreaker}
          participants={retro.participants}
          onStartTimer={retro.startTimer}
          onPauseTimer={retro.pauseTimer}
          onResumeTimer={retro.resumeTimer}
          onResetTimer={retro.resetTimer}
          onNextParticipant={retro.advanceIcebreaker}
          onContinueToBrainstorm={retro.startBrainstorm}
        />
      ) : retro.stage === 'brainstorm' && retro.timer !== null ? (
        <BrainstormPage
          timer={retro.timer}
          cards={retro.cards}
          onStartTimer={retro.startTimer}
          onPauseTimer={retro.pauseTimer}
          onResumeTimer={retro.resumeTimer}
          onResetTimer={retro.resetTimer}
          onAddCard={retro.addCard}
          onRemoveCard={retro.removeCard}
        />
      ) : null}
    </main>
  );
}
