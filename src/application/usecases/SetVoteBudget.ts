import { RetroRepository } from '../../domain/ports/RetroRepository';
import { setVoteBudget } from '../../domain/retro/Retro';

export class SetVoteBudget {
  constructor(private readonly repo: RetroRepository) {}

  execute(budget: number): void {
    this.repo.save(setVoteBudget(this.repo.load(), budget));
  }
}
