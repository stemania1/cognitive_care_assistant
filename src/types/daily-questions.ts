export interface Question {
  id: string;
  text: string;
  choices?: string[];
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
}

export interface RecentAnswer {
  date: string;
  created_at?: string;
  setIndex: number;
  answers: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ChartDataPoint {
  seconds: number;
  x: number;
  y: number;
}
