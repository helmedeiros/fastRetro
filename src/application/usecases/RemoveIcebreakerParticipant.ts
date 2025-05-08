import type { RetroRepository } from '../../domain/ports/RetroRepository';
import { removeIcebreakerParticipant } from '../../domain/retro/Retro';

export class RemoveIcebreakerParticipant {
  constructor(private readonly repo: RetroRepository) {}

  execute(id: string): void {
    this.repo.save(removeIcebreakerParticipant(this.repo.load(), id));
  }
}
