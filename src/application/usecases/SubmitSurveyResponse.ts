import { RetroRepository } from '../../domain/ports/RetroRepository';
import { IdGenerator } from '../../domain/ports/IdGenerator';
import { submitSurveyResponse } from '../../domain/retro/Retro';

export class SubmitSurveyResponse {
  constructor(
    private readonly repo: RetroRepository,
    private readonly ids: IdGenerator,
  ) {}

  execute(
    participantId: string,
    questionId: string,
    rating: number,
    comment: string,
  ): void {
    this.repo.save(
      submitSurveyResponse(
        this.repo.load(),
        participantId,
        questionId,
        rating,
        comment,
        this.ids,
      ),
    );
  }
}
