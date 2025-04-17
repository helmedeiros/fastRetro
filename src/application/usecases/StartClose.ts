import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startClose } from '../../domain/retro/Retro';

export class StartClose {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startClose(this.repo.load()));
  }
}
