import { DailyCheckSession } from '@/types/daily-questions';
import { generateChartData } from '@/utils/chart';

interface CompletionChartProps {
  sessions: DailyCheckSession[];
}

export function CompletionChart({ sessions }: CompletionChartProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-medium mb-4">Completion Times</h3>
        <div className="text-center text-white/60 py-8">
          No completion data available yet
        </div>
      </div>
    );
  }

  const data = generateChartData(sessions);
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = 200;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-medium mb-4">Completion Times</h3>
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
                {Math.round(Math.max(...data.map(d => d.seconds)) * (1 - ratio))}s
              </text>
            </g>
          ))}
          
          {/* Line connecting points */}
          {data.length > 1 && (
            <polyline
              points={data.map(d => `${d.x},${d.y}`).join(' ')}
              fill="none"
              stroke="rgba(34,211,238,0.8)"
              strokeWidth="2"
            />
          )}
          
          {/* Data points */}
          {data.map((dot, idx) => (
            <g key={idx}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r="6"
                fill="rgba(34,211,238,0.9)"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={dot.x}
                cy={dot.y}
                r="3"
                fill="rgba(255,255,255,0.3)"
              />
              <text
                x={dot.x}
                y={dot.y - 15}
                fontSize="11"
                fontWeight="bold"
                fill="rgba(34,211,238,1)"
                textAnchor="middle"
              >
                {dot.seconds}s
              </text>
            </g>
          ))}
          
          {/* X-axis labels */}
          {sessions.map((session, idx) => {
            const x = padding + (sessions.length > 1 ? (idx / (sessions.length - 1)) * chartWidth : chartWidth / 2);
            const createdDate = new Date(session.created_at);
            const sessionDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
            
            return (
              <g key={idx}>
                <text
                  x={x}
                  y={padding + chartHeight + 15}
                  fontSize="9"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="middle"
                >
                  {sessionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
                <text
                  x={x}
                  y={padding + chartHeight + 28}
                  fontSize="8"
                  fill="rgba(255,255,255,0.5)"
                  textAnchor="middle"
                >
                  {createdDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
