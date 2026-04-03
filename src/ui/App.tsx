import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RetroStage } from '../domain/retro/Retro';
import type { Clock } from '../domain/ports/Clock';
import type { Downloader } from '../domain/ports/Downloader';
import type { IdGenerator } from '../domain/ports/IdGenerator';
import type { Picker } from '../domain/ports/Picker';
import type { TeamRepository } from '../domain/ports/TeamRepository';
import { CryptoIdGenerator } from '../adapters/id/CryptoIdGenerator';
import { RandomPicker } from '../adapters/random/RandomPicker';
import { ActiveRetroRepositoryBridge } from '../adapters/storage/ActiveRetroRepositoryBridge';
import { useTeamDashboard } from './hooks/useTeamDashboard';
import { useRetro } from './hooks/useRetro';
import { AppNav, type AppTab } from './components/AppNav';
import { TeamDashboardPage } from './pages/TeamDashboardPage';
import { RetrospectivesPage } from './pages/RetrospectivesPage';
import { RetroSetupPage } from './pages/RetroSetupPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { IcebreakerPage } from './pages/IcebreakerPage';
import { BrainstormPage } from './pages/BrainstormPage';
import { GroupPage } from './pages/GroupPage';
import { VotePage } from './pages/VotePage';
import { DiscussPage } from './pages/DiscussPage';
import { ReviewPage } from './pages/ReviewPage';
import { ClosePage } from './pages/ClosePage';
import { StageNav } from './components/StageNav';
import { SideMenu } from './components/SideMenu';
import { JoinModal } from './components/JoinModal';
import { useRoomSync } from './hooks/useRoomSync';
import { useIdentity } from './hooks/useIdentity';
import { RoomSync } from '../adapters/sync/RoomSync';
import type { SyncTeamInfo } from '../adapters/sync/RoomSync';
import { TeamRegistry } from '../adapters/storage/TeamRegistry';
import { LocalStorageTeamRepository } from '../adapters/storage/LocalStorageTeamRepository';
import { TeamSelectorPage } from './pages/TeamSelectorPage';
import { addMember, addAgreement } from '../domain/team/Team';
import { ReturnToDashboard } from '../application/usecases/ReturnToDashboard';
import { STAGE_DURATIONS } from '../domain/retro/Retro';
import { createTimer } from '../domain/retro/Timer';

export interface AppProps {
  teamRepository: TeamRepository;
  clock: Clock;
  picker?: Picker<string>;
  idGenerator?: IdGenerator;
  downloader?: Downloader;
  storage?: Storage;
}

const defaultPicker = new RandomPicker<string>();

