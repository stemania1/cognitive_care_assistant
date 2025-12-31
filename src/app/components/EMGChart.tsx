'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { EMGData, MoveMarker } from '@/types/emg';
import { registerChartJS } from '@/utils/chart-registration';

// Register Chart.js components
registerChartJS();

interface EMGChartProps {
  data: EMGData[];
  isConnected: boolean;
  onReset?: () => void; // Callback to clear data in parent
  moveMarkers?: MoveMarker[]; // Markers for move requests and sensed moves
  sessionStartTime?: number | null; // Session start time for calculating relative time
}

const EMGChart: React.FC<EMGChartProps> = ({ data, isConnected, onReset, moveMarkers = [], sessionStartTime = null }) => {
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
  const moveMarkersRef = useRef<MoveMarker[]>(moveMarkers);
  const chartRef = useRef<any>(null);
  const [markerUpdateTick, setMarkerUpdateTick] = useState(0); // Force re-render when markers change
  const dataRef = useRef<EMGData[]>(data); // Store data for peak calculation
  
  // Update refs when data or moveMarkers change
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Update ref when moveMarkers change and force chart redraw
  useEffect(() => {
    moveMarkersRef.current = moveMarkers;
    console.log('🔄 Move markers updated:', {
      count: moveMarkers.length,
      markers: moveMarkers,
      chartRefExists: !!chartRef.current
    });
    
    // Increment tick to force plugin re-evaluation
    setMarkerUpdateTick(prev => prev + 1);
    
    // Force chart update when markers change
    if (chartRef.current) {
      console.log('🔄 Forcing chart update...');
      // Use setTimeout to ensure the update happens after state is set
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.update('none');
        }
      }, 0);
    }
  }, [moveMarkers]);

  useEffect(() => {
    // Log every time data prop changes to track updates
    console.log('📊 EMGChart data prop changed:', {
      dataLength: data.length,
      hasData: data.length > 0,
      firstTimestamp: data.length > 0 ? new Date(data[0].timestamp).toISOString() : 'N/A',
      lastTimestamp: data.length > 0 ? new Date(data[data.length - 1].timestamp).toISOString() : 'N/A',
      lastVoltage: data.length > 0 ? data[data.length - 1].voltage?.toFixed(3) + 'V' : 'N/A',
      lastMuscleActivity: data.length > 0 ? data[data.length - 1].muscleActivity : 'N/A',
      isConnected: isConnected,
      voltageRange: data.length > 0 ? {
        min: Math.min(...data.map(d => d.voltage ?? (d.muscleActivity * 3.3 / 4095))).toFixed(3) + 'V',
        max: Math.max(...data.map(d => d.voltage ?? (d.muscleActivity * 3.3 / 4095))).toFixed(3) + 'V'
      } : 'N/A'
    });
    
    if (data.length === 0) {
      console.log('⚠️ EMGChart: No data to display - data prop is empty array', {
        isConnected,
        note: 'Check if data is being added to chartData state in parent component'
      });
      return;
    }

    // Filter to 4 samples per second (one every 250ms)
    // Group data by 250ms intervals and take the last sample from each interval
    const dataByInterval = new Map<number, EMGData>();
    
    data.forEach(d => {
      // Ensure timestamp is in milliseconds
      const timestampMs = typeof d.timestamp === 'number' ? d.timestamp : Date.parse(d.timestamp as any);
      // Group by 250ms intervals (4 per second)
      const interval250ms = Math.floor(timestampMs / 250);
      
      // Keep the most recent sample for each 250ms interval
      const existing = dataByInterval.get(interval250ms);
      if (!existing || timestampMs > existing.timestamp) {
        dataByInterval.set(interval250ms, { ...d, timestamp: timestampMs });
      }
    });
    
    // Convert back to array and sort by timestamp
    const filteredData = Array.from(dataByInterval.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-maxDataPoints); // Get last maxDataPoints entries
    
    // Debug: Log filtering results more frequently
    if (filteredData.length > 0) {
      const timeSpan = (filteredData[filteredData.length - 1].timestamp - filteredData[0].timestamp) / 1000;
      const samplesPerSecond = filteredData.length / Math.max(1, timeSpan);
      
      // Log every time we get a new sample (when filteredData length changes)
      console.log('📊 Chart filtering (4 samples/sec):', {
        inputSamples: data.length,
        outputSamples: filteredData.length,
        timeRange: `0s - ${timeSpan.toFixed(1)}s`,
        samplesPerSecond: samplesPerSecond.toFixed(2),
        lastSampleTime: new Date(filteredData[filteredData.length - 1].timestamp).toLocaleTimeString(),
        lastSampleVoltage: filteredData[filteredData.length - 1].voltage?.toFixed(3) || 'N/A'
      });
    }
    
    // Initialize/reset base time if needed
    if (baseTimeRef.current === null) {
      baseTimeRef.current = filteredData[0]?.timestamp ?? 0;
    }
    const base = baseTimeRef.current ?? 0;
    
    // Create labels - use numeric values for proper x-axis scaling
    // The x-axis will be configured to show labels at 1-second intervals
    const labels = filteredData.map((d) => {
      const seconds = (d.timestamp - base) / 1000;
      return seconds; // Use numeric value for proper linear scaling
    });

    // Extract voltage data
    // Use provided voltage if available, otherwise calculate for ESP32
    const voltageData = filteredData.map(d => {
      if (d.voltage !== undefined && d.voltage !== null) {
        return d.voltage;
      }
      // ESP32 fallback calculation: 12-bit ADC (0-4095), 3.3V reference
      return (d.muscleActivity * 3.3) / 4095.0;
    });

    // Calculate dynamic max based on actual data (with padding)
    if (voltageData.length > 0) {
      const maxVoltage = Math.max(...voltageData);
      const minVoltage = Math.min(...voltageData);
      const voltageRange = maxVoltage - minVoltage;
      
      // Check if voltage is stuck at high values (sensor disconnected)
      if (maxVoltage > 2.9 && voltageRange < 0.1) {
        console.warn('⚠️ VOLTAGE STUCK AT HIGH VALUE - Sensor may be disconnected!', {
          voltage: maxVoltage.toFixed(3) + 'V',
          range: voltageRange.toFixed(3) + 'V',
          diagnosis: 'Wireless shield sensor likely disconnected or not making contact'
        });
      }
      
      // Dynamic scaling:
      // If signal is small (< 1.5V), scale to fit (e.g. 1.5V max)
      // If signal is large, scale to fit (with 10% padding)
      // Minimum scale is 1.0V to prevent zoom-in on noise
      // Cap at 3.5V to prevent excessive scaling when sensor is disconnected
      const targetMax = Math.min(3.5, Math.max(1.0, maxVoltage * 1.1));
      
      setVoltageMax(targetMax);
    }

    // Create datasets array with voltage data only (no move markers as datasets)
    // For linear x-axis, we need to provide data as {x, y} objects
    const datasets: any[] = [
      {
        ...chartData.datasets[0],
        data: labels.map((labelSeconds, i) => ({
          x: typeof labelSeconds === 'number' ? labelSeconds : parseFloat(labelSeconds as string),
          y: voltageData[i]
        })),
      },
    ];

    setChartData({
      labels,
      datasets,
    });
  }, [data, resetTick, voltageMax]);

  // Custom plugin to draw move marker lines directly on canvas
  // Recreate plugin when markers change to ensure it uses latest data
  const moveMarkerPlugin = useMemo(() => ({
    id: 'moveMarkerLines',
    afterDraw: (chart: any) => {
      // Always get latest markers from ref
      const markers = moveMarkersRef.current;
      
      console.log('🎨 Drawing move markers:', {
        markerCount: markers?.length || 0,
        markers: markers,
        baseTime: baseTimeRef.current,
        hasXScale: !!chart.scales.x,
        hasYScale: !!chart.scales.y
      });
      
      if (!markers || markers.length === 0) {
        return;
      }

      const ctx = chart.ctx;
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;

      if (!xScale || !yScale) {
        console.warn('⚠️ Missing chart scales');
        return;
      }

      // Get base time from ref, or use session start time, or use first marker timestamp
      let base = baseTimeRef.current;
      if (base === null || base === 0) {
        // Try to use session start time if available
        if (sessionStartTime) {
          base = sessionStartTime;
          console.log('📅 Using session start time as base:', base);
        } else if (markers.length > 0) {
          // Use first marker's timestamp as base (fallback)
          base = markers[0].timestamp;
          console.log('📅 Using first marker timestamp as base:', base);
        } else {
          base = 0;
        }
      }
      
      if (base === 0) {
        console.warn('⚠️ Base time is 0, markers may not display correctly');
      }

      ctx.save();

      markers.forEach((marker, index) => {
        // Calculate seconds from base time
        const markerSeconds = (marker.timestamp - base) / 1000;
        
        console.log(`📍 Marker ${index}:`, {
          type: marker.type,
          timestamp: marker.timestamp,
          base: base,
          markerSeconds: markerSeconds,
          xScaleMin: xScale.min,
          xScaleMax: xScale.max,
          xScaleLeft: xScale.left,
          xScaleRight: xScale.right,
          xScaleType: xScale.type
        });
        
        // For linear scale, get pixel position for this x value
        // Make sure the value is within the scale range
        let xPos: number | null = null;
        
        try {
          xPos = xScale.getPixelForValue(markerSeconds);
        } catch (error) {
          console.error(`Error getting pixel for value ${markerSeconds}:`, error);
        }
        
        console.log(`  → xPos: ${xPos}, isValid: ${xPos !== null && !isNaN(xPos) && isFinite(xPos)}`);
        
        // Check if position is valid and within chart bounds
        if (xPos !== null && !isNaN(xPos) && isFinite(xPos)) {
          // For linear scale, we need to check if it's within the visible range
          // The xPos might be outside the chart area even if it's a valid number
          const isInBounds = xPos >= xScale.left && xPos <= xScale.right;
          
          console.log(`  → In bounds: ${isInBounds}, xPos=${xPos.toFixed(1)}, left=${xScale.left.toFixed(1)}, right=${xScale.right.toFixed(1)}`);
          
          if (isInBounds) {
            // Set line style based on marker type
            if (marker.type === 'request') {
              // Solid blue line for move requests
              ctx.strokeStyle = 'rgb(59, 130, 246)'; // Blue
              ctx.lineWidth = 2;
              ctx.setLineDash([]); // Solid line
            } else if (marker.type === 'end') {
              // Solid red line for end move events
              ctx.strokeStyle = 'rgb(239, 68, 68)'; // Red
              ctx.lineWidth = 2;
              ctx.setLineDash([]); // Solid line
            } else {
              // Dotted green line for sensed moves
              ctx.strokeStyle = 'rgb(34, 197, 94)'; // Green
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]); // Dotted line
            }

            // Draw vertical line from top to bottom of chart area
            ctx.beginPath();
            ctx.moveTo(xPos, yScale.top);
            ctx.lineTo(xPos, yScale.bottom);
            ctx.stroke();
            
            console.log(`  ✅ Drew ${marker.type} line at x=${xPos.toFixed(1)}, from y=${yScale.top.toFixed(1)} to y=${yScale.bottom.toFixed(1)}`);
          } else {
            console.warn(`  ⚠️ Marker ${index} position outside visible range:`, {
              xPos: xPos.toFixed(1),
              left: xScale.left.toFixed(1),
              right: xScale.right.toFixed(1),
              markerSeconds: markerSeconds.toFixed(2),
              scaleMin: xScale.min,
              scaleMax: xScale.max
            });
          }
        } else {
          console.warn(`  ❌ Marker ${index} invalid position:`, {
            xPos,
            markerSeconds: markerSeconds.toFixed(2),
            scaleMin: xScale.min,
            scaleMax: xScale.max
          });
        }
      });

      // Calculate and draw movement peaks
      const currentData = dataRef.current;
      if (currentData && currentData.length > 0 && markers.length > 0) {
        // Sort markers by timestamp
        const sortedMarkers = [...markers].sort((a, b) => a.timestamp - b.timestamp);
        
        // Find movement periods and their peaks
        // Pair each start marker with the next end marker to ensure unique periods
        let endMarkerIndex = 0;
        
        for (let i = 0; i < sortedMarkers.length; i++) {
          const startMarker = sortedMarkers[i];
          if (startMarker.type === 'request' || startMarker.type === 'sensed') {
            // Find the next 'end' marker after this start marker
            let endMarker: MoveMarker | null = null;
            for (let j = Math.max(i + 1, endMarkerIndex); j < sortedMarkers.length; j++) {
              if (sortedMarkers[j].type === 'end') {
                endMarker = sortedMarkers[j];
                endMarkerIndex = j + 1; // Move past this end marker for next iteration
                break;
              }
            }
            
            if (endMarker) {
              // Find peak voltage within this specific period only
              const periodData = currentData.filter(d => {
                const timestamp = d.timestamp;
                return timestamp >= startMarker.timestamp && timestamp <= endMarker.timestamp && d.voltage !== undefined && d.voltage !== null;
              });
              
              if (periodData.length > 0) {
                // Find the data point with maximum voltage within THIS period only
                let peakData = periodData[0];
                let maxVoltage = peakData.voltage || 0;
                
                for (const d of periodData) {
                  const dataVoltage = d.voltage || 0;
                  if (dataVoltage > maxVoltage) {
                    maxVoltage = dataVoltage;
                    peakData = d;
                  }
                }
                
                if (peakData.voltage !== undefined && peakData.voltage !== null) {
                  const peakSeconds = (peakData.timestamp - base) / 1000;
                  
                  console.log(`📊 Live movement period peak:`, {
                    period: `Start: ${new Date(startMarker.timestamp).toISOString()} → End: ${new Date(endMarker.timestamp).toISOString()}`,
                    peakVoltage: peakData.voltage,
                    peakTimestamp: new Date(peakData.timestamp).toISOString(),
                    dataPointsInPeriod: periodData.length
                  });
                  
                  try {
                    const xPos = xScale.getPixelForValue(peakSeconds);
                    const yPos = yScale.getPixelForValue(peakData.voltage);
                    
                    if (xPos !== null && !isNaN(xPos) && isFinite(xPos) && 
                        yPos !== null && !isNaN(yPos) && isFinite(yPos) &&
                        xPos >= xScale.left && xPos <= xScale.right &&
                        yPos >= yScale.top && yPos <= yScale.bottom) {
                      
                      // Draw peak point (larger circle)
                      ctx.fillStyle = 'rgb(250, 204, 21)'; // Yellow
                      ctx.strokeStyle = 'rgb(217, 119, 6)'; // Darker yellow border
                      ctx.lineWidth = 2;
                      ctx.beginPath();
                      ctx.arc(xPos, yPos, 6, 0, 2 * Math.PI);
                      ctx.fill();
                      ctx.stroke();
                      
                      // Draw peak value label
                      ctx.fillStyle = 'rgb(250, 204, 21)';
                      ctx.font = 'bold 11px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'bottom';
                      ctx.fillText(`${peakData.voltage.toFixed(2)}V`, xPos, yPos - 8);
                    }
                  } catch (error) {
                    console.warn('⚠️ Error drawing peak:', error);
                  }
                }
              }
            }
          }
        }
      }

      ctx.restore();
    },
  }), [moveMarkers, markerUpdateTick, sessionStartTime, data]); // Include dependencies to trigger re-render when markers change

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
          {isConnected && (
            <div className="text-xs text-yellow-400 mt-2">
              💡 If using wireless shield, check that sensor is connected and sending data
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Check if voltage is stuck at high values (sensor disconnected)
  const voltageDataCheck = data.map(d => d.voltage ?? (d.muscleActivity * 3.3 / 4095));
  const isVoltageStuck = voltageDataCheck.length > 0 && 
    Math.max(...voltageDataCheck) > 2.9 && 
    (Math.max(...voltageDataCheck) - Math.min(...voltageDataCheck)) < 0.1;

  // Show message when no data
  if (data.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex flex-col items-center justify-center">
        <div className="text-gray-400 text-center">
          <p className="text-lg mb-2">📊 No Data to Display</p>
          <p className="text-sm mb-4">Waiting for EMG data from MyoWare sensor...</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Check that MyoWare sensor is connected</p>
            <p>• Verify EMG server is running (port 3001)</p>
            <p>• Check Next.js console for data reception</p>
            <p>• Connection status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      {isVoltageStuck && (
        <div className="mb-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-200">
          ⚠️ Voltage stuck at ~3V - Wireless shield sensor may be disconnected! Check sensor connection and ensure it's properly attached to muscle.
        </div>
      )}
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
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options} 
        plugins={[moveMarkerPlugin]} 
      />
    </div>
  );
};

export default EMGChart;
