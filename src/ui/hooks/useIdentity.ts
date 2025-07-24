import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fastretro:identity';

interface PersistedIdentity {
  roomCode: string;
  participantId: string;
}

export interface UseIdentity {
  participantId: string | null;
  setParticipantId: (id: string, roomCode: string) => void;
  clear: () => void;
}

function loadPersistedId(roomCode: string | null): string | null {
  if (roomCode === null) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as PersistedIdentity;
    return parsed.roomCode === roomCode ? parsed.participantId : null;
  } catch {
    return null;
  }
}

function persistId(roomCode: string, id: string): void {
  try {
    const data: PersistedIdentity = { roomCode, participantId: id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
}

function clearPersistedId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

/** Extract room code from the URL hash before it gets cleared. */
function roomCodeFromHash(): string | null {
  const match = /^#room=([A-Z0-9-]+)$/i.exec(window.location.hash);
  return match !== null ? match[1] : null;
}

export function useIdentity(): UseIdentity {
  const [participantId, setId] = useState<string | null>(() =>
    loadPersistedId(roomCodeFromHash()),
  );

  const setParticipantId = useCallback((id: string, roomCode: string) => {
    setId(id);
    persistId(roomCode, id);
  }, []);

  const clear = useCallback(() => {
    setId(null);
    clearPersistedId();
  }, []);

  return { participantId, setParticipantId, clear };
}
