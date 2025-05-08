import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Picker } from '../../domain/ports/Picker';
import { addIcebreakerParticipant } from '../../domain/retro/Retro';

export class AddIcebreakerParticipant {
  constructor(
    private readonly repo: RetroRepository,
    private readonly ids: IdGenerator,
    private readonly picker: Picker<string>,
  ) {}

  execute(name: string): void {
    this.repo.save(
      addIcebreakerParticipant(this.repo.load(), this.ids.next(), name, this.picker),
    );
  }
}
