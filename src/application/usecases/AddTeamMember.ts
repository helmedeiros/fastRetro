import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import { addMember } from '../../domain/team/Team';

export class AddTeamMember {
  constructor(
    private readonly repo: TeamRepository,
    private readonly ids: IdGenerator,
  ) {}

  execute(name: string): void {
    this.repo.saveTeam(addMember(this.repo.loadTeam(), this.ids.next(), name));
  }
}
