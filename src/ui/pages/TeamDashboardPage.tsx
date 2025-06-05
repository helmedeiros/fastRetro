import { useState, type FormEvent } from 'react';
import type { TeamMember, Agreement } from '../../domain/team/Team';
import type { FlatActionItem } from '../../domain/team/RetroHistory';
import { OwnerPicker } from '../components/OwnerPicker';
import { CarouselModal, type CarouselItem } from '../components/CarouselModal';

function HandshakeIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M9 13c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21 18v-1c0-1.5-1.2-3-3.5-3.5" />
    </svg>
  );
}

export interface TeamDashboardPageProps {
  members: readonly TeamMember[];
  allActionItems: readonly FlatActionItem[];
  hasActiveRetro: boolean;
  activeRetroStage: string;
  activeRetroName: string;
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  onStartRetro: () => void;
  onResumeRetro: () => void;
  onViewMember?: (memberId: string) => void;
  onReassignAction?: (noteId: string, ownerName: string | null) => void;
  onAddActionItem?: (text: string) => void;
  agreements?: readonly Agreement[];
  onAddAgreement?: (text: string) => void;
  onRemoveAgreement?: (id: string) => void;
  onPromoteToAgreement?: (noteId: string) => void;
  onDemoteAgreement?: (agreementId: string) => void;
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

export function TeamDashboardPage({
  members,
  allActionItems,
  hasActiveRetro,
  activeRetroStage,
  activeRetroName,
  onAddMember,
  onRemoveMember,
  onStartRetro,
  onResumeRetro,
  onViewMember,
  onReassignAction,
  onAddActionItem,
  agreements = [],
  onAddAgreement,
  onRemoveAgreement,
  onPromoteToAgreement,
  onDemoteAgreement,
}: TeamDashboardPageProps): JSX.Element {
  const [agreementText, setAgreementText] = useState('');
  const [actionText, setActionText] = useState('');
  const [carousel, setCarousel] = useState<{ type: 'actions' | 'agreements'; index: number } | null>(null);
  const [actionPage, setActionPage] = useState(0);
  const [agreementPage, setAgreementPage] = useState(0);
  const PAGE_SIZE = 4;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    try {
      onAddMember(name);
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section aria-label="Team Dashboard">
      <div className="dashboard-layout">
        <aside>
          <section aria-label="Retrospectives">
            <h2>Retrospectives</h2>
            {hasActiveRetro ? (
              <button
                type="button"
                className="retro-card"
                onClick={onResumeRetro}
              >
                <div className="retro-card-columns">
                  <span className="retro-col retro-col-stop">Stop</span>
                  <span className="retro-col retro-col-start">Start</span>
                </div>
                <div className="retro-card-info">
                  <span className="retro-card-name">{activeRetroName || 'Current Retro'}</span>
                  <span className="retro-card-meta">
                    {activeRetroStage.toUpperCase()}
                    {' \u00B7 '}
                    <span className="retro-badge">IN PROGRESS</span>
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                className="start-retro-card"
                onClick={onStartRetro}
                disabled={members.length === 0}
              >
                <span className="plus">+</span>
                <span className="label">Start Retrospective</span>
              </button>
            )}
          </section>

          <section aria-label="Members" className="members-section">
            <h2>Members</h2>
            <p className="members-desc">Manage your retrospective team</p>
            <form onSubmit={onSubmit} className="members-add-form">
              <input
                id="member-name"
                type="text"
                value={name}
                onChange={(e): void => { setName(e.target.value); }}
                placeholder="Search or add name..."
                aria-label="Name"
                className="members-search-input"
              />
              <button type="submit" className="members-invite-btn">Add</button>
            </form>
            {error !== null && <p role="alert">{error}</p>}
            <ul aria-label="Team members" className="members-list">
              {members.map((m) => (
                <li key={m.id} className="member-row">
                  <span
                    className="member-avatar-lg"
                    style={{ background: avatarColor(m.name), cursor: onViewMember ? 'pointer' : undefined }}
                    onClick={(): void => { if (onViewMember) onViewMember(m.id); }}
                  >
                    {initials(m.name)}
                  </span>
                  <div
                    className="member-info"
                    style={{ cursor: onViewMember ? 'pointer' : undefined }}
                    onClick={(): void => { if (onViewMember) onViewMember(m.id); }}
                  >
                    <span className="member-name-lg">{m.name}</span>
                    <span className="member-role-tag">Member</span>
                  </div>
                  <button
                    type="button"
                    className="member-remove-btn"
                    aria-label={`Remove ${m.name}`}
                    onClick={(): void => { onRemoveMember(m.id); }}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="dashboard-main-content">
          <section aria-label="Action items" className="dashboard-card-section">
            <h2>Team Actions</h2>
            {onAddActionItem !== undefined && (
              <div className="brainstorm-input-row">
                <span className="brainstorm-input-plus">&#10003;</span>
                <input
                  type="text"
                  value={actionText}
                  onChange={(e): void => { setActionText(e.target.value); }}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter' && actionText.trim().length > 0) {
                      onAddActionItem(actionText.trim());
                      setActionText('');
                    }
                  }}
                  placeholder="Add action..."
                  aria-label="New action item text"
                />
                <button
                  type="button"
                  className="brainstorm-input-add"
                  disabled={actionText.trim().length === 0}
                  onClick={(): void => {
                    if (actionText.trim().length > 0 && onAddActionItem) {
                      onAddActionItem(actionText.trim());
                      setActionText('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            )}
            {allActionItems.length === 0 ? (
              <div className="dashboard-empty-card">
                <span className="dashboard-empty-icon">&#10003;</span>
                <p className="dashboard-empty-title">There is no Action Item available!</p>
                <p className="dashboard-empty-sub">Complete a retrospective to create action items.</p>
              </div>
            ) : (
              <>
                <div>
                  {allActionItems.slice(actionPage * PAGE_SIZE, (actionPage + 1) * PAGE_SIZE).map((item, idx) => (
                    <div
                      key={item.noteId}
                      className="action-item-row"
                      data-testid={`dashboard-action-${item.noteId}`}
                      style={{ cursor: 'pointer' }}
                      onClick={(): void => { setCarousel({ type: 'actions', index: actionPage * PAGE_SIZE + idx }); }}
                    >
                      <span className="check-icon">&#10003;</span>
                      <div className="action-content">
                        <div className="action-text">{item.text}</div>
                        <div className="action-meta">
                          {item.parentText}
                          {' \u00B7 '}
                          {new Date(item.completedAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                        </div>
                      </div>
                      {onReassignAction !== undefined ? (
                        <OwnerPicker
                          ownerName={item.ownerName}
                          members={members}
                          onAssign={(ownerName): void => { onReassignAction(item.noteId, ownerName); }}
                        />
                      ) : item.ownerName !== null ? (
                        <span
                          className="action-owner"
                          style={{ background: avatarColor(item.ownerName) }}
                          title={item.ownerName}
                        >
                          {initials(item.ownerName)}
                        </span>
                      ) : null}
                      {onPromoteToAgreement !== undefined && (
                        <button
                          type="button"
                          className="promote-btn"
                          title="Promote to agreement"
                          onClick={(): void => { onPromoteToAgreement(item.noteId); }}
                        >
                          <HandshakeIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {allActionItems.length > PAGE_SIZE && (
                  <div className="pagination">
                    <button
                      type="button"
                      disabled={actionPage === 0}
                      onClick={(): void => { setActionPage(actionPage - 1); }}
                    >
                      &#8592; Prev
                    </button>
                    <span className="pagination-info">
                      {`${String(actionPage + 1)} / ${String(Math.ceil(allActionItems.length / PAGE_SIZE))}`}
                    </span>
                    <button
                      type="button"
                      disabled={(actionPage + 1) * PAGE_SIZE >= allActionItems.length}
                      onClick={(): void => { setActionPage(actionPage + 1); }}
                    >
                      Next &#8594;
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section aria-label="Team agreements" className="dashboard-card-section">
            <h2>Team Agreements</h2>
            {onAddAgreement !== undefined && (
              <div className="brainstorm-input-row">
                <span className="brainstorm-input-plus"><HandshakeIcon /></span>
                <input
                  type="text"
                  value={agreementText}
                  onChange={(e): void => { setAgreementText(e.target.value); }}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter' && agreementText.trim().length > 0) {
                      onAddAgreement(agreementText.trim());
                      setAgreementText('');
                    }
                  }}
                  placeholder="Add agreement..."
                  aria-label="New agreement text"
                />
                <button
                  type="button"
                  className="brainstorm-input-add"
                  disabled={agreementText.trim().length === 0}
                  onClick={(): void => {
                    if (agreementText.trim().length > 0 && onAddAgreement) {
                      onAddAgreement(agreementText.trim());
                      setAgreementText('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            )}
            {agreements.length === 0 ? (
              <div className="dashboard-empty-card">
                <span className="dashboard-empty-icon"><HandshakeIcon /></span>
                <p className="dashboard-empty-title">There is no Team Agreement available!</p>
                <p className="dashboard-empty-sub">Create an agreement or promote an action item.</p>
              </div>
            ) : (
              <>
                <div className="agreements-list">
                  {agreements.slice(agreementPage * PAGE_SIZE, (agreementPage + 1) * PAGE_SIZE).map((a, idx) => (
                    <div
                      key={a.id}
                      className="agreement-row"
                      style={{ cursor: 'pointer' }}
                      onClick={(): void => { setCarousel({ type: 'agreements', index: agreementPage * PAGE_SIZE + idx }); }}
                    >
                      <span className="agreement-icon">
                        <span className="agreement-icon-inner"><HandshakeIcon /></span>
                      </span>
                      <div className="agreement-content">
                        <span className="agreement-text">{a.text}</span>
                        <span className="agreement-date">
                          {new Date(a.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="agreement-actions">
                        {onDemoteAgreement !== undefined && (
                          <button
                            type="button"
                            className="demote-btn"
                            title="Convert to action item"
                            onClick={(): void => { onDemoteAgreement(a.id); }}
                          >
                            &#10003;
                          </button>
                        )}
                        {onRemoveAgreement !== undefined && (
                          <button
                            type="button"
                            className="agreement-remove"
                            onClick={(): void => { onRemoveAgreement(a.id); }}
                            aria-label={`Remove agreement ${a.text}`}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {agreements.length > PAGE_SIZE && (
                  <div className="pagination">
                    <button
                      type="button"
                      disabled={agreementPage === 0}
                      onClick={(): void => { setAgreementPage(agreementPage - 1); }}
                    >
                      &#8592; Prev
                    </button>
                    <span className="pagination-info">
                      {`${String(agreementPage + 1)} / ${String(Math.ceil(agreements.length / PAGE_SIZE))}`}
                    </span>
                    <button
                      type="button"
                      disabled={(agreementPage + 1) * PAGE_SIZE >= agreements.length}
                      onClick={(): void => { setAgreementPage(agreementPage + 1); }}
                    >
                      Next &#8594;
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
      {carousel !== null && carousel.type === 'actions' && (
        <CarouselModal
          items={allActionItems.map((item): CarouselItem => ({
            id: item.noteId,
            icon: <span>&#10003;</span>,
            title: item.text,
            inspiredBy: item.parentText !== 'Manual' ? item.parentText : undefined,
            meta: new Date(item.completedAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
            assignedTo: item.ownerName,
          }))}
          initialIndex={carousel.index}
          onClose={(): void => { setCarousel(null); }}
        />
      )}
      {carousel !== null && carousel.type === 'agreements' && (
        <CarouselModal
          items={agreements.map((a): CarouselItem => ({
            id: a.id,
            icon: <HandshakeIcon />,
            title: a.text,
            meta: new Date(a.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
          }))}
          initialIndex={carousel.index}
          onClose={(): void => { setCarousel(null); }}
        />
      )}
    </section>
  );
}
