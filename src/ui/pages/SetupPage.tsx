import { FormEvent, useState } from 'react';
import type { Participant } from '../../domain/retro/Participant';

export interface SetupPageProps {
  participants: readonly Participant[];
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onStartRetro: () => void;
}

export function SetupPage({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onStartRetro,
}: SetupPageProps): JSX.Element {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    try {
      onAddParticipant(name);
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const canStart = participants.length >= 1;

  return (
    <section>
      <h2>Setup</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="participant-name">Participant name</label>
        <input
          id="participant-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error !== null && <p role="alert">{error}</p>}
      <ul aria-label="Participants">
        {participants.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <button
              type="button"
              aria-label={`Remove ${p.name}`}
              onClick={() => onRemoveParticipant(p.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onStartRetro} disabled={!canStart}>
        Start retro
      </button>
    </section>
  );
}
