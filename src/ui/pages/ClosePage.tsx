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
            <span className="close-stat-icon">{'\u2726'}</span>
            <span className="close-stat-value">{String(stats.ideas)} ideas added</span>
            <span className="close-stat-sub">by {String(stats.participants)} participants</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">{'\u2630'}</span>
            <span className="close-stat-value">{stats.votes > 0 ? `${String(stats.votes)} votes cast` : 'No votes cast'}</span>
            <span className="close-stat-sub">for {String(stats.groups)} groups</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">{'\u2713'}</span>
            <span className="close-stat-value">{stats.actions > 0 ? `${String(stats.actions)} actions` : 'No new actions'}</span>
            <span className="close-stat-sub">from this retro</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">{'\u2687'}</span>
            <span className="close-stat-value">100% participation</span>
            <span className="close-stat-sub">{String(stats.participants)}/{String(stats.participants)} invited participants</span>
          </div>
        </div>
      )}

      <div aria-label="Close summary" className="close-discussed">
        {summary.discussed.map((d) => {
          const id = itemId(d);
          const title = itemTitle(d);
          const votes = itemVotes(d);
          const hasContent = d.contextNotes.length > 0 || d.actionItems.length > 0;
          return (
            <div key={id} data-testid={`close-card-${id}`} className="close-topic">
              <div className="close-topic-header">
                <h3 className="close-topic-title">{title}</h3>
                <span className="close-topic-votes" data-testid={`close-card-votes-${id}`}>
                  {String(votes)} votes
                </span>
              </div>
              {hasContent && (
                <div className="close-topic-body">
                  {d.contextNotes.length > 0 && (
                    <section aria-label={`Context notes for ${title}`} className="close-topic-lane">
                      <h4 className="close-topic-lane-title">Context</h4>
                      {d.contextNotes.map((n) => (
                        <div key={n.id} data-testid={`close-context-${n.id}`} className="close-topic-note close-note-context">
                          {n.text}
                        </div>
                      ))}
                    </section>
                  )}
                  {d.actionItems.length > 0 && (
                    <section aria-label={`Action items for ${title}`} className="close-topic-lane">
                      <h4 className="close-topic-lane-title">Actions</h4>
                      {d.actionItems.map((a) => (
                        <div key={a.note.id} data-testid={`close-action-${a.note.id}`} className="close-topic-note close-note-action">
                          <span>{a.note.text}</span>
                          <span className="close-topic-owner">
                            {a.owner === null ? 'unassigned' : a.owner.name}
                          </span>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
