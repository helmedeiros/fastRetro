import { useMemo } from 'react';
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
import { TeamDashboardPage } from './pages/TeamDashboardPage';
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

  const dashboard = useTeamDashboard(teamRepository, ids, picker, clock);
  const retro = useRetro(bridge, picker, ids, clock, downloader);

  // Use retro.stage (always fresh) for routing within an active retro
  const retroStage = retro.stage;
  const hasActiveRetro = dashboard.activeRetro !== null;

  const isActiveRetro =
    hasActiveRetro &&
    retroStage !== 'setup' &&
    retroStage !== 'close';

  const isCloseStage = hasActiveRetro && retroStage === 'close';

  // Viewing a completed retro from history
  if (dashboard.viewingCompletedRetroId !== null && dashboard.viewingCompletedSummary !== null) {
    return (
      <main className="container">
        <h1>fastRetro</h1>
        <ClosePage
          summary={dashboard.viewingCompletedSummary}
          onBackToDashboard={dashboard.backToDashboard}
        />
      </main>
    );
  }

  // Active retro in close stage — show close page with return option
  if (isCloseStage) {
    return (
      <main className="container">
        <h1>fastRetro</h1>
        <StageNav currentStage="close" />
        <ClosePage
          summary={retro.closeSummary}
          onExport={retro.exportJson}
          onReturnToDashboard={dashboard.returnToDashboard}
        />
      </main>
    );
  }

  // Active retro in progress
  if (isActiveRetro) {
    return (
      <main className="container">
        <h1>fastRetro</h1>
        <StageNav currentStage={retroStage} />
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
            onContinueToGroup={retro.startGroup}
          />
        ) : retro.stage === 'group' && retro.timer !== null ? (
          <GroupPage
            timer={retro.timer}
            cards={retro.cards}
            groups={retro.groups}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onCreateGroup={retro.createGroupByDrop}
            onRenameGroup={retro.renameGroup}
            onUngroupCard={retro.ungroupCard}
            onContinueToVote={retro.startVote}
          />
        ) : retro.stage === 'vote' && retro.timer !== null ? (
          <VotePage
            timer={retro.timer}
            participants={retro.participants}
            cards={retro.cards}
            votes={retro.votes}
            voteBudget={retro.voteBudget}
            onStartTimer={retro.startTimer}
            onPauseTimer={retro.pauseTimer}
            onResumeTimer={retro.resumeTimer}
            onResetTimer={retro.resetTimer}
            onSetVoteBudget={retro.setVoteBudget}
            onCastVote={retro.castVote}
            onContinueToDiscuss={retro.startDiscuss}
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
            onContinueToReview={retro.startReview}
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
            onContinueToClose={retro.startClose}
          />
        ) : null}
      </main>
    );
  }

  // Dashboard (default view)
  return (
    <main className="container">
      <h1>fastRetro</h1>
      <TeamDashboardPage
        members={dashboard.team.members}
        history={dashboard.history}
        allActionItems={dashboard.allActionItems}
        hasActiveRetro={hasActiveRetro && retroStage !== 'setup'}
        onAddMember={dashboard.addMember}
        onRemoveMember={dashboard.removeMember}
        onStartRetro={() => {
          dashboard.startRetro();
          retro.refresh();
        }}
        onResumeRetro={() => {
          retro.refresh();
        }}
        onViewCompletedRetro={dashboard.viewCompletedRetro}
      />
    </main>
  );
}
