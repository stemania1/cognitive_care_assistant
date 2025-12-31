import { EMGMetric } from '@/types/emg';

export const EMG_METRICS: EMGMetric[] = [
  {
    metric: 'Mean EMG amplitude (µV or %MVC)',
    type: 'Quantitative',
    definition: 'Average signal over active contraction period',
    purpose: 'Measures average muscle activation intensity',
  },
  {
    metric: 'Peak EMG amplitude (µV)',
    type: 'Quantitative',
    definition: 'Maximum signal reached per repetition',
    purpose: 'Indicates maximal muscle engagement',
  },
  {
    metric: 'EMG variability (Coefficient of Variation)',
    type: 'Quantitative',
    definition: '(SD / Mean) × 100',
    purpose: 'Evaluates steadiness or fatigue during exercise',
  },
  {
    metric: 'Signal-to-noise ratio (SNR)',
    type: 'Quantitative',
    definition: 'Mean signal amplitude ÷ baseline noise',
    purpose: 'Assesses quality of sensor placement and contact',
  },
  {
    metric: 'Latency / response time (ms)',
    type: 'Quantitative',
    definition: 'Delay between visual cue and EMG onset',
    purpose: 'Evaluates neuromuscular response speed',
  },
  {
    metric: 'Classification accuracy (if ML model used)',
    type: 'Quantitative',
    definition: '% of correctly classified muscle actions',
    purpose: 'For pattern recognition or gesture detection modules',
  },
  {
    metric: 'Session compliance rate (%)',
    type: 'Behavioral',
    definition: '# sessions with valid EMG data ÷ total sessions',
    purpose: 'Ensures sensor usability by participants',
  },
  {
    metric: 'User-rated ease of setup (1–10)',
    type: 'Subjective',
    definition: 'Likert score in survey',
    purpose: 'Perceived usability of MyoWare setup and comfort',
  },
  {
    metric: 'Healthcare interpretation utility (1–10)',
    type: 'Subjective',
    definition: 'Rated by clinician reviewers',
    purpose: 'Determines clinical usefulness of EMG graphs',
  },
];

