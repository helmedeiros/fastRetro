import type { CloseSummary } from '../../domain/retro/Retro';

export interface ClosePageProps {
  summary: CloseSummary;
  onExport: () => void;
}

export function ClosePage({ summary, onExport }: ClosePageProps): JSX.Element {
  return (
    <section aria-label="Close">
      <h2>Retro complete</h2>
      <ol aria-label="Close summary">
        {summary.discussed.map((d) => (
          <li key={d.card.id} data-testid={`close-card-${d.card.id}`}>
            <h3>
              {d.card.text}{' '}
              <small data-testid={`close-card-votes-${d.card.id}`}>
                ({String(d.card.votes)} votes)
              </small>
            </h3>
            <section aria-label={`Context notes for ${d.card.text}`}>
              <h4>Context</h4>
              <ul>
                {d.contextNotes.map((n) => (
                  <li key={n.id} data-testid={`close-context-${n.id}`}>
                    {n.text}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label={`Action items for ${d.card.text}`}>
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
        ))}
      </ol>
      <button
        type="button"
        aria-label="Export retro as JSON"
        onClick={onExport}
      >
        Export JSON
      </button>
    </section>
  );
}
