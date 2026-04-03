import { useState } from 'react';
import type { Timer } from '../../domain/retro/Timer';
import type { CheckTemplate, CheckQuestion } from '../../domain/retro/CheckTemplate';
import type { SurveyResponse } from '../../domain/retro/SurveyResponse';
import type { Participant } from '../../domain/retro/Participant';
import { PresentTimer } from '../components/PresentTimer';

export interface SurveyPageProps {
  timer: Timer;
  checkTemplate: CheckTemplate;
  currentParticipantId: string | null;
  surveyResponses: readonly SurveyResponse[];
  participants: readonly Participant[];
  onSubmitResponse: (participantId: string, questionId: string, rating: number, comment: string) => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
}

function QuestionRow({
  question,
  response,
  onRate,
  onComment,
}: {
  question: CheckQuestion;
  response: SurveyResponse | undefined;
  onRate: (rating: number) => void;
  onComment: (comment: string) => void;
}): JSX.Element {
  const [commentDraft, setCommentDraft] = useState(response?.comment ?? '');
  const isNumericOnly = question.options.every((o) => o.label === String(o.value));

  return (
    <div className="survey-question" aria-label={`Question: ${question.title}`}>
      <div className="survey-question-header">
        <h3 className="survey-question-title">{question.title}</h3>
        <p className="survey-question-description">{question.description}</p>
      </div>
      <div className="survey-question-body">
        <div className="survey-rating" role="radiogroup" aria-label={`Rating for ${question.title}`}>
          {isNumericOnly ? (
            <div className="survey-rating-circles">
              {question.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`survey-circle${response?.rating === opt.value ? ' selected' : ''}`}
                  aria-pressed={response?.rating === opt.value}
                  onClick={(): void => { onRate(opt.value); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="survey-rating-labels">
              {question.options.map((opt) => (
                <label key={opt.value} className={`survey-radio-label${response?.rating === opt.value ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name={`rating-${question.id}`}
                    value={opt.value}
                    checked={response?.rating === opt.value}
                    onChange={(): void => { onRate(opt.value); }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="survey-comment">
          <input
            type="text"
            placeholder="Additional comments..."
            aria-label={`Comment for ${question.title}`}
            value={commentDraft}
            onChange={(e): void => { setCommentDraft(e.target.value); }}
            onBlur={(): void => {
              if (commentDraft.trim() !== (response?.comment ?? '')) {
                onComment(commentDraft);
              }
            }}
            onKeyDown={(e): void => {
              if (e.key === 'Enter') {
                onComment(commentDraft);
              }
            }}
          />
        </div>
        {response !== undefined && (
          <span className="survey-saved" aria-label="Saved">SAVED</span>
        )}
      </div>
    </div>
  );
}

export function SurveyPage({
  timer,
  checkTemplate,
  currentParticipantId,
  surveyResponses,
  participants,
  onSubmitResponse,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
}: SurveyPageProps): JSX.Element {
  const myResponses = surveyResponses.filter(
    (r) => r.participantId === currentParticipantId,
  );
  const responseByQuestion = new Map(myResponses.map((r) => [r.questionId, r]));
  const answeredCount = myResponses.length;
  const totalQuestions = checkTemplate.questions.length;
  const allAnswered = answeredCount >= totalQuestions;

  const totalResponses = surveyResponses.length;
  const totalExpected = participants.length * totalQuestions;
  const waitingOnOthers = totalResponses < totalExpected && allAnswered;

  return (
    <section aria-label="Survey" className="survey-page">
      <PresentTimer
        timer={timer}
        onStart={onStartTimer}
        onPause={onPauseTimer}
        onResume={onResumeTimer}
        onReset={onResetTimer}
      />
      <div className="survey-questions">
        {checkTemplate.questions.map((q) => (
          <QuestionRow
            key={q.id}
            question={q}
            response={responseByQuestion.get(q.id)}
            onRate={(rating): void => {
              if (currentParticipantId !== null) {
                const existing = responseByQuestion.get(q.id);
                onSubmitResponse(currentParticipantId, q.id, rating, existing?.comment ?? '');
              }
            }}
            onComment={(comment): void => {
              if (currentParticipantId !== null) {
                const existing = responseByQuestion.get(q.id);
                if (existing !== undefined) {
                  onSubmitResponse(currentParticipantId, q.id, existing.rating, comment);
                }
              }
            }}
          />
        ))}
      </div>
      <div className="survey-footer">
        {waitingOnOthers ? (
          <span className="survey-status">Waiting on others to finish rating...</span>
        ) : !allAnswered ? (
          <span className="survey-status">
            {answeredCount} of {totalQuestions} answered
          </span>
        ) : (
          <span className="survey-status">All questions answered</span>
        )}
      </div>
    </section>
  );
}
