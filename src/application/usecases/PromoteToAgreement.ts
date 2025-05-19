import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Clock } from '../../domain/ports/Clock';
import { addAgreement } from '../../domain/team/Team';
import { getAllActionItems } from '../../domain/team/RetroHistory';

export class PromoteToAgreement {
  constructor(
    private readonly repo: TeamRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  execute(noteId: string): void {
    const history = this.repo.loadHistory();
    const allItems = getAllActionItems(history);
    const item = allItems.find((a) => a.noteId === noteId);
    if (item === undefined) return;
    const createdAt = new Date(this.clock.now()).toISOString();
    this.repo.saveTeam(
      addAgreement(this.repo.loadTeam(), this.ids.next(), item.text, createdAt),
    );
  }
}
