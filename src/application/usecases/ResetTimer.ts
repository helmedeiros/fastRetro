import { RetroRepository } from '../../domain/ports/RetroRepository';
import { resetRetroTimer } from '../../domain/retro/Retro';

export class ResetTimer {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(resetRetroTimer(this.repo.load()));
  }
}
