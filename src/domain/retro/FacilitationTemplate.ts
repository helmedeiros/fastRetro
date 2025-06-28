export interface ColumnTemplate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface FacilitationTemplate {
  readonly id: string;
  readonly name: string;
  readonly columns: readonly ColumnTemplate[];
}

export const TEMPLATES: readonly FacilitationTemplate[] = [
  {
    id: 'start-stop',
    name: 'Start / Stop',
    columns: [
      { id: 'stop', title: 'Stop', description: 'What factors are slowing us down or holding us back?' },
      { id: 'start', title: 'Start', description: 'What factors are driving us forward and enabling our success?' },
    ],
  },
  {
    id: 'anchors-engines',
    name: 'Anchors & Engines',
    columns: [
      { id: 'anchors', title: 'Anchors', description: 'What factors are slowing us down or holding us back?' },
      { id: 'engines', title: 'Engines', description: 'What factors are driving us forward and enabling our success?' },
    ],
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad Sad Glad',
    columns: [
      { id: 'mad', title: 'Mad', description: 'What made you frustrated or angry?' },
      { id: 'sad', title: 'Sad', description: 'What disappointed you or could have been better?' },
      { id: 'glad', title: 'Glad', description: 'What made you happy or went well?' },
    ],
  },
  {
    id: 'four-ls',
    name: 'Four Ls',
    columns: [
      { id: 'liked', title: 'Liked', description: 'What did you like about this iteration?' },
      { id: 'learned', title: 'Learned', description: 'What did you learn?' },
      { id: 'lacked', title: 'Lacked', description: 'What was missing or lacking?' },
      { id: 'longed-for', title: 'Longed for', description: 'What do you wish for in the future?' },
    ],
  },
  {
    id: 'kalm',
    name: 'KALM',
    columns: [
      { id: 'keep', title: 'Keep', description: 'What should we keep doing?' },
      { id: 'add', title: 'Add', description: 'What should we add or start doing?' },
      { id: 'less', title: 'Less', description: 'What should we do less of?' },
      { id: 'more', title: 'More', description: 'What should we do more of?' },
    ],
  },
  {
    id: 'starfish',
    name: 'Starfish',
    columns: [
      { id: 'start', title: 'Start', description: 'What should we start doing?' },
      { id: 'more-of', title: 'More of', description: 'What should we do more of?' },
      { id: 'continue', title: 'Continue', description: 'What should we continue doing?' },
      { id: 'less-of', title: 'Less of', description: 'What should we do less of?' },
      { id: 'stop', title: 'Stop', description: 'What should we stop doing?' },
    ],
  },
];

export const DEFAULT_TEMPLATE_ID = 'start-stop';

export function getTemplate(id: string): FacilitationTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
