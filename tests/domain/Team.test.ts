import { describe, it, expect } from 'vitest';
import {
  createTeam,
  addMember,
  removeMember,
  addAgreement,
  editAgreement,
  removeAgreement,
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

  it('starts with no agreements', () => {
    expect(createTeam().agreements).toEqual([]);
  });

  it('adds an agreement', () => {
    const team = addAgreement(createTeam(), 'a1', 'Timebox meetings', '2025-05-01');
    expect(team.agreements).toHaveLength(1);
    expect(team.agreements[0]).toEqual({ id: 'a1', text: 'Timebox meetings', createdAt: '2025-05-01' });
  });

  it('throws on empty agreement text', () => {
    expect(() => addAgreement(createTeam(), 'a1', '  ', '2025-05-01')).toThrow(/empty/);
  });

  it('edits an agreement text', () => {
    let team = addAgreement(createTeam(), 'a1', 'Old', '2025-05-01');
    team = editAgreement(team, 'a1', 'Updated');
    expect(team.agreements[0].text).toBe('Updated');
  });

  it('removes an agreement', () => {
    let team = addAgreement(createTeam(), 'a1', 'Rule 1', '2025-05-01');
    team = addAgreement(team, 'a2', 'Rule 2', '2025-05-01');
    team = removeAgreement(team, 'a1');
    expect(team.agreements).toHaveLength(1);
    expect(team.agreements[0].id).toBe('a2');
  });
});
