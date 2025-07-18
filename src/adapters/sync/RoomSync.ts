import type { RetroState, RetroStage } from '../../domain/retro/Retro';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const parts: string[] = [];
  for (let p = 0; p < 3; p++) {
    let seg = '';
    for (let i = 0; i < 3; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(seg);
  }
  return parts.join('-');
}

export class RoomSync {
  private ws: WebSocket | null = null;
  private _roomCode: string;
  private _isHost: boolean;
  private onStateCallback: ((state: RetroState) => void) | null = null;
  private onVoteCallback: ((stage: RetroStage, participantId: string) => void) | null = null;
  private onRequestStateCallback: (() => void) | null = null;
  private onNavigateCallback: ((stage: RetroStage) => void) | null = null;
  private onPeerCountCallback: ((count: number) => void) | null = null;

  constructor(roomCode?: string) {
    this._roomCode = roomCode ?? generateRoomCode();
    this._isHost = roomCode === undefined;
  }

  get roomCode(): string {
    return this._roomCode;
  }

  get isHost(): boolean {
    return this._isHost;
  }

  connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/__ws/room/${this._roomCode}`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e): void => {
      const msg = JSON.parse(e.data as string) as {
        type: string;
        state?: RetroState;
        stage?: string;
        participantId?: string;
        count?: number;
      };

      switch (msg.type) {
        case 'state':
          if (msg.state !== undefined) this.onStateCallback?.(msg.state);
          break;
        case 'vote-stage':
          if (msg.stage !== undefined && msg.participantId !== undefined) {
            this.onVoteCallback?.(msg.stage as RetroStage, msg.participantId);
          }
          break;
        case 'navigate-stage':
          if (msg.stage !== undefined) this.onNavigateCallback?.(msg.stage as RetroStage);
          break;
        case 'peer-count':
          if (msg.count !== undefined) this.onPeerCountCallback?.(msg.count);
          break;
        case 'request-state':
          this.onRequestStateCallback?.();
          break;
      }
    };
  }

  broadcastState(state: RetroState): void {
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'state', state }));
    }
  }

  sendVoteStage(stage: RetroStage, participantId: string): void {
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'vote-stage', stage, participantId }));
    }
  }

  onState(cb: (state: RetroState) => void): void {
    this.onStateCallback = cb;
  }

  onVoteStage(cb: (stage: RetroStage, participantId: string) => void): void {
    this.onVoteCallback = cb;
  }

  onNavigateStage(cb: (stage: RetroStage) => void): void {
    this.onNavigateCallback = cb;
  }

  onPeerCount(cb: (count: number) => void): void {
    this.onPeerCountCallback = cb;
  }

  onRequestState(cb: () => void): void {
    this.onRequestStateCallback = cb;
  }

  getShareUrl(): string {
    return `${window.location.origin}${window.location.pathname}#room=${this._roomCode}`;
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  static async createRoom(): Promise<string> {
    const res = await fetch('/__api/rooms', { method: 'POST' });
    const data = (await res.json()) as { code: string };
    return data.code;
  }

  static extractRoomCodeFromHash(): string | null {
    const hash = window.location.hash;
    const match = /^#room=([A-Z0-9-]+)$/i.exec(hash);
    return match !== null ? match[1] : null;
  }
}
