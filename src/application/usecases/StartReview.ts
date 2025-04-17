import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startReview } from '../../domain/retro/Retro';

export class StartReview {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startReview(this.repo.load()));
  }
}
