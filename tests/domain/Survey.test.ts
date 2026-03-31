import { describe, it, expect } from 'vitest';
import {
  createRetro,
  addParticipant,
  startIcebreaker,
  startBrainstorm,
  startGroup,
  startVote,
  startSurvey,
  submitSurveyResponse,
} from '../../src/domain/retro/Retro';
import type { RetroState } from '../../src/domain/retro/Retro';

const ids = (() => {
  let c = 0;
  return { next: () => `id-${String(++c)}` };
})();
const picker = { pick: (items: readonly string[]) => items[0] };

function checkInIcebreaker(): RetroState {
  let state = createRetro({
    type: 'check',
    name: 'Health Check',
    date: '2026-03-31',
    context: '',
    templateId: 'health-check',
  });
  state = addParticipant(state, 'p1', 'Alice');
  state = addParticipant(state, 'p2', 'Bob');
  state = startIcebreaker(state, picker);
  return state;
}

function checkInSurvey(): RetroState {
  return startSurvey(checkInIcebreaker());
}

function retroInIcebreaker(): RetroState {
  let state = createRetro({
    type: 'retro',
    name: 'Sprint 1',
    date: '2026-03-31',
    context: '',
    templateId: 'start-stop',
  });
  state = addParticipant(state, 'p1', 'Alice');
  state = startIcebreaker(state, picker);
  return state;
}

describe('startSurvey', () => {
  it('transitions to survey stage for check type', () => {
    const state = startSurvey(checkInIcebreaker());
    expect(state.stage).toBe('survey');
  });

  it('creates a timer with survey duration', () => {
    const state = startSurvey(checkInIcebreaker());
    expect(state.timer).not.toBeNull();
    expect(state.timer!.durationMs).toBe(10 * 60 * 1000);
  });

  it('rejects retro type', () => {
    expect(() => startSurvey(retroInIcebreaker())).toThrow(
      'Survey is only available for check sessions',
    );
  });

  it('rejects setup stage', () => {
    const state = createRetro({
      type: 'check',
      name: 'Test',
      date: '',
      context: '',
      templateId: 'health-check',
    });
    expect(() => startSurvey(state)).toThrow('Survey can only start after the icebreaker stage');
  });
});

describe('submitSurveyResponse', () => {
  it('adds a new response', () => {
    const state = submitSurveyResponse(checkInSurvey(), 'p1', 'ownership', 4, 'Good', ids);
    expect(state.surveyResponses).toHaveLength(1);
    expect(state.surveyResponses[0].participantId).toBe('p1');
    expect(state.surveyResponses[0].questionId).toBe('ownership');
    expect(state.surveyResponses[0].rating).toBe(4);
    expect(state.surveyResponses[0].comment).toBe('Good');
  });

  it('upserts existing response for same participant+question', () => {
    let state = checkInSurvey();
    state = submitSurveyResponse(state, 'p1', 'ownership', 3, 'OK', ids);
    state = submitSurveyResponse(state, 'p1', 'ownership', 5, 'Great', ids);
    expect(state.surveyResponses).toHaveLength(1);
    expect(state.surveyResponses[0].rating).toBe(5);
    expect(state.surveyResponses[0].comment).toBe('Great');
  });

  it('keeps responses from different participants separate', () => {
    let state = checkInSurvey();
    state = submitSurveyResponse(state, 'p1', 'ownership', 3, '', ids);
    state = submitSurveyResponse(state, 'p2', 'ownership', 4, '', ids);
    expect(state.surveyResponses).toHaveLength(2);
  });

  it('keeps responses for different questions separate', () => {
    let state = checkInSurvey();
    state = submitSurveyResponse(state, 'p1', 'ownership', 3, '', ids);
    state = submitSurveyResponse(state, 'p1', 'value', 2, '', ids);
    expect(state.surveyResponses).toHaveLength(2);
  });

  it('rejects invalid rating for question options', () => {
    expect(() =>
      submitSurveyResponse(checkInSurvey(), 'p1', 'ownership', 6, '', ids),
    ).toThrow('not a valid option');
  });

  it('rejects non-integer rating', () => {
    expect(() =>
      submitSurveyResponse(checkInSurvey(), 'p1', 'ownership', 2.5, '', ids),
    ).toThrow('Rating must be an integer');
  });

  it('rejects unknown participant', () => {
    expect(() =>
      submitSurveyResponse(checkInSurvey(), 'unknown', 'ownership', 3, '', ids),
    ).toThrow('Participant "unknown" not found');
  });

  it('rejects unknown question', () => {
    expect(() =>
      submitSurveyResponse(checkInSurvey(), 'p1', 'nonexistent', 3, '', ids),
    ).toThrow('Question "nonexistent" not found');
  });

  it('rejects when not in survey stage', () => {
    expect(() =>
      submitSurveyResponse(checkInIcebreaker(), 'p1', 'ownership', 3, '', ids),
    ).toThrow('Survey responses can only be submitted during survey');
  });

  it('trims comment whitespace', () => {
    const state = submitSurveyResponse(checkInSurvey(), 'p1', 'ownership', 3, '  spaces  ', ids);
    expect(state.surveyResponses[0].comment).toBe('spaces');
  });
});

describe('cross-type stage guards', () => {
  it('startBrainstorm rejects check type', () => {
    expect(() => startBrainstorm(checkInIcebreaker())).toThrow(
      'Brainstorm is not available for check sessions',
    );
  });

  it('startGroup rejects check type', () => {
    expect(() => startGroup(checkInIcebreaker())).toThrow(
      'Group is not available for check sessions',
    );
  });

  it('startVote rejects check type', () => {
    expect(() => startVote(checkInIcebreaker())).toThrow(
      'Vote is not available for check sessions',
    );
  });

  it('startSurvey rejects retro type', () => {
    expect(() => startSurvey(retroInIcebreaker())).toThrow(
      'Survey is only available for check sessions',
    );
  });

  it('startBrainstorm works for retro type', () => {
    const state = startBrainstorm(retroInIcebreaker());
    expect(state.stage).toBe('brainstorm');
  });
});
