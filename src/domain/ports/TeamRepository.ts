import type { TeamState } from '../team/Team';
import type { RetroHistoryState } from '../team/RetroHistory';
import type { RetroState } from '../retro/Retro';

export interface TeamRepository {
  loadTeam(): TeamState;
  saveTeam(state: TeamState): void;
  loadHistory(): RetroHistoryState;
  saveHistory(state: RetroHistoryState): void;
  loadActiveRetro(): RetroState | null;
  saveActiveRetro(state: RetroState | null): void;
}
