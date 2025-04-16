import { RetroRepository } from '../../domain/ports/RetroRepository';
import { removeDiscussNote } from '../../domain/retro/Retro';

export class RemoveDiscussNote {
  constructor(private readonly repo: RetroRepository) {}

  execute(noteId: string): void {
    this.repo.save(removeDiscussNote(this.repo.load(), noteId));
  }
}
