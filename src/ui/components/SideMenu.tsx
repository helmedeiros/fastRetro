import { useState } from 'react';
import type { Participant } from '../../domain/retro/Participant';

export interface SideMenuProps {
  participants: readonly Participant[];
}

const AVATAR_COLORS = [
  '#5ec4c8', '#e06060', '#6ec76e', '#d4a84e',
  '#7a8fe0', '#c87ae0', '#e09060', '#60c4e0',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SideMenu({ participants }: SideMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'team' | null>(null);

  const togglePanel = (p: 'team'): void => {
    if (panel === p) {
      setPanel(null);
    } else {
      setPanel(p);
      if (!open) setOpen(true);
    }
  };

  return (
    <>
      {/* Overlay */}
      {panel !== null && (
        <div className="side-menu-overlay" onClick={(): void => { setPanel(null); }} />
      )}

      {/* Panel */}
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
                <li key={p.id} className="side-menu-participant">
                  <span className="side-menu-avatar" style={{ background: avatarColor(p.name) }}>
                    {initials(p.name)}
                  </span>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Pill bar */}
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

        <button
          type="button"
          className="side-menu-item"
          title="Info"
          onClick={(): void => { setOpen(!open); }}
        >
          <span className="side-menu-icon">{'\u24D8'}</span>
          <span className="side-menu-label">Context</span>
        </button>

        {/* Toggle button at the bottom */}
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
