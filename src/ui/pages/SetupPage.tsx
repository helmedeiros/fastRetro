import { FormEvent, useState } from 'react';
import type { RetroRepository } from '../../domain/ports/RetroRepository';
import { useRetro } from '../hooks/useRetro';

export interface SetupPageProps {
  repository: RetroRepository;
}

export function SetupPage({ repository }: SetupPageProps): JSX.Element {
  const { participants, addParticipant, removeParticipant } =
    useRetro(repository);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    try {
      addParticipant(name);
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

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
              onClick={() => removeParticipant(p.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
