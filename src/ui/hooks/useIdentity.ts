import { useState, useCallback } from 'react';

export interface UseIdentity {
  participantId: string | null;
  setParticipantId: (id: string) => void;
  clear: () => void;
}

export function useIdentity(): UseIdentity {
  const [participantId, setId] = useState<string | null>(null);

  const setParticipantId = useCallback((id: string) => {
    setId(id);
  }, []);

  const clear = useCallback(() => {
    setId(null);
  }, []);

  return { participantId, setParticipantId, clear };
}
