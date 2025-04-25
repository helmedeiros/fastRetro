import type { TeamRepository } from '../../domain/ports/TeamRepository';
import { removeMember } from '../../domain/team/Team';

export class RemoveTeamMember {
  constructor(private readonly repo: TeamRepository) {}

  execute(id: string): void {
    this.repo.saveTeam(removeMember(this.repo.loadTeam(), id));
  }
}
