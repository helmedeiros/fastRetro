import { useState, useCallback, useMemo } from 'react';
import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Picker } from '../../domain/ports/Picker';
import type { Clock } from '../../domain/ports/Clock';
import type { TeamState } from '../../domain/team/Team';
import type { RetroHistoryState } from '../../domain/team/RetroHistory';
import { getAllActionItems, type FlatActionItem } from '../../domain/team/RetroHistory';
import { AddTeamMember } from '../../application/usecases/AddTeamMember';
import { RemoveTeamMember } from '../../application/usecases/RemoveTeamMember';
import { StartNewRetro } from '../../application/usecases/StartNewRetro';
import { ReturnToDashboard } from '../../application/usecases/ReturnToDashboard';
import type { RetroState } from '../../domain/retro/Retro';
import { getCloseSummary, type CloseSummary } from '../../domain/retro/Retro';

export interface UseTeamDashboard {
  readonly team: TeamState;
  readonly history: RetroHistoryState;
  readonly allActionItems: readonly FlatActionItem[];
  readonly activeRetro: RetroState | null;
  readonly viewingCompletedRetroId: string | null;
  readonly viewingCompletedSummary: CloseSummary | null;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  startRetro: () => void;
  returnToDashboard: () => void;
  viewCompletedRetro: (retroId: string) => void;
  backToDashboard: () => void;
}

export function useTeamDashboard(
  teamRepo: TeamRepository,
  ids: IdGenerator,
  picker: Picker<string>,
  clock: Clock,
): UseTeamDashboard {
  const [team, setTeam] = useState<TeamState>(() => teamRepo.loadTeam());
  const [history, setHistory] = useState<RetroHistoryState>(() =>
    teamRepo.loadHistory(),
  );
  const [activeRetro, setActiveRetro] = useState<RetroState | null>(() =>
    teamRepo.loadActiveRetro(),
  );
  const [viewingCompletedRetroId, setViewingCompletedRetroId] = useState<string | null>(null);

  const services = useMemo(
    () => ({
      addMember: new AddTeamMember(teamRepo, ids),
      removeMember: new RemoveTeamMember(teamRepo),
      startRetro: new StartNewRetro(teamRepo, picker),
      returnToDashboard: new ReturnToDashboard(teamRepo, ids, clock),
    }),
    [teamRepo, ids, picker, clock],
  );

  const refresh = useCallback(() => {
    setTeam(teamRepo.loadTeam());
    setHistory(teamRepo.loadHistory());
    setActiveRetro(teamRepo.loadActiveRetro());
  }, [teamRepo]);

  const addMember = useCallback(
    (name: string) => {
      services.addMember.execute(name);
      refresh();
    },
    [services, refresh],
  );

  const removeMember = useCallback(
    (id: string) => {
      services.removeMember.execute(id);
      refresh();
    },
    [services, refresh],
  );

  const startRetro = useCallback(() => {
    services.startRetro.execute();
    refresh();
  }, [services, refresh]);

  const returnToDashboard = useCallback(() => {
    services.returnToDashboard.execute();
    refresh();
  }, [services, refresh]);

  const viewCompletedRetro = useCallback((retroId: string) => {
    setViewingCompletedRetroId(retroId);
  }, []);

  const backToDashboard = useCallback(() => {
    setViewingCompletedRetroId(null);
  }, []);

  const allActionItems = useMemo(() => getAllActionItems(history), [history]);

  const viewingCompletedSummary = useMemo(() => {
    if (viewingCompletedRetroId === null) return null;
    const entry = history.completed.find((c) => c.id === viewingCompletedRetroId);
    if (entry === undefined) return null;
    return getCloseSummary(entry.fullState);
  }, [viewingCompletedRetroId, history]);

  return {
    team,
    history,
    allActionItems,
    activeRetro,
    viewingCompletedRetroId,
    viewingCompletedSummary,
    addMember,
    removeMember,
    startRetro,
    returnToDashboard,
    viewCompletedRetro,
    backToDashboard,
  };
}
