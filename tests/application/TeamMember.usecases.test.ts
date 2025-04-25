import { describe, it, expect } from 'vitest';
import { InMemoryTeamRepository } from '../../src/adapters/storage/InMemoryTeamRepository';
import { AddTeamMember } from '../../src/application/usecases/AddTeamMember';
import { RemoveTeamMember } from '../../src/application/usecases/RemoveTeamMember';

let counter = 0;
const ids = { next: () => `id-${String(++counter)}` };

describe('AddTeamMember', () => {
  it('adds a member to the team', () => {
    const repo = new InMemoryTeamRepository();
    const usecase = new AddTeamMember(repo, ids);
    usecase.execute('Alice');
    const team = repo.loadTeam();
    expect(team.members).toHaveLength(1);
    expect(team.members[0].name).toBe('Alice');
  });
});

describe('RemoveTeamMember', () => {
  it('removes a member from the team', () => {
    const repo = new InMemoryTeamRepository();
    const addUc = new AddTeamMember(repo, ids);
    addUc.execute('Alice');
    const memberId = repo.loadTeam().members[0].id;
    const removeUc = new RemoveTeamMember(repo);
    removeUc.execute(memberId);
    expect(repo.loadTeam().members).toHaveLength(0);
  });
});
