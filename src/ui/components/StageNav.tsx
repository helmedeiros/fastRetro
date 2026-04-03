import type { RetroStage, RetroType } from '../../domain/retro/Retro';
import { stagesForType } from '../../domain/retro/StageFlow';

const STAGE_LABELS: Readonly<Record<RetroStage, string>> = {
  setup: 'Setup',
  icebreaker: 'Icebreaker',
  brainstorm: 'Brainstorm',
  group: 'Group',
  vote: 'Vote',
  survey: 'Survey',
  discuss: 'Discuss',
  review: 'Review',
  close: 'Close',
};

export interface StageNavProps {
  currentStage: RetroStage;
  retroType?: RetroType;
  onNavigate?: (stage: RetroStage) => void;
}

export function StageNav({ currentStage, retroType = 'retro', onNavigate }: StageNavProps): JSX.Element {
  const stages = stagesForType(retroType);

  return (
    <nav className="stage-nav" aria-label="Retro stages">
      {stages.map((s) => (
        <button
          key={s}
          type="button"
          className={`stage-nav-item${s === currentStage ? ' active' : ''}`}
          aria-current={s === currentStage ? 'step' : undefined}
          onClick={(): void => { onNavigate?.(s); }}
        >
          {STAGE_LABELS[s].toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
