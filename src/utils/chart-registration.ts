import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

let isRegistered = false;

/**
 * Registers Chart.js components. Safe to call multiple times - will only register once.
 * Call this at the top of any component that uses Chart.js.
 */
export function registerChartJS(): void {
  if (isRegistered) {
    return;
  }

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  isRegistered = true;
}

