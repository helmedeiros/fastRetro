import { useState, useCallback, useRef, useEffect } from 'react';
import type { RetroState, RetroStage } from '../../domain/retro/Retro';
import { RoomSync } from '../../adapters/sync/RoomSync';

export type RoomRole = 'none' | 'host' | 'guest';
export type RoomStatus = 'disconnected' | 'connected';

export interface UseRoomSync {
  role: RoomRole;
  status: RoomStatus;
  roomCode: string | null;
  shareUrl: string | null;
  stageVotes: Map<string, Set<string>>;
  hostRoom: () => void;
  joinRoom: (code: string) => void;
  broadcastState: (state: RetroState) => void;
  voteForStage: (stage: RetroStage, participantId: string) => void;
  onRemoteState: (cb: (state: RetroState) => void) => void;
  onStageVote: (cb: (stage: RetroStage, participantId: string) => void) => void;
  onRequestState: (cb: () => void) => void;
  disconnect: () => void;
}

export function useRoomSync(): UseRoomSync {
  const [role, setRole] = useState<RoomRole>('none');
  const [status, setStatus] = useState<RoomStatus>('disconnected');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [stageVotes, setStageVotes] = useState<Map<string, Set<string>>>(new Map());

  const syncRef = useRef<RoomSync | null>(null);
  const remoteStateCbRef = useRef<((state: RetroState) => void) | null>(null);
  const stageVoteCbRef = useRef<((stage: RetroStage, pid: string) => void) | null>(null);
  const requestStateCbRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { syncRef.current?.disconnect(); };
  }, []);

  const setupCallbacks = useCallback((sync: RoomSync) => {
    sync.onState((state) => { remoteStateCbRef.current?.(state); });
    sync.onVoteStage((stage, pid) => {
      setStageVotes((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(stage) ?? []);
        set.add(pid);
        next.set(stage, set);
        return next;
      });
      stageVoteCbRef.current?.(stage, pid);
    });
    sync.onRequestState(() => { requestStateCbRef.current?.(); });
  }, []);

  const hostRoom = useCallback(() => {
    const sync = new RoomSync();
    syncRef.current = sync;
    setupCallbacks(sync);
    sync.connect();
    setRole('host');
    setStatus('connected');
    setRoomCode(sync.roomCode);
    setShareUrl(sync.getShareUrl());
  }, [setupCallbacks]);

  const joinRoom = useCallback((code: string) => {
    const sync = new RoomSync(code);
    syncRef.current = sync;
    setupCallbacks(sync);
    sync.connect();
    setRole('guest');
    setStatus('connected');
    setRoomCode(code);
    setShareUrl(sync.getShareUrl());
  }, [setupCallbacks]);

  const broadcastState = useCallback((state: RetroState) => {
    syncRef.current?.broadcastState(state);
  }, []);

  const voteForStage = useCallback((stage: RetroStage, pid: string) => {
    syncRef.current?.sendVoteStage(stage, pid);
  }, []);

  const onRemoteState = useCallback((cb: (state: RetroState) => void) => {
    remoteStateCbRef.current = cb;
  }, []);

  const onStageVote = useCallback((cb: (stage: RetroStage, pid: string) => void) => {
    stageVoteCbRef.current = cb;
  }, []);

  const onRequestState = useCallback((cb: () => void) => {
    requestStateCbRef.current = cb;
  }, []);

  const disconnect = useCallback(() => {
    syncRef.current?.disconnect();
    syncRef.current = null;
    setRole('none');
    setStatus('disconnected');
    setRoomCode(null);
    setShareUrl(null);
    setStageVotes(new Map());
  }, []);

  return {
    role, status, roomCode, shareUrl, stageVotes,
    hostRoom, joinRoom, broadcastState, voteForStage,
    onRemoteState, onStageVote, onRequestState, disconnect,
  };
}
