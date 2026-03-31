import type { RetroStage, RetroType } from './Retro';

const RETRO_STAGES: readonly RetroStage[] = [
  'icebreaker',
  'brainstorm',
  'group',
  'vote',
  'discuss',
  'review',
  'close',
];

const CHECK_STAGES: readonly RetroStage[] = [
  'icebreaker',
  'survey',
  'discuss',
  'review',
  'close',
];

export function stagesForType(type: RetroType): readonly RetroStage[] {
  return type === 'check' ? CHECK_STAGES : RETRO_STAGES;
}

export function isValidStage(type: RetroType, stage: RetroStage): boolean {
  return stagesForType(type).includes(stage);
}

export function nextStage(
  type: RetroType,
  current: RetroStage,
): RetroStage | null {
  const stages = stagesForType(type);
  const idx = stages.indexOf(current);
  if (idx < 0 || idx >= stages.length - 1) return null;
  return stages[idx + 1];
}

export function previousStage(
  type: RetroType,
  current: RetroStage,
): RetroStage | null {
  const stages = stagesForType(type);
  const idx = stages.indexOf(current);
  if (idx <= 0) return null;
  return stages[idx - 1];
}
