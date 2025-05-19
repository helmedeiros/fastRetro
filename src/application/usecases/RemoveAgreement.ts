import type { TeamRepository } from '../../domain/ports/TeamRepository';
import { removeAgreement } from '../../domain/team/Team';

export class RemoveAgreement {
  constructor(private readonly repo: TeamRepository) {}

  execute(id: string): void {
    this.repo.saveTeam(removeAgreement(this.repo.loadTeam(), id));
  }
}
