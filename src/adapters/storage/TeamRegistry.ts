const REGISTRY_KEY = 'fastretro:teams:registry';

export interface TeamEntry {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
}

export class TeamRegistry {
  constructor(private readonly storage: Storage) {}

  list(): readonly TeamEntry[] {
    const raw = this.storage.getItem(REGISTRY_KEY);
    if (raw === null) return [];
    try {
      const parsed = JSON.parse(raw) as TeamEntry[];
      return parsed;
    } catch {
      return [];
    }
  }

  add(id: string, name: string): TeamEntry {
    const entries = [...this.list()];
    const entry: TeamEntry = { id, name, createdAt: new Date().toISOString() };
    entries.push(entry);
    this.storage.setItem(REGISTRY_KEY, JSON.stringify(entries));
    return entry;
  }

  remove(id: string): void {
    const entries = this.list().filter((e) => e.id !== id);
    this.storage.setItem(REGISTRY_KEY, JSON.stringify(entries));
  }

  rename(id: string, name: string): void {
    const entries = this.list().map((e) => e.id === id ? { ...e, name } : e);
    this.storage.setItem(REGISTRY_KEY, JSON.stringify(entries));
  }

  getSelectedTeamId(): string | null {
    return this.storage.getItem('fastretro:teams:selected');
  }

  setSelectedTeamId(id: string | null): void {
    if (id === null) {
      this.storage.removeItem('fastretro:teams:selected');
    } else {
      this.storage.setItem('fastretro:teams:selected', id);
    }
  }
}
