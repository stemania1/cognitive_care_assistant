'use client';

import { useEffect, useRef, useState } from 'react';

interface CalibrationData {
  rawValue: number;
  min: number;
  max: number;
  progress: number;
  timestamp: number;
  heartRateComponent?: number;
  muscleActivity?: number;
  baseline?: number;
  heartRateBPM?: number;
  heartRateDetected?: boolean;
}

interface CalibrationChartProps {
  isCalibrating: boolean;
  onCalibrationComplete: (min: number, max: number) => void;
  serverUrl?: string;
}

export default function CalibrationChart({ isCalibrating, onCalibrationComplete, serverUrl = `http://localhost:${typeof window !== 'undefined' ? window.location.port : '3000'}` }: CalibrationChartProps) {
  const [calibrationData, setCalibrationData] = useState<CalibrationData[]>([]);
  const [currentMin, setCurrentMin] = useState<number>(4095);
  const [currentMax, setCurrentMax] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Fetch calibration data when calibrating
  useEffect(() => {
    if (!isCalibrating) {
      setCalibrationData([]);
      setCurrentMin(4095);
      setCurrentMax(0);
      setProgress(0);
      setIsUsingFallback(false);
      return;
    }

    let startTime = Date.now();
    const calibrationDuration = 10000; // 10 seconds
    let realDataReceived = false;
    let fallbackMin = 4095;
    let fallbackMax = 0;

      const fetchCalibrationData = async () => {
        try {
          const response = await fetch(`${serverUrl}/api/emg/command`);
          if (response.ok) {
            const data = await response.json();
            if (data.calibrationData) {
              realDataReceived = true;
              const calData = data.calibrationData;
              
              // Debug: Log calibration data reception timing
              console.log(`📊 Real calibration data received: progress=${calData.progress}%, raw=${calData.rawValue}, min=${calData.min}, max=${calData.max}, heart=${calData.heartRateComponent?.toFixed(1)}, muscle=${calData.muscleActivity?.toFixed(1)}, BPM=${calData.heartRateBPM?.toFixed(1)}`);
              
              setProgress(calData.progress);
              setCurrentMin(calData.min);
              setCurrentMax(calData.max);

            // Add data point
            const newDataPoint: CalibrationData = {
              rawValue: calData.rawValue,
              min: calData.min,
              max: calData.max,
              progress: calData.progress,
              timestamp: Date.now() - startTime,
              heartRateComponent: calData.heartRateComponent,
              muscleActivity: calData.muscleActivity,
              baseline: calData.baseline,
              heartRateBPM: calData.heartRateBPM,
              heartRateDetected: calData.heartRateDetected
            };

            setCalibrationData(prev => {
              const updated = [...prev, newDataPoint];
              // Keep only last 100 points for performance
              return updated.slice(-100);
            });

            // Check if calibration is complete
            if (calData.progress >= 100) {
              onCalibrationComplete(calData.min, calData.max);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching calibration data:', error);
      }

        // Fallback: Generate simulated data if no real data received after 1 second
        if (!realDataReceived && Date.now() - startTime > 1000) {
          setIsUsingFallback(true);
          console.log('🔄 Using fallback calibration data - ESP32 not sending real data');
          
          const elapsed = Date.now() - startTime;
          const progressPercent = Math.min((elapsed / calibrationDuration) * 100, 100);
          
          setProgress(progressPercent);

          if (progressPercent >= 100) {
            // Use reasonable default calibration values
            const defaultMin = 1200;
            const defaultMax = 2800;
            onCalibrationComplete(defaultMin, defaultMax);
            return;
          }

          // Simulate muscle activity data for demonstration
          const baseValue = 1500 + Math.sin(elapsed / 1000) * 300; // More dramatic changes
          const noise = (Math.random() - 0.5) * 100;
          const rawValue = Math.round(baseValue + noise);
          
          // Update min/max
          fallbackMin = Math.min(fallbackMin, rawValue);
          fallbackMax = Math.max(fallbackMax, rawValue);
          setCurrentMin(fallbackMin);
          setCurrentMax(fallbackMax);

          // Add data point
          const newDataPoint: CalibrationData = {
            rawValue,
            min: fallbackMin,
            max: fallbackMax,
            progress: progressPercent,
            timestamp: elapsed
          };

          setCalibrationData(prev => {
            const updated = [...prev, newDataPoint];
            return updated.slice(-100);
          });
          
          // Debug: Log the simulated values
          console.log(`📊 Simulated data: raw=${rawValue}, min=${fallbackMin}, max=${fallbackMax}, progress=${progressPercent}%`);
        }

      // Continue polling if still calibrating
      if (isCalibrating) {
        animationRef.current = requestAnimationFrame(fetchCalibrationData);
      }
    };

    // Start polling for calibration data
    animationRef.current = requestAnimationFrame(fetchCalibrationData);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isCalibrating, onCalibrationComplete, serverUrl]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || calibrationData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw data points
    if (calibrationData.length > 1) {
      const xStep = width / (calibrationData.length - 1);
      
      // Draw min line
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - (currentMin / 4095) * height);
      ctx.lineTo(width, height - (currentMin / 4095) * height);
      ctx.stroke();

      // Draw max line
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - (currentMax / 4095) * height);
      ctx.lineTo(width, height - (currentMax / 4095) * height);
      ctx.stroke();

      // Draw raw data line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - (calibrationData[0].rawValue / 4095) * height);
      
      for (let i = 1; i < calibrationData.length; i++) {
        const x = i * xStep;
        const y = height - (calibrationData[i].rawValue / 4095) * height;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('4095', 5, 15);
    ctx.fillText('0', 5, height - 5);
    ctx.fillText('Raw Data', 5, height / 2);
    
    // Draw min/max labels
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(`Min: ${currentMin}`, width - 100, 20);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(`Max: ${currentMax}`, width - 100, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Range: ${currentMax - currentMin}`, width - 100, 60);
  }, [calibrationData, currentMin, currentMax]);

  if (!isCalibrating) return null;

  return (
    <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-orange-200">Calibration Progress</h4>
        <div className="flex items-center gap-2">
          <div className={`text-xs px-2 py-1 rounded ${
            isUsingFallback 
              ? 'bg-yellow-500/20 text-yellow-200' 
              : 'bg-green-500/20 text-green-200'
          }`}>
            {isUsingFallback ? 'Demo Mode' : 'Live Data'}
          </div>
          <div className="text-sm text-orange-200">{Math.round(progress)}%</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div 
          className="bg-orange-500 h-2 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Signal Processing Display */}
      <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Raw Signal</div>
            <div className="text-lg font-bold text-white">
              {calibrationData.length > 0 ? calibrationData[calibrationData.length - 1].rawValue : '---'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Baseline</div>
            <div className="text-lg font-bold text-yellow-400">
              {calibrationData.length > 0 && calibrationData[calibrationData.length - 1].baseline 
                ? calibrationData[calibrationData.length - 1].baseline?.toFixed(1) 
                : '---'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">🫀 Heart Rate Component</div>
            <div className="text-lg font-bold text-red-400">
              {calibrationData.length > 0 && calibrationData[calibrationData.length - 1].heartRateComponent 
                ? calibrationData[calibrationData.length - 1].heartRateComponent?.toFixed(1) 
                : '---'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">💓 Heart Rate (BPM)</div>
            <div className="text-lg font-bold text-pink-400">
              {calibrationData.length > 0 && calibrationData[calibrationData.length - 1].heartRateDetected 
                ? calibrationData[calibrationData.length - 1].heartRateBPM?.toFixed(1) + ' BPM'
                : 'Not Detected'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">💪 Muscle Activity</div>
            <div className="text-lg font-bold text-green-400">
              {calibrationData.length > 0 && calibrationData[calibrationData.length - 1].muscleActivity 
                ? calibrationData[calibrationData.length - 1].muscleActivity?.toFixed(1) 
                : '---'}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Min Detected</div>
            <div className="text-lg font-bold text-orange-400">
              {currentMin === 4095 ? '---' : currentMin}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Max Detected</div>
            <div className="text-lg font-bold text-cyan-400">
              {currentMax === 0 ? '---' : currentMax}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-48 bg-gray-900 rounded border"
        />
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-white"></div>
            <span className="text-gray-300">Raw Data</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-400"></div>
            <span className="text-gray-300">Min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-teal-400"></div>
            <span className="text-gray-300">Max</span>
          </div>
        </div>
      </div>

      {/* Signal Processing Instructions */}
      <div className="mt-3 text-xs text-gray-300 space-y-1">
        {isUsingFallback ? (
          <>
            <p className="text-yellow-200"><strong>⚠️ Demo Mode Active</strong></p>
            <p>• Real sensor data not detected - using simulated data</p>
            <p>• Check that ESP32 is connected and receiving CALIBRATE command</p>
            <p>• Verify sensor is properly connected to analog pin A0</p>
            <p>• This is demonstration data showing expected calibration behavior</p>
          </>
        ) : (
          <>
            <p><strong>🔬 Signal Processing Analysis:</strong></p>
            <p>• <strong>Raw Signal:</strong> Original sensor reading (includes everything)</p>
            <p>• <strong>Baseline:</strong> Average signal level (heart rate baseline)</p>
            <p>• <strong>🫀 Heart Rate:</strong> Regular pulses (1-2 Hz, 60-120 BPM)</p>
            <p>• <strong>💪 Muscle Activity:</strong> Voluntary contractions (filtered)</p>
            <p>• <strong>Instructions:</strong> Contract/relax muscle to see muscle activity increase</p>
            <p>• <strong>Heart rate</strong> should be steady pulses, <strong>muscle activity</strong> should spike when you flex</p>
          </>
        )}
      </div>
    </div>
  );
}
