import { RetroRepository } from '../../domain/ports/RetroRepository';
import { removeCardFromBrainstorm } from '../../domain/retro/Retro';

export class RemoveCard {
  constructor(private readonly repo: RetroRepository) {}

  execute(cardId: string): void {
    this.repo.save(removeCardFromBrainstorm(this.repo.load(), cardId));
  }
}
