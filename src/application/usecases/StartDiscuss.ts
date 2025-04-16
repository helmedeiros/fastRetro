import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startDiscuss } from '../../domain/retro/Retro';

export class StartDiscuss {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startDiscuss(this.repo.load()));
  }
}
