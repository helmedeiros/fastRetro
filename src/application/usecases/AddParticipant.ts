import { RetroRepository } from '../../domain/ports/RetroRepository';
import { IdGenerator } from '../../domain/ports/IdGenerator';
import { addParticipant } from '../../domain/retro/Retro';

export class AddParticipant {
  constructor(
    private readonly repo: RetroRepository,
    private readonly ids: IdGenerator,
  ) {}

  execute(name: string): void {
    const state = this.repo.load();
    const next = addParticipant(state, this.ids.next(), name);
    this.repo.save(next);
  }
}
