import { useCallback, useMemo, useState } from 'react';
import { InMemoryRetroRepository } from '../../adapters/storage/InMemoryRetroRepository';
import { CryptoIdGenerator } from '../../adapters/id/CryptoIdGenerator';
import { AddParticipant } from '../../application/usecases/AddParticipant';
import { RemoveParticipant } from '../../application/usecases/RemoveParticipant';
import type { Participant } from '../../domain/retro/Participant';

export interface UseRetro {
  participants: readonly Participant[];
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
}

export function useRetro(): UseRetro {
  const services = useMemo(() => {
    const repo = new InMemoryRetroRepository();
    const ids = new CryptoIdGenerator();
    return {
      repo,
      add: new AddParticipant(repo, ids),
      remove: new RemoveParticipant(repo),
    };
  }, []);

  const [participants, setParticipants] = useState<readonly Participant[]>(
    () => services.repo.load().participants,
  );

  const addParticipant = useCallback(
    (name: string) => {
      services.add.execute(name);
      setParticipants(services.repo.load().participants);
    },
    [services],
  );

  const removeParticipant = useCallback(
    (id: string) => {
      services.remove.execute(id);
      setParticipants(services.repo.load().participants);
    },
    [services],
  );

  return { participants, addParticipant, removeParticipant };
}
