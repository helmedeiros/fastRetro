import { useState, type FormEvent } from 'react';
import type { TeamMember } from '../../domain/team/Team';
import type { FlatActionItem } from '../../domain/team/RetroHistory';
import type { RetroHistoryState } from '../../domain/team/RetroHistory';

export interface TeamDashboardPageProps {
  members: readonly TeamMember[];
  history: RetroHistoryState;
  allActionItems: readonly FlatActionItem[];
  hasActiveRetro: boolean;
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  onStartRetro: () => void;
  onResumeRetro: () => void;
  onViewCompletedRetro: (retroId: string) => void;
}

const AVATAR_COLORS = [
  '#5ec4c8', '#e06060', '#6ec76e', '#d4a84e',
  '#7a8fe0', '#c87ae0', '#e09060', '#60c4e0',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamDashboardPage({
  members,
  history,
  allActionItems,
  hasActiveRetro,
  onAddMember,
  onRemoveMember,
  onStartRetro,
  onResumeRetro,
  onViewCompletedRetro,
}: TeamDashboardPageProps): JSX.Element {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    try {
      onAddMember(name);
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section aria-label="Team Dashboard">
      <div className="dashboard-layout">
        <aside>
          <section aria-label="Retrospectives">
            <h2>Retrospectives</h2>
            {hasActiveRetro ? (
              <button
                type="button"
                className="start-retro-card"
                onClick={onResumeRetro}
              >
                <span className="plus">&#9654;</span>
                <span className="label">Resume Retrospective</span>
              </button>
            ) : (
              <button
                type="button"
                className="start-retro-card"
                onClick={onStartRetro}
                disabled={members.length === 0}
              >
                <span className="plus">+</span>
                <span className="label">Start Retrospective</span>
              </button>
            )}
            {history.completed.length > 0 && (
              <ul aria-label="Past retrospectives">
                {history.completed.map((r) => (
                  <li key={r.id} className="past-retro-item">
                    <span>{new Date(r.completedAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <button
                      type="button"
                      onClick={(): void => {
                        onViewCompletedRetro(r.id);
                      }}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Members">
            <h2>Members <small style={{ color: 'var(--fr-accent)' }}>+</small></h2>
            <form onSubmit={onSubmit}>
              <input
                id="member-name"
                type="text"
                value={name}
                onChange={(e): void => {
                  setName(e.target.value);
                }}
                placeholder="Add member..."
                aria-label="Name"
              />
              <button type="submit">Add</button>
            </form>
            {error !== null && <p role="alert">{error}</p>}
            <ul aria-label="Team members">
              {members.map((m) => (
                <li key={m.id} className="member-item">
                  <span
                    className="member-avatar"
                    style={{ background: avatarColor(m.name) }}
                  >
                    {initials(m.name)}
                  </span>
                  <span>
                    <span className="member-name">{m.name}</span>
                    <br />
                    <span className="member-role">Member</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    onClick={(): void => {
                      onRemoveMember(m.id);
                    }}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section aria-label="Action items">
          <h2>Team Actions</h2>
          {allActionItems.length === 0 ? (
            <p className="empty-state">
              No action items yet.<br />
              Complete a retrospective to see them here.
            </p>
          ) : (
            <div>
              {allActionItems.map((item) => (
                <div
                  key={item.noteId}
                  className="action-item-row"
                  data-testid={`dashboard-action-${item.noteId}`}
                >
                  <span className="check-icon">&#10003;</span>
                  <div className="action-content">
                    <div className="action-text">{item.text}</div>
                    <div className="action-meta">
                      {item.parentText}
                      {' \u00B7 '}
                      {new Date(item.completedAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                    </div>
                  </div>
                  {item.ownerName !== null && (
                    <span
                      className="action-owner"
                      style={{ background: avatarColor(item.ownerName) }}
                      title={item.ownerName}
                    >
                      {initials(item.ownerName)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
