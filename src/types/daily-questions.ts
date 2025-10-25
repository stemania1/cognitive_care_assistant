export interface Question {
  id: string;
  text: string;
  choices?: string[];
  allowPhoto?: boolean; // Allow photo upload for this question
}

export interface StoredAnswer {
  v: string;
  t: string;
}

export interface DailyCheckSession {
  id: string;
  created_at: string;
  duration_ms: number;
  set_start_index: number;
  date: string;
}

export interface RecentAnswer {
  date: string;
  created_at?: string;
  setIndex: number;
  answers: Array<{
    question_id?: string;
    question: string;
    answer: string;
    photo_url?: string;
  }>;
}

export interface ChartDataPoint {
  seconds: number;
  x: number;
  y: number;
}
