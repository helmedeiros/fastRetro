import { RetroRepository } from '../../domain/ports/RetroRepository';
import { tickRetroTimer } from '../../domain/retro/Retro';

export class TickTimer {
  constructor(private readonly repo: RetroRepository) {}

  execute(deltaMs: number): void {
    this.repo.save(tickRetroTimer(this.repo.load(), deltaMs));
  }
}
