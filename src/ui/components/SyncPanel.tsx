import { useState } from 'react';
import type { UseRoomSync } from '../hooks/useRoomSync';

export interface SyncPanelProps {
  sync: UseRoomSync;
}

export function SyncPanel({ sync }: SyncPanelProps): JSX.Element {
  const [joinCode, setJoinCode] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => { setCopiedField(null); }, 2000);
    }).catch(() => undefined);
  };

  // Not connected
  if (sync.role === 'none') {
    return (
      <div className="sync-panel">
        <h4 className="sync-panel-title">Share this retro</h4>
        <p className="sync-panel-desc">Host a live session so others can join from another tab.</p>
        <button
          type="button"
          className="sync-btn sync-btn-host"
          onClick={sync.hostRoom}
        >
          Host session
        </button>
        <div className="sync-divider">or join an existing one</div>
        <div className="sync-join-section">
          <input
            type="text"
            value={joinCode}
            onChange={(e): void => { setJoinCode(e.target.value.toUpperCase()); }}
            placeholder="Enter room code..."
            className="sync-input"
          />
          <button
            type="button"
            className="sync-btn"
            disabled={joinCode.trim().length === 0}
            onClick={(): void => { sync.joinRoom(joinCode.trim()); }}
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  // Connected (host or guest)
  return (
    <div className="sync-panel">
      <h4 className="sync-panel-title">
        {sync.role === 'host' ? 'Hosting session' : 'Joined session'}
      </h4>

      <div className="sync-status-bar">
        <span className="sync-status-dot" />
        <span className="sync-status-text">Connected</span>
      </div>

      {sync.roomCode !== null && (
        <div className="sync-share-section">
          <div className="sync-code-display">
            <span className="sync-code-label">Room code</span>
            <div className="sync-code-row">
              <span className="sync-room-code">{sync.roomCode}</span>
              <button
                type="button"
                className="sync-copy-btn"
                onClick={(): void => { copyToClipboard(sync.roomCode!, 'code'); }}
              >
                {copiedField === 'code' ? '\u2713' : '\u2398'}
              </button>
            </div>
          </div>

          {sync.shareUrl !== null && (
            <div className="sync-link-display">
              <div className="sync-link-row">
                <span className="sync-link-text">{sync.shareUrl}</span>
                <button
                  type="button"
                  className="sync-copy-btn"
                  onClick={(): void => { copyToClipboard(sync.shareUrl!, 'link'); }}
                >
                  {copiedField === 'link' ? '\u2713' : '\u2398'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button type="button" className="sync-btn-disconnect" onClick={sync.disconnect}>
        {sync.role === 'host' ? 'End session' : 'Leave session'}
      </button>
    </div>
  );
}
