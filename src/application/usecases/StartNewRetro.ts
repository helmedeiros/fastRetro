import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { Picker } from '../../domain/ports/Picker';
import { createRetro, addParticipant, startIcebreaker, type RetroMeta } from '../../domain/retro/Retro';

export class StartNewRetro {
  constructor(
    private readonly repo: TeamRepository,
    private readonly picker: Picker<string>,
  ) {}

  execute(meta: RetroMeta): void {
    const team = this.repo.loadTeam();
    if (team.members.length === 0) {
      throw new Error('At least one team member is required to start a retro');
    }
    let retro = createRetro(meta);
    for (const m of team.members) {
      retro = addParticipant(retro, m.id, m.name);
    }
    retro = startIcebreaker(retro, this.picker);
    this.repo.saveActiveRetro(retro);
  }
}