export function App({
  teamRepository: defaultTeamRepository,
  clock,
  picker = defaultPicker,
  idGenerator,
  downloader,
  storage,
}: AppProps): JSX.Element {
  const hasStorage = storage !== undefined && typeof storage.getItem === 'function';
  const safeStorage = hasStorage ? storage : null;

  const registry = useMemo(
    () => safeStorage !== null ? new TeamRegistry(safeStorage) : null,
    [safeStorage],
  );

  const [teams, setTeams] = useState(() => {
    if (registry === null) return [];
    const existing = registry.list();
    if (existing.length === 0) {
      try {
        const team = defaultTeamRepository.loadTeam();
        if (team.members.length > 0) {
          registry.add('default', 'Default Team');
          registry.setSelectedTeamId('default');
          return registry.list();
        }
      } catch {
        // skip
      }
    }
    return existing;
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    // No storage (test env) — skip team selection
    if (registry === null) return 'default';
    // Joining via share URL — skip team selection, go straight to retro
    if (RoomSync.extractRoomCodeFromHash() !== null) return 'default';
    // No teams — show team selector
    if (registry.list().length === 0) return null;
    // Saved selection still valid
    const saved = registry.getSelectedTeamId();
    if (saved !== null && registry.list().some((t) => t.id === saved)) return saved;
    // Only one team — auto-select
    if (registry.list().length === 1) return registry.list()[0].id;
    return null;
  });

  const teamRepository = useMemo(() => {
    if (selectedTeamId === 'default' || safeStorage === null) return defaultTeamRepository;
    if (selectedTeamId === null) return defaultTeamRepository;
    return new LocalStorageTeamRepository(safeStorage, selectedTeamId);
  }, [selectedTeamId, safeStorage, defaultTeamRepository]);

  const ids = useMemo(
    () => idGenerator ?? new CryptoIdGenerator(),
    [idGenerator],
  );

  // Guest retro complete: resolve/create team, merge data, save history, switch
  const onGuestRetroComplete = useCallback((info: SyncTeamInfo) => {
    if (registry === null || safeStorage === null) return;

    // Find existing team by name or create a new one
    const existing = registry.list().find((t) => t.name === info.teamName);
    let teamId: string;
    if (existing !== undefined) {
      teamId = existing.id;
    } else {
      teamId = ids.next();
      registry.add(teamId, info.teamName);
    }

    // Move active retro from default repo to target repo
    const activeRetro = teamRepository.loadActiveRetro();
    const targetRepo = new LocalStorageTeamRepository(safeStorage, teamId);

    // Merge members and agreements from host into the target team (dedup by id and name/text)
    let team = targetRepo.loadTeam();

    for (const m of info.members) {
      const exists = team.members.some((x) => x.id === m.id || x.name.toLowerCase() === m.name.trim().toLowerCase());
      if (!exists) {
        try { team = addMember(team, m.id, m.name); } catch { /* skip */ }
      }
    }
    for (const a of info.agreements) {
      const exists = team.agreements.some((x) => x.id === a.id || x.text.toLowerCase() === a.text.trim().toLowerCase());
      if (!exists) {
        try { team = addAgreement(team, a.id, a.text, ''); } catch { /* skip */ }
      }
    }
    // Also merge retro participants (like the CLI does)
    if (activeRetro !== null) {
      for (const p of activeRetro.participants) {
        const exists = team.members.some((x) => x.id === p.id || x.name.toLowerCase() === p.name.trim().toLowerCase());
        if (!exists) {
          try { team = addMember(team, p.id, p.name); } catch { /* skip */ }
        }
      }
    }
    targetRepo.saveTeam(team);

    // Complete the retro in the target repo
    if (activeRetro !== null) {
      targetRepo.saveActiveRetro(activeRetro);
      teamRepository.saveActiveRetro(null);
      const rtd = new ReturnToDashboard(targetRepo, ids, clock);
      rtd.execute();
    }

    // Switch to the resolved team
    setTeams(registry.list());
    setSelectedTeamId(teamId);
    registry.setSelectedTeamId(teamId);
  }, [registry, safeStorage, ids, clock, teamRepository]);

  // Team selector — must be BEFORE the inner app
  if (selectedTeamId === null && registry !== null) {
    const teamSelectorLogo = (
      <h1>
        <span className="logo-btn">fastRetro</span>
      </h1>
    );
    return (
      <main className="container">
        {teamSelectorLogo}
        <TeamSelectorPage
          teams={teams}
          onSelectTeam={(id): void => {
            setSelectedTeamId(id);
            registry.setSelectedTeamId(id);
          }}
          onCreateTeam={(name): void => {
            const id = ids.next();
            registry.add(id, name);
            setTeams(registry.list());
            setSelectedTeamId(id);
            registry.setSelectedTeamId(id);
          }}
          onDeleteTeam={(id): void => {
            registry.remove(id);
            setTeams(registry.list());
          }}
        />
      </main>
    );
  }

  const currentTeamName = teams.find((t) => t.id === selectedTeamId)?.name;

  return (
    <TeamApp
      key={selectedTeamId ?? 'default'}
      teamRepository={teamRepository}
      clock={clock}
      picker={picker}
      ids={ids}
      downloader={downloader}
      teamName={currentTeamName}
      registry={registry}
      onSwitchTeam={registry !== null ? (): void => {
        setSelectedTeamId(null);
        registry.setSelectedTeamId(null);
      } : undefined}
      onGuestRetroComplete={onGuestRetroComplete}
    />
  );
}

