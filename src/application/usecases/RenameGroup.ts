import { RetroRepository } from '../../domain/ports/RetroRepository';
import { renameRetroGroup } from '../../domain/retro/Retro';

export class RenameGroup {
  constructor(private readonly repo: RetroRepository) {}

  execute(groupId: string, name: string): void {
    this.repo.save(renameRetroGroup(this.repo.load(), groupId, name));
  }
}
