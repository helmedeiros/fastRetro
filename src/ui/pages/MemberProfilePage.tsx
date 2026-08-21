import type { TeamMember } from '../../domain/team/Team';
import type { RetroHistoryState, FlatActionItem } from '../../domain/team/RetroHistory';
import { avatarColor, initials } from '../avatarColor';

export interface MemberProfilePageProps {
  member: TeamMember;
  history: RetroHistoryState;
  onBack: () => void;
}

export function MemberProfilePage({
  member,
  history,
  onBack,
}: MemberProfilePageProps): JSX.Element {
  // Find retros this member participated in
  const memberRetros = history.completed.filter((r) =>
    r.fullState.participants.some((p) => p.name.toLowerCase() === member.name.toLowerCase()),
  );

  // Find action items owned by or related to this member
  const memberActions: FlatActionItem[] = history.completed.flatMap((r) =>
    r.actionItems.filter((a) => a.ownerName?.toLowerCase() === member.name.toLowerCase()),
  );

  return (
    <section aria-label="Member Profile" className="member-profile">
      <button type="button" className="profile-back-btn" onClick={onBack}>
        &#8592; Back
      </button>

      <div className="profile-header">
        <span
          className="profile-avatar"
          style={{ background: avatarColor(member.name) }}
        >
          {initials(member.name)}
        </span>
        <div className="profile-header-info">
          <h2 className="profile-name">{member.name}</h2>
          <span className="profile-role">Team Member</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{String(memberRetros.length)}</span>
          <span className="profile-stat-label">Retros</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{String(memberActions.length)}</span>
          <span className="profile-stat-label">Actions</span>
        </div>
      </div>

      <div className="profile-sections">
        <section className="profile-card">
          <h3>Retrospectives ({String(memberRetros.length)})</h3>
          {memberRetros.length === 0 ? (
            <p className="profile-empty">No retrospectives yet</p>
          ) : (
            <ul className="profile-retro-list">
              {memberRetros.map((r) => (
                <li key={r.id} className="profile-retro-item">
                  <span className="profile-retro-name">
                    {r.fullState.meta?.name || 'Retrospective'}
                  </span>
                  <span className="profile-retro-date">
                    {new Date(r.completedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="profile-card">
          <h3>Action Items ({String(memberActions.length)})</h3>
          {memberActions.length === 0 ? (
            <p className="profile-empty">No action items assigned</p>
          ) : (
            <ul className="profile-action-list">
              {memberActions.map((a, i) => (
                <li key={`${a.noteId}-${String(i)}`} className="profile-action-item">
                  <span className="profile-action-check">&#10003;</span>
                  <div className="profile-action-content">
                    <span className="profile-action-text">{a.text}</span>
                    <span className="profile-action-meta">
                      {a.parentText}
                      {' \u00B7 '}
                      {new Date(a.completedAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
