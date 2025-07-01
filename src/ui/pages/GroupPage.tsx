import type { Card } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Timer } from '../../domain/retro/Timer';
import { BrainstormPage } from './BrainstormPage';

export interface GroupPageProps {
  timer: Timer;
  cards: readonly Card[];
  groups: readonly Group[];
  templateId?: string;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onCreateGroup: (sourceCardId: string, targetCardId: string) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onUngroupCard: (cardId: string) => void;
}

export function GroupPage({
  timer,
  cards,
  groups,
  templateId,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onCreateGroup,
  onRenameGroup,
  onUngroupCard,
}: GroupPageProps): JSX.Element {
  return (
    <BrainstormPage
      timer={timer}
      cards={cards}
      groups={groups}
      templateId={templateId}
      onStartTimer={onStartTimer}
      onPauseTimer={onPauseTimer}
      onResumeTimer={onResumeTimer}
      onResetTimer={onResetTimer}
      onCreateGroup={onCreateGroup}
      onRenameGroup={onRenameGroup}
      onUngroupCard={onUngroupCard}
    />
  );
}
