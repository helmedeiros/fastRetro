import type {
  CloseSummary,
  CloseSummaryDiscussedItem,
} from '../../domain/retro/Retro';

export interface CloseStats {
  readonly ideas: number;
  readonly participants: number;
  readonly votes: number;
  readonly groups: number;
  readonly actions: number;
}

export interface ClosePageProps {
  summary: CloseSummary;
  stats?: CloseStats;
  onExport?: () => void;
  onReturnToDashboard?: () => void;
  onBackToDashboard?: () => void;
}

function itemId(d: CloseSummaryDiscussedItem): string {
  return d.kind === 'card' ? d.card.id : d.group.id;
}

function itemTitle(d: CloseSummaryDiscussedItem): string {
  return d.kind === 'card' ? d.card.text : d.group.name;
}

function itemVotes(d: CloseSummaryDiscussedItem): number {
  return d.kind === 'card' ? d.card.votes : d.group.votes;
}

export function ClosePage({ summary, stats, onExport, onReturnToDashboard, onBackToDashboard }: ClosePageProps): JSX.Element {
  return (
    <section aria-label="Close">
      <h2>Retro complete</h2>

      {stats !== undefined && (
        <div className="close-stats">
          <div className="close-stat">
            <span className="close-stat-icon">&#128161;</span>
            <span className="close-stat-value">{String(stats.ideas)} ideas added</span>
            <span className="close-stat-sub">by {String(stats.participants)} participants</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">&#9745;</span>
            <span className="close-stat-value">{stats.votes > 0 ? `${String(stats.votes)} votes cast` : 'No votes cast'}</span>
            <span className="close-stat-sub">for {String(stats.groups)} groups</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">&#10003;</span>
            <span className="close-stat-value">{stats.actions > 0 ? `${String(stats.actions)} actions` : 'No new actions'}</span>
            <span className="close-stat-sub">from this retro</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">&#128101;</span>
            <span className="close-stat-value">100% participation</span>
            <span className="close-stat-sub">{String(stats.participants)}/{String(stats.participants)} invited participants</span>
          </div>
        </div>
      )}

      <ol aria-label="Close summary">
        {summary.discussed.map((d) => {
          const id = itemId(d);
          const title = itemTitle(d);
          const votes = itemVotes(d);
          return (
            <li key={id} data-testid={`close-card-${id}`}>
              <h3>
                {title}{' '}
                <small data-testid={`close-card-votes-${id}`}>
                  ({String(votes)} votes)
                </small>
              </h3>
              <section aria-label={`Context notes for ${title}`}>
                <h4>Context</h4>
                <ul>
                  {d.contextNotes.map((n) => (
                    <li key={n.id} data-testid={`close-context-${n.id}`}>
                      {n.text}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label={`Action items for ${title}`}>
                <h4>Action items</h4>
                <ul>
                  {d.actionItems.map((a) => (
                    <li key={a.note.id} data-testid={`close-action-${a.note.id}`}>
                      <span>{a.note.text}</span>{' '}
                      <em>
                        {a.owner === null
                          ? 'unassigned'
                          : `owned by ${a.owner.name}`}
                      </em>
                    </li>
                  ))}
                </ul>
              </section>
            </li>
          );
        })}
      </ol>
      <div role="group" aria-label="Close actions" className="close-actions">
        {onExport !== undefined && (
          <button
            type="button"
            className="primary"
            aria-label="Export retro as JSON"
            onClick={onExport}
          >
            Export JSON
          </button>
        )}
        {onReturnToDashboard !== undefined && (
          <button
            type="button"
            className="primary"
            onClick={onReturnToDashboard}
          >
            Return to Dashboard
          </button>
        )}
        {onBackToDashboard !== undefined && (
          <button
            type="button"
            className="secondary"
            onClick={onBackToDashboard}
          >
            Back to Dashboard
          </button>
        )}
      </div>
    </section>
  );
}
