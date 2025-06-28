import { useState } from 'react';
import type { RetroMeta } from '../../domain/retro/Retro';
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from '../../domain/retro/FacilitationTemplate';

export interface RetroSetupPageProps {
  onStart: (meta: RetroMeta) => void;
  onCancel: () => void;
}

const DEFAULT_CONTEXT =
  '"Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand."\n—Norm Kerth, Project Retrospectives';

export function RetroSetupPage({
  onStart,
  onCancel,
}: RetroSetupPageProps): JSX.Element {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);

  const canStart = name.trim().length > 0;

  return (
    <section aria-label="Retro Setup" className="retro-setup">
      <h2>New Retrospective</h2>

      <div className="retro-setup-row">
        <div className="retro-setup-name">
          <label htmlFor="retro-name">Name</label>
          <input
            id="retro-name"
            type="text"
            value={name}
            onChange={(e): void => { setName(e.target.value); }}
            placeholder="e.g. Sprint 14 Retro"
          />
        </div>
        <div className="retro-setup-date">
          <label htmlFor="retro-date">Date</label>
          <input
            id="retro-date"
            type="date"
            value={date}
            onChange={(e): void => { setDate(e.target.value); }}
          />
        </div>
      </div>

      <div className="retro-setup-context">
        <label htmlFor="retro-context">Context</label>
        <textarea
          id="retro-context"
          rows={4}
          value={context}
          onChange={(e): void => { setContext(e.target.value); }}
          placeholder="Set the stage for this retrospective..."
        />
      </div>

      <fieldset className="template-selector">
        <legend>Facilitation Design</legend>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`template-card${t.id === templateId ? ' template-selected' : ''}`}
              onClick={(): void => { setTemplateId(t.id); }}
              aria-pressed={t.id === templateId}
            >
              <span className="template-name">{t.name}</span>
              <span className="template-columns">
                {t.columns.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ' \u00B7 '}
                    <span style={{ color: c.color }}>{c.title}</span>
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="retro-setup-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="primary"
          disabled={!canStart}
          onClick={(): void => {
            onStart({
              name: name.trim(),
              date,
              context: context.trim(),
              templateId,
            });
          }}
        >
          Start Retrospective
        </button>
      </div>
    </section>
  );
}
