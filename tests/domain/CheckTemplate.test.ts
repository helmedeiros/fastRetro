import { describe, it, expect } from 'vitest';
import {
  CHECK_TEMPLATES,
  DEFAULT_CHECK_TEMPLATE_ID,
  getCheckTemplate,
  maxLevelForQuestion,
} from '../../src/domain/retro/CheckTemplate';
import type { CheckQuestion } from '../../src/domain/retro/CheckTemplate';

describe('CheckTemplate', () => {
  describe('CHECK_TEMPLATES', () => {
    it('contains the health-check template', () => {
      const hc = CHECK_TEMPLATES.find((t) => t.id === 'health-check');
      expect(hc).toBeDefined();
      expect(hc!.name).toBe('Health Check');
    });

    it('health-check has 9 questions', () => {
      const hc = getCheckTemplate('health-check');
      expect(hc.questions).toHaveLength(9);
    });

    it('each question has a unique id', () => {
      const hc = getCheckTemplate('health-check');
      const ids = hc.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each question has a non-empty title, description, and options', () => {
      const hc = getCheckTemplate('health-check');
      for (const q of hc.questions) {
        expect(q.title.length).toBeGreaterThan(0);
        expect(q.description.length).toBeGreaterThan(0);
        expect(q.options.length).toBeGreaterThan(0);
      }
    });

    it('each option has a positive integer value and a non-empty label', () => {
      const hc = getCheckTemplate('health-check');
      for (const q of hc.questions) {
        for (const opt of q.options) {
          expect(opt.value).toBeGreaterThan(0);
          expect(Number.isInteger(opt.value)).toBe(true);
          expect(opt.label.length).toBeGreaterThan(0);
        }
      }
    });

    it('options are sorted ascending by value', () => {
      const hc = getCheckTemplate('health-check');
      for (const q of hc.questions) {
        const values = q.options.map((o) => o.value);
        for (let i = 1; i < values.length; i++) {
          expect(values[i]).toBeGreaterThan(values[i - 1]);
        }
      }
    });

    it('health-check questions have 5 numeric options each', () => {
      const hc = getCheckTemplate('health-check');
      for (const q of hc.questions) {
        expect(q.options).toHaveLength(5);
        expect(q.options.map((o) => o.value)).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it('each template has a unique id', () => {
      const ids = CHECK_TEMPLATES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getCheckTemplate', () => {
    it('returns the template with the given id', () => {
      const hc = getCheckTemplate('health-check');
      expect(hc.id).toBe('health-check');
    });

    it('returns the first template for an unknown id', () => {
      const fallback = getCheckTemplate('nonexistent');
      expect(fallback.id).toBe(CHECK_TEMPLATES[0].id);
    });

    it('DEFAULT_CHECK_TEMPLATE_ID resolves to a valid template', () => {
      const tmpl = getCheckTemplate(DEFAULT_CHECK_TEMPLATE_ID);
      expect(tmpl.id).toBe(DEFAULT_CHECK_TEMPLATE_ID);
    });
  });

  describe('maxLevelForQuestion', () => {
    it('returns the highest option value for a question', () => {
      const hc = getCheckTemplate('health-check');
      expect(maxLevelForQuestion(hc.questions[0])).toBe(5);
    });

    it('works with non-standard option values', () => {
      const question: CheckQuestion = {
        id: 'custom',
        title: 'Custom',
        description: 'Test',
        options: [
          { value: 1, label: 'Low' },
          { value: 3, label: 'Medium' },
          { value: 7, label: 'High' },
        ],
      };
      expect(maxLevelForQuestion(question)).toBe(7);
    });
  });

  describe('health-check question content', () => {
    it('includes expected question titles', () => {
      const hc = getCheckTemplate('health-check');
      const titles = hc.questions.map((q) => q.title);
      expect(titles).toEqual([
        'Ownership',
        'Value',
        'Goal Alignment',
        'Communication',
        'Team Roles',
        'Velocity',
        'Support And Resources',
        'Process',
        'Fun',
      ]);
    });

    it('includes expected question ids', () => {
      const hc = getCheckTemplate('health-check');
      const ids = hc.questions.map((q) => q.id);
      expect(ids).toEqual([
        'ownership',
        'value',
        'goal-alignment',
        'communication',
        'team-roles',
        'velocity',
        'support-and-resources',
        'process',
        'fun',
      ]);
    });
  });
});
