import { RecentAnswer } from '@/types/daily-questions';
import { useRef } from 'react';
import { ALL_QUESTIONS } from '@/constants/questions';

interface RecentAnswersTableProps {
  recentAnswers: RecentAnswer[];
  onDeleteDailyChecks: (date: string) => void;
}

export function RecentAnswersTable({ recentAnswers, onDeleteDailyChecks }: RecentAnswersTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  // Always show the table structure, even if no answers yet
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-medium">Recent Answers</h3>
        </div>
      </div>
      
      <div className="relative">
        {/* Scrollable content */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto" ref={tableRef}>
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
              {recentAnswers.length === 0 ? (
                // Show a single row with "No answer" for all questions when no answers exist
                <tr className="border-b border-white/5 hover:bg-white/5">
                  {ALL_QUESTIONS.map((question) => (
                    <td key={question.id} className="py-3 px-3 text-white/40 italic min-w-48">
                      No answer
                    </td>
                  ))}
                  <td className="py-3 px-3 text-center">
                    <span className="text-white/40 italic text-xs">No data</span>
                  </td>
                </tr>
              ) : (
                recentAnswers.map((dayData, dayIdx) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
