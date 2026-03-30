export interface AnswerOption {
  readonly value: number;
  readonly label: string;
}

export interface CheckQuestion {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly options: readonly AnswerOption[];
}

export interface CheckTemplate {
  readonly id: string;
  readonly name: string;
  readonly questions: readonly CheckQuestion[];
}

export const CHECK_TEMPLATES: readonly CheckTemplate[] = [
  {
    id: 'health-check',
    name: 'Health Check',
    questions: [
      {
        id: 'ownership',
        title: 'Ownership',
        description:
          'The team has clear ownership or a dedicated product owner who is accountable for the team\'s results and champions the mission inside and outside of the team.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'value',
        title: 'Value',
        description:
          'We can define and measure the value we provide to the business and the user.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'goal-alignment',
        title: 'Goal Alignment',
        description:
          'Everyone understands why they are here, supports the idea, and believes they have what it takes to create solutions that add value.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'communication',
        title: 'Communication',
        description:
          'We have clear and consistent communication that ensures that issues are shared, conflict is reduced, and everyone can work with greater efficiency.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'team-roles',
        title: 'Team Roles',
        description:
          'The current team skill set is right for the current stage and there are clear roles and responsibilities for each person in the team.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'velocity',
        title: 'Velocity',
        description:
          'We learn and implement lessons leading to incremental progress in iterations and production as we go.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'support-and-resources',
        title: 'Support And Resources',
        description:
          'We are equipped with the right tools and resources and can easily access support from within and outside the team.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'process',
        title: 'Process',
        description:
          'Our processes are aligned, effective, and free of unnecessary delays and blocks. We have metrics in place to measure our goals.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
      {
        id: 'fun',
        title: 'Fun',
        description:
          'We enjoy our work and working as a team. We are being challenged and can develop our skill set or acquire new ones.',
        options: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
        ],
      },
    ],
  },
];

export const DEFAULT_CHECK_TEMPLATE_ID = 'health-check';

export function getCheckTemplate(id: string): CheckTemplate {
  return CHECK_TEMPLATES.find((t) => t.id === id) ?? CHECK_TEMPLATES[0];
}

export function maxLevelForQuestion(question: CheckQuestion): number {
  return Math.max(...question.options.map((o) => o.value));
}
