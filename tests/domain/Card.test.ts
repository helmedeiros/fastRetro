import { describe, it, expect } from 'vitest';
import { createCard, MAX_CARD_LENGTH } from '../../src/domain/retro/Card';

describe('Card.createCard', () => {
  it('creates a card with trimmed text', () => {
    const c = createCard('id-1', 'start', '  ship faster  ');
    expect(c).toEqual({ id: 'id-1', columnId: 'start', text: 'ship faster' });
  });

  it('rejects empty text', () => {
    expect(() => createCard('id-1', 'start', '   ')).toThrow(/empty/);
  });

  it('rejects text longer than 140 chars after trimming', () => {
    const tooLong = 'a'.repeat(MAX_CARD_LENGTH + 1);
    expect(() => createCard('id-1', 'stop', tooLong)).toThrow(/140/);
  });

  it('accepts exactly 140 chars', () => {
    const exact = 'a'.repeat(MAX_CARD_LENGTH);
    expect(createCard('id-1', 'start', exact).text.length).toBe(
      MAX_CARD_LENGTH,
    );
  });

  it('returns a frozen, immutable card', () => {
    const c = createCard('id-1', 'start', 'hi');
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('supports both columns', () => {
    expect(createCard('a', 'start', 'x').columnId).toBe('start');
    expect(createCard('b', 'stop', 'y').columnId).toBe('stop');
  });
});
