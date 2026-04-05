import type { Card } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { CloseSummary, RetroType } from '../../domain/retro/Retro';
import type { DiscussItem } from '../../domain/retro/DiscussItem';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';

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
  cards?: readonly Card[];
  groups?: readonly Group[];
  templateId?: string;
  retroType?: RetroType;
  discussItems?: readonly DiscussItem[];
  onExport?: () => void;
  onReturnToDashboard?: () => void;
  onBackToDashboard?: () => void;
}

export function ClosePage({
  summary,
  stats,
  cards = [],
  groups = [],
  templateId,
  retroType = 'retro',
  discussItems = [],
  onExport,
  onReturnToDashboard,
  onBackToDashboard,
}: ClosePageProps): JSX.Element {
  const isCheck = retroType === 'check';
  const template = getTemplate(templateId ?? 'start-stop');

  return (
    <section aria-label="Close">
      <h2>{isCheck ? 'Check complete' : 'Retro complete'}</h2>

      {stats !== undefined && !isCheck && (
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

      {isCheck && stats !== undefined && (
        <div className="close-stats">
          <div className="close-stat">
            <span className="close-stat-icon">{'\u2726'}</span>
            <span className="close-stat-value">{String(discussItems.length)} questions rated</span>
            <span className="close-stat-sub">by {String(stats.participants)} participants</span>
          </div>
          <div className="close-stat">
            <span className="close-stat-icon">{'\u2713'}</span>
            <span className="close-stat-value">{stats.actions > 0 ? `${String(stats.actions)} actions` : 'No new actions'}</span>
            <span className="close-stat-sub">from this check</span>
          </div>
        </div>
      )}

      {isCheck && discussItems.length > 0 && (
        <section className="close-board" aria-label="Check results">
          <h3 className="close-board-title">Survey results</h3>
          <div className="close-check-results">
            {discussItems.map((item) => (
              <div key={item.id} className="close-check-question">
                <span className="close-check-score">
                  {item.score === 0 ? '\u2014' : item.score.toFixed(1)}
                </span>
                <div className="close-check-content">
                  <span className="close-check-title">{item.title}</span>
                  <span className="close-check-description">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isCheck && cards.length > 0 && (
        <section className="close-board">
          <h3 className="close-board-title">Board overview</h3>
          <div className="columns">
            {template.columns.map((col) => {
              const colCards = cards.filter((c) => c.columnId === col.id);
              const colGroups = groups.filter((g) => g.columnId === col.id);
              const groupedIds = new Set(colGroups.flatMap((g) => g.cardIds));
              const ungrouped = colCards.filter((c) => !groupedIds.has(c.id));
              return (
                <section
                  key={col.id}
                  className="brainstorm-column"
                  style={{ '--col-color': col.color } as React.CSSProperties}
                >
                  <h3>{col.title}</h3>
                  <p className="column-desc">{col.description}</p>
                  {ungrouped.map((c) => (
                    <div key={c.id} className="brainstorm-card">
                      <span className="brainstorm-card-text">{c.text}</span>
                    </div>
                  ))}
                  {colGroups.map((g) => {
                    const gCards = g.cardIds
                      .map((cid) => cards.find((cc) => cc.id === cid))
                      .filter((cc): cc is Card => cc !== undefined);
                    return (
                      <div key={g.id} className="brainstorm-group">
                        <div className="brainstorm-group-header">
                          <span className="brainstorm-group-name">{g.name || 'Group'}</span>
                        </div>
                        <ul className="brainstorm-group-cards">
                          {gCards.map((c) => (
                            <li key={c.id} className="brainstorm-card">
                              <span className="brainstorm-card-text">{c.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </section>
      )}

      {summary.allActionItems.length > 0 && (
        <section className="close-board" aria-label="Close summary">
          <h3 className="close-board-title">Action items from this {isCheck ? 'check' : 'retro'}</h3>
          <ul className="close-action-list">
            {summary.allActionItems.map((a) => (
              <li key={a.note.id} data-testid={`close-action-${a.note.id}`} className="close-action-item">
                <span className="close-action-check">{'\u2713'}</span>
                <div className="close-action-content">
                  <span className="close-action-text">{a.note.text}</span>
                  <span className="close-action-parent">{a.parentCard.text}</span>
                </div>
                <span className="close-action-owner">
                  {a.owner === null ? 'unassigned' : a.owner.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div role="group" aria-label="Close actions" className="close-actions">
        {onExport !== undefined && (
          <button type="button" className="close-action-btn" aria-label="Export retro as JSON" onClick={onExport}>
            <span className="close-action-icon">{'\u2913'}</span>
            <span>Download</span>
          </button>
        )}
        {onReturnToDashboard !== undefined && (
          <button type="button" className="close-action-btn" onClick={onReturnToDashboard}>
            <span className="close-action-icon">{'\u2302'}</span>
            <span>Exit</span>
          </button>
        )}
        {onBackToDashboard !== undefined && (
          <button type="button" className="close-action-btn" onClick={onBackToDashboard}>
            <span className="close-action-icon">{'\u2190'}</span>
            <span>Back</span>
          </button>
        )}
      </div>
    </section>
  );
}
