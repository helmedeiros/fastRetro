import { describe, it, expect } from 'vitest';
import { createSurveyResponse } from '../../src/domain/retro/SurveyResponse';

const FIVE_SCALE = [1, 2, 3, 4, 5];
const THREE_SCALE = [1, 2, 3];
const DORA_SCALE = [1, 2, 3, 4, 5, 6, 7];

describe('SurveyResponse', () => {
  describe('createSurveyResponse', () => {
    it('creates a valid response with a 5-option scale', () => {
      const r = createSurveyResponse('r1', 'p1', 'q1', 3, 'Good', FIVE_SCALE);
      expect(r).toEqual({
        id: 'r1',
        participantId: 'p1',
        questionId: 'q1',
        rating: 3,
        comment: 'Good',
      });
    });

    it('creates a valid response with a 3-option scale', () => {
      const r = createSurveyResponse('r1', 'p1', 'q1', 2, '', THREE_SCALE);
      expect(r.rating).toBe(2);
    });

    it('creates a valid response with a 7-option DORA scale', () => {
      const r = createSurveyResponse('r1', 'p1', 'q1', 7, '', DORA_SCALE);
      expect(r.rating).toBe(7);
    });

    it('trims the comment', () => {
      const r = createSurveyResponse('r1', 'p1', 'q1', 1, '  spaces  ', FIVE_SCALE);
      expect(r.comment).toBe('spaces');
    });

    it('accepts an empty comment', () => {
      const r = createSurveyResponse('r1', 'p1', 'q1', 1, '', FIVE_SCALE);
      expect(r.comment).toBe('');
    });
  });

  describe('validation', () => {
    it('rejects an empty question ID', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', '', 3, '', FIVE_SCALE),
      ).toThrow('Question ID must not be empty');
    });

    it('rejects a whitespace-only question ID', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', '  ', 3, '', FIVE_SCALE),
      ).toThrow('Question ID must not be empty');
    });

    it('rejects a non-integer rating', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', 'q1', 2.5, '', FIVE_SCALE),
      ).toThrow('Rating must be an integer');
    });

    it('rejects a rating of zero when not in valid values', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', 'q1', 0, '', FIVE_SCALE),
      ).toThrow('not a valid option');
    });

    it('rejects a negative rating', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', 'q1', -1, '', FIVE_SCALE),
      ).toThrow('not a valid option');
    });

    it('rejects a rating exceeding the max option value', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', 'q1', 6, '', FIVE_SCALE),
      ).toThrow('not a valid option');
    });

    it('rejects a rating not in the valid values set', () => {
      expect(() =>
        createSurveyResponse('r1', 'p1', 'q1', 4, '', THREE_SCALE),
      ).toThrow('not a valid option');
    });

    it('accepts boundary values (min and max)', () => {
      expect(createSurveyResponse('r1', 'p1', 'q1', 1, '', FIVE_SCALE).rating).toBe(1);
      expect(createSurveyResponse('r2', 'p1', 'q1', 5, '', FIVE_SCALE).rating).toBe(5);
    });

    it('accepts the first DORA option value', () => {
      expect(createSurveyResponse('r1', 'p1', 'q1', 1, '', DORA_SCALE).rating).toBe(1);
    });

    it('accepts the last DORA option value', () => {
      expect(createSurveyResponse('r1', 'p1', 'q1', 7, '', DORA_SCALE).rating).toBe(7);
    });
  });
});
