interface QuestionNavigationProps {
  windowStart: number;
  totalQuestions: number;
  questionsPerPage: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionNavigation({ windowStart, totalQuestions, questionsPerPage, onPrevious, onNext }: QuestionNavigationProps) {
  // Calculate current range
  const currentStart = windowStart + 1;
  const currentEnd = Math.min(windowStart + questionsPerPage, totalQuestions);
  
  // Calculate previous range
  const prevStart = Math.max(1, windowStart - questionsPerPage + 1);
  const prevEnd = Math.min(windowStart, totalQuestions);
  
  // Calculate next range
  const nextStart = Math.min(windowStart + questionsPerPage + 1, totalQuestions);
  const nextEnd = Math.min(windowStart + (questionsPerPage * 2), totalQuestions);

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        type="button"
        disabled={windowStart === 0}
      >
        ← Questions {prevStart}-{prevEnd}
      </button>
      
      <button
        onClick={onNext}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        type="button"
        disabled={windowStart + questionsPerPage >= totalQuestions}
      >
        Questions {nextStart}-{nextEnd} →
      </button>
    </div>
  );
}
