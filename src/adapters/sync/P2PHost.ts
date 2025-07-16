import type { RetroState, RetroStage } from '../../domain/retro/Retro';

export interface StageVoteEvent {
  stage: RetroStage;
  participantId: string;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  participantId: string | null;
}

export class P2PHost {
  private peers: Map<string, PeerConnection> = new Map();
  private stageVotes: Map<string, Set<string>> = new Map();
  private onVoteStageCallback: ((event: StageVoteEvent) => void) | null = null;
  private onPeerCountChangeCallback: ((count: number) => void) | null = null;
  private nextPeerId = 0;

  async createOffer(): Promise<{ peerId: string; offerCode: string }> {
    const peerId = `peer-${String(++this.nextPeerId)}`;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const dc = pc.createDataChannel('retro-sync');
    const peer: PeerConnection = { pc, dc, participantId: null };

    dc.onmessage = (e): void => {
      this.handleMessage(peerId, e.data);
    };

    dc.onopen = (): void => {
      this.onPeerCountChangeCallback?.(this.getConnectedPeerCount());
    };

    dc.onclose = (): void => {
      this.peers.delete(peerId);
      this.onPeerCountChangeCallback?.(this.getConnectedPeerCount());
    };

    this.peers.set(peerId, peer);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      pc.onicegatheringstatechange = (): void => {
        if (pc.iceGatheringState === 'complete') resolve();
      };
    });

    const sdp = pc.localDescription;
    if (sdp === null) throw new Error('Failed to create offer');
    return { peerId, offerCode: btoa(JSON.stringify(sdp)) };
  }

  async acceptAnswer(peerId: string, answerCode: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer === undefined) throw new Error('Unknown peer');
    const answer = JSON.parse(atob(answerCode)) as RTCSessionDescriptionInit;
    await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  broadcast(state: RetroState): void {
    const msg = JSON.stringify({ type: 'state', state });
    for (const peer of this.peers.values()) {
      if (peer.dc !== null && peer.dc.readyState === 'open') {
        peer.dc.send(msg);
      }
    }
  }

  onVoteStage(cb: (event: StageVoteEvent) => void): void {
    this.onVoteStageCallback = cb;
  }

  onPeerCountChange(cb: (count: number) => void): void {
    this.onPeerCountChangeCallback = cb;
  }

  getVotesForStage(stage: RetroStage): number {
    return this.stageVotes.get(stage)?.size ?? 0;
  }

  resetVotes(): void {
    this.stageVotes.clear();
  }

  getConnectedPeerCount(): number {
    let count = 0;
    for (const peer of this.peers.values()) {
      if (peer.dc !== null && peer.dc.readyState === 'open') count++;
    }
    return count;
  }

  close(): void {
    for (const peer of this.peers.values()) {
      peer.dc?.close();
      peer.pc.close();
    }
    this.peers.clear();
  }

  private handleMessage(_peerId: string, raw: string): void {
    const msg = JSON.parse(raw) as { type: string; stage?: string; participantId?: string };
    if (msg.type === 'vote-stage' && msg.stage !== undefined && msg.participantId !== undefined) {
      const stage = msg.stage as RetroStage;
      if (!this.stageVotes.has(stage)) {
        this.stageVotes.set(stage, new Set());
      }
      this.stageVotes.get(stage)!.add(msg.participantId);
      this.onVoteStageCallback?.({ stage, participantId: msg.participantId });
    }
  }
}
