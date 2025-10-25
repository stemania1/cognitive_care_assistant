import { RecentAnswer } from '@/types/daily-questions';
import { formatDate, formatTime } from '@/utils/date';
import { useTableScroll } from '@/hooks/useTableScroll';
import { useRef, useState, useEffect } from 'react';
import { ALL_QUESTIONS } from '@/constants/questions';

interface RecentAnswersTableProps {
  recentAnswers: RecentAnswer[];
  onDeleteDailyChecks: (date: string) => void;
}

export function RecentAnswersTable({ recentAnswers, onDeleteDailyChecks }: RecentAnswersTableProps) {
  const { scrollPosition, scrollUp, scrollDown } = useTableScroll('answers-table');
  const tableRef = useRef<HTMLDivElement>(null);
  const [horizontalScrollPosition, setHorizontalScrollPosition] = useState(0);
  const [maxHorizontalScroll, setMaxHorizontalScroll] = useState(0);

  // Update horizontal scroll position and max scroll
  useEffect(() => {
    const updateScrollInfo = () => {
      if (tableRef.current) {
        const element = tableRef.current;
        setHorizontalScrollPosition(element.scrollLeft);
        setMaxHorizontalScroll(element.scrollWidth - element.clientWidth);
        // Removed console logging for cleaner output
      }
    };

    const element = tableRef.current;
    if (element) {
      element.addEventListener('scroll', updateScrollInfo);
      updateScrollInfo(); // Initial update
      
      return () => element.removeEventListener('scroll', updateScrollInfo);
    }
  }, [recentAnswers]);

  const handleHorizontalScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scrollValue = parseInt(e.target.value);
    if (tableRef.current) {
      tableRef.current.scrollLeft = scrollValue;
    }
  };

  if (recentAnswers.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-medium mb-4">Recent Answers</h3>
        <div className="text-center text-white/60 py-4">
          No answers saved yet. Complete some questions and save to see your history here.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-medium">Recent Answers</h3>
          <div className="text-xs text-white/50 mt-1">
            Use ↑↓ arrows or scroll buttons to navigate
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-white/50 mr-2">
            {Math.round(scrollPosition)}%
          </div>
          <button
            onClick={scrollUp}
            className="px-3 py-1 rounded-md bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm"
            title="Scroll up (↑)"
          >
            ↑
          </button>
          <button
            onClick={scrollDown}
            className="px-3 py-1 rounded-md bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm"
            title="Scroll down (↓)"
          >
            ↓
          </button>
        </div>
      </div>
      
      <div className="relative">
        {/* Frozen first column */}
        <div className="absolute left-0 top-0 z-10 bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] border-r border-white/10">
          <div className="overflow-x-auto max-h-96 overflow-y-auto" id="answers-table">
            <table className="text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 font-medium text-cyan-300 w-32">Question</th>
                </tr>
              </thead>
              <tbody>
                {recentAnswers.map((dayData, dayIdx) => (
                  <tr key={dayIdx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-3 text-white/90 font-medium">
                      <div className="text-xs">
                        {formatDate(dayData.date)}
                      </div>
                      <div className="text-xs text-white/60">
                        {dayData.created_at ? 
                          formatTime(dayData.created_at) : 
                          'Time not available'
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto ml-32" ref={tableRef}>
          <table className="text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b border-white/10">
                {ALL_QUESTIONS.map((question, index) => (
                  <th key={question.id} className="text-left py-2 px-3 font-medium text-cyan-300 min-w-48">
                    <div className="text-sm text-white/90">{index + 1}. {question.text}</div>
                  </th>
                ))}
                <th className="text-center py-2 px-3 font-medium text-cyan-300 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAnswers.map((dayData, dayIdx) => (
                <tr key={dayIdx} className="border-b border-white/5 hover:bg-white/5">
                  {ALL_QUESTIONS.map((question, qIndex) => {
                    const qa = dayData.answers.find(answer => answer.question_id === question.id);
                    return (
                      <td key={question.id} className="py-3 px-3 text-white/70 min-w-48">
                        {qa ? (
                          <div className="truncate" title={qa.answer}>
                            {qa.answer}
                          </div>
                        ) : (
                          <div className="text-white/40 italic">No answer</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onDeleteDailyChecks(dayData.date)}
                      className="px-3 py-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors text-xs font-medium"
                      title="Delete this day's answers"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Horizontal Scroll Slider */}
      {maxHorizontalScroll > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">←</span>
            <input
              type="range"
              min="0"
              max={maxHorizontalScroll}
              value={horizontalScrollPosition}
              onChange={handleHorizontalScroll}
              className="flex-1 h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: 'transparent'
              }}
            />
            <span className="text-xs text-white/50">→</span>
          </div>
          <div className="text-xs text-white/40 mt-1 text-center">
            Scroll horizontally to see more columns
          </div>
        </div>
      )}
    </div>
  );
}
