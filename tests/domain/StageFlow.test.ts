import { describe, it, expect } from 'vitest';
import {
  stagesForType,
  isValidStage,
  nextStage,
  previousStage,
} from '../../src/domain/retro/StageFlow';

describe('StageFlow', () => {
  describe('stagesForType', () => {
    it('returns retro stages for retro type', () => {
      const stages = stagesForType('retro');
      expect(stages).toEqual([
        'icebreaker',
        'brainstorm',
        'group',
        'vote',
        'discuss',
        'review',
        'close',
      ]);
    });

    it('returns check stages for check type', () => {
      const stages = stagesForType('check');
      expect(stages).toEqual([
        'icebreaker',
        'survey',
        'discuss',
        'review',
        'close',
      ]);
    });

    it('check stages do not include brainstorm, group, or vote', () => {
      const stages = stagesForType('check');
      expect(stages).not.toContain('brainstorm');
      expect(stages).not.toContain('group');
      expect(stages).not.toContain('vote');
    });

    it('retro stages do not include survey', () => {
      const stages = stagesForType('retro');
      expect(stages).not.toContain('survey');
    });
  });

  describe('isValidStage', () => {
    it('brainstorm is valid for retro', () => {
      expect(isValidStage('retro', 'brainstorm')).toBe(true);
    });

    it('brainstorm is invalid for check', () => {
      expect(isValidStage('check', 'brainstorm')).toBe(false);
    });

    it('survey is valid for check', () => {
      expect(isValidStage('check', 'survey')).toBe(true);
    });

    it('survey is invalid for retro', () => {
      expect(isValidStage('retro', 'survey')).toBe(false);
    });

    it('discuss is valid for both types', () => {
      expect(isValidStage('retro', 'discuss')).toBe(true);
      expect(isValidStage('check', 'discuss')).toBe(true);
    });

    it('setup is invalid for both types (not in stage flow)', () => {
      expect(isValidStage('retro', 'setup')).toBe(false);
      expect(isValidStage('check', 'setup')).toBe(false);
    });
  });

  describe('nextStage', () => {
    it('returns brainstorm after icebreaker for retro', () => {
      expect(nextStage('retro', 'icebreaker')).toBe('brainstorm');
    });

    it('returns survey after icebreaker for check', () => {
      expect(nextStage('check', 'icebreaker')).toBe('survey');
    });

    it('returns discuss after survey for check', () => {
      expect(nextStage('check', 'survey')).toBe('discuss');
    });

    it('returns null at the end (close)', () => {
      expect(nextStage('retro', 'close')).toBeNull();
      expect(nextStage('check', 'close')).toBeNull();
    });

    it('returns null for invalid stage', () => {
      expect(nextStage('retro', 'survey')).toBeNull();
      expect(nextStage('check', 'brainstorm')).toBeNull();
    });

    it('progresses through full retro flow', () => {
      const flow: string[] = [];
      let current = nextStage('retro', 'icebreaker');
      while (current !== null) {
        flow.push(current);
        current = nextStage('retro', current);
      }
      expect(flow).toEqual(['brainstorm', 'group', 'vote', 'discuss', 'review', 'close']);
    });

    it('progresses through full check flow', () => {
      const flow: string[] = [];
      let current = nextStage('check', 'icebreaker');
      while (current !== null) {
        flow.push(current);
        current = nextStage('check', current);
      }
      expect(flow).toEqual(['survey', 'discuss', 'review', 'close']);
    });
  });

  describe('previousStage', () => {
    it('returns icebreaker before brainstorm for retro', () => {
      expect(previousStage('retro', 'brainstorm')).toBe('icebreaker');
    });

    it('returns icebreaker before survey for check', () => {
      expect(previousStage('check', 'survey')).toBe('icebreaker');
    });

    it('returns null at the beginning (icebreaker)', () => {
      expect(previousStage('retro', 'icebreaker')).toBeNull();
      expect(previousStage('check', 'icebreaker')).toBeNull();
    });

    it('returns null for invalid stage', () => {
      expect(previousStage('retro', 'survey')).toBeNull();
      expect(previousStage('check', 'vote')).toBeNull();
    });

    it('returns review before close for check', () => {
      expect(previousStage('check', 'close')).toBe('review');
    });
  });
});
