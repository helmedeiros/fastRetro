import { useState, useCallback, useRef, useEffect } from 'react';
import type { RetroState, RetroStage } from '../../domain/retro/Retro';
import { P2PHost } from '../../adapters/sync/P2PHost';
import { P2PPeer } from '../../adapters/sync/P2PPeer';

export type SyncRole = 'none' | 'host' | 'peer';
export type SyncStatus = 'disconnected' | 'waiting' | 'connected';

export interface PendingOffer {
  peerId: string;
  offerCode: string;
}

export interface UseP2PSync {
  role: SyncRole;
  status: SyncStatus;
  peerCount: number;
  pendingOffer: PendingOffer | null;
  stageVotes: Map<string, number>;
  startHosting: () => Promise<PendingOffer>;
  createNewOffer: () => Promise<PendingOffer>;
  acceptAnswer: (peerId: string, answerCode: string) => Promise<void>;
  joinAsGuest: (offerCode: string) => Promise<string>;
  broadcastState: (state: RetroState) => void;
  voteForStage: (stage: RetroStage, participantId: string) => void;
  onRemoteState: (cb: (state: RetroState) => void) => void;
  onStageVote: (cb: (stage: RetroStage, participantId: string, totalParticipants: number) => void) => void;
  disconnect: () => void;
}

export function useP2PSync(): UseP2PSync {
  const [role, setRole] = useState<SyncRole>('none');
  const [status, setStatus] = useState<SyncStatus>('disconnected');
  const [peerCount, setPeerCount] = useState(0);
  const [pendingOffer, setPendingOffer] = useState<PendingOffer | null>(null);
  const [stageVotes, setStageVotes] = useState<Map<string, number>>(new Map());

  const hostRef = useRef<P2PHost | null>(null);
  const peerRef = useRef<P2PPeer | null>(null);
  const remoteStateCbRef = useRef<((state: RetroState) => void) | null>(null);
  const stageVoteCbRef = useRef<((stage: RetroStage, pid: string, total: number) => void) | null>(null);

  useEffect(() => {
    return () => {
      hostRef.current?.close();
      peerRef.current?.close();
    };
  }, []);

  const startHosting = useCallback(async (): Promise<PendingOffer> => {
    const host = new P2PHost();
    hostRef.current = host;
    setRole('host');
    setStatus('waiting');

    host.onPeerCountChange((count) => {
      setPeerCount(count);
      if (count > 0) setStatus('connected');
    });

    host.onVoteStage(({ stage, participantId }) => {
      const votes = host.getVotesForStage(stage);
      setStageVotes((prev) => {
        const next = new Map(prev);
        next.set(stage, votes);
        return next;
      });
      stageVoteCbRef.current?.(stage, participantId, host.getConnectedPeerCount() + 1);
    });

    const offer = await host.createOffer();
    setPendingOffer(offer);
    return offer;
  }, []);

  const createNewOffer = useCallback(async (): Promise<PendingOffer> => {
    const host = hostRef.current;
    if (host === null) throw new Error('Not hosting');
    const offer = await host.createOffer();
    setPendingOffer(offer);
    return offer;
  }, []);

  const acceptAnswer = useCallback(async (peerId: string, answerCode: string): Promise<void> => {
    const host = hostRef.current;
    if (host === null) throw new Error('Not hosting');
    await host.acceptAnswer(peerId, answerCode);
  }, []);

  const joinAsGuest = useCallback(async (offerCode: string): Promise<string> => {
    const p = new P2PPeer();
    peerRef.current = p;
    setRole('peer');
    setStatus('waiting');

    p.onStateUpdate((state) => {
      remoteStateCbRef.current?.(state);
    });

    p.onConnected(() => {
      setStatus('connected');
    });

    p.onDisconnected(() => {
      setStatus('disconnected');
    });

    const answerCode = await p.joinWithOffer(offerCode);
    return answerCode;
  }, []);

  const broadcastState = useCallback((state: RetroState): void => {
    hostRef.current?.broadcast(state);
  }, []);

  const voteForStage = useCallback((stage: RetroStage, participantId: string): void => {
    peerRef.current?.sendVoteStage(stage, participantId);
  }, []);

  const onRemoteState = useCallback((cb: (state: RetroState) => void): void => {
    remoteStateCbRef.current = cb;
  }, []);

  const onStageVote = useCallback((cb: (stage: RetroStage, pid: string, total: number) => void): void => {
    stageVoteCbRef.current = cb;
  }, []);

  const disconnect = useCallback((): void => {
    hostRef.current?.close();
    hostRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    setRole('none');
    setStatus('disconnected');
    setPeerCount(0);
    setPendingOffer(null);
    setStageVotes(new Map());
  }, []);

  return {
    role, status, peerCount, pendingOffer, stageVotes,
    startHosting, createNewOffer, acceptAnswer, joinAsGuest,
    broadcastState, voteForStage, onRemoteState, onStageVote,
    disconnect,
  };
}
