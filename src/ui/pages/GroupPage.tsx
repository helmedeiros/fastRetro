import { useState } from 'react';
import type { Card, ColumnId } from '../../domain/retro/Card';
import type { Group } from '../../domain/retro/Group';
import type { Timer } from '../../domain/retro/Timer';
import { PresentTimer } from '../components/PresentTimer';

export interface GroupPageProps {
  timer: Timer;
  cards: readonly Card[];
  groups: readonly Group[];
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onCreateGroup: (sourceCardId: string, targetCardId: string) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onUngroupCard: (cardId: string) => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
  description: string;
  cards: readonly Card[];
  groups: readonly Group[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  onCreateGroup: (sourceCardId: string, targetCardId: string) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onUngroupCard: (cardId: string) => void;
}

function groupOfCard(
  groups: readonly Group[],
  cardId: string,
): Group | undefined {
  return groups.find((g) => g.cardIds.includes(cardId));
}

function GroupItem({
  group,
  cards,
  columnId,
  onRename,
  onUngroup,
}: {
  group: Group;
  cards: readonly Card[];
  columnId: ColumnId;
  onRename: (groupId: string, name: string) => void;
  onUngroup: (cardId: string) => void;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const groupCards = group.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is Card => c !== undefined);

  return (
    <li data-testid={`group-${group.id}`} className="group-item">
      <div className="group-header">
        {editing ? (
          <div className="group-edit-row">
            <input
              type="text"
              value={name}
              onChange={(e): void => { setName(e.target.value); }}
              aria-label={`Group name ${group.name}`}
              id={`group-name-${group.id}`}
            />
            <button
              type="button"
              className="group-save-btn"
              aria-label={`Save group name ${group.name}`}
              onClick={(): void => {
                if (name.trim().length > 0) onRename(group.id, name);
                setEditing(false);
              }}
            >
              &#10003;
            </button>
            <button
              type="button"
              className="group-cancel-btn"
              onClick={(): void => { setEditing(false); }}
            >
              &#10005;
            </button>
          </div>
        ) : (
          <div className="group-title-row">
            <strong>{group.name}</strong>
            <button
              type="button"
              className="group-rename-btn"
              aria-label={`Rename group ${group.name}`}
              onClick={(): void => { setName(group.name); setEditing(true); }}
            >
              &#9998;
            </button>
          </div>
        )}
      </div>
      <ul aria-label={`Cards in group ${group.name}`} className="group-card-list">
        {groupCards.map((c) => (
          <li
            key={c.id}
            className={`brainstorm-card brainstorm-col-${columnId === 'stop' ? 'stop' : 'start'}-card`}
          >
            <span className="brainstorm-card-text">{c.text}</span>
            <button
              type="button"
              className="brainstorm-card-remove"
              aria-label={`Ungroup card ${c.text}`}
              onClick={(): void => { onUngroup(c.id); }}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}

function Column({
  columnId,
  title,
  description,
  cards,
  groups,
  selectedCardId,
  onSelectCard,
  onCreateGroup,
  onRenameGroup,
  onUngroupCard,
}: ColumnProps): JSX.Element {
  const columnCards = cards.filter((c) => c.columnId === columnId);
  const columnGroups = groups.filter((g) => g.columnId === columnId);
  const emittedGroupIds = new Set<string>();
  const ungroupedCards = columnCards.filter(
    (c) => groupOfCard(groups, c.id) === undefined,
  );

  return (
    <section aria-label={`${title} column`} className={`brainstorm-column brainstorm-col-${columnId}`}>
      <h3>{title}</h3>
      <p className="column-desc">{description}</p>
      {columnGroups.length > 0 && (
        <ul aria-label={`${title} groups`} className="brainstorm-card-list">
          {columnGroups.map((g) => {
            if (emittedGroupIds.has(g.id)) return null;
            emittedGroupIds.add(g.id);
            return (
              <GroupItem
                key={g.id}
                group={g}
                cards={cards}
                columnId={columnId}
                onRename={onRenameGroup}
                onUngroup={onUngroupCard}
              />
            );
          })}
        </ul>
      )}
      <ul aria-label={`${title} ungrouped cards`} className="brainstorm-card-list">
        {ungroupedCards.map((c) => {
          const isSelected = c.id === selectedCardId;
          return (
            <li key={c.id} data-testid={`group-card-${c.id}`}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select card ${c.text}`}
                className={`brainstorm-card brainstorm-card-btn${isSelected ? ' selected' : ''}`}
                onClick={(): void => {
                  if (selectedCardId !== null && selectedCardId !== c.id) {
                    onCreateGroup(selectedCardId, c.id);
                    onSelectCard('');
                  } else {
                    onSelectCard(isSelected ? '' : c.id);
                  }
                }}
              >
                {c.text}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GroupPage({
  timer,
  cards,
  groups,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onCreateGroup,
  onRenameGroup,
  onUngroupCard,
}: GroupPageProps): JSX.Element {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  return (
    <section aria-label="Group">
      <h2>Group</h2>
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <p className="stage-instruction">Select two cards in the same column to group them together.</p>
      <div className="columns">
        <Column
          columnId="stop"
          title="Stop"
          description="What factors are slowing us down or holding us back?"
          cards={cards}
          groups={groups}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onCreateGroup={onCreateGroup}
          onRenameGroup={onRenameGroup}
          onUngroupCard={onUngroupCard}
        />
        <Column
          columnId="start"
          title="Start"
          description="What factors are driving us forward and enabling our success?"
          cards={cards}
          groups={groups}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onCreateGroup={onCreateGroup}
          onRenameGroup={onRenameGroup}
          onUngroupCard={onUngroupCard}
        />
      </div>
    </section>
  );
}
