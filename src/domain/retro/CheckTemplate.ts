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
  {
    id: 'dora-metrics',
    name: 'DORA Metrics Quiz',
    questions: [
      {
        id: 'lead-time',
        title: 'Lead Time for Changes',
        description:
          'For the primary application or service you work on, what is your lead time for changes (that is, how long does it take to go from code committed to code successfully running in production)?',
        options: [
          { value: 1, label: 'More than six months' },
          { value: 2, label: 'One to six months' },
          { value: 3, label: 'One week to one month' },
          { value: 4, label: 'One day to one week' },
          { value: 5, label: 'Less than one day' },
          { value: 6, label: 'Less than one hour' },
        ],
      },
      {
        id: 'deploy-frequency',
        title: 'Deploy Frequency',
        description:
          'For the primary application or service you work on, how often does your organization deploy code to production or release it to end users?',
        options: [
          { value: 1, label: 'Less than once per six months' },
          { value: 2, label: 'Between once per month and once every six months' },
          { value: 3, label: 'Between once per week and once per month' },
          { value: 4, label: 'Between once per day and once per week' },
          { value: 5, label: 'Between once per hour and once per day' },
          { value: 6, label: 'On demand (multiple deploys per day)' },
        ],
      },
      {
        id: 'failure-recovery',
        title: 'Failure Recovery',
        description:
          'For the primary application or service you work on, how long does it generally take to restore service after a change to production or release to users results in degraded service?',
        options: [
          { value: 1, label: 'More than six months' },
          { value: 2, label: 'One to six months' },
          { value: 3, label: 'One week to one month' },
          { value: 4, label: 'One day to one week' },
          { value: 5, label: 'Less than one day' },
          { value: 6, label: 'Less than one hour' },
        ],
      },
      {
        id: 'change-failure-rate',
        title: 'Change Failure Rate',
        description:
          'For the primary application or service you work on, what percentage of changes to production or releases to users result in degraded service and subsequently require remediation?',
        options: [
          { value: 1, label: '76-100%' },
          { value: 2, label: '46-75%' },
          { value: 3, label: '16-45%' },
          { value: 4, label: '0-15%' },
        ],
      },
      {
        id: 'reliability',
        title: 'Reliability',
        description:
          'How would you rate the reliability of the primary application or service you work on, considering its availability and performance against your targets?',
        options: [
          { value: 1, label: 'Very low — frequently misses targets' },
          { value: 2, label: 'Low — occasionally misses targets' },
          { value: 3, label: 'Medium — meets targets most of the time' },
          { value: 4, label: 'High — consistently meets targets' },
          { value: 5, label: 'Very high — exceeds targets' },
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
