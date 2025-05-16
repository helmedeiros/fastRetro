import type { TeamRepository } from '../../domain/ports/TeamRepository';
import { removeMember } from '../../domain/team/Team';
import { clearOwnerFromHistory } from '../../domain/team/RetroHistory';

export class RemoveTeamMember {
  constructor(private readonly repo: TeamRepository) {}

  execute(id: string): void {
    const team = this.repo.loadTeam();
    const member = team.members.find((m) => m.id === id);
    this.repo.saveTeam(removeMember(team, id));
    if (member !== undefined) {
      const history = this.repo.loadHistory();
      this.repo.saveHistory(clearOwnerFromHistory(history, member.name));
    }
  }
}
