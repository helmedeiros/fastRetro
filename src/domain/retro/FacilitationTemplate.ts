export interface ColumnTemplate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly color: string;
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
      { id: 'stop', title: 'Stop', description: 'What factors are slowing us down or holding us back?', color: '#e06060' },
      { id: 'start', title: 'Start', description: 'What factors are driving us forward and enabling our success?', color: '#6ec76e' },
    ],
  },
  {
    id: 'anchors-engines',
    name: 'Anchors & Engines',
    columns: [
      { id: 'anchors', title: 'Anchors', description: 'What factors are slowing us down or holding us back?', color: '#e06060' },
      { id: 'engines', title: 'Engines', description: 'What factors are driving us forward and enabling our success?', color: '#6ec76e' },
    ],
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad Sad Glad',
    columns: [
      { id: 'mad', title: 'Mad', description: 'What made you frustrated or angry?', color: '#e06060' },
      { id: 'sad', title: 'Sad', description: 'What disappointed you or could have been better?', color: '#d4a84e' },
      { id: 'glad', title: 'Glad', description: 'What made you happy or went well?', color: '#6ec76e' },
    ],
  },
  {
    id: 'four-ls',
    name: 'Four Ls',
    columns: [
      { id: 'liked', title: 'Liked', description: 'What did you like about this iteration?', color: '#6ec76e' },
      { id: 'learned', title: 'Learned', description: 'What did you learn?', color: '#d4a84e' },
      { id: 'lacked', title: 'Lacked', description: 'What was missing or lacking?', color: '#e06060' },
      { id: 'longed-for', title: 'Longed for', description: 'What do you wish for in the future?', color: '#7a8fe0' },
    ],
  },
  {
    id: 'kalm',
    name: 'KALM',
    columns: [
      { id: 'keep', title: 'Keep', description: 'What should we keep doing?', color: '#6ec76e' },
      { id: 'add', title: 'Add', description: 'What should we add or start doing?', color: '#7a8fe0' },
      { id: 'less', title: 'Less', description: 'What should we do less of?', color: '#e06060' },
      { id: 'more', title: 'More', description: 'What should we do more of?', color: '#5ec4c8' },
    ],
  },
  {
    id: 'starfish',
    name: 'Starfish',
    columns: [
      { id: 'start', title: 'Start', description: 'What should we start doing?', color: '#6ec76e' },
      { id: 'more-of', title: 'More of', description: 'What should we do more of?', color: '#7a8fe0' },
      { id: 'continue', title: 'Continue', description: 'What should we continue doing?', color: '#d4a84e' },
      { id: 'less-of', title: 'Less of', description: 'What should we do less of?', color: '#e09060' },
      { id: 'stop', title: 'Stop', description: 'What should we stop doing?', color: '#e06060' },
    ],
  },
];

export const DEFAULT_TEMPLATE_ID = 'start-stop';

export function getTemplate(id: string): FacilitationTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
