import { RetroRepository } from '../../domain/ports/RetroRepository';
import { assignActionOwner } from '../../domain/retro/Retro';

export class AssignActionOwner {
  constructor(private readonly repo: RetroRepository) {}

  execute(noteId: string, participantId: string | null): void {
    this.repo.save(assignActionOwner(this.repo.load(), noteId, participantId));
  }
}
