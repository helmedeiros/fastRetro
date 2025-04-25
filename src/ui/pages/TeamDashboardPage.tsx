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
      <div className="columns">
        <aside>
          <section aria-label="Retrospectives">
            <h2>Retrospectives</h2>
            {hasActiveRetro ? (
              <button type="button" className="primary" onClick={onResumeRetro}>
                Resume Retrospective
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={onStartRetro}
                disabled={members.length === 0}
              >
                + Start Retrospective
              </button>
            )}
            {history.completed.length > 0 && (
              <ul aria-label="Past retrospectives">
                {history.completed.map((r) => (
                  <li key={r.id}>
                    <span>{new Date(r.completedAt).toLocaleDateString()}</span>
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
            <h2>
              Members{' '}
              <small>({String(members.length)})</small>
            </h2>
            <form onSubmit={onSubmit}>
              <label htmlFor="member-name">Name</label>
              <input
                id="member-name"
                type="text"
                value={name}
                onChange={(e): void => {
                  setName(e.target.value);
                }}
                placeholder="Add member..."
              />
              <button type="submit">Add</button>
            </form>
            {error !== null && <p role="alert">{error}</p>}
            <ul aria-label="Team members">
              {members.map((m) => (
                <li key={m.id}>
                  <span>{m.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    onClick={(): void => {
                      onRemoveMember(m.id);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section aria-label="Action items">
          <h2>Action Items</h2>
          {allActionItems.length === 0 ? (
            <p>No action items yet. Complete a retrospective to see them here.</p>
          ) : (
            <ul aria-label="All action items">
              {allActionItems.map((item) => (
                <li key={item.noteId} data-testid={`dashboard-action-${item.noteId}`}>
                  <div>
                    <span>{item.text}</span>
                    <small>
                      {' '}
                      {item.ownerName !== null
                        ? `— ${item.ownerName}`
                        : '— unassigned'}
                    </small>
                    <br />
                    <small>
                      {item.parentText} · {new Date(item.completedAt).toLocaleDateString()}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
