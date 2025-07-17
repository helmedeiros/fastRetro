import type { RetroState, RetroStage } from '../../domain/retro/Retro';

export type RoomMessage =
  | { type: 'state'; state: RetroState }
  | { type: 'vote-stage'; stage: RetroStage; participantId: string }
  | { type: 'join'; participantId: string; name: string }
  | { type: 'request-state' };

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
  private channel: BroadcastChannel | null = null;
  private _roomCode: string;
  private _isHost: boolean;
  private onStateCallback: ((state: RetroState) => void) | null = null;
  private onVoteCallback: ((stage: RetroStage, participantId: string) => void) | null = null;
  private onJoinCallback: ((participantId: string, name: string) => void) | null = null;
  private onRequestStateCallback: (() => void) | null = null;

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
    this.channel = new BroadcastChannel(`fastretro:room:${this._roomCode}`);
    this.channel.onmessage = (e: MessageEvent): void => {
      const msg = e.data as RoomMessage;
      switch (msg.type) {
        case 'state':
          this.onStateCallback?.(msg.state);
          break;
        case 'vote-stage':
          this.onVoteCallback?.(msg.stage, msg.participantId);
          break;
        case 'join':
          this.onJoinCallback?.(msg.participantId, msg.name);
          break;
        case 'request-state':
          this.onRequestStateCallback?.();
          break;
      }
    };

    if (!this._isHost) {
      this.channel.postMessage({ type: 'request-state' } satisfies RoomMessage);
    }
  }

  broadcastState(state: RetroState): void {
    this.channel?.postMessage({ type: 'state', state } satisfies RoomMessage);
  }

  sendVoteStage(stage: RetroStage, participantId: string): void {
    this.channel?.postMessage({ type: 'vote-stage', stage, participantId } satisfies RoomMessage);
  }

  sendJoin(participantId: string, name: string): void {
    this.channel?.postMessage({ type: 'join', participantId, name } satisfies RoomMessage);
  }

  onState(cb: (state: RetroState) => void): void {
    this.onStateCallback = cb;
  }

  onVoteStage(cb: (stage: RetroStage, participantId: string) => void): void {
    this.onVoteCallback = cb;
  }

  onJoin(cb: (participantId: string, name: string) => void): void {
    this.onJoinCallback = cb;
  }

  onRequestState(cb: () => void): void {
    this.onRequestStateCallback = cb;
  }

  getShareUrl(): string {
    return `${window.location.origin}${window.location.pathname}#room=${this._roomCode}`;
  }

  disconnect(): void {
    this.channel?.close();
    this.channel = null;
  }

  static extractRoomCodeFromHash(): string | null {
    const hash = window.location.hash;
    const match = /^#room=([A-Z0-9-]+)$/i.exec(hash);
    return match !== null ? match[1] : null;
  }
}
