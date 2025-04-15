import { RetroRepository } from '../../domain/ports/RetroRepository';
import type { Picker } from '../../domain/ports/Picker';
import { startIcebreaker } from '../../domain/retro/Retro';

export class StartIcebreaker {
  constructor(
    private readonly repo: RetroRepository,
    private readonly picker: Picker<string>,
  ) {}

  execute(): void {
    this.repo.save(startIcebreaker(this.repo.load(), this.picker));
  }
}
