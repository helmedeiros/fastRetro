import { describe, it, expect } from 'vitest';
import { createParticipant } from '../../src/domain/retro/Participant';

describe('Participant', () => {
  it('creates a participant with trimmed name', () => {
    const p = createParticipant('id-1', '  Alice  ');
    expect(p).toEqual({ id: 'id-1', name: 'Alice' });
  });

  it('rejects an empty name', () => {
    expect(() => createParticipant('id-1', '')).toThrow(/empty/);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createParticipant('id-1', '   ')).toThrow(/empty/);
  });

  it('rejects an empty id', () => {
    expect(() => createParticipant('  ', 'Alice')).toThrow(/id/);
  });
});
