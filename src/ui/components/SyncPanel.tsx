import { useState } from 'react';
import type { UseP2PSync } from '../hooks/useP2PSync';

export interface SyncPanelProps {
  sync: UseP2PSync;
}

export function SyncPanel({ sync }: SyncPanelProps): JSX.Element {
  const [answerInput, setAnswerInput] = useState('');
  const [offerInput, setOfferInput] = useState('');
  const [answerCode, setAnswerCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); }, 2000);
    }).catch(() => undefined);
  };

  // Not connected yet
  if (sync.role === 'none') {
    return (
      <div className="sync-panel">
        <h4 className="sync-panel-title">Share this retro</h4>
        <p className="sync-panel-desc">Host a session or join an existing one.</p>
        <div className="sync-panel-actions">
          <button
            type="button"
            className="sync-btn sync-btn-host"
            onClick={(): void => { sync.startHosting().catch(() => undefined); }}
          >
            Host session
          </button>
          <div className="sync-join-section">
            <textarea
              value={offerInput}
              onChange={(e): void => { setOfferInput(e.target.value); }}
              placeholder="Paste host code here..."
              className="sync-textarea"
              rows={3}
            />
            <button
              type="button"
              className="sync-btn"
              disabled={offerInput.trim().length === 0}
              onClick={(): void => {
                sync.joinAsGuest(offerInput.trim()).then((code) => {
                  setAnswerCode(code);
                }).catch(() => undefined);
              }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Peer waiting for connection or showing answer code
  if (sync.role === 'peer') {
    return (
      <div className="sync-panel">
        <h4 className="sync-panel-title">
          {sync.status === 'connected' ? 'Connected' : 'Joining...'}
        </h4>
        {answerCode !== null && sync.status !== 'connected' && (
          <div className="sync-code-section">
            <p className="sync-panel-desc">Send this answer code back to the host:</p>
            <div className="sync-code-box">
              <code className="sync-code">{answerCode.slice(0, 40)}...</code>
              <button
                type="button"
                className="sync-copy-btn"
                onClick={(): void => { copyToClipboard(answerCode); }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
        {sync.status === 'connected' && (
          <p className="sync-status-connected">Synced with host</p>
        )}
        <button type="button" className="sync-btn-disconnect" onClick={sync.disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  // Host mode
  return (
    <div className="sync-panel">
      <h4 className="sync-panel-title">Hosting session</h4>
      <div className="sync-host-status">
        <span className="sync-peer-count">{String(sync.peerCount)}</span>
        <span className="sync-peer-label">peer{sync.peerCount !== 1 ? 's' : ''} connected</span>
      </div>

      {sync.pendingOffer !== null && (
        <div className="sync-code-section">
          <p className="sync-panel-desc">Share this code with a participant:</p>
          <div className="sync-code-box">
            <code className="sync-code">{sync.pendingOffer.offerCode.slice(0, 40)}...</code>
            <button
              type="button"
              className="sync-copy-btn"
              onClick={(): void => { copyToClipboard(sync.pendingOffer!.offerCode); }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="sync-answer-section">
            <textarea
              value={answerInput}
              onChange={(e): void => { setAnswerInput(e.target.value); }}
              placeholder="Paste their answer code here..."
              className="sync-textarea"
              rows={3}
            />
            <button
              type="button"
              className="sync-btn"
              disabled={answerInput.trim().length === 0}
              onClick={(): void => {
                sync.acceptAnswer(sync.pendingOffer!.peerId, answerInput.trim())
                  .then(() => { setAnswerInput(''); })
                  .catch(() => undefined);
              }}
            >
              Accept
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="sync-btn"
        onClick={(): void => { sync.createNewOffer().catch(() => undefined); }}
      >
        + Invite another
      </button>

      <button type="button" className="sync-btn-disconnect" onClick={sync.disconnect}>
        End session
      </button>
    </div>
  );
}
