import { RetroRepository } from '../../domain/ports/RetroRepository';
import { startSurvey } from '../../domain/retro/Retro';

export class StartSurvey {
  constructor(private readonly repo: RetroRepository) {}

  execute(): void {
    this.repo.save(startSurvey(this.repo.load()));
  }
}
