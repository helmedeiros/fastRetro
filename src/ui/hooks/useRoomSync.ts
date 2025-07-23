import { useState, useCallback, useRef } from 'react';
import type { RetroState, RetroStage } from '../../domain/retro/Retro';
import { RoomSync } from '../../adapters/sync/RoomSync';
import type { SyncTeamInfo } from '../../adapters/sync/RoomSync';

export type RoomRole = 'none' | 'host' | 'guest';
export type RoomStatus = 'disconnected' | 'connected';

export interface UseRoomSync {
  role: RoomRole;
  status: RoomStatus;
  roomCode: string | null;
  shareUrl: string | null;
  peerCount: number;
  takenIds: Set<string>;
  stageVotes: Map<string, Set<string>>;
  hostRoom: () => void;
  joinRoom: (code: string) => void;
  claimIdentity: (participantId: string) => void;
  broadcastState: (state: RetroState) => void;
  voteForStage: (stage: RetroStage, participantId: string) => void;
  onRemoteState: (cb: (state: RetroState) => void) => void;
  onStageVote: (cb: (stage: RetroStage, participantId: string) => void) => void;
  onNavigateStage: (cb: (stage: RetroStage) => void) => void;
  onRequestState: (cb: () => void) => void;
  onConnected: (cb: () => void) => void;
  broadcastTeamInfo: (info: SyncTeamInfo) => void;
  onTeamInfo: (cb: (info: SyncTeamInfo) => void) => void;
  disconnect: () => void;
}

export function useRoomSync(): UseRoomSync {
  const [role, setRole] = useState<RoomRole>('none');
  const [status, setStatus] = useState<RoomStatus>('disconnected');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [stageVotes, setStageVotes] = useState<Map<string, Set<string>>>(new Map());

  const syncRef = useRef<RoomSync | null>(null);
  const remoteStateCbRef = useRef<((state: RetroState) => void) | null>(null);
  const bufferedStateRef = useRef<RetroState | null>(null);
  const stageVoteCbRef = useRef<((stage: RetroStage, pid: string) => void) | null>(null);
  const navigateStageCbRef = useRef<((stage: RetroStage) => void) | null>(null);
  const requestStateCbRef = useRef<(() => void) | null>(null);
  const connectedCbRef = useRef<(() => void) | null>(null);
  const teamInfoCbRef = useRef<((info: SyncTeamInfo) => void) | null>(null);

  // WebSocket closes automatically on page unload.
  // Manual disconnect via the disconnect() callback.
  // No cleanup effect here — React StrictMode double-mounts would kill the connection.

  const setupCallbacks = useCallback((sync: RoomSync) => {
    sync.onState((state) => {
      if (remoteStateCbRef.current !== null) {
        remoteStateCbRef.current(state);
      } else {
        bufferedStateRef.current = state;
      }
    });
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
    sync.onNavigateStage((stage) => { navigateStageCbRef.current?.(stage); });
    sync.onPeerCount((count) => { setPeerCount(count); });
    sync.onTakenIds((ids) => { setTakenIds(new Set(ids)); });
    sync.onRequestState(() => { requestStateCbRef.current?.(); });
    sync.onConnected(() => { connectedCbRef.current?.(); });
    sync.onTeamInfo((info) => { teamInfoCbRef.current?.(info); });
  }, []);

  const connectSync = useCallback((sync: RoomSync) => {
    syncRef.current = sync;
    setupCallbacks(sync);
    sync.connect();
    setStatus('connected');
    setRoomCode(sync.roomCode);
    setShareUrl(sync.getShareUrl());
  }, [setupCallbacks]);

  const hostRoom = useCallback(() => {
    RoomSync.createRoom().then((code) => {
      const sync = new RoomSync(code);
      setRole('host');
      connectSync(sync);
    }).catch(() => {
      // Fallback: create locally
      const sync = new RoomSync();
      setRole('host');
      connectSync(sync);
    });
  }, [connectSync]);

  const joinRoom = useCallback((code: string) => {
    const sync = new RoomSync(code);
    setRole('guest');
    connectSync(sync);
  }, [connectSync]);

  const claimIdentity = useCallback((participantId: string) => {
    syncRef.current?.sendClaimIdentity(participantId);
    setTakenIds((prev) => new Set([...prev, participantId]));
  }, []);

  const broadcastState = useCallback((state: RetroState) => {
    syncRef.current?.broadcastState(state);
  }, []);

  const voteForStage = useCallback((stage: RetroStage, pid: string) => {
    syncRef.current?.sendVoteStage(stage, pid);
  }, []);

  const onRemoteState = useCallback((cb: (state: RetroState) => void) => {
    remoteStateCbRef.current = cb;
    // Replay buffered state that arrived before callback was registered
    if (bufferedStateRef.current !== null) {
      const buffered = bufferedStateRef.current;
      bufferedStateRef.current = null;
      cb(buffered);
    }
  }, []);

  const onStageVote = useCallback((cb: (stage: RetroStage, pid: string) => void) => {
    stageVoteCbRef.current = cb;
  }, []);

  const onNavigateStage = useCallback((cb: (stage: RetroStage) => void) => {
    navigateStageCbRef.current = cb;
  }, []);

  const onRequestState = useCallback((cb: () => void) => {
    requestStateCbRef.current = cb;
  }, []);

  const onConnected = useCallback((cb: () => void) => {
    connectedCbRef.current = cb;
  }, []);

  const broadcastTeamInfo = useCallback((info: SyncTeamInfo) => {
    syncRef.current?.broadcastTeamInfo(info);
  }, []);

  const onTeamInfo = useCallback((cb: (info: SyncTeamInfo) => void) => {
    teamInfoCbRef.current = cb;
  }, []);

  const disconnect = useCallback(() => {
    syncRef.current?.disconnect();
    syncRef.current = null;
    setRole('none');
    setStatus('disconnected');
    setRoomCode(null);
    setShareUrl(null);
    setPeerCount(0);
    setTakenIds(new Set());
    setStageVotes(new Map());
  }, []);

  return {
    role, status, roomCode, shareUrl, peerCount, takenIds, stageVotes,
    hostRoom, joinRoom, claimIdentity, broadcastState, voteForStage,
    onRemoteState, onStageVote, onNavigateStage, onRequestState, onConnected,
    broadcastTeamInfo, onTeamInfo, disconnect,
  };
}
