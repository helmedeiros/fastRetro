import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddParticipant } from '../../application/usecases/AddParticipant';
import { RemoveParticipant } from '../../application/usecases/RemoveParticipant';
import { StartIcebreaker } from '../../application/usecases/StartIcebreaker';
import { AdvanceIcebreaker } from '../../application/usecases/AdvanceIcebreaker';
import { StartBrainstorm } from '../../application/usecases/StartBrainstorm';
import { AddCard } from '../../application/usecases/AddCard';
import { RemoveCard } from '../../application/usecases/RemoveCard';
import { StartTimer } from '../../application/usecases/StartTimer';
import { PauseTimer } from '../../application/usecases/PauseTimer';
import { ResumeTimer } from '../../application/usecases/ResumeTimer';
import { ResetTimer } from '../../application/usecases/ResetTimer';
import { TickTimer } from '../../application/usecases/TickTimer';
import type { Clock } from '../../domain/ports/Clock';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Picker } from '../../domain/ports/Picker';
import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Participant } from '../../domain/retro/Participant';
import type { RetroStage, RetroState } from '../../domain/retro/Retro';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';
import type { Timer } from '../../domain/retro/Timer';

export interface UseRetro {
  stage: RetroStage;
  participants: readonly Participant[];
  timer: Timer | null;
  icebreaker: IcebreakerState | null;
  cards: readonly Card[];
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  startIcebreaker: () => void;
  advanceIcebreaker: () => void;
  startBrainstorm: () => void;
  addCard: (columnId: ColumnId, text: string) => void;
  removeCard: (cardId: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

export function useRetro(
  repository: RetroRepository,
  picker: Picker<string>,
  idGenerator: IdGenerator,
  clock?: Clock,
): UseRetro {
  const services = useMemo(
    () => ({
      repo: repository,
      add: new AddParticipant(repository, idGenerator),
      remove: new RemoveParticipant(repository),
      startIcebreaker: new StartIcebreaker(repository, picker),
      advanceIcebreaker: new AdvanceIcebreaker(repository),
      startBrainstorm: new StartBrainstorm(repository),
      addCard: new AddCard(repository, idGenerator),
      removeCard: new RemoveCard(repository),
      startTimer: new StartTimer(repository),
      pauseTimer: new PauseTimer(repository),
      resumeTimer: new ResumeTimer(repository),
      resetTimer: new ResetTimer(repository),
      tickTimer: new TickTimer(repository),
    }),
    [repository, picker, idGenerator],
  );

  const [state, setState] = useState<RetroState>(() => services.repo.load());
  const refresh = useCallback(() => {
    setState(services.repo.load());
  }, [services]);

  const lastTickRef = useRef<number | null>(null);
  const isTimerRunning = state.timer?.status === 'running';

  useEffect(() => {
    if (!isTimerRunning || clock === undefined) {
      lastTickRef.current = null;
      return undefined;
    }
    lastTickRef.current = clock.now();
    const unsubscribe = clock.subscribe((now) => {
      const previous = lastTickRef.current ?? now;
      const delta = now - previous;
      lastTickRef.current = now;
      if (delta > 0) {
        services.tickTimer.execute(delta);
        refresh();
      }
    }, 250);
    return () => {
      unsubscribe();
      lastTickRef.current = null;
    };
  }, [isTimerRunning, clock, services, refresh]);

  const addParticipant = useCallback(
    (name: string) => {
      services.add.execute(name);
      refresh();
    },
    [services, refresh],
  );

  const removeParticipant = useCallback(
    (id: string) => {
      services.remove.execute(id);
      refresh();
    },
    [services, refresh],
  );

  const startIcebreaker = useCallback(() => {
    services.startIcebreaker.execute();
    refresh();
  }, [services, refresh]);

  const advanceIcebreaker = useCallback(() => {
    services.advanceIcebreaker.execute();
    refresh();
  }, [services, refresh]);

  const startBrainstorm = useCallback(() => {
    services.startBrainstorm.execute();
    refresh();
  }, [services, refresh]);

  const addCard = useCallback(
    (columnId: ColumnId, text: string) => {
      services.addCard.execute(columnId, text);
      refresh();
    },
    [services, refresh],
  );

  const removeCard = useCallback(
    (cardId: string) => {
      services.removeCard.execute(cardId);
      refresh();
    },
    [services, refresh],
  );

  const startTimer = useCallback(() => {
    services.startTimer.execute();
    refresh();
  }, [services, refresh]);

  const pauseTimer = useCallback(() => {
    services.pauseTimer.execute();
    refresh();
  }, [services, refresh]);

  const resumeTimer = useCallback(() => {
    services.resumeTimer.execute();
    refresh();
  }, [services, refresh]);

  const resetTimer = useCallback(() => {
    services.resetTimer.execute();
    refresh();
  }, [services, refresh]);

  return {
    stage: state.stage,
    participants: state.participants,
    timer: state.timer,
    icebreaker: state.icebreaker,
    cards: state.cards,
    addParticipant,
    removeParticipant,
    startIcebreaker,
    advanceIcebreaker,
    startBrainstorm,
    addCard,
    removeCard,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
}
