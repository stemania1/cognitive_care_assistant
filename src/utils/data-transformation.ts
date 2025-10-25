import { RecentAnswer } from '@/types/daily-questions';
import { ALL_QUESTIONS } from '@/constants/questions';

export function groupAnswersByQuestionSets(answers: any[]): RecentAnswer[] {
  // Group by date and question set (3 questions at a time)
  const grouped = answers.reduce((acc: any, check: any) => {
    const date = check.date;
    const questionId = check.question_id;
    
    // Find the question index in ALL_QUESTIONS array
    const questionIndex = ALL_QUESTIONS.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      console.warn(`Question ID ${questionId} not found in ALL_QUESTIONS`);
      return acc;
    }
    
    const setIndex = Math.floor(questionIndex / 3); // Group every 3 questions
    const key = `${date}-set${setIndex}`;
    
    if (!acc[key]) {
      acc[key] = { 
        date, 
        created_at: check.created_at, 
        setIndex,
        answers: [] 
      };
    }
    
    // Find the answer for this question in the set
    const answerIndex = questionIndex % 3; // Position within the set (0, 1, or 2)
    
    // Ensure answers array has the right length
    while (acc[key].answers.length <= answerIndex) {
      acc[key].answers.push({ question: '', answer: '' });
    }
    
    acc[key].answers[answerIndex] = {
      question_id: questionId,
      question: check.question_text,
      answer: check.answer
    };
    
    return acc;
  }, {});
  
  // Convert to array and sort by date and set (newest first)
  const sortedAnswers = Object.values(grouped).sort((a: any, b: any) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return b.setIndex - a.setIndex; // Within same date, newer sets first
  }) as RecentAnswer[];
  
  return sortedAnswers.slice(0, 10); // Show last 10 sets (up to 30 questions)
}
