import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startBrainstorm } from '../../domain/retro/Retro';

export class StartBrainstorm {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startBrainstorm(this.repo.load()));
  }
}
