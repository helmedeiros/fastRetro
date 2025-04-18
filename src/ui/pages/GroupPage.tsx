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
  onContinueToVote: () => void;
}

interface ColumnProps {
  columnId: ColumnId;
  title: string;
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
  onRename,
  onUngroup,
}: {
  group: Group;
  cards: readonly Card[];
  onRename: (groupId: string, name: string) => void;
  onUngroup: (cardId: string) => void;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const groupCards = group.cardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is Card => c !== undefined);

  return (
    <li data-testid={`group-${group.id}`}>
      {editing ? (
        <span>
          <label htmlFor={`group-name-${group.id}`}>Group name</label>
          <input
            id={`group-name-${group.id}`}
            type="text"
            value={name}
            onChange={(e): void => {
              setName(e.target.value);
            }}
          />
          <button
            type="button"
            aria-label={`Save group name ${group.name}`}
            onClick={(): void => {
              if (name.trim().length > 0) {
                onRename(group.id, name);
              }
              setEditing(false);
            }}
          >
            Save
          </button>
        </span>
      ) : (
        <span>
          <strong>{group.name}</strong>
          <button
            type="button"
            aria-label={`Rename group ${group.name}`}
            onClick={(): void => {
              setName(group.name);
              setEditing(true);
            }}
          >
            Rename
          </button>
        </span>
      )}
      <ul aria-label={`Cards in group ${group.name}`}>
        {groupCards.map((c) => (
          <li key={c.id}>
            <span>{c.text}</span>
            <button
              type="button"
              aria-label={`Ungroup card ${c.text}`}
              onClick={(): void => {
                onUngroup(c.id);
              }}
            >
              Ungroup
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
    <section aria-label={`${title} column`}>
      <h3>{title}</h3>
      {columnGroups.length > 0 && (
        <ul aria-label={`${title} groups`}>
          {columnGroups.map((g) => {
            if (emittedGroupIds.has(g.id)) return null;
            emittedGroupIds.add(g.id);
            return (
              <GroupItem
                key={g.id}
                group={g}
                cards={cards}
                onRename={onRenameGroup}
                onUngroup={onUngroupCard}
              />
            );
          })}
        </ul>
      )}
      <ul aria-label={`${title} ungrouped cards`}>
        {ungroupedCards.map((c) => {
          const isSelected = c.id === selectedCardId;
          return (
            <li key={c.id} data-testid={`group-card-${c.id}`}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select card ${c.text}`}
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
  onContinueToVote,
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
      <p>Select two cards in the same column to group them together.</p>
      <div>
        <Column
          columnId="start"
          title="Start"
          cards={cards}
          groups={groups}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onCreateGroup={onCreateGroup}
          onRenameGroup={onRenameGroup}
          onUngroupCard={onUngroupCard}
        />
        <Column
          columnId="stop"
          title="Stop"
          cards={cards}
          groups={groups}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onCreateGroup={onCreateGroup}
          onRenameGroup={onRenameGroup}
          onUngroupCard={onUngroupCard}
        />
      </div>
      <button type="button" onClick={onContinueToVote}>
        Continue to vote
      </button>
    </section>
  );
}
