import type { IdGenerator } from '../../domain/ports/IdGenerator';
import { RetroRepository } from '../../domain/ports/RetroRepository';
import { createGroupByDrop } from '../../domain/retro/Retro';

export class CreateGroupByDrop {
  constructor(
    private readonly repo: RetroRepository,
    private readonly ids: IdGenerator,
  ) {}

  execute(sourceCardId: string, targetCardId: string): void {
    this.repo.save(createGroupByDrop(this.repo.load(), sourceCardId, targetCardId, this.ids));
  }
}
