import { RetroRepository } from '../../domain/ports/RetroRepository';
import { advanceDiscussSegment } from '../../domain/retro/Retro';

export class AdvanceDiscussSegment {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(advanceDiscussSegment(this.repo.load()));
  }
}
