import type { RetroStage } from '../../domain/retro/Retro';

const STAGES: { key: RetroStage; label: string }[] = [
  { key: 'icebreaker', label: 'Icebreaker' },
  { key: 'brainstorm', label: 'Brainstorm' },
  { key: 'group', label: 'Group' },
  { key: 'vote', label: 'Vote' },
  { key: 'discuss', label: 'Discuss' },
  { key: 'review', label: 'Review' },
  { key: 'close', label: 'Close' },
];

export interface StageNavProps {
  currentStage: RetroStage;
}

export function StageNav({ currentStage }: StageNavProps): JSX.Element {
  return (
    <nav className="stage-nav" aria-label="Retro stages">
      {STAGES.map((s) => (
        <span
          key={s.key}
          className={`stage-nav-item${s.key === currentStage ? ' active' : ''}`}
          aria-current={s.key === currentStage ? 'step' : undefined}
        >
          {s.label.toUpperCase()}
        </span>
      ))}
    </nav>
  );
}
