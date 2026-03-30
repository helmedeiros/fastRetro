export interface SurveyResponse {
  readonly id: string;
  readonly participantId: string;
  readonly questionId: string;
  readonly rating: number;
  readonly comment: string;
}

export function createSurveyResponse(
  id: string,
  participantId: string,
  questionId: string,
  rating: number,
  comment: string,
  validValues: readonly number[],
): SurveyResponse {
  if (questionId.trim().length === 0) {
    throw new Error('Question ID must not be empty');
  }
  if (!Number.isInteger(rating)) {
    throw new Error('Rating must be an integer');
  }
  if (!validValues.includes(rating)) {
    throw new Error(
      `Rating ${rating} is not a valid option (expected one of ${validValues.join(', ')})`,
    );
  }
  return { id, participantId, questionId, rating, comment: comment.trim() };
}
