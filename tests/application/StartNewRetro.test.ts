import { describe, it, expect } from 'vitest';
import { InMemoryTeamRepository } from '../../src/adapters/storage/InMemoryTeamRepository';
import { AddTeamMember } from '../../src/application/usecases/AddTeamMember';
import { StartNewRetro } from '../../src/application/usecases/StartNewRetro';

let counter = 0;
const ids = { next: () => `id-${String(++counter)}` };
const picker = { pick: (items: readonly string[]) => items[0] };

describe('StartNewRetro', () => {
  it('creates a retro in icebreaker stage with team members as participants', () => {
    const repo = new InMemoryTeamRepository();
    new AddTeamMember(repo, ids).execute('Alice');
    new AddTeamMember(repo, ids).execute('Bob');
    new StartNewRetro(repo, picker).execute();
    const retro = repo.loadActiveRetro();
    expect(retro).not.toBeNull();
    expect(retro!.stage).toBe('icebreaker');
    expect(retro!.participants).toHaveLength(2);
    expect(retro!.participants.map((p) => p.name)).toEqual(['Alice', 'Bob']);
    expect(retro!.timer).not.toBeNull();
  });

  it('throws when team has no members', () => {
    const repo = new InMemoryTeamRepository();
    expect(() => new StartNewRetro(repo, picker).execute()).toThrow(/at least one/i);
  });
});
