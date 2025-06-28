import { useCallback, useMemo, useState } from 'react';
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

export interface AppProps {
  teamRepository: TeamRepository;
  clock: Clock;
  picker?: Picker<string>;
  idGenerator?: IdGenerator;
  downloader?: Downloader;
}

const defaultPicker = new RandomPicker<string>();

export function App({
  teamRepository,
  clock,
  picker = defaultPicker,
  idGenerator,
  downloader,
}: AppProps): JSX.Element {
  const ids = useMemo(
    () => idGenerator ?? new CryptoIdGenerator(),
    [idGenerator],
  );

  const bridge = useMemo(
    () => new ActiveRetroRepositoryBridge(teamRepository),
    [teamRepository],
  );

  const [appTab, setAppTab] = useState<AppTab>('home');
  const [showingRetroSetup, setShowingRetroSetup] = useState(false);
  const [forceDashboard, setForceDashboard] = useState(false);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const dashboard = useTeamDashboard(teamRepository, ids, picker, clock);
  const retro = useRetro(bridge, picker, ids, clock, downloader);

  const retroStage = retro.stage;
  const hasActiveRetro = dashboard.activeRetro !== null;

  const isActiveRetro =
    hasActiveRetro &&
    retroStage !== 'setup' &&
    retroStage !== 'close';

  const isCloseStage = hasActiveRetro && retroStage === 'close';

  const goHome = useCallback(() => {
    setForceDashboard(true);
    setShowingRetroSetup(false);
    setViewingMemberId(null);
    dashboard.backToDashboard();
  }, [dashboard]);

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
      discuss: retro.startDiscuss,
      review: retro.startReview,
      close: retro.startClose,
    };
    nav[stage]?.();
  }, [retro]);

  const logo = (
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
        <StageNav currentStage="close" onNavigate={navigateStage} />
        <ClosePage
          summary={retro.closeSummary}
          onExport={retro.exportJson}
          onReturnToDashboard={() => {
            dashboard.returnToDashboard();
            setForceDashboard(true);
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
        <StageNav currentStage={retroStage} onNavigate={navigateStage} />
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
            templateId={retro.meta.templateId}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onAddCard={retro.addCard}
            onRemoveCard={retro.removeCard}
            onMoveCard={retro.moveCard}
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
            cards={retro.cards}
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
            votes={retro.votes}
            discuss={retro.discuss}
            notes={retro.discussNotes}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onPreviousSegment={retro.previousDiscussSegment}
            onNextSegment={retro.advanceDiscussSegment}
            onAddNote={retro.addDiscussNote}
            onRemoveNote={retro.removeDiscussNote}
          />
        ) : retro.stage === 'review' && retro.timer !== null ? (
          <ReviewPage
            timer={retro.timer}
            participants={retro.participants}
            actionItems={retro.actionItems}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onAssignOwner={retro.assignActionOwner}
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
          onAddMember={dashboard.addMember}
          onRemoveMember={dashboard.removeMember}
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
