import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Clock } from '../../domain/ports/Clock';
import { addManualActionItem } from '../../domain/team/RetroHistory';

export class AddManualActionItem {
  constructor(
    private readonly repo: TeamRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  execute(text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    const now = new Date(this.clock.now()).toISOString();
    const history = this.repo.loadHistory();
    this.repo.saveHistory(
      addManualActionItem(history, {
        noteId: this.ids.next(),
        text: trimmed,
        parentText: 'Manual',
        ownerName: null,
        completedAt: now,
      }),
    );
  }
}
