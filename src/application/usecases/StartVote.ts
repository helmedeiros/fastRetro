import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startVote } from '../../domain/retro/Retro';

export class StartVote {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startVote(this.repo.load()));
  }
}
