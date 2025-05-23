import type { TeamRepository } from '../../domain/ports/TeamRepository';
import type { Clock } from '../../domain/ports/Clock';
import type { IdGenerator } from '../../domain/ports/IdGenerator';
import { removeAgreement } from '../../domain/team/Team';
import { addManualActionItem } from '../../domain/team/RetroHistory';

export class DemoteAgreement {
  constructor(
    private readonly repo: TeamRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  execute(agreementId: string): void {
    const team = this.repo.loadTeam();
    const agreement = team.agreements.find((a) => a.id === agreementId);
    if (agreement === undefined) return;
    // Remove from agreements
    this.repo.saveTeam(removeAgreement(team, agreementId));
    // Add as action item
    const now = new Date(this.clock.now()).toISOString();
    const history = this.repo.loadHistory();
    this.repo.saveHistory(
      addManualActionItem(history, {
        noteId: this.ids.next(),
        text: agreement.text,
        parentText: 'Agreement',
        ownerName: null,
        completedAt: now,
      }),
    );
  }
}
