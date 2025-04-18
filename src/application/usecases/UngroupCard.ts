import { RetroRepository } from '../../domain/ports/RetroRepository';
import { ungroupCard } from '../../domain/retro/Retro';

export class UngroupCard {
  constructor(private readonly repo: RetroRepository) {}

  execute(cardId: string): void {
    this.repo.save(ungroupCard(this.repo.load(), cardId));
  }
}
