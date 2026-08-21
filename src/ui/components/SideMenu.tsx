import { useState } from 'react';
import type { Participant } from '../../domain/retro/Participant';
import type { UseRoomSync } from '../hooks/useRoomSync';
import { avatarColor, initials } from '../avatarColor';
import { SyncPanel } from './SyncPanel';

export interface SideMenuProps {
  participants: readonly Participant[];
  currentParticipantId?: string | null;
  sync?: UseRoomSync;
}

type PanelType = 'team' | 'sync' | null;

export function SideMenu({ participants, currentParticipantId, sync }: SideMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<PanelType>(null);

  const togglePanel = (p: PanelType): void => {
    if (panel === p) {
      setPanel(null);
    } else {
      setPanel(p);
      if (!open) setOpen(true);
    }
  };

  const syncStatusDot = sync !== undefined && sync.status === 'connected'
    ? 'sync-dot-connected'
    : '';

  return (
    <>
      {panel !== null && (
        <div className="side-menu-overlay" onClick={(): void => { setPanel(null); }} />
      )}

      {panel === 'team' && (
        <div className="side-menu-panel">
          <div className="side-menu-panel-header">
            <h3>Team</h3>
            <button type="button" className="side-menu-panel-close" onClick={(): void => { setPanel(null); }}>
              &times;
            </button>
          </div>
          <div className="side-menu-panel-section">
            <h4>Participants</h4>
            <ul className="side-menu-participant-list">
              {participants.map((p) => (
                <li key={p.id} className={`side-menu-participant${p.id === currentParticipantId ? ' side-menu-participant-me' : ''}`}>
                  <span className="side-menu-avatar" style={{ background: avatarColor(p.name) }}>
                    {initials(p.name)}
                  </span>
                  <span>{p.name}{p.id === currentParticipantId ? ' (me)' : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {panel === 'sync' && sync !== undefined && (
        <div className="side-menu-panel">
          <div className="side-menu-panel-header">
            <h3>Sync</h3>
            <button type="button" className="side-menu-panel-close" onClick={(): void => { setPanel(null); }}>
              &times;
            </button>
          </div>
          <SyncPanel sync={sync} />
        </div>
      )}

      <div className={`side-menu-bar${open ? ' side-menu-bar-open' : ''}`}>
        <button
          type="button"
          className={`side-menu-item${panel === 'team' ? ' active' : ''}`}
          title="Team"
          onClick={(): void => { togglePanel('team'); }}
        >
          <span className="side-menu-icon">{'\u2691'}</span>
          <span className="side-menu-label">Team</span>
        </button>

        {sync !== undefined && (
          <button
            type="button"
            className={`side-menu-item${panel === 'sync' ? ' active' : ''}${syncStatusDot !== '' ? ` ${syncStatusDot}` : ''}`}
            title="Sync"
            onClick={(): void => { togglePanel('sync'); }}
          >
            <span className="side-menu-icon">{'\u21C4'}</span>
            <span className="side-menu-label">Sync</span>
          </button>
        )}

        <button
          type="button"
          className="side-menu-toggle"
          title={open ? 'Collapse menu' : 'Open menu'}
          onClick={(): void => { setOpen(!open); setPanel(null); }}
        >
          <span className="side-menu-toggle-icon">{open ? '\u2715' : '\u2630'}</span>
        </button>
      </div>
    </>
  );
}
