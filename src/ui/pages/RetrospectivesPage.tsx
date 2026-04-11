import type { RetroHistoryState } from '../../domain/team/RetroHistory';
import type { RetroState, RetroType } from '../../domain/retro/Retro';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { getCheckTemplate } from '../../domain/retro/CheckTemplate';

export interface RetrospectivesPageProps {
  filterType: RetroType;
  activeRetro: RetroState | null;
  activeRetroStage: string;
  history: RetroHistoryState;
  membersCount: number;
  onStartRetro: () => void;
  onResumeRetro: () => void;
  onViewCompletedRetro: (retroId: string) => void;
}

export function RetrospectivesPage({
  filterType,
  activeRetro,
  activeRetroStage,
  history,
  membersCount,
  onStartRetro,
  onResumeRetro,
  onViewCompletedRetro,
}: RetrospectivesPageProps): JSX.Element {
  const isCheck = filterType === 'check';
  const label = isCheck ? 'Check' : 'Retrospective';
  const labelPlural = isCheck ? 'Checks' : 'Retrospectives';

  const hasActive =
    activeRetro !== null &&
    activeRetroStage !== 'setup' &&
    (activeRetro.meta.type ?? 'retro') === filterType;

  const filteredHistory = history.completed.filter((r) => {
    const type = (r.fullState?.meta?.type ?? 'retro') as string;
    return type === filterType;
  });

  return (
    <section aria-label={labelPlural}>
      <section>
        <h2>{`Open ${labelPlural.toLowerCase()}`}</h2>
        <div className="retro-grid">
          <button
            type="button"
            className="start-retro-card"
            onClick={onStartRetro}
            disabled={membersCount === 0}
          >
            <span className="plus">+</span>
            <span className="label">{`Start ${label}`}</span>
          </button>

          {hasActive && (() => {
            if (isCheck) {
              const ct = getCheckTemplate(activeRetro?.meta?.templateId ?? 'health-check');
              return (
                <button
                  type="button"
                  className="retro-card"
                  onClick={onResumeRetro}
                >
                  <div className="retro-card-columns">
                    <span className="retro-col retro-col-check">{ct.name}</span>
                  </div>
                  <div className="retro-card-info">
                    <span className="retro-card-name">{activeRetro?.meta?.name || 'Current Check'}</span>
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
            }
            const t = getTemplate(activeRetro?.meta?.templateId ?? 'start-stop');
            return (
              <button
                type="button"
                className="retro-card"
                onClick={onResumeRetro}
              >
                <div className="retro-card-columns">
                  {t.columns.map((col) => (
                    <span key={col.id} className="retro-col" style={{ '--col-color': col.color } as React.CSSProperties}>{col.title}</span>
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

      {filteredHistory.length > 0 && (
        <section>
          <h2>{`Closed ${labelPlural.toLowerCase()}`}</h2>
          <div className="retro-grid">
            {filteredHistory.map((r) => {
              const rType = (r.fullState?.meta?.type ?? 'retro') as string;
              if (rType === 'check') {
                const ct = getCheckTemplate(r.fullState.meta?.templateId ?? 'health-check');
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="retro-card"
                    onClick={(): void => { onViewCompletedRetro(r.id); }}
                  >
                    <div className="retro-card-columns">
                      <span className="retro-col retro-col-check">{ct.name}</span>
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
                        {`${String(ct.questions.length)} questions`}
                        {' \u00B7 '}
                        {`${String(r.actionItems.length)} actions`}
                      </span>
                    </div>
                  </button>
                );
              }
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
                      <span key={col.id} className="retro-col" style={{ '--col-color': col.color } as React.CSSProperties}>{col.title}</span>
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
