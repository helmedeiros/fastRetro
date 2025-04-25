import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import type { Clock } from '../../domain/ports/Clock';
import { getActionItems } from '../../domain/retro/Retro';
import { addCompletedRetro } from '../../domain/team/RetroHistory';
import type { FlatActionItem, CompletedRetro } from '../../domain/team/RetroHistory';

export class ReturnToDashboard {
  constructor(
    private readonly repo: TeamRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  execute(): void {
    const active = this.repo.loadActiveRetro();
    if (active === null) return;

    if (active.stage === 'close') {
      const participantById = new Map(
        active.participants.map((p) => [p.id, p]),
      );
      const items = getActionItems(active);
      const completedAt = new Date(this.clock.now()).toISOString();
      const flatItems: FlatActionItem[] = items.map((item) => ({
        noteId: item.note.id,
        text: item.note.text,
        parentText: item.parentCard.text,
        ownerName:
          item.ownerId === null
            ? null
            : (participantById.get(item.ownerId)?.name ?? null),
        completedAt,
      }));
      const entry: CompletedRetro = {
        id: this.ids.next(),
        completedAt,
        actionItems: flatItems,
        fullState: active,
      };
      const history = this.repo.loadHistory();
      this.repo.saveHistory(addCompletedRetro(history, entry));
    }

    this.repo.saveActiveRetro(null);
  }
}
