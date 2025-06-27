export interface ColumnTemplate {
  readonly title: string;
  readonly description: string;
}

export interface FacilitationTemplate {
  readonly id: string;
  readonly name: string;
  readonly columns: {
    readonly stop: ColumnTemplate;
    readonly start: ColumnTemplate;
  };
}

export const TEMPLATES: readonly FacilitationTemplate[] = [
  {
    id: 'start-stop',
    name: 'Start / Stop',
    columns: {
      stop: {
        title: 'Stop',
        description: 'What factors are slowing us down or holding us back?',
      },
      start: {
        title: 'Start',
        description: 'What factors are driving us forward and enabling our success?',
      },
    },
  },
  {
    id: 'anchors-engines',
    name: 'Anchors & Engines',
    columns: {
      stop: {
        title: 'Anchors',
        description: 'What factors are slowing us down or holding us back?',
      },
      start: {
        title: 'Engines',
        description: 'What factors are driving us forward and enabling our success?',
      },
    },
  },
];

export const DEFAULT_TEMPLATE_ID = 'start-stop';

export function getTemplate(id: string): FacilitationTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
