import type { RetroState, RetroStage } from '../../domain/retro/Retro';

export class P2PPeer {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private onStateUpdateCallback: ((state: RetroState) => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;

  async joinWithOffer(offerCode: string): Promise<string> {
    const offer = JSON.parse(atob(offerCode)) as RTCSessionDescriptionInit;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.pc = pc;

    pc.ondatachannel = (e): void => {
      this.dc = e.channel;
      e.channel.onmessage = (ev): void => {
        this.handleMessage(ev.data);
      };
      e.channel.onopen = (): void => {
        this.onConnectedCallback?.();
      };
      e.channel.onclose = (): void => {
        this.onDisconnectedCallback?.();
      };
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

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
    if (sdp === null) throw new Error('Failed to create answer');
    return btoa(JSON.stringify(sdp));
  }

  sendVoteStage(stage: RetroStage, participantId: string): void {
    if (this.dc !== null && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify({ type: 'vote-stage', stage, participantId }));
    }
  }

  onStateUpdate(cb: (state: RetroState) => void): void {
    this.onStateUpdateCallback = cb;
  }

  onConnected(cb: () => void): void {
    this.onConnectedCallback = cb;
  }

  onDisconnected(cb: () => void): void {
    this.onDisconnectedCallback = cb;
  }

  isConnected(): boolean {
    return this.dc !== null && this.dc.readyState === 'open';
  }

  close(): void {
    this.dc?.close();
    this.pc?.close();
    this.dc = null;
    this.pc = null;
  }

  private handleMessage(raw: string): void {
    const msg = JSON.parse(raw) as { type: string; state?: RetroState };
    if (msg.type === 'state' && msg.state !== undefined) {
      this.onStateUpdateCallback?.(msg.state);
    }
  }
}
