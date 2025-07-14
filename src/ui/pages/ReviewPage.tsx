import { useState } from 'react';
import type { Card } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Timer } from '../../domain/retro/Timer';
import type { Participant } from '../../domain/retro/Participant';
import type { ActionItem } from '../../domain/retro/Retro';
import type { Agreement } from '../../domain/team/Team';
import type { FlatActionItem } from '../../domain/team/RetroHistory';
import { getTemplate } from '../../domain/retro/FacilitationTemplate';
import { OwnerPicker } from '../components/OwnerPicker';
import { PresentTimer } from '../components/PresentTimer';

export interface ReviewPageProps {
  timer: Timer;
  participants: readonly Participant[];
  actionItems: readonly ActionItem[];
  cards?: readonly Card[];
  groups?: readonly Group[];
  templateId?: string;
  existingActionItems?: readonly FlatActionItem[];
  agreements?: readonly Agreement[];
  members?: readonly { id: string; name: string }[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onAssignOwner: (noteId: string, participantId: string | null) => void;
  onPromoteToAgreement?: (noteId: string) => void;
  onDemoteAgreement?: (agreementId: string) => void;
  onAddAgreement?: (text: string) => void;
  onRemoveAgreement?: (id: string) => void;
  onReassignAction?: (noteId: string, ownerName: string | null) => void;
}

export function ReviewPage({
  timer,
  participants,
  actionItems,
  cards = [],
  groups = [],
  templateId,
  existingActionItems = [],
  agreements = [],
  members = [],
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onAssignOwner,
  onPromoteToAgreement,
  onDemoteAgreement,
  onAddAgreement,
  onRemoveAgreement,
  onReassignAction,
}: ReviewPageProps): JSX.Element {
  const [agreementText, setAgreementText] = useState('');
  const memberList = members.length > 0 ? members : participants.map((p) => ({ id: p.id, name: p.name }));

  return (
    <section aria-label="Review">
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />

      <section className="review-section">
        <h3 className="review-section-title">Actions from this retrospective</h3>
        <section aria-label="Action items">
          <ul aria-label="Action items list" className="review-list">
            {actionItems.map((item) => {
              const ownerParticipant = item.ownerId !== null
                ? participants.find((p) => p.id === item.ownerId)
                : undefined;
              return (
                <li
                  key={item.note.id}
                  data-testid={`action-item-${item.note.id}`}
                  className="review-item"
                >
                  <span className="review-check">&#10003;</span>
                  <div className="review-item-content">
                    <p data-testid={`action-text-${item.note.id}`} className="review-text">
                      {item.note.text}
                    </p>
                    <p data-testid={`action-parent-${item.note.id}`} className="review-parent">
                      {item.parentCard.text}
                    </p>
                  </div>
                  <div className="review-item-actions">
                    {onPromoteToAgreement !== undefined && (
                      <button
                        type="button"
                        className="review-promote-btn"
                        title="Promote to agreement"
                        onClick={(): void => { onPromoteToAgreement(item.note.id); }}
                      >
                        &#9783;
                      </button>
                    )}
                    <OwnerPicker
                      ownerName={ownerParticipant?.name ?? null}
                      members={memberList}
                      onAssign={(name): void => {
                        const p = participants.find((pp) => pp.name.toLowerCase() === name?.toLowerCase());
                        onAssignOwner(item.note.id, p?.id ?? null);
                      }}
                    />
                  </div>
                </li>
              );
            })}
            {actionItems.length === 0 && (
              <li className="review-empty">No actions yet</li>
            )}
          </ul>
        </section>
      </section>

      {existingActionItems.length > 0 && (
        <section className="review-section">
          <h3 className="review-section-title">Other open actions</h3>
          <ul className="review-list">
            {existingActionItems.filter((a) => !(a.done ?? false)).map((item) => (
              <li key={item.noteId} className="review-item">
                <span className="review-check">&#10003;</span>
                <div className="review-item-content">
                  <p className="review-text">{item.text}</p>
                  <p className="review-parent">{item.parentText}</p>
                </div>
                <div className="review-item-actions">
                  {onReassignAction !== undefined && (
                    <OwnerPicker
                      ownerName={item.ownerName}
                      members={memberList}
                      onAssign={(name): void => { onReassignAction(item.noteId, name); }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="review-section">
        <h3 className="review-section-title">Team agreements</h3>
        {onAddAgreement !== undefined && (
          <div className="review-agreement-input">
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
            />
            <button
              type="button"
              disabled={agreementText.trim().length === 0}
              onClick={(): void => {
                if (agreementText.trim().length > 0) {
                  onAddAgreement(agreementText.trim());
                  setAgreementText('');
                }
              }}
            >
              Add
            </button>
          </div>
        )}
        <ul className="review-list">
          {agreements.map((a) => (
            <li key={a.id} className="review-item review-agreement-item">
              <span className="review-agreement-icon">&#9783;</span>
              <div className="review-item-content">
                <p className="review-text">{a.text}</p>
              </div>
              <div className="review-item-actions">
                {onDemoteAgreement !== undefined && (
                  <button
                    type="button"
                    className="review-demote-btn"
                    title="Convert to action item"
                    onClick={(): void => { onDemoteAgreement(a.id); }}
                  >
                    &#10003;
                  </button>
                )}
                {onRemoveAgreement !== undefined && (
                  <button
                    type="button"
                    className="review-remove-btn"
                    title="Remove agreement"
                    onClick={(): void => { onRemoveAgreement(a.id); }}
                  >
                    &times;
                  </button>
                )}
              </div>
            </li>
          ))}
          {agreements.length === 0 && (
            <li className="review-empty">No agreements yet</li>
          )}
        </ul>
      </section>

      {cards.length > 0 && (() => {
        const template = getTemplate(templateId ?? 'start-stop');
        return (
          <section className="review-section review-board">
            <h3 className="review-section-title">Board overview</h3>
            <div className="columns">
              {template.columns.map((col) => {
                const colCards = cards.filter((c) => c.columnId === col.id);
                const colGroups = groups.filter((g) => g.columnId === col.id);
                const groupedIds = new Set(colGroups.flatMap((g) => g.cardIds));
                const ungrouped = colCards.filter((c) => !groupedIds.has(c.id));
                return (
                  <section
                    key={col.id}
                    className="brainstorm-column"
                    style={{ '--col-color': col.color } as React.CSSProperties}
                  >
                    <h3>{col.title}</h3>
                    <p className="column-desc">{col.description}</p>
                    {ungrouped.map((c) => (
                      <div key={c.id} className="brainstorm-card">
                        <span className="brainstorm-card-text">{c.text}</span>
                      </div>
                    ))}
                    {colGroups.map((g) => {
                      const gCards = g.cardIds
                        .map((cid) => cards.find((c) => c.id === cid))
                        .filter((c): c is Card => c !== undefined);
                      return (
                        <div key={g.id} className="brainstorm-group">
                          <div className="brainstorm-group-header">
                            <span className="brainstorm-group-name">{g.name || 'Group'}</span>
                          </div>
                          <ul className="brainstorm-group-cards">
                            {gCards.map((c) => (
                              <li key={c.id} className="brainstorm-card">
                                <span className="brainstorm-card-text">{c.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          </section>
        );
      })()}
    </section>
  );
}
