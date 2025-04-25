import { describe, it, expect } from 'vitest';
import {
  createTeam,
  addMember,
  removeMember,
} from '../../src/domain/team/Team';

describe('Team', () => {
  it('starts with no members', () => {
    expect(createTeam().members).toEqual([]);
  });

  it('adds a member', () => {
    const team = addMember(createTeam(), 'm1', 'Alice');
    expect(team.members).toEqual([{ id: 'm1', name: 'Alice' }]);
  });

  it('trims member names', () => {
    const team = addMember(createTeam(), 'm1', '  Bob  ');
    expect(team.members[0].name).toBe('Bob');
  });

  it('throws on empty name', () => {
    expect(() => addMember(createTeam(), 'm1', '   ')).toThrow(/empty/);
  });

  it('throws on duplicate name (case-insensitive)', () => {
    const team = addMember(createTeam(), 'm1', 'Alice');
    expect(() => addMember(team, 'm2', 'alice')).toThrow(/already exists/);
  });

  it('removes a member', () => {
    let team = addMember(createTeam(), 'm1', 'Alice');
    team = addMember(team, 'm2', 'Bob');
    team = removeMember(team, 'm1');
    expect(team.members).toEqual([{ id: 'm2', name: 'Bob' }]);
  });

  it('throws when removing a non-existent member', () => {
    expect(() => removeMember(createTeam(), 'nope')).toThrow(/not found/);
  });
});
