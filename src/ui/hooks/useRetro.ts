import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CryptoIdGenerator } from '../../adapters/id/CryptoIdGenerator';
import { AddParticipant } from '../../application/usecases/AddParticipant';
import { RemoveParticipant } from '../../application/usecases/RemoveParticipant';
import { StartIcebreaker } from '../../application/usecases/StartIcebreaker';
import { AdvanceIcebreaker } from '../../application/usecases/AdvanceIcebreaker';
import { StartTimer } from '../../application/usecases/StartTimer';
import { PauseTimer } from '../../application/usecases/PauseTimer';
import { ResumeTimer } from '../../application/usecases/ResumeTimer';
import { ResetTimer } from '../../application/usecases/ResetTimer';
import { TickTimer } from '../../application/usecases/TickTimer';
import type { Clock } from '../../domain/ports/Clock';
import type { Picker } from '../../domain/ports/Picker';
import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { Participant } from '../../domain/retro/Participant';
import type { RetroStage, RetroState } from '../../domain/retro/Retro';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';
import type { Timer } from '../../domain/retro/Timer';

export interface UseRetro {
  stage: RetroStage;
  participants: readonly Participant[];
  timer: Timer | null;
  icebreaker: IcebreakerState | null;
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  startIcebreaker: () => void;
  advanceIcebreaker: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

export function useRetro(
  repository: RetroRepository,
  picker: Picker<string>,
  clock?: Clock,
): UseRetro {
  const services = useMemo(() => {
    const ids = new CryptoIdGenerator();
    return {
      repo: repository,
      add: new AddParticipant(repository, ids),
      remove: new RemoveParticipant(repository),
      startIcebreaker: new StartIcebreaker(repository, picker),
      advanceIcebreaker: new AdvanceIcebreaker(repository),
      startTimer: new StartTimer(repository),
      pauseTimer: new PauseTimer(repository),
      resumeTimer: new ResumeTimer(repository),
      resetTimer: new ResetTimer(repository),
      tickTimer: new TickTimer(repository),
    };
  }, [repository, picker]);

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
    addParticipant,
    removeParticipant,
    startIcebreaker,
    advanceIcebreaker,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
}
