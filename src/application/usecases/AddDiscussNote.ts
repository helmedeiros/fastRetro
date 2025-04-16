import { RetroRepository } from '../../domain/ports/RetroRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import { addDiscussNote } from '../../domain/retro/Retro';
import type { DiscussLane } from '../../domain/retro/DiscussNote';

export class AddDiscussNote {
  constructor(
    private readonly repo: RetroRepository,
    private readonly ids: IdGenerator,
  ) {}

  execute(parentCardId: string, lane: DiscussLane, text: string): void {
    this.repo.save(
      addDiscussNote(this.repo.load(), parentCardId, lane, text, this.ids),
    );
  }
}
