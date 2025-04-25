import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { RetroState } from '../../domain/retro/Retro';
import { createRetro } from '../../domain/retro/Retro';

export class ActiveRetroRepositoryBridge implements RetroRepository {
  constructor(private readonly teamRepo: TeamRepository) {}

  load(): RetroState {
    return this.teamRepo.loadActiveRetro() ?? createRetro();
  }

  save(state: RetroState): void {
    this.teamRepo.saveActiveRetro(state);
  }
}
