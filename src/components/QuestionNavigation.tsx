/**
 * Question Navigation Component
 * Features: Bookmarking, quick navigation, progress indicator, question palette
 */

import { useState } from 'react';
import { CheckCircle2, Circle, Flag, ChevronLeft, ChevronRight, List, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface Question {
  question_id: number;
  content: string;
  question_type: string;
}

interface QuestionNavigationProps {
  questions: Question[];
  currentQuestionIndex: number;
  answeredQuestions: number[];
  bookmarkedQuestions: number[];
  onNavigate: (index: number) => void;
  onToggleBookmark: (questionId: number) => void;
  onReviewMode?: () => void;
  className?: string;
}

export default function QuestionNavigation({
  questions,
  currentQuestionIndex,
  answeredQuestions,
  bookmarkedQuestions,
  onNavigate,
  onToggleBookmark,
  onReviewMode,
  className
}: QuestionNavigationProps) {
  const [showPalette, setShowPalette] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = answeredQuestions.length;
  const bookmarkedCount = bookmarkedQuestions.length;
  const unansweredCount = totalQuestions - answeredCount;

  // Check question status
  const isAnswered = (questionId: number) => answeredQuestions.includes(questionId);
  const isBookmarked = (questionId: number) => bookmarkedQuestions.includes(questionId);
  const isCurrent = (index: number) => index === currentQuestionIndex;

  // Navigation handlers
  const goToNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      onNavigate(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      onNavigate(currentQuestionIndex - 1);
    }
  };

  const goToNextUnanswered = () => {
    const nextUnanswered = questions.findIndex(
      (q, idx) => idx > currentQuestionIndex && !answeredQuestions.includes(q.question_id)
    );
    if (nextUnanswered !== -1) {
      onNavigate(nextUnanswered);
    } else {
      // Wrap around to beginning
      const firstUnanswered = questions.findIndex(q => !answeredQuestions.includes(q.question_id));
      if (firstUnanswered !== -1) {
        onNavigate(firstUnanswered);
      }
    }
  };

  // Progress percentage
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  // Progress color
  const getProgressColor = () => {
    if (progressPercentage >= 67) return 'bg-emerald-500';
    if (progressPercentage >= 34) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
        
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full transition-all duration-300', getProgressColor())}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{answeredCount} Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="h-4 w-4 text-amber-500" />
            <span>{bookmarkedCount} Bookmarked</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-muted-foreground" />
            <span>{unansweredCount} Remaining</span>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleBookmark(currentQuestion.question_id)}
          className={cn(
            'px-3',
            isBookmarked(currentQuestion.question_id) && 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}
          title="Bookmark this question"
        >
          <Flag className={cn('h-4 w-4', isBookmarked(currentQuestion.question_id) && 'fill-current')} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPalette(!showPalette)}
          className="px-3"
          title="Question palette"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentQuestionIndex === totalQuestions - 1}
          className="flex-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={goToNextUnanswered}
          disabled={unansweredCount === 0}
          className="flex-1"
        >
          Jump to Next Unanswered
        </Button>
        {onReviewMode && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReviewMode}
            className="flex-1"
          >
            <Eye className="h-4 w-4" />
            Review All
          </Button>
        )}
      </div>

      {/* Question Palette */}
      {showPalette && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Question Palette</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPalette(false)}
              className="h-6 px-2 text-xs"
            >
              Close
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {questions.map((question, index) => {
              const answered = isAnswered(question.question_id);
              const bookmarked = isBookmarked(question.question_id);
              const current = isCurrent(index);

              return (
                <button
                  key={question.question_id}
                  onClick={() => {
                    onNavigate(index);
                    setShowPalette(false);
                  }}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-all',
                    current && 'ring-2 ring-indigo-500',
                    answered && !current && 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    !answered && !current && 'border-border bg-muted text-muted-foreground hover:bg-muted/70',
                    current && 'border-indigo-500 bg-indigo-500 text-white'
                  )}
                >
                  {index + 1}
                  {bookmarked && (
                    <Flag className="absolute -right-1 -top-1 h-3 w-3 fill-amber-500 text-amber-500" />
                  )}
                  {answered && !current && (
                    <CheckCircle2 className="absolute -bottom-1 -right-1 h-3 w-3 text-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border border-indigo-500 bg-indigo-500" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border border-emerald-500 bg-emerald-500/10">
                <CheckCircle2 className="h-full w-full text-emerald-500 p-1" />
              </div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 rounded border border-border bg-muted">
                <Flag className="absolute -right-0.5 -top-0.5 h-3 w-3 fill-amber-500 text-amber-500" />
              </div>
              <span>Bookmarked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border border-border bg-muted" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
