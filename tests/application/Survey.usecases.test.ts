import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRetroRepository } from '../../src/adapters/storage/InMemoryRetroRepository';
import { StartSurvey } from '../../src/application/usecases/StartSurvey';
import { SubmitSurveyResponse } from '../../src/application/usecases/SubmitSurveyResponse';
import {
  addParticipant,
  createRetro,
  startIcebreaker,
} from '../../src/domain/retro/Retro';
import type { Picker } from '../../src/domain/ports/Picker';
import type { IdGenerator } from '../../src/domain/ports/IdGenerator';

const firstPicker: Picker<string> = {
  pick: <T,>(items: readonly T[]): T => items[0] as T,
};

class SeqIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `id-${String(this.n)}`;
  }
}

describe('Survey use cases', () => {
  let repo: InMemoryRetroRepository;

  beforeEach(() => {
    let s = createRetro({
      type: 'check',
      name: 'Health Check',
      date: '2026-04-01',
      context: '',
      templateId: 'health-check',
    });
    s = addParticipant(s, 'p-1', 'Alice');
    s = addParticipant(s, 'p-2', 'Bob');
    s = startIcebreaker(s, firstPicker);
    repo = new InMemoryRetroRepository(s);
  });

  it('StartSurvey transitions to survey stage with timer', () => {
    new StartSurvey(repo).execute();
    const s = repo.load();
    expect(s.stage).toBe('survey');
    expect(s.timer?.durationMs).toBe(10 * 60 * 1000);
  });

  it('SubmitSurveyResponse adds a response', () => {
    new StartSurvey(repo).execute();
    const submit = new SubmitSurveyResponse(repo, new SeqIds());
    submit.execute('p-1', 'ownership', 4, 'Good ownership');
    const s = repo.load();
    expect(s.surveyResponses).toHaveLength(1);
    expect(s.surveyResponses[0].rating).toBe(4);
    expect(s.surveyResponses[0].comment).toBe('Good ownership');
  });

  it('SubmitSurveyResponse upserts on same participant+question', () => {
    new StartSurvey(repo).execute();
    const submit = new SubmitSurveyResponse(repo, new SeqIds());
    submit.execute('p-1', 'ownership', 3, 'OK');
    submit.execute('p-1', 'ownership', 5, 'Great');
    const s = repo.load();
    expect(s.surveyResponses).toHaveLength(1);
    expect(s.surveyResponses[0].rating).toBe(5);
  });

  it('SubmitSurveyResponse rejects invalid rating', () => {
    new StartSurvey(repo).execute();
    const submit = new SubmitSurveyResponse(repo, new SeqIds());
    expect(() => submit.execute('p-1', 'ownership', 6, '')).toThrow();
  });

  it('SubmitSurveyResponse rejects unknown participant', () => {
    new StartSurvey(repo).execute();
    const submit = new SubmitSurveyResponse(repo, new SeqIds());
    expect(() => submit.execute('ghost', 'ownership', 3, '')).toThrow();
  });

  it('SubmitSurveyResponse rejects when not in survey stage', () => {
    const submit = new SubmitSurveyResponse(repo, new SeqIds());
    expect(() => submit.execute('p-1', 'ownership', 3, '')).toThrow();
  });
});
