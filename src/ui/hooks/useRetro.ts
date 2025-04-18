import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddParticipant } from '../../application/usecases/AddParticipant';
import { RemoveParticipant } from '../../application/usecases/RemoveParticipant';
import { StartIcebreaker } from '../../application/usecases/StartIcebreaker';
import { AdvanceIcebreaker } from '../../application/usecases/AdvanceIcebreaker';
import { StartBrainstorm } from '../../application/usecases/StartBrainstorm';
import { AddCard } from '../../application/usecases/AddCard';
import { RemoveCard } from '../../application/usecases/RemoveCard';
import { StartGroup } from '../../application/usecases/StartGroup';
import { CreateGroupByDrop } from '../../application/usecases/CreateGroupByDrop';
import { RenameGroup } from '../../application/usecases/RenameGroup';
import { UngroupCard } from '../../application/usecases/UngroupCard';
import { StartVote } from '../../application/usecases/StartVote';
import { CastVote } from '../../application/usecases/CastVote';
import { SetVoteBudget } from '../../application/usecases/SetVoteBudget';
import { StartTimer } from '../../application/usecases/StartTimer';
import { PauseTimer } from '../../application/usecases/PauseTimer';
import { ResumeTimer } from '../../application/usecases/ResumeTimer';
import { ResetTimer } from '../../application/usecases/ResetTimer';
import { TickTimer } from '../../application/usecases/TickTimer';
import { StartDiscuss } from '../../application/usecases/StartDiscuss';
import { AdvanceDiscussSegment } from '../../application/usecases/AdvanceDiscussSegment';
import { PreviousDiscussSegment } from '../../application/usecases/PreviousDiscussSegment';
import { AddDiscussNote } from '../../application/usecases/AddDiscussNote';
import { RemoveDiscussNote } from '../../application/usecases/RemoveDiscussNote';
import { StartReview } from '../../application/usecases/StartReview';
import { AssignActionOwner } from '../../application/usecases/AssignActionOwner';
import { StartClose } from '../../application/usecases/StartClose';
import { ExportRetro } from '../../application/usecases/ExportRetro';
import type { Downloader } from '../../domain/ports/Downloader';
import type {
  DiscussLane,
  DiscussNote,
} from '../../domain/retro/DiscussNote';
import type {
  ActionItem,
  CloseSummary,
  DiscussState,
} from '../../domain/retro/Retro';
import { getActionItems, getCloseSummary } from '../../domain/retro/Retro';
import type { Clock } from '../../domain/ports/Clock';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Picker } from '../../domain/ports/Picker';
import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Participant } from '../../domain/retro/Participant';
import type { RetroStage, RetroState } from '../../domain/retro/Retro';
import type { IcebreakerState } from '../../domain/retro/stages/Icebreaker';
import type { Timer } from '../../domain/retro/Timer';
import type { Vote } from '../../domain/retro/Vote';

export interface UseRetro {
  stage: RetroStage;
  participants: readonly Participant[];
  timer: Timer | null;
  icebreaker: IcebreakerState | null;
  cards: readonly Card[];
  groups: readonly Group[];
  votes: readonly Vote[];
  voteBudget: number;
  discuss: DiscussState | null;
  discussNotes: readonly DiscussNote[];
  actionItems: readonly ActionItem[];
  closeSummary: CloseSummary;
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  startIcebreaker: () => void;
  advanceIcebreaker: () => void;
  startBrainstorm: () => void;
  addCard: (columnId: ColumnId, text: string) => void;
  removeCard: (cardId: string) => void;
  startGroup: () => void;
  createGroupByDrop: (sourceCardId: string, targetCardId: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  ungroupCard: (cardId: string) => void;
  startVote: () => void;
  castVote: (participantId: string, cardId: string) => void;
  setVoteBudget: (budget: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  startDiscuss: () => void;
  advanceDiscussSegment: () => void;
  previousDiscussSegment: () => void;
  addDiscussNote: (parentCardId: string, lane: DiscussLane, text: string) => void;
  removeDiscussNote: (noteId: string) => void;
  startReview: () => void;
  assignActionOwner: (noteId: string, participantId: string | null) => void;
  startClose: () => void;
  exportJson: () => void;
}

export function useRetro(
  repository: RetroRepository,
  picker: Picker<string>,
  idGenerator: IdGenerator,
  clock?: Clock,
  downloader?: Downloader,
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
      startGroup: new StartGroup(repository),
      createGroupByDrop: new CreateGroupByDrop(repository, idGenerator),
      renameGroup: new RenameGroup(repository),
      ungroupCard: new UngroupCard(repository),
      startVote: new StartVote(repository),
      castVote: new CastVote(repository),
      setVoteBudget: new SetVoteBudget(repository),
      startTimer: new StartTimer(repository),
      pauseTimer: new PauseTimer(repository),
      resumeTimer: new ResumeTimer(repository),
      resetTimer: new ResetTimer(repository),
      tickTimer: new TickTimer(repository),
      startDiscuss: new StartDiscuss(repository),
      advanceDiscussSegment: new AdvanceDiscussSegment(repository),
      previousDiscussSegment: new PreviousDiscussSegment(repository),
      addDiscussNote: new AddDiscussNote(repository, idGenerator),
      removeDiscussNote: new RemoveDiscussNote(repository),
      startReview: new StartReview(repository),
      assignActionOwner: new AssignActionOwner(repository),
      startClose: new StartClose(repository),
      exportRetro:
        clock !== undefined && downloader !== undefined
          ? new ExportRetro(repository, clock, downloader)
          : null,
    }),
    [repository, picker, idGenerator, clock, downloader],
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

