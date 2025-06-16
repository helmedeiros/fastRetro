import { useState, useCallback, useMemo } from 'react';
import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Picker } from '../../domain/ports/Picker';
import type { Clock } from '../../domain/ports/Clock';
import type { TeamState } from '../../domain/team/Team';
import type { RetroHistoryState } from '../../domain/team/RetroHistory';
import { getAllActionItems, editActionItemText as editActionItemTextDomain, removeActionItem as removeActionItemDomain, toggleActionItemDone as toggleActionItemDoneDomain, type FlatActionItem } from '../../domain/team/RetroHistory';
import { editAgreement } from '../../domain/team/Team';
import { AddTeamMember } from '../../application/usecases/AddTeamMember';
import { RemoveTeamMember } from '../../application/usecases/RemoveTeamMember';
import { StartNewRetro } from '../../application/usecases/StartNewRetro';
import { ReturnToDashboard } from '../../application/usecases/ReturnToDashboard';
import { ReassignActionItem } from '../../application/usecases/ReassignActionItem';
import { AddAgreement } from '../../application/usecases/AddAgreement';
import { AddManualActionItem } from '../../application/usecases/AddManualActionItem';
import { RemoveAgreement } from '../../application/usecases/RemoveAgreement';
import { PromoteToAgreement } from '../../application/usecases/PromoteToAgreement';
import { DemoteAgreement } from '../../application/usecases/DemoteAgreement';
import type { RetroState, RetroMeta } from '../../domain/retro/Retro';
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
  startRetro: (meta: RetroMeta) => void;
  returnToDashboard: () => void;
  viewCompletedRetro: (retroId: string) => void;
  backToDashboard: () => void;
  reassignActionItem: (noteId: string, ownerName: string | null) => void;
  addActionItem: (text: string) => void;
  addAgreement: (text: string) => void;
  removeAgreement: (id: string) => void;
  promoteToAgreement: (noteId: string) => void;
  demoteAgreement: (agreementId: string) => void;
  editActionItemText: (noteId: string, newText: string) => void;
  editAgreementText: (agreementId: string, newText: string) => void;
  deleteActionItem: (noteId: string) => void;
  toggleActionItemDone: (noteId: string) => void;
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
      reassignActionItem: new ReassignActionItem(teamRepo),
      addManualActionItem: new AddManualActionItem(teamRepo, ids, clock),
      addAgreement: new AddAgreement(teamRepo, ids, clock),
      removeAgreement: new RemoveAgreement(teamRepo),
      promoteToAgreement: new PromoteToAgreement(teamRepo, ids, clock),
      demoteAgreement: new DemoteAgreement(teamRepo, ids, clock),
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

  const startRetro = useCallback(
    (meta: RetroMeta) => {
      services.startRetro.execute(meta);
      refresh();
    },
    [services, refresh],
  );

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

  const reassignActionItemCb = useCallback(
    (noteId: string, ownerName: string | null) => {
      services.reassignActionItem.execute(noteId, ownerName);
      refresh();
    },
    [services, refresh],
  );

  const allActionItems = useMemo(
    () => getAllActionItems(history),
    [history],
  );

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
    reassignActionItem: reassignActionItemCb,
    addActionItem: useCallback(
      (text: string) => { services.addManualActionItem.execute(text); refresh(); },
      [services, refresh],
    ),
    addAgreement: useCallback(
      (text: string) => { services.addAgreement.execute(text); refresh(); },
      [services, refresh],
    ),
    removeAgreement: useCallback(
      (id: string) => { services.removeAgreement.execute(id); refresh(); },
      [services, refresh],
    ),
    promoteToAgreement: useCallback(
      (noteId: string) => { services.promoteToAgreement.execute(noteId); refresh(); },
      [services, refresh],
    ),
    demoteAgreement: useCallback(
      (agreementId: string) => { services.demoteAgreement.execute(agreementId); refresh(); },
      [services, refresh],
    ),
    editActionItemText: useCallback(
      (noteId: string, newText: string) => {
        teamRepo.saveHistory(editActionItemTextDomain(teamRepo.loadHistory(), noteId, newText));
        refresh();
      },
      [teamRepo, refresh],
    ),
    editAgreementText: useCallback(
      (agreementId: string, newText: string) => {
        teamRepo.saveTeam(editAgreement(teamRepo.loadTeam(), agreementId, newText));
        refresh();
      },
      [teamRepo, refresh],
    ),
    deleteActionItem: useCallback(
      (noteId: string) => {
        teamRepo.saveHistory(removeActionItemDomain(teamRepo.loadHistory(), noteId));
        refresh();
      },
      [teamRepo, refresh],
    ),
    toggleActionItemDone: useCallback(
      (noteId: string) => {
        teamRepo.saveHistory(toggleActionItemDoneDomain(teamRepo.loadHistory(), noteId));
        refresh();
      },
      [teamRepo, refresh],
    ),
  };
}
