import type {
  CloseSummary,
  CloseSummaryDiscussedItem,
} from '../../domain/retro/Retro';

export interface ClosePageProps {
  summary: CloseSummary;
  onExport: () => void;
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

export function ClosePage({ summary, onExport }: ClosePageProps): JSX.Element {
  return (
    <section aria-label="Close">
      <h2>Retro complete</h2>
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
      <button
        type="button"
        className="primary"
        aria-label="Export retro as JSON"
        onClick={onExport}
      >
        Export JSON
      </button>
    </section>
  );
}
