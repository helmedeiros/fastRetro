import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Clock } from '../../domain/ports/Clock';
import { addAgreement } from '../../domain/team/Team';

export class AddAgreement {
  constructor(
    private readonly repo: TeamRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  execute(text: string): void {
    const createdAt = new Date(this.clock.now()).toISOString();
    this.repo.saveTeam(addAgreement(this.repo.loadTeam(), this.ids.next(), text, createdAt));
  }
}
