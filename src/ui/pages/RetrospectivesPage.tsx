import { useState, useCallback } from 'react';
import type { RetroHistoryState, CompletedRetro } from '../../domain/team/RetroHistory';
import type { RetroState, RetroType } from '../../domain/retro/Retro';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { CHECK_TEMPLATES, getCheckTemplate } from '../../domain/retro/CheckTemplate';
import type { CheckTemplate } from '../../domain/retro/CheckTemplate';
import { medianForQuestion } from '../../domain/retro/DiscussItem';
import { RadarChart } from '../components/RadarChart';

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

function scoreColor(score: number, maxLevel: number): string {
  if (score === 0) return 'transparent';
  const ratio = score / maxLevel;
  if (ratio >= 0.8) return 'rgba(110, 199, 110, 0.5)';
  if (ratio >= 0.6) return 'rgba(180, 200, 80, 0.4)';
  if (ratio >= 0.4) return 'rgba(212, 168, 78, 0.4)';
  return 'rgba(224, 96, 96, 0.35)';
}

function RadarCarousel({
  sessions,
  template,
  maxLevel,
  onViewSession,
}: {
  sessions: CompletedRetro[];
  template: CheckTemplate;
  maxLevel: number;
  onViewSession: (id: string) => void;
}): JSX.Element {
  // Start at last (most recent) session — sessions are already newest-first
  const [index, setIndex] = useState(0);

  const goLeft = useCallback(() => {
    setIndex((i) => Math.min(i + 1, sessions.length - 1));
  }, [sessions.length]);
  const goRight = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  if (sessions.length === 0) return <></>;

  const s = sessions[index];
  const sessionName = s.fullState.meta?.name || s.id;
  const sessionDate = s.fullState.meta?.date
    ? new Date(s.fullState.meta.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const values = template.questions.map((q) =>
    medianForQuestion(s.fullState.surveyResponses ?? [], q.id),
  );

  const canGoLeft = index < sessions.length - 1;
  const canGoRight = index > 0;

  return (
    <div className="check-radar-single">
      <button
        type="button"
        className={`check-radar-arrow check-radar-arrow-left${canGoLeft ? '' : ' disabled'}`}
        onClick={goLeft}
        disabled={!canGoLeft}
        aria-label="Previous session"
      >
        &#8592;
      </button>
      <RadarChart
        labels={template.questions.map((q) => q.title)}
        values={values}
        maxValue={maxLevel}
        name={sessionName}
        date={sessionDate}
        size={340}
        onClick={(): void => { onViewSession(s.id); }}
      />
      <button
        type="button"
        className={`check-radar-arrow check-radar-arrow-right${canGoRight ? '' : ' disabled'}`}
        onClick={goRight}
        disabled={!canGoRight}
        aria-label="Next session"
      >
        &#8594;
      </button>
    </div>
  );
}

function CheckComparisonView({
  template,
  sessions,
  activeRetro,
  activeRetroStage,
  membersCount,
  onStartRetro,
  onResumeRetro,
  onViewCompletedRetro,
}: {
  template: CheckTemplate;
  sessions: CompletedRetro[];
  activeRetro: RetroState | null;
  activeRetroStage: string;
  membersCount: number;
  onStartRetro: () => void;
  onResumeRetro: () => void;
  onViewCompletedRetro: (retroId: string) => void;
}): JSX.Element {
  const hasActive =
    activeRetro !== null &&
    activeRetroStage !== 'setup' &&
    (activeRetro.meta.type ?? 'retro') === 'check' &&
    (activeRetro.meta.templateId ?? '') === template.id;

  const maxLevel = Math.max(...template.questions.flatMap((q) => q.options.map((o) => o.value)));

  return (
    <section aria-label="Check comparison">
      <div className="check-comparison-header">
        {hasActive && (
          <button type="button" className="check-resume-btn" onClick={onResumeRetro}>
            Resume: {activeRetro?.meta?.name || 'In Progress'}
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="check-empty">No completed {template.name} sessions yet.</p>
      ) : (
        <>
        <div className="check-comparison-table-wrap">
          <table className="check-comparison-table">
            <thead>
              <tr>
                <th className="check-question-header">Question</th>
                {sessions.map((s) => {
                  const name = s.fullState.meta?.name || s.id;
                  const date = s.fullState.meta?.date
                    ? new Date(s.fullState.meta.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '';
                  return (
                    <th key={s.id} className="check-session-header">
                      <button
                        type="button"
                        className="check-session-link"
                        onClick={(): void => { onViewCompletedRetro(s.id); }}
                      >
                        <span className="check-session-name">{name}</span>
                        {date && <span className="check-session-date">{date}</span>}
                        <span className="check-session-meta">
                          {s.fullState.participants.length} part. &middot; {s.actionItems.length} actions
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th className="check-start-header">
                  <button
                    type="button"
                    className="start-retro-card check-start-cell"
                    onClick={onStartRetro}
                    disabled={membersCount === 0}
                  >
                    <span className="plus">+</span>
                    <span className="label">Start {template.name}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {template.questions.map((q) => (
                <tr key={q.id}>
                  <td className="check-question-cell" title={q.description}>
                    {q.title}
                  </td>
                  {sessions.map((s) => {
                    const median = medianForQuestion(s.fullState.surveyResponses ?? [], q.id);
                    return (
                      <td
                        key={s.id}
                        className="check-score-cell"
                        style={{ backgroundColor: scoreColor(median, maxLevel) }}
                      >
                        {median === 0 ? '\u2014' : median.toFixed(1)}
                      </td>
                    );
                  })}
                  <td className="check-score-cell check-empty-cell" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <RadarCarousel
          sessions={sessions}
          template={template}
          maxLevel={maxLevel}
          onViewSession={onViewCompletedRetro}
        />
        </>
      )}
    </section>
  );
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

  const [selectedTemplateId, setSelectedTemplateId] = useState(CHECK_TEMPLATES[0]?.id ?? '');

  // Check comparison view
  if (isCheck) {
    const templateSessions = filteredHistory
      .filter((r) => (r.fullState.meta?.templateId ?? '') === selectedTemplateId)
      .reverse();
    const selectedTemplate = getCheckTemplate(selectedTemplateId);

    return (
      <section aria-label={labelPlural}>
        <div className="check-toolbar">
          <button
            type="button"
            className="start-retro-card check-toolbar-start"
            onClick={onStartRetro}
            disabled={membersCount === 0}
          >
            <span className="plus">+</span>
            <span className="label">Start Check</span>
          </button>
          <select
            className="check-template-filter"
            value={selectedTemplateId}
            onChange={(e): void => { setSelectedTemplateId(e.target.value); }}
            aria-label="Filter by template"
          >
            {CHECK_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <CheckComparisonView
          template={selectedTemplate}
          sessions={templateSessions}
          activeRetro={activeRetro}
          activeRetroStage={activeRetroStage}
          membersCount={membersCount}
          onStartRetro={onStartRetro}
          onResumeRetro={onResumeRetro}
          onViewCompletedRetro={onViewCompletedRetro}
        />
      </section>
    );
  }

  // Retro card view (unchanged)
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
