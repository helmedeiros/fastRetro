import { describe, it, expect } from 'vitest';
import {
  createRetro,
  addParticipant,
  removeParticipant,
} from '../../src/domain/retro/Retro';

describe('Retro.addParticipant', () => {
  it('starts with no participants', () => {
    expect(createRetro().participants).toEqual([]);
  });

  it('adds a participant', () => {
    const s = addParticipant(createRetro(), 'id-1', 'Alice');
    expect(s.participants).toHaveLength(1);
    expect(s.participants[0]).toEqual({ id: 'id-1', name: 'Alice' });
  });

  it('is immutable — returns new state', () => {
    const s0 = createRetro();
    const s1 = addParticipant(s0, 'id-1', 'Alice');
    expect(s0.participants).toHaveLength(0);
    expect(s1).not.toBe(s0);
  });

  it('rejects duplicate names (case-insensitive)', () => {
    const s = addParticipant(createRetro(), 'id-1', 'Alice');
    expect(() => addParticipant(s, 'id-2', 'alice')).toThrow(/already/);
  });

  it('rejects empty names', () => {
    expect(() => addParticipant(createRetro(), 'id-1', '   ')).toThrow();
  });
});

describe('Retro.removeParticipant', () => {
  it('removes a participant by id', () => {
    let s = createRetro();
    s = addParticipant(s, 'id-1', 'Alice');
    s = addParticipant(s, 'id-2', 'Bob');
    s = removeParticipant(s, 'id-1');
    expect(s.participants.map((p) => p.name)).toEqual(['Bob']);
  });

  it('throws when id not found', () => {
    const s = addParticipant(createRetro(), 'id-1', 'Alice');
    expect(() => removeParticipant(s, 'missing')).toThrow(/not found/);
  });
});
