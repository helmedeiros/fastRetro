import type { TeamRepository } from '../../domain/ports/TeamRepository';
import { reassignActionItem } from '../../domain/team/RetroHistory';

export class ReassignActionItem {
  constructor(private readonly repo: TeamRepository) {}

  execute(noteId: string, ownerName: string | null): void {
    const history = this.repo.loadHistory();
    this.repo.saveHistory(reassignActionItem(history, noteId, ownerName));
  }
}
