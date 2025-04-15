import { RetroRepository } from '../../domain/ports/RetroRepository';
import { advanceIcebreakerParticipant } from '../../domain/retro/Retro';

export class AdvanceIcebreaker {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(advanceIcebreakerParticipant(this.repo.load()));
  }
}
