import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { ColumnId } from '../../domain/retro/Card';
import { moveCard } from '../../domain/retro/Retro';

export class MoveCard {
  constructor(private readonly repo: RetroRepository) {}

  execute(cardId: string, targetColumnId: ColumnId, targetIndex: number): void {
    this.repo.save(moveCard(this.repo.load(), cardId, targetColumnId, targetIndex));
  }
}
