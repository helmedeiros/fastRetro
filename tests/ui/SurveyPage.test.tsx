import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SurveyPage } from '../../src/ui/pages/SurveyPage';
import { createTimer } from '../../src/domain/retro/Timer';
import { getCheckTemplate } from '../../src/domain/retro/CheckTemplate';
import type { SurveyResponse } from '../../src/domain/retro/SurveyResponse';

function noop(): void {
  // intentionally empty
}

const timer = createTimer(10 * 60 * 1000);
const template = getCheckTemplate('health-check');
const participants = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
];

describe('SurveyPage', () => {
  it('renders all questions from the template', () => {
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={[]}
        participants={participants}
        onSubmitResponse={noop}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    for (const q of template.questions) {
      expect(screen.getByText(q.title)).toBeInTheDocument();
    }
  });

  it('renders rating circles for numeric options', () => {
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={[]}
        participants={participants}
        onSubmitResponse={noop}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    // Each question should have 5 rating buttons
    const questionRegion = screen.getByLabelText(/Question: Ownership/);
    const buttons = questionRegion.querySelectorAll('.survey-circle');
    expect(buttons).toHaveLength(5);
  });

  it('calls onSubmitResponse when clicking a rating', () => {
    const onSubmit = vi.fn();
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={[]}
        participants={participants}
        onSubmitResponse={onSubmit}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    const questionRegion = screen.getByLabelText(/Question: Ownership/);
    const buttons = questionRegion.querySelectorAll('.survey-circle');
    fireEvent.click(buttons[3]); // rating 4
    expect(onSubmit).toHaveBeenCalledWith('p1', 'ownership', 4, '');
  });

  it('shows SAVED indicator for answered questions', () => {
    const responses: SurveyResponse[] = [
      { id: 'r1', participantId: 'p1', questionId: 'ownership', rating: 3, comment: '' },
    ];
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={responses}
        participants={participants}
        onSubmitResponse={noop}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    const saved = screen.getAllByText('SAVED');
    expect(saved.length).toBeGreaterThanOrEqual(1);
  });

  it('highlights the selected rating circle', () => {
    const responses: SurveyResponse[] = [
      { id: 'r1', participantId: 'p1', questionId: 'ownership', rating: 4, comment: '' },
    ];
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={responses}
        participants={participants}
        onSubmitResponse={noop}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    const questionRegion = screen.getByLabelText(/Question: Ownership/);
    const selected = questionRegion.querySelectorAll('.survey-circle.selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toBe('4');
  });

  it('shows answer count when not all answered', () => {
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={[]}
        participants={participants}
        onSubmitResponse={noop}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    expect(screen.getByText(/0 of 9 answered/)).toBeInTheDocument();
  });

  it('shows all answered when complete', () => {
    const responses: SurveyResponse[] = template.questions.map((q, i) => ({
      id: `r${i}`,
      participantId: 'p1',
      questionId: q.id,
      rating: 3,
      comment: '',
    }));
    render(
      <SurveyPage
        timer={timer}
        checkTemplate={template}
        currentParticipantId="p1"
        surveyResponses={responses}
        participants={participants}
        onSubmitResponse={noop}
        onStartTimer={noop}
        onPauseTimer={noop}
        onResumeTimer={noop}
        onResetTimer={noop}
      />,
    );
    expect(screen.getByText(/waiting on others/i)).toBeInTheDocument();
  });
});
