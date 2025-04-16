import { RetroRepository } from '../../domain/ports/RetroRepository';
import { castVote } from '../../domain/retro/Retro';

export class CastVote {
  constructor(private readonly repo: RetroRepository) {}

  execute(participantId: string, cardId: string): void {
    this.repo.save(castVote(this.repo.load(), participantId, cardId));
  }
}
