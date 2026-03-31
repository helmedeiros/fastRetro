import type { RetroState } from './Retro';
import { getVotables, votableIdOf, votableTitleOf, votesForVotable } from './Retro';
import { getCheckTemplate } from './CheckTemplate';
import type { SurveyResponse } from './SurveyResponse';

export interface DiscussItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly score: number;
  readonly scoreLabel: string;
  readonly participantIds: readonly string[];
}

export function medianForQuestion(
  responses: readonly SurveyResponse[],
  questionId: string,
): number {
  const ratings = responses
    .filter((r) => r.questionId === questionId)
    .map((r) => r.rating)
    .sort((a, b) => a - b);
  if (ratings.length === 0) return 0;
  const mid = Math.floor(ratings.length / 2);
  if (ratings.length % 2 === 0) {
    return (ratings[mid - 1] + ratings[mid]) / 2;
  }
  return ratings[mid];
}

function votablesToDiscussItems(state: RetroState): readonly DiscussItem[] {
  const votables = getVotables(state);
  const insertionIndex = new Map<string, number>();
  votables.forEach((v, i) => insertionIndex.set(votableIdOf(v), i));

  return [...votables]
    .sort((a, b) => {
      const ida = votableIdOf(a);
      const idb = votableIdOf(b);
      const va = votesForVotable(state, ida);
      const vb = votesForVotable(state, idb);
      if (vb !== va) return vb - va;
      return (insertionIndex.get(ida) ?? 0) - (insertionIndex.get(idb) ?? 0);
    })
    .map((v) => {
      const id = votableIdOf(v);
      const votes = votesForVotable(state, id);
      const voterIds = [
        ...new Set(
          state.votes.filter((vote) => vote.cardId === id).map((vote) => vote.participantId),
        ),
      ];
      return {
        id,
        title: votableTitleOf(v),
        description: '',
        score: votes,
        scoreLabel: `${votes} vote${votes !== 1 ? 's' : ''}`,
        participantIds: voterIds,
      };
    });
}

function questionsToDiscussItems(state: RetroState): readonly DiscussItem[] {
  const template = getCheckTemplate(state.meta.templateId);
  return [...template.questions]
    .map((q) => {
      const median = medianForQuestion(state.surveyResponses, q.id);
      const raterIds = [
        ...new Set(
          state.surveyResponses
            .filter((r) => r.questionId === q.id)
            .map((r) => r.participantId),
        ),
      ];
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        score: median,
        scoreLabel: median === 0 ? 'No ratings' : median.toFixed(1),
        participantIds: raterIds,
      };
    })
    .sort((a, b) => a.score - b.score);
}

export function getDiscussItems(state: RetroState): readonly DiscussItem[] {
  if (state.meta.type === 'check') {
    return questionsToDiscussItems(state);
  }
  return votablesToDiscussItems(state);
}
