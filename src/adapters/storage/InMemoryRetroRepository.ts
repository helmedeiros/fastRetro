import { RetroRepository } from '../../domain/ports/RetroRepository';
import { RetroState, createRetro } from '../../domain/retro/Retro';

export class InMemoryRetroRepository implements RetroRepository {
  private state: RetroState;

  constructor(initial: RetroState = createRetro()) {
    this.state = initial;
  }

  load(): RetroState {
    return this.state;
  }

  save(state: RetroState): void {
    this.state = state;
  }
}
