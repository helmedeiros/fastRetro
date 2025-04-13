import { RetroRepository } from '../../domain/ports/RetroRepository';
import { removeParticipant } from '../../domain/retro/Retro';

export class RemoveParticipant {
  constructor(private readonly repo: RetroRepository) {}

  execute(id: string): void {
    const state = this.repo.load();
    const next = removeParticipant(state, id);
    this.repo.save(next);
  }
}