  const startGroup = useCallback(() => {
    services.startGroup.execute();
    refresh();
  }, [services, refresh]);

  const createGroupByDrop = useCallback(
    (sourceCardId: string, targetCardId: string) => {
      services.createGroupByDrop.execute(sourceCardId, targetCardId);
      refresh();
    },
    [services, refresh],
  );

  const renameGroup = useCallback(
    (groupId: string, name: string) => {
      services.renameGroup.execute(groupId, name);
      refresh();
    },
    [services, refresh],
  );

  const ungroupCard = useCallback(
    (cardId: string) => {
      services.ungroupCard.execute(cardId);
      refresh();
    },
    [services, refresh],
  );

  const startVote = useCallback(() => {
    services.startVote.execute();
    refresh();
  }, [services, refresh]);

  const castVote = useCallback(
    (participantId: string, cardId: string) => {
      services.castVote.execute(participantId, cardId);
      refresh();
    },
    [services, refresh],
  );

  const setVoteBudget = useCallback(
    (budget: number) => {
      services.setVoteBudget.execute(budget);
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

  const startDiscuss = useCallback(() => {
    services.startDiscuss.execute();
    refresh();
  }, [services, refresh]);

  const advanceDiscussSegment = useCallback(() => {
    services.advanceDiscussSegment.execute();
    refresh();
  }, [services, refresh]);

  const previousDiscussSegment = useCallback(() => {
    services.previousDiscussSegment.execute();
    refresh();
  }, [services, refresh]);

  const addDiscussNote = useCallback(
    (parentCardId: string, lane: DiscussLane, text: string) => {
      services.addDiscussNote.execute(parentCardId, lane, text);
      refresh();
    },
    [services, refresh],
  );

  const removeDiscussNote = useCallback(
    (noteId: string) => {
      services.removeDiscussNote.execute(noteId);
      refresh();
    },
    [services, refresh],
  );

  const startReview = useCallback(() => {
    services.startReview.execute();
    refresh();
  }, [services, refresh]);

  const assignActionOwner = useCallback(
    (noteId: string, participantId: string | null) => {
      services.assignActionOwner.execute(noteId, participantId);
      refresh();
    },
    [services, refresh],
  );

  const startClose = useCallback(() => {
    services.startClose.execute();
    refresh();
  }, [services, refresh]);

  const exportJson = useCallback(() => {
    if (services.exportRetro !== null) {
      services.exportRetro.execute();
    }
  }, [services]);

  return {
    stage: state.stage,
    participants: state.participants,
    timer: state.timer,
    icebreaker: state.icebreaker,
    cards: state.cards,
    groups: state.groups,
    votes: state.votes,
    voteBudget: state.voteBudget,
    discuss: state.discuss,
    discussNotes: state.discussNotes,
    actionItems: getActionItems(state),
    closeSummary: getCloseSummary(state),
    addParticipant,
    removeParticipant,
    startIcebreaker,
    advanceIcebreaker,
    startBrainstorm,
    addCard,
    removeCard,
    startGroup,
    createGroupByDrop,
    renameGroup,
    ungroupCard,
    startVote,
    castVote,
    setVoteBudget,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startDiscuss,
    advanceDiscussSegment,
    previousDiscussSegment,
    addDiscussNote,
    removeDiscussNote,
    startReview,
    assignActionOwner,
    startClose,
    exportJson,
  };
}
