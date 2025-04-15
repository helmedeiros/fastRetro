import { RetroRepository } from '../../domain/ports/RetroRepository';
import { IdGenerator } from '../../domain/ports/IdGenerator';
import { addCardToBrainstorm } from '../../domain/retro/Retro';
import type { ColumnId } from '../../domain/retro/Card';

export class AddCard {
  constructor(
    private readonly repo: RetroRepository,
    private readonly ids: IdGenerator,
  ) {}

  execute(columnId: ColumnId, text: string): void {
    this.repo.save(
      addCardToBrainstorm(this.repo.load(), columnId, text, this.ids),
    );
  }
}
