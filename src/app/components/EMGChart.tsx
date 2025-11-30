'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { Line } from 'react-chartjs-2';

// Register Chart.js components
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

interface EMGData {
  timestamp: number;
  muscleActivity: number;
  muscleActivityProcessed: number;
  voltage?: number; // Voltage in volts (ESP32: 0-3.3V)
}

interface EMGChartProps {
  data: EMGData[];
  isConnected: boolean;
  onReset?: () => void; // Callback to clear data in parent
}

const EMGChart: React.FC<EMGChartProps> = ({ data, isConnected, onReset }) => {
  const [chartData, setChartData] = useState({
    labels: [] as (string | number)[],
    datasets: [
      {
        label: 'Voltage (V)',
        data: [] as number[],
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  });

  const maxDataPoints = 50; // Show last 50 data points
  const baseTimeRef = useRef<number | null>(null); // ms origin for counting seconds
  const [resetTick, setResetTick] = useState(0);
  const [voltageMax, setVoltageMax] = useState(3.3); // Dynamic max for voltage axis (ESP32: 0-3.3V)

  useEffect(() => {
    if (data.length === 0) return;

    // Get the last maxDataPoints entries
    const recentData = data.slice(-maxDataPoints);
    // Initialize/reset base time if needed
    if (baseTimeRef.current === null) {
      baseTimeRef.current = recentData[0]?.timestamp ?? 0;
    }
    const base = baseTimeRef.current ?? 0;
    // Create labels - use numeric values for proper x-axis scaling
    // The x-axis will be configured to show labels at 1-second intervals
    const labels = recentData.map((d) => {
      const seconds = (d.timestamp - base) / 1000;
      return seconds; // Use numeric value for proper linear scaling
    });

    // Extract voltage data
    // Use provided voltage if available, otherwise calculate for ESP32
    const voltageData = recentData.map(d => {
      if (d.voltage !== undefined && d.voltage !== null) {
        return d.voltage;
      }
      // ESP32 fallback calculation: 12-bit ADC (0-4095), 3.3V reference
      return (d.muscleActivity * 3.3) / 4095.0;
    });

    // Calculate dynamic max based on actual data (with padding)
    if (voltageData.length > 0) {
      const maxVoltage = Math.max(...voltageData);
      
      // Dynamic scaling:
      // If signal is small (< 1.5V), scale to fit (e.g. 1.5V max)
      // If signal is large, scale to fit (with 10% padding)
      // Minimum scale is 1.0V to prevent zoom-in on noise
      const targetMax = Math.max(1.0, maxVoltage * 1.1);
      
      setVoltageMax(targetMax);
    }

    setChartData({
      labels,
      datasets: [
        {
          ...chartData.datasets[0],
          data: voltageData,
        },
      ],
    });
  }, [data, resetTick]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: isConnected ? 'Real-time EMG Data' : 'EMG Data (Disconnected)',
        color: isConnected ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)}V`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        display: true,
        title: {
          display: true,
          text: 'Time (s)',
          color: 'rgb(156, 163, 175)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          stepSize: 1, // Show tick marks every 1 second
          callback: function(value: any) {
            // Only show integer second labels (0s, 1s, 2s, etc.)
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (Number.isInteger(numValue)) {
              return numValue + 's';
            }
            return '';
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Voltage (V)',
          color: 'rgb(251, 146, 60)',
        },
        min: 0,
        max: voltageMax,
        ticks: {
          color: 'rgb(251, 146, 60)',
          callback: function(value: any) {
            return `${value.toFixed(1)}V`;
          },
        },
        grid: {
          color: 'rgba(251, 146, 60, 0.1)',
        },
      },
    },
    animation: {
      duration: 0, // Disable animation for real-time updates
    },
  };

  if (data.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-700">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <div className="text-gray-400">
            {isConnected ? 'Waiting for EMG data...' : 'Connect MyoWare to see data'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">Counting seconds from last reset</div>
        <button
          onClick={() => { 
            baseTimeRef.current = null; 
            setResetTick((v) => v + 1);
            setVoltageMax(3.3); // Reset max to default (ESP32: 3.3V)
            // Clear chart data
            setChartData({
              labels: [],
              datasets: [
                {
                  ...chartData.datasets[0],
                  data: [],
                },
              ],
            });
            // Call parent callback to clear data if provided
            if (onReset) {
              onReset();
            }
          }}
          className="px-2 py-0.5 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
        >
          Reset Graph
        </button>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default EMGChart;
