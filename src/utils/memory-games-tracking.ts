import { GameSession, GameStats } from '@/types/memory-games';

const STORAGE_KEYS = {
  MEMORY_SESSIONS: 'games:memory:sessions',
  JIGSAW_SESSIONS: 'games:jigsaw:sessions',
  MEMORY_STATS: 'games:memory:stats',
  JIGSAW_STATS: 'games:jigsaw:stats',
} as const;

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveGameSession(gameType: 'memory' | 'jigsaw', session: Omit<GameSession, 'id'>): void {
  try {
    const sessionKey = gameType === 'memory' ? STORAGE_KEYS.MEMORY_SESSIONS : STORAGE_KEYS.JIGSAW_SESSIONS;
    const statsKey = gameType === 'memory' ? STORAGE_KEYS.MEMORY_STATS : STORAGE_KEYS.JIGSAW_STATS;
    
    const fullSession: GameSession = {
      ...session,
      id: generateSessionId(),
    };
    
    // Save session
    const sessionsRaw = localStorage.getItem(sessionKey);
    const sessions: GameSession[] = sessionsRaw ? JSON.parse(sessionsRaw) : [];
    sessions.push(fullSession);
    localStorage.setItem(sessionKey, JSON.stringify(sessions));
    
    // Update stats
    const statsRaw = localStorage.getItem(statsKey);
    const stats: GameStats = statsRaw ? JSON.parse(statsRaw) : {
      totalCompletions: 0,
      totalIncorrectAttempts: 0,
      averageCompletionTime: 0,
      bestTime: Infinity,
      sessions: []
    };
    
    if (session.completed) {
      stats.totalCompletions += 1;
      stats.totalIncorrectAttempts += session.incorrectAttempts;
      
      // Update best time
      if (session.durationMs < stats.bestTime) {
        stats.bestTime = session.durationMs;
      }
      
      // Calculate average completion time
      const completedSessions = sessions.filter(s => s.completed);
      if (completedSessions.length > 0) {
        const totalTime = completedSessions.reduce((sum, s) => sum + s.durationMs, 0);
        stats.averageCompletionTime = totalTime / completedSessions.length;
      }
    }
    
    stats.sessions = sessions.slice(-50); // Keep last 50 sessions
    localStorage.setItem(statsKey, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving game session:', error);
  }
}

export function getGameStats(gameType: 'memory' | 'jigsaw'): GameStats {
  try {
    const statsKey = gameType === 'memory' ? STORAGE_KEYS.MEMORY_STATS : STORAGE_KEYS.JIGSAW_STATS;
    const statsRaw = localStorage.getItem(statsKey);
    
    if (statsRaw) {
      return JSON.parse(statsRaw);
    }
  } catch (error) {
    console.error('Error loading game stats:', error);
  }
  
  return {
    totalCompletions: 0,
    totalIncorrectAttempts: 0,
    averageCompletionTime: 0,
    bestTime: Infinity,
    sessions: []
  };
}

export function getRecentSessions(gameType: 'memory' | 'jigsaw', limit: number = 10): GameSession[] {
  try {
    const sessionKey = gameType === 'memory' ? STORAGE_KEYS.MEMORY_SESSIONS : STORAGE_KEYS.JIGSAW_SESSIONS;
    const sessionsRaw = localStorage.getItem(sessionKey);
    
    if (sessionsRaw) {
      const sessions: GameSession[] = JSON.parse(sessionsRaw);
      return sessions.slice(-limit).reverse(); // Most recent first
    }
  } catch (error) {
    console.error('Error loading recent sessions:', error);
  }
  
  return [];
}
