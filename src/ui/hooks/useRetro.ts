import { useCallback, useMemo, useState } from 'react';
import { CryptoIdGenerator } from '../../adapters/id/CryptoIdGenerator';
import { AddParticipant } from '../../application/usecases/AddParticipant';
import { RemoveParticipant } from '../../application/usecases/RemoveParticipant';
import type { RetroRepository } from '../../domain/ports/RetroRepository';
import type { Participant } from '../../domain/retro/Participant';

export interface UseRetro {
  participants: readonly Participant[];
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
}

export function useRetro(repository: RetroRepository): UseRetro {
  const services = useMemo(() => {
    const ids = new CryptoIdGenerator();
    return {
      repo: repository,
      add: new AddParticipant(repository, ids),
      remove: new RemoveParticipant(repository),
    };
  }, [repository]);

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
