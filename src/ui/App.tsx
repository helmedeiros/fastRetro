import { useMemo } from 'react';
import type { Clock } from '../domain/ports/Clock';
import type { Downloader } from '../domain/ports/Downloader';
import type { IdGenerator } from '../domain/ports/IdGenerator';
import type { Picker } from '../domain/ports/Picker';
import type { RetroRepository } from '../domain/ports/RetroRepository';
import { CryptoIdGenerator } from '../adapters/id/CryptoIdGenerator';
import { RandomPicker } from '../adapters/random/RandomPicker';
import { useRetro } from './hooks/useRetro';
import { SetupPage } from './pages/SetupPage';
import { IcebreakerPage } from './pages/IcebreakerPage';
import { BrainstormPage } from './pages/BrainstormPage';
import { GroupPage } from './pages/GroupPage';
import { VotePage } from './pages/VotePage';
import { DiscussPage } from './pages/DiscussPage';
import { ReviewPage } from './pages/ReviewPage';
import { ClosePage } from './pages/ClosePage';

export interface AppProps {
  repository: RetroRepository;
  clock?: Clock;
  picker?: Picker<string>;
  idGenerator?: IdGenerator;
  downloader?: Downloader;
}

const defaultPicker = new RandomPicker<string>();

export function App({
  repository,
  clock,
  picker = defaultPicker,
  idGenerator,
  downloader,
}: AppProps): JSX.Element {
  const ids = useMemo(
    () => idGenerator ?? new CryptoIdGenerator(),
    [idGenerator],
  );
  const retro = useRetro(repository, picker, ids, clock, downloader);

  return (
    <main className="container">
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
      ) : retro.stage === 'close' ? (
        <ClosePage summary={retro.closeSummary} onExport={retro.exportJson} />
      ) : null}
    </main>
  );
}
