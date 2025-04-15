import type { Picker } from '../../domain/ports/Picker';

export type RandomFn = () => number;

export class RandomPicker<T> implements Picker<T> {
  private readonly rng: RandomFn;

  constructor(rng: RandomFn = Math.random) {
    this.rng = rng;
  }

  pick(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('RandomPicker cannot pick from an empty list');
    }
    const r = this.rng();
    const bounded = r < 0 ? 0 : r >= 1 ? 0.999999 : r;
    const index = Math.floor(bounded * items.length);
    return items[index] as T;
  }
}
