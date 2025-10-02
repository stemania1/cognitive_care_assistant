interface QuestionNavigationProps {
  windowStart: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionNavigation({ windowStart, totalQuestions, onPrevious, onNext }: QuestionNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        type="button"
      >
        ← Previous 3
      </button>
      
      <span className="text-xs opacity-70">
        Questions {((windowStart % totalQuestions) + 1)}–{(((windowStart + 2) % totalQuestions) + 1)} of {totalQuestions}
      </span>
      
      <button
        onClick={onNext}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        type="button"
      >
        Next 3 →
      </button>
    </div>
  );
}
