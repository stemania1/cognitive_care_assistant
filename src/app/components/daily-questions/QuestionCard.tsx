import { Question } from '@/types/daily-questions';

interface QuestionCardProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-medium mb-3 text-white/90">{question.text}</h3>
      
      {question.choices ? (
        <div className="space-y-2">
          {question.choices.map((choice) => (
            <button
              key={choice}
              onClick={() => onChange(choice)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                value === choice
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
              type="button"
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
          className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/40"
        />
      )}
    </div>
  );
}
