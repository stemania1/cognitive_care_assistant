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
}

interface EMGChartProps {
  data: EMGData[];
  isConnected: boolean;
}

const EMGChart: React.FC<EMGChartProps> = ({ data, isConnected }) => {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Muscle Activity (%)',
        data: [] as number[],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Raw Activity',
        data: [] as number[],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'y1',
      },
    ],
  });

  const maxDataPoints = 50; // Show last 50 data points

  useEffect(() => {
    if (data.length === 0) return;

    // Get the last maxDataPoints entries
    const recentData = data.slice(-maxDataPoints);
    
    // Create time labels (relative to first data point)
    const firstTimestamp = recentData[0]?.timestamp || 0;
    const labels = recentData.map((_, index) => {
      const timeDiff = (recentData[index]?.timestamp - firstTimestamp) / 1000; // Convert to seconds
      return `${timeDiff.toFixed(1)}s`;
    });

    // Extract processed and raw data
    const processedData = recentData.map(d => d.muscleActivityProcessed);
    const rawData = recentData.map(d => d.muscleActivity);

    setChartData({
      labels,
      datasets: [
        {
          ...chartData.datasets[0],
          data: processedData,
        },
        {
          ...chartData.datasets[1],
          data: rawData,
        },
      ],
    });
  }, [data]);

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
            if (label.includes('Raw')) {
              return `${label}: ${value.toFixed(0)}`;
            }
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: 'rgb(156, 163, 175)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxTicksLimit: 10,
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
          text: 'Muscle Activity (%)',
          color: 'rgb(34, 197, 94)',
        },
        min: 0,
        max: 100,
        ticks: {
          color: 'rgb(34, 197, 94)',
          callback: function(value: any) {
            return `${value}%`;
          },
        },
        grid: {
          color: 'rgba(34, 197, 94, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Raw Activity',
          color: 'rgb(59, 130, 246)',
        },
        min: 0,
        max: 4095,
        ticks: {
          color: 'rgb(59, 130, 246)',
          callback: function(value: any) {
            return value.toFixed(0);
          },
        },
        grid: {
          drawOnChartArea: false,
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
    <div className="w-full h-80 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default EMGChart;
