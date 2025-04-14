import { RetroRepository } from '../../domain/ports/RetroRepository';
import { pauseRetroTimer } from '../../domain/retro/Retro';

export class PauseTimer {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(pauseRetroTimer(this.repo.load()));
  }
}
