export interface GameSession {
  id: string;
  gameType: 'memory' | 'jigsaw';
  startTime: string;
  endTime: string;
  durationMs: number;
  incorrectAttempts: number;
  completed: boolean;
}

export interface GameStats {
  totalCompletions: number;
  totalIncorrectAttempts: number;
  averageCompletionTime: number;
  bestTime: number;
  sessions: GameSession[];
}

export interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}
