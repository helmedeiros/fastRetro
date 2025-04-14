import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startRetro } from '../../domain/retro/Retro';

export class StartRetro {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startRetro(this.repo.load()));
  }
}
