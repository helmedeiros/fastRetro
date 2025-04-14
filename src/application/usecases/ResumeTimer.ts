import { RetroRepository } from '../../domain/ports/RetroRepository';
import { resumeRetroTimer } from '../../domain/retro/Retro';

export class ResumeTimer {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(resumeRetroTimer(this.repo.load()));
  }
}
