import type { Picker } from '../../ports/Picker';
import type { Participant } from '../Participant';

export const ICEBREAKER_QUESTIONS: readonly string[] = [
  'What was the last thing that made you laugh out loud?',
  'If you could instantly master any skill, which would you pick?',
  'What is a small thing that consistently brightens your day?',
  'Which fictional place would you most want to visit?',
  'What is the best meal you have eaten in the past month?',
  'If you had a free afternoon tomorrow, how would you spend it?',
  'What is a hobby you would love to try but never have?',
  'Which song have you had on repeat recently?',
  'What is the most useful thing you learned in the past year?',
  'If you could have dinner with anyone, living or not, who would it be?',
  'What is a book or show you would recommend right now?',
  'What is your go-to way to unwind after a tough day?',
];

export interface IcebreakerState {
  readonly question: string;
  readonly questions: readonly string[];
  readonly participantIds: readonly string[];
  readonly currentIndex: number;
}

export function createIcebreaker(
  participants: readonly Participant[],
  questionPool: readonly string[],
  picker: Picker<string>,
): IcebreakerState {
  if (participants.length === 0) {
    throw new Error('Icebreaker requires at least one participant');
  }
  if (questionPool.length === 0) {
    throw new Error('Icebreaker requires a non-empty question pool');
  }
  const questions: string[] = [];
  const remaining = [...questionPool];
  for (let i = 0; i < participants.length; i++) {
    if (remaining.length === 0) {
      remaining.push(...questionPool);
    }
    const picked = picker.pick(remaining);
    questions.push(picked);
    const idx = remaining.indexOf(picked);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return {
    question: questions[0],
    questions,
    participantIds: participants.map((p) => p.id),
    currentIndex: 0,
  };
}

export function currentQuestion(state: IcebreakerState): string {
  return state.questions[state.currentIndex] ?? state.question;
}

export function nextParticipant(state: IcebreakerState): IcebreakerState {
  if (isAtEnd(state)) {
    return state;
  }
  const nextIndex = state.currentIndex + 1;
  return {
    ...state,
    currentIndex: nextIndex,
    question: state.questions[nextIndex] ?? state.question,
  };
}

export function isAtEnd(state: IcebreakerState): boolean {
  return state.currentIndex >= state.participantIds.length - 1;
}
