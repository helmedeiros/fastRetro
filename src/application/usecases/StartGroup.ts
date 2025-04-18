import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startGroup } from '../../domain/retro/Retro';

export class StartGroup {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startGroup(this.repo.load()));
  }
}
