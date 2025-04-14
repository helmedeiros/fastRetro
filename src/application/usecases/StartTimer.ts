import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startRetroTimer } from '../../domain/retro/Retro';

export class StartTimer {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startRetroTimer(this.repo.load()));
  }
}
