import { GameSession, ChartDataPoint } from '@/types/memory-games';

interface GameStatsChartProps {
  sessions: GameSession[];
  gameType: 'memory' | 'jigsaw';
}

export function GameStatsChart({ sessions, gameType }: GameStatsChartProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-medium mb-4">
          {gameType === 'memory' ? 'Memory Cards' : 'Jigsaw Puzzle'} Performance
        </h3>
        <div className="text-center text-white/60 py-8">
          No game data available yet. Complete some games to see your performance!
        </div>
      </div>
    );
  }

  const completedSessions = sessions.filter(s => s.completed);
  
  if (completedSessions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-medium mb-4">
          {gameType === 'memory' ? 'Memory Cards' : 'Jigsaw Puzzle'} Performance
        </h3>
        <div className="text-center text-white/60 py-8">
          Complete a game to see your performance data!
        </div>
      </div>
    );
  }

  const padding = 40;
  const chartWidth = 400;
  const chartHeight = 200;

  // Prepare data for completion time chart
  const timeData = completedSessions.map((session, idx) => ({
    x: padding + (completedSessions.length > 1 ? (idx / (completedSessions.length - 1)) * chartWidth : chartWidth / 2),
    y: padding + chartHeight - (session.durationMs / Math.max(...completedSessions.map(s => s.durationMs))) * chartHeight,
    seconds: Math.round(session.durationMs / 1000),
    date: new Date(session.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: new Date(session.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }));

  // Prepare data for incorrect attempts chart
  const incorrectData = completedSessions.map((session, idx) => ({
    x: padding + (completedSessions.length > 1 ? (idx / (completedSessions.length - 1)) * chartWidth : chartWidth / 2),
    y: padding + chartHeight - (session.incorrectAttempts / Math.max(...completedSessions.map(s => s.incorrectAttempts), 1)) * chartHeight,
    attempts: session.incorrectAttempts,
    date: new Date(session.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: new Date(session.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }));

  const maxTime = Math.max(...completedSessions.map(s => s.durationMs));
  const maxAttempts = Math.max(...completedSessions.map(s => s.incorrectAttempts), 1);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-medium mb-4">
        {gameType === 'memory' ? 'Memory Cards' : 'Jigsaw Puzzle'} Performance
      </h3>
      
      <div className="space-y-6">
        {/* Completion Time Chart */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-cyan-300">Completion Time</h4>
          <div className="flex justify-center">
            <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2 + 40} className="mx-auto">
              {/* Chart background */}
              <rect
                x={padding}
                y={padding}
                width={chartWidth}
                height={chartHeight}
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                rx="4"
              />
              
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                <g key={idx}>
                  <line
                    x1={padding}
                    y1={padding + chartHeight * ratio}
                    x2={padding + chartWidth}
                    y2={padding + chartHeight * ratio}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 10}
                    y={padding + chartHeight * ratio + 4}
                    fontSize="10"
                    fill="rgba(255,255,255,0.5)"
                    textAnchor="end"
                  >
                    {Math.round(maxTime / 1000 * (1 - ratio))}s
                  </text>
                </g>
              ))}
              
              {/* Line connecting points */}
              {timeData.length > 1 && (
                <polyline
                  points={timeData.map(d => `${d.x},${d.y}`).join(' ')}
                  fill="none"
                  stroke="rgba(34,211,238,0.8)"
                  strokeWidth="2"
                />
              )}
              
              {/* Data points */}
              {timeData.map((point, idx) => (
                <g key={idx}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="rgba(34,211,238,0.9)"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="rgba(255,255,255,0.3)"
                  />
                  <text
                    x={point.x}
                    y={point.y - 15}
                    fontSize="11"
                    fontWeight="bold"
                    fill="rgba(34,211,238,1)"
                    textAnchor="middle"
                  >
                    {point.seconds}s
                  </text>
                </g>
              ))}
              
              {/* X-axis labels */}
              {timeData.map((point, idx) => (
                <g key={idx}>
                  <text
                    x={point.x}
                    y={padding + chartHeight + 15}
                    fontSize="9"
                    fill="rgba(255,255,255,0.6)"
                    textAnchor="middle"
                  >
                    {point.date}
                  </text>
                  <text
                    x={point.x}
                    y={padding + chartHeight + 28}
                    fontSize="8"
                    fill="rgba(255,255,255,0.5)"
                    textAnchor="middle"
                  >
                    {point.time}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Incorrect Attempts Chart */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-red-300">Incorrect Attempts</h4>
          <div className="flex justify-center">
            <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2 + 40} className="mx-auto">
              {/* Chart background */}
              <rect
                x={padding}
                y={padding}
                width={chartWidth}
                height={chartHeight}
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                rx="4"
              />
              
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                <g key={idx}>
                  <line
                    x1={padding}
                    y1={padding + chartHeight * ratio}
                    x2={padding + chartWidth}
                    y2={padding + chartHeight * ratio}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 10}
                    y={padding + chartHeight * ratio + 4}
                    fontSize="10"
                    fill="rgba(255,255,255,0.5)"
                    textAnchor="end"
                  >
                    {Math.round(maxAttempts * (1 - ratio))}
                  </text>
                </g>
              ))}
              
              {/* Line connecting points */}
              {incorrectData.length > 1 && (
                <polyline
                  points={incorrectData.map(d => `${d.x},${d.y}`).join(' ')}
                  fill="none"
                  stroke="rgba(239,68,68,0.8)"
                  strokeWidth="2"
                />
              )}
              
              {/* Data points */}
              {incorrectData.map((point, idx) => (
                <g key={idx}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="rgba(239,68,68,0.9)"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="rgba(255,255,255,0.3)"
                  />
                  <text
                    x={point.x}
                    y={point.y - 15}
                    fontSize="11"
                    fontWeight="bold"
                    fill="rgba(239,68,68,1)"
                    textAnchor="middle"
                  >
                    {point.attempts}
                  </text>
                </g>
              ))}
              
              {/* X-axis labels */}
              {incorrectData.map((point, idx) => (
                <g key={idx}>
                  <text
                    x={point.x}
                    y={padding + chartHeight + 15}
                    fontSize="9"
                    fill="rgba(255,255,255,0.6)"
                    textAnchor="middle"
                  >
                    {point.date}
                  </text>
                  <text
                    x={point.x}
                    y={padding + chartHeight + 28}
                    fontSize="8"
                    fill="rgba(255,255,255,0.5)"
                    textAnchor="middle"
                  >
                    {point.time}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-md bg-white/5 p-3">
            <div className="text-cyan-300 font-medium">Best Time</div>
            <div className="text-white/90">
              {Math.round(Math.min(...completedSessions.map(s => s.durationMs)) / 1000)}s
            </div>
          </div>
          <div className="rounded-md bg-white/5 p-3">
            <div className="text-red-300 font-medium">Avg Attempts</div>
            <div className="text-white/90">
              {Math.round(completedSessions.reduce((sum, s) => sum + s.incorrectAttempts, 0) / completedSessions.length)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
