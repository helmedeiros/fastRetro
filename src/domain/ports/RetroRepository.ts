import { RetroState } from '../retro/Retro';

export interface RetroRepository {
  load(): RetroState;
  save(state: RetroState): void;
}
