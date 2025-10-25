interface QuestionNavigationProps {
  windowStart: number;
  totalQuestions: number;
  questionsPerPage: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionNavigation({ windowStart, totalQuestions, questionsPerPage, onPrevious, onNext }: QuestionNavigationProps) {
  // Calculate previous range
  const prevStart = Math.max(1, windowStart - questionsPerPage + 1);
  const prevEnd = windowStart;
  
  // Calculate next range
  const nextStart = windowStart + questionsPerPage + 1;
  const nextEnd = Math.min(windowStart + (questionsPerPage * 2), totalQuestions);

  // Check if ranges are valid
  const hasPrevious = windowStart > 0 && prevStart <= prevEnd;
  const hasNext = windowStart + questionsPerPage < totalQuestions && nextStart <= nextEnd;

  return (
    <div className="flex items-center justify-between">
      {hasPrevious ? (
        <button
          onClick={onPrevious}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          type="button"
        >
          ← Questions {prevStart}-{prevEnd}
        </button>
      ) : (
        <div className="px-4 py-2"></div>
      )}
      
      {hasNext ? (
        <button
          onClick={onNext}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          type="button"
        >
          Questions {nextStart}-{nextEnd} →
        </button>
      ) : (
        <div className="px-4 py-2"></div>
      )}
    </div>
  );
}
