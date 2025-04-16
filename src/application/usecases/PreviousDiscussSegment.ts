import { RetroRepository } from '../../domain/ports/RetroRepository';
import { previousDiscussSegment } from '../../domain/retro/Retro';

export class PreviousDiscussSegment {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(previousDiscussSegment(this.repo.load()));
  }
}
