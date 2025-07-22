import { useState } from 'react';
import type { TeamEntry } from '../../adapters/storage/TeamRegistry';

export interface TeamSelectorPageProps {
  teams: readonly TeamEntry[];
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => void;
  onDeleteTeam: (teamId: string) => void;
}

export function TeamSelectorPage({
  teams,
  onSelectTeam,
  onCreateTeam,
  onDeleteTeam,
}: TeamSelectorPageProps): JSX.Element {
  const [name, setName] = useState('');

  return (
    <section aria-label="Team Selector" className="team-selector">
      <h2>Your Teams</h2>
      <p className="team-selector-desc">
        Select a team to view their dashboard, or create a new one.
      </p>

      {teams.length > 0 && (
        <ul className="team-selector-list">
          {teams.map((t) => (
            <li key={t.id} className="team-selector-item">
              <button
                type="button"
                className="team-selector-btn"
                onClick={(): void => { onSelectTeam(t.id); }}
              >
                <span className="team-selector-name">{t.name}</span>
                <span className="team-selector-date">
                  {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </button>
              <button
                type="button"
                className="team-selector-delete"
                title="Delete team"
                onClick={(): void => { onDeleteTeam(t.id); }}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      {teams.length === 0 && (
        <div className="team-selector-empty">
          <p>No teams yet. Create your first team to get started.</p>
        </div>
      )}

      <div className="team-selector-create">
        <input
          type="text"
          value={name}
          onChange={(e): void => { setName(e.target.value); }}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' && name.trim().length > 0) {
              onCreateTeam(name.trim());
              setName('');
            }
          }}
          placeholder="New team name..."
        />
        <button
          type="button"
          className="primary"
          disabled={name.trim().length === 0}
          onClick={(): void => {
            if (name.trim().length > 0) {
              onCreateTeam(name.trim());
              setName('');
            }
          }}
        >
          Create Team
        </button>
      </div>
    </section>
  );
}
