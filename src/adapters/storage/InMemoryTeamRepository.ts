import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { TeamState } from '../../domain/team/Team';
import type { RetroHistoryState } from '../../domain/team/RetroHistory';
import type { RetroState } from '../../domain/retro/Retro';
import { createTeam } from '../../domain/team/Team';
import { createHistory } from '../../domain/team/RetroHistory';

export class InMemoryTeamRepository implements TeamRepository {
  private team: TeamState = createTeam();
  private history: RetroHistoryState = createHistory();
  private activeRetro: RetroState | null = null;

  loadTeam(): TeamState {
    return this.team;
  }

  saveTeam(state: TeamState): void {
    this.team = state;
  }

  loadHistory(): RetroHistoryState {
    return this.history;
  }

  saveHistory(state: RetroHistoryState): void {
    this.history = state;
  }

  loadActiveRetro(): RetroState | null {
    return this.activeRetro;
  }

  saveActiveRetro(state: RetroState | null): void {
    this.activeRetro = state;
  }
}
