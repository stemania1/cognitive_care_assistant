import { ChartDataPoint, DailyCheckSession } from '@/types/daily-questions';

export function generateChartData(sessions: DailyCheckSession[]): ChartDataPoint[] {
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = 200;
  const maxSeconds = Math.max(...sessions.map(s => Math.round(s.duration_ms / 1000)));

  return sessions.map((session, idx) => {
    const x = padding + (sessions.length > 1 ? (idx / (sessions.length - 1)) * chartWidth : chartWidth / 2);
    const seconds = Math.round(session.duration_ms / 1000);
    const y = padding + chartHeight - (seconds / maxSeconds) * chartHeight;
    return { seconds, x, y };
  });
}

export function createChartSVG(data: ChartDataPoint[], sessions: DailyCheckSession[]) {
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = 200;

  return {
    width: chartWidth + padding * 2,
    height: chartHeight + padding * 2 + 40,
    padding,
    chartWidth,
    chartHeight,
    data,
    sessions
  };
}