function TeamApp({
  teamRepository,
  clock,
  picker,
  ids,
  downloader,
  teamName,
  registry,
  onSwitchTeam,
  onGuestRetroComplete,
}: {
  teamRepository: TeamRepository;
  clock: Clock;
  picker: Picker<string>;
  ids: IdGenerator;
  downloader?: Downloader;
  teamName?: string;
  registry?: TeamRegistry | null;
  onSwitchTeam?: () => void;
  onGuestRetroComplete?: (info: SyncTeamInfo) => void;
}): JSX.Element {
  const bridge = useMemo(
    () => new ActiveRetroRepositoryBridge(teamRepository),
    [teamRepository],
  );

  const [appTab, setAppTab] = useState<AppTab>('home');
  const [showingRetroSetup, setShowingRetroSetup] = useState(false);
  const [forceDashboard, setForceDashboard] = useState(false);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [defaultMemberName, setDefaultMemberName] = useState<string | null>(
    () => registry?.getDefaultMemberName() ?? null,
  );
  const dashboard = useTeamDashboard(teamRepository, ids, picker, clock);
  const retro = useRetro(bridge, picker, ids, clock, downloader);
  const roomSync = useRoomSync();
  const identity = useIdentity();

  // No auto-assign — host and guests both pick via JoinModal

  // Auto-join room from URL hash on mount
  const { joinRoom: joinRoomFn } = roomSync;
  const hasJoinedRef = useRef(false);
  useEffect(() => {
    if (hasJoinedRef.current) return;
    const code = RoomSync.extractRoomCodeFromHash();
    if (code === null) return;
    hasJoinedRef.current = true;
    joinRoomFn(code);
    // Clear hash after a short delay so StrictMode re-mount still sees it
    setTimeout(() => { window.location.hash = ''; }, 100);
  }, [joinRoomFn]);

  // Sync: stable refs to avoid stale closures
  const { broadcastState: syncBroadcast, onRemoteState: syncOnRemote, onRequestState: syncOnRequest, onNavigateStage: syncOnNavigate, onConnected: syncOnConnected, broadcastTeamInfo: syncBroadcastTeamInfo, onTeamInfo: syncOnTeamInfo, role: syncRole } = roomSync;
  const retroRefresh = retro.refresh;
  const dashboardRefresh = dashboard.refresh;

  // Sync: broadcast state when retro changes
  const isSyncingRef = useRef(false);
  useEffect(() => {
    if (syncRole === 'none' || isSyncingRef.current) return;
    const state = teamRepository.loadActiveRetro();
    if (state !== null) {
      syncBroadcast(state);
    }
  }, [retro.stage, retro.cards, retro.votes, retro.groups, retro.discussNotes, retro.participants, retro.surveyResponses, syncBroadcast, syncRole, teamRepository]);

  // Sync: receive remote state and apply it
  useEffect(() => {
    syncOnRemote((state) => {
      isSyncingRef.current = true;
      // Patch state from CLI: ensure required fields exist with defaults
      let patched = state;
      if (patched.timer === null && patched.stage !== 'setup' && patched.stage !== 'close') {
        const duration = STAGE_DURATIONS[patched.stage as keyof typeof STAGE_DURATIONS];
        if (duration !== undefined) {
          patched = { ...patched, timer: createTimer(duration) };
        }
      }
      if (patched.actionItemOwners === null || patched.actionItemOwners === undefined) {
        patched = { ...patched, actionItemOwners: {} };
      }
      if (!Array.isArray(patched.surveyResponses)) {
        patched = { ...patched, surveyResponses: [] };
      }
      if (patched.meta.type !== 'retro' && patched.meta.type !== 'check') {
        patched = { ...patched, meta: { ...patched.meta, type: 'retro' } };
      }
      teamRepository.saveActiveRetro(patched);
      retroRefresh();
      dashboardRefresh();
      setForceDashboard(false);
      // Auto-select default member if no identity picked yet
      if (identity.participantId === null && registry !== undefined && registry !== null) {
        const defaultName = registry.getDefaultMemberName();
        if (defaultName !== null) {
          const match = patched.participants.find(
            (p) => p.name.toLowerCase() === defaultName.toLowerCase(),
          );
          if (match !== undefined) {
            identity.setParticipantId(match.id, roomSync.roomCode ?? '');
            roomSync.claimIdentity(match.id);
          }
        }
      }
      setTimeout(() => { isSyncingRef.current = false; }, 50);
    });
  }, [syncOnRemote, teamRepository, retroRefresh, dashboardRefresh, identity, registry, roomSync]);

  // Sync: when WebSocket connects, broadcast current state and team info (host),
  // and re-claim identity if we already picked one (reconnect scenario)
  useEffect(() => {
    syncOnConnected(() => {
      // Only the host broadcasts state on connect — guests must NOT
      // overwrite the room with their stale local data
      if (syncRole === 'host') {
        const state = teamRepository.loadActiveRetro();
        if (state !== null) {
          syncBroadcast(state);
        }
        if (teamName) {
          syncBroadcastTeamInfo({
            teamName,
            members: dashboard.team.members.map((m) => ({ id: m.id, name: m.name })),
            agreements: dashboard.team.agreements.map((a) => ({ id: a.id, text: a.text })),
          });
        }
      }
      // Re-claim persisted identity or auto-select default member
      if (identity.participantId !== null) {
        roomSync.claimIdentity(identity.participantId);
      } else if (registry !== undefined && registry !== null) {
        const defaultName = registry.getDefaultMemberName();
        if (defaultName !== null) {
          const state = teamRepository.loadActiveRetro();
          if (state !== null) {
            const match = state.participants.find(
              (p) => p.name.toLowerCase() === defaultName.toLowerCase(),
            );
            if (match !== undefined) {
              identity.setParticipantId(match.id, roomSync.roomCode ?? '');
              roomSync.claimIdentity(match.id);
            }
          }
        }
      }
    });
  }, [syncOnConnected, syncBroadcast, syncBroadcastTeamInfo, syncRole, teamRepository, teamName, dashboard.team.members, dashboard.team.agreements, identity.participantId, roomSync, registry, identity]);

  // Sync: when a new peer requests state, send current state and team info
  useEffect(() => {
    syncOnRequest(() => {
      const state = teamRepository.loadActiveRetro();
      if (state !== null) {
        syncBroadcast(state);
      }
      if (teamName) {
        syncBroadcastTeamInfo({
          teamName,
          members: dashboard.team.members.map((m) => ({ id: m.id, name: m.name })),
          agreements: dashboard.team.agreements.map((a) => ({ id: a.id, text: a.text })),
        });
      }
    });
  }, [syncOnRequest, syncBroadcast, syncBroadcastTeamInfo, teamRepository, teamName, dashboard.team.members, dashboard.team.agreements]);

  // Sync: receive team info — store for team resolution when guest completes retro
  const remoteTeamInfoRef = useRef<SyncTeamInfo | null>(null);
  useEffect(() => {
    syncOnTeamInfo((info) => {
      remoteTeamInfoRef.current = info;
    });
  }, [syncOnTeamInfo]);

  const retroStage = retro.stage;
  const hasActiveRetro = dashboard.activeRetro !== null;

  const isActiveRetro =
    hasActiveRetro &&
    retroStage !== 'setup' &&
    retroStage !== 'close';

  const isCloseStage = hasActiveRetro && retroStage === 'close';

  const goHome = useCallback(() => {
    // Guest with team info: resolve/create team before going home
    if (syncRole === 'guest' && remoteTeamInfoRef.current !== null && onGuestRetroComplete !== undefined) {
      onGuestRetroComplete(remoteTeamInfoRef.current);
      return;
    }
    setForceDashboard(true);
    setShowingRetroSetup(false);
    setViewingMemberId(null);
    dashboard.backToDashboard();
  }, [dashboard, syncRole, onGuestRetroComplete]);

  const resumeRetro = useCallback(() => {
    retro.refresh();
    setForceDashboard(false);
  }, [retro]);

  const navigateStage = useCallback((stage: RetroStage) => {
    const nav: Record<RetroStage, (() => void) | undefined> = {
      setup: undefined,
      icebreaker: retro.startIcebreaker,
      brainstorm: retro.startBrainstorm,
      group: retro.startGroup,
      vote: retro.startVote,
      survey: retro.startSurvey,
      discuss: retro.startDiscuss,
      review: retro.startReview,
      close: retro.startClose,
    };
    nav[stage]?.();
  }, [retro]);

  // Sync: server tells us to navigate (40% threshold reached)
  useEffect(() => {
    syncOnNavigate((stage) => {
      navigateStage(stage);
    });
  }, [syncOnNavigate, navigateStage]);

  const logo = (
    <div className="app-header">
      <h1>
        <button
          type="button"
          className="logo-btn"
          onClick={goHome}
          aria-label="Go to dashboard"
        >
          fastRetro
        </button>
      </h1>
      {teamName !== undefined && onSwitchTeam !== undefined && (
        <button
          type="button"
          className="team-switch-btn"
          onClick={onSwitchTeam}
        >
          {teamName} &#9662;
        </button>
      )}
    </div>
  );

  // Viewing a completed retro from history
  if (dashboard.viewingCompletedRetroId !== null && dashboard.viewingCompletedSummary !== null) {
    return (
      <main className="container">
        {logo}
        <ClosePage
          summary={dashboard.viewingCompletedSummary}
          onBackToDashboard={dashboard.backToDashboard}
        />
      </main>
    );
  }

  // Active retro in close stage (not forced to dashboard)
  if (isCloseStage && !forceDashboard) {
    return (
      <main className="container">
        {logo}
        <StageNav currentStage="close" retroType={retro.meta.type} onNavigate={navigateStage} />
        <SideMenu participants={retro.participants} currentParticipantId={identity.participantId} sync={roomSync} />
        <ClosePage
          summary={retro.closeSummary}
          stats={{
            ideas: retro.cards.length,
            participants: retro.participants.length,
            votes: retro.votes.length,
            groups: retro.groups.length,
            actions: retro.closeSummary.allActionItems.length,
          }}
          cards={retro.cards}
          groups={retro.groups}
          templateId={retro.meta.templateId}
          onExport={retro.exportJson}
          onReturnToDashboard={() => {
            if (syncRole === 'guest' && remoteTeamInfoRef.current !== null && onGuestRetroComplete !== undefined) {
              onGuestRetroComplete(remoteTeamInfoRef.current);
            } else {
              dashboard.returnToDashboard();
              setForceDashboard(true);
            }
          }}
        />
      </main>
    );
  }

  // Active retro in progress (not forced to dashboard)
  if (isActiveRetro && !forceDashboard) {
    return (
      <main className="container">
        {logo}
        <StageNav currentStage={retroStage} retroType={retro.meta.type} onNavigate={navigateStage} />
        <SideMenu participants={retro.participants} currentParticipantId={identity.participantId} sync={roomSync} />
        {roomSync.role !== 'none' && identity.participantId === null && retro.participants.length > 0 && (
          <JoinModal
            participants={retro.participants}
            takenParticipantIds={roomSync.takenIds}
            onSelectParticipant={(pid): void => {
              identity.setParticipantId(pid, roomSync.roomCode ?? '');
              roomSync.claimIdentity(pid);
            }}
            onAddParticipant={(name): void => {
              retro.addParticipant(name);
              setTimeout(() => {
                const state = teamRepository.loadActiveRetro();
                if (state !== null) {
                  const last = state.participants[state.participants.length - 1];
                  if (last !== undefined) {
                    identity.setParticipantId(last.id, roomSync.roomCode ?? '');
                    roomSync.claimIdentity(last.id);
                  }
                }
              }, 100);
            }}
          />
        )}
        {retro.stage === 'icebreaker' &&
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
            onAddParticipant={retro.addIcebreakerParticipant}
            onRemoveParticipant={retro.removeIcebreakerParticipant}
            onContinueToBrainstorm={retro.startBrainstorm}
          />
        ) : retro.stage === 'brainstorm' && retro.timer !== null ? (
          <BrainstormPage
            timer={retro.timer}
            cards={retro.cards}
            groups={retro.groups}
            templateId={retro.meta.templateId}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onAddCard={retro.addCard}
            onRemoveCard={retro.removeCard}
            onMoveCard={retro.moveCard}
            onCreateGroup={retro.createGroupByDrop}
            onRenameGroup={retro.renameGroup}
            onUngroupCard={retro.ungroupCard}
          />
        ) : retro.stage === 'group' && retro.timer !== null ? (
          <GroupPage
            timer={retro.timer}
            cards={retro.cards}
            groups={retro.groups}
            templateId={retro.meta.templateId}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onCreateGroup={retro.createGroupByDrop}
            onRenameGroup={retro.renameGroup}
            onUngroupCard={retro.ungroupCard}
          />
        ) : retro.stage === 'vote' && retro.timer !== null ? (
          <VotePage
            timer={retro.timer}
            participants={retro.participants}
            templateId={retro.meta.templateId}
            currentParticipantId={identity.participantId}
            cards={retro.cards}
            groups={retro.groups}
            votes={retro.votes}
            voteBudget={retro.voteBudget}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onSetVoteBudget={retro.setVoteBudget}
            onCastVote={retro.castVote}
          />
        ) : retro.stage === 'discuss' &&
          retro.timer !== null &&
          retro.discuss !== null ? (
          <DiscussPage
            timer={retro.timer}
            cards={retro.cards}
            groups={retro.groups}
            votes={retro.votes}
            templateId={retro.meta.templateId}
            discuss={retro.discuss}
            notes={retro.discussNotes}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onPreviousSegment={retro.previousDiscussSegment}
            onNextSegment={retro.advanceDiscussSegment}
            onJumpToItem={retro.jumpToDiscussItem}
            onRenameGroup={retro.renameGroup}
            onAddNote={retro.addDiscussNote}
            onRemoveNote={retro.removeDiscussNote}
          />
        ) : retro.stage === 'review' && retro.timer !== null ? (
          <ReviewPage
            timer={retro.timer}
            participants={retro.participants}
            actionItems={retro.actionItems}
            cards={retro.cards}
            groups={retro.groups}
            templateId={retro.meta.templateId}
            existingActionItems={dashboard.allActionItems}
            agreements={dashboard.team.agreements}
            members={dashboard.team.members}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onAssignOwner={retro.assignActionOwner}
            onPromoteToAgreement={dashboard.promoteToAgreement}
            onDemoteAgreement={dashboard.demoteAgreement}
            onAddAgreement={dashboard.addAgreement}
            onRemoveAgreement={dashboard.removeAgreement}
            onReassignAction={dashboard.reassignActionItem}
          />
        ) : null}
      </main>
    );
  }

  // Member profile view
  if (viewingMemberId !== null) {
    const member = dashboard.team.members.find((m) => m.id === viewingMemberId);
    if (member !== undefined) {
      return (
        <main className="container">
          {logo}
          <MemberProfilePage
            member={member}
            history={dashboard.history}
            onBack={() => { setViewingMemberId(null); }}
          />
        </main>
      );
    }
  }

  // Retro setup form
  if (showingRetroSetup) {
    return (
      <main className="container">
        {logo}
        <RetroSetupPage
          onStart={(meta) => {
            dashboard.startRetro(meta);
            retro.refresh();
            setShowingRetroSetup(false);
            setForceDashboard(false);
          }}
          onCancel={() => { setShowingRetroSetup(false); }}
        />
      </main>
    );
  }

  // Dashboard views (home / retrospectives)
  const handleStartRetro = (): void => { setShowingRetroSetup(true); };
  const showActiveRetro = hasActiveRetro && retroStage !== 'setup';
  return (
    <main className="container">
      {logo}
      <AppNav currentTab={appTab} onNavigate={setAppTab} />
      {appTab === 'home' ? (
        <TeamDashboardPage
          members={dashboard.team.members}
          allActionItems={dashboard.allActionItems}
          hasActiveRetro={showActiveRetro}
          activeRetroStage={retroStage}
          activeRetroName={dashboard.activeRetro?.meta?.name ?? ''}
          defaultMemberName={defaultMemberName}
          onAddMember={dashboard.addMember}
          onRemoveMember={dashboard.removeMember}
          onSetDefaultMember={registry !== undefined && registry !== null ? (name): void => {
            registry.setDefaultMemberName(name);
            setDefaultMemberName(name);
          } : undefined}
          onStartRetro={handleStartRetro}
          onResumeRetro={resumeRetro}
          onViewMember={setViewingMemberId}
          onReassignAction={dashboard.reassignActionItem}
          onAddActionItem={dashboard.addActionItem}
          agreements={dashboard.team.agreements}
          onAddAgreement={dashboard.addAgreement}
          onRemoveAgreement={dashboard.removeAgreement}
          onPromoteToAgreement={dashboard.promoteToAgreement}
          onDemoteAgreement={dashboard.demoteAgreement}
          onEditActionItemText={dashboard.editActionItemText}
          onEditAgreementText={dashboard.editAgreementText}
          onDeleteActionItem={dashboard.deleteActionItem}
          onToggleActionItemDone={dashboard.toggleActionItemDone}
        />
      ) : (
        <RetrospectivesPage
          activeRetro={dashboard.activeRetro}
          activeRetroStage={retroStage}
          history={dashboard.history}
          membersCount={dashboard.team.members.length}
          onStartRetro={handleStartRetro}
          onResumeRetro={resumeRetro}
          onViewCompletedRetro={dashboard.viewCompletedRetro}
        />
      )}
    </main>
  );
}
