import type { RetroHistoryState } from '../../domain/team/RetroHistory';
import type { RetroState } from '../../domain/retro/Retro';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';

export interface RetrospectivesPageProps {
  activeRetro: RetroState | null;
  activeRetroStage: string;
  history: RetroHistoryState;
  membersCount: number;
  onStartRetro: () => void;
  onResumeRetro: () => void;
  onViewCompletedRetro: (retroId: string) => void;
}

export function RetrospectivesPage({
  activeRetro,
  activeRetroStage,
  history,
  membersCount,
  onStartRetro,
  onResumeRetro,
  onViewCompletedRetro,
}: RetrospectivesPageProps): JSX.Element {
  const hasActive = activeRetro !== null && activeRetroStage !== 'setup';

  return (
    <section aria-label="Retrospectives">
      <section>
        <h2>Open retrospectives</h2>
        <div className="retro-grid">
          <button
            type="button"
            className="start-retro-card"
            onClick={onStartRetro}
            disabled={membersCount === 0}
          >
            <span className="plus">+</span>
            <span className="label">Start Retrospective</span>
          </button>

          {hasActive && (() => {
            const t = getTemplate(activeRetro?.meta?.templateId ?? 'start-stop');
            return (
            <button
              type="button"
              className="retro-card"
              onClick={onResumeRetro}
            >
              <div className="retro-card-columns">
                {t.columns.map((col) => (
                  <span key={col.id} className="retro-col">{col.title}</span>
                ))}
              </div>
              <div className="retro-card-info">
                <span className="retro-card-name">{activeRetro?.meta?.name || 'Current Retro'}</span>
                <span className="retro-card-meta">
                  {activeRetro?.meta?.date
                    ? new Date(activeRetro.meta.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
                    : activeRetroStage.toUpperCase()}
                  {' \u00B7 '}
                  <span className="retro-badge">IN PROGRESS</span>
                </span>
              </div>
            </button>
            );
          })()}
        </div>
      </section>

      {history.completed.length > 0 && (
        <section>
          <h2>Closed retrospectives</h2>
          <div className="retro-grid">
            {history.completed.map((r) => {
              const t = getTemplate(r.fullState.meta?.templateId ?? 'start-stop');
              const totalCards = r.fullState.cards.length;
              return (
                <button
                  key={r.id}
                  type="button"
                  className="retro-card"
                  onClick={(): void => { onViewCompletedRetro(r.id); }}
                >
                  <div className="retro-card-columns">
                    {t.columns.map((col) => (
                      <span key={col.id} className="retro-col">{col.title}</span>
                    ))}
                  </div>
                  <div className="retro-card-info">
                    <span className="retro-card-name">
                      {r.fullState.meta?.name || new Date(r.completedAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="retro-card-meta">
                      {r.fullState.meta?.date
                        ? new Date(r.fullState.meta.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
                        : new Date(r.completedAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' \u00B7 '}
                      {`${String(r.fullState.participants.length)} participants`}
                      {' \u00B7 '}
                      {`${String(totalCards)} cards`}
                      {' \u00B7 '}
                      {`${String(r.actionItems.length)} actions`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
