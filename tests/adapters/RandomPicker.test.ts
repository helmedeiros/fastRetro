import { describe, it, expect } from 'vitest';
import { RandomPicker } from '../../src/adapters/random/RandomPicker';

describe('RandomPicker', () => {
  it('picks index 0 when rng returns 0', () => {
    const picker = new RandomPicker<string>(() => 0);
    expect(picker.pick(['a', 'b', 'c'])).toBe('a');
  });

  it('picks the last index when rng returns ~1', () => {
    const picker = new RandomPicker<string>(() => 0.999);
    expect(picker.pick(['a', 'b', 'c'])).toBe('c');
  });

  it('throws on empty list', () => {
    const picker = new RandomPicker<string>(() => 0.5);
    expect(() => picker.pick([])).toThrow();
  });

  it('defaults to Math.random', () => {
    const picker = new RandomPicker<string>();
    const result = picker.pick(['only']);
    expect(result).toBe('only');
  });
});
