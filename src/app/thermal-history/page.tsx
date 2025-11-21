"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { isGuestUser, getGuestUserId } from "@/lib/guestDataManager";
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

// Component wrapper to add move event lines to chart
function MoveEventChart({ data, options, session }: { data: any; options: any; session: ThermalSession }) {
  // Store session in a ref to ensure plugin has access
  const sessionRef = React.useRef(session);
  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Helper function to draw vertical lines for events
  const drawEventLines = (
    chart: any,
    events: MoveEvent[] | null | undefined,
    color: string,
    lineWidth: number = 2,
    dashPattern: number[] = [5, 5]
  ) => {
    if (!events || !Array.isArray(events) || events.length === 0) {
      return;
    }

    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;

    if (!xScale || !yScale) {
      return;
    }

    const labels = chart.data?.labels || [];
    if (labels.length === 0) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashPattern);

    events.forEach((event: MoveEvent) => {
      const targetLabel = `${event.secondsFromStart}s`;
      let labelIndex = labels.findIndex((label: string) => label === targetLabel);

      if (labelIndex === -1) {
        let closestDiff = Infinity;
        let closestIdx = -1;

        labels.forEach((label: string, index: number) => {
          const labelSeconds = parseInt(label.replace('s', ''), 10);
          if (!isNaN(labelSeconds)) {
            const diff = Math.abs(labelSeconds - event.secondsFromStart);
            if (diff < closestDiff) {
              closestDiff = diff;
              closestIdx = index;
            }
          }
        });

        if (closestIdx !== -1 && closestDiff <= 5) {
          labelIndex = closestIdx;
        } else {
          return;
        }
      }

      if (labelIndex !== -1 && labelIndex >= 0 && labelIndex < labels.length) {
        const xPos = xScale.getPixelForValue(labelIndex);

        if (xPos !== null && !isNaN(xPos) && isFinite(xPos) && xPos >= xScale.left && xPos <= xScale.right) {
          ctx.beginPath();
          ctx.moveTo(xPos, yScale.top);
          ctx.lineTo(xPos, yScale.bottom);
          ctx.stroke();
        }
      }
    });

    ctx.restore();
  };

  // Helper function to draw triangles for movement detection
  const drawMovementTriangles = (
    chart: any,
    events: MoveEvent[] | null | undefined
  ) => {
    if (!events || !Array.isArray(events) || events.length === 0) {
      console.log('🔺 No movement events to draw triangles for');
      return;
    }

    console.log('🔺 Drawing triangles for', events.length, 'movement events:', events);

    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;

    if (!xScale || !yScale) {
      console.log('🔺 Missing chart scales');
      return;
    }

    const labels = chart.data?.labels || [];
    if (labels.length === 0) {
      console.log('🔺 No chart labels available');
      return;
    }

    console.log('🔺 Chart labels:', labels);

    ctx.save();
    ctx.fillStyle = 'rgb(250, 204, 21)'; // Yellow color
    ctx.strokeStyle = 'rgb(217, 119, 6)'; // Darker yellow border
    ctx.lineWidth = 1;

    events.forEach((event: MoveEvent, index: number) => {
      // Find the closest label index for this event
      const targetLabel = `${event.secondsFromStart}s`;
      const labelIndex = labels.findIndex((label: string) => label === targetLabel);
      
      console.log(`🔺 Event ${index}: looking for "${targetLabel}", found at index ${labelIndex}`);
      
      if (labelIndex === -1) {
        // Try to find the closest label if exact match not found
        const closestIndex = labels.reduce((closest: number, label: string, idx: number) => {
          const labelSeconds = parseInt(label.replace('s', ''));
          const currentClosest = parseInt(labels[closest].replace('s', ''));
          return Math.abs(labelSeconds - event.secondsFromStart) < Math.abs(currentClosest - event.secondsFromStart) ? idx : closest;
        }, 0);
        
        console.log(`🔺 Using closest label at index ${closestIndex}: "${labels[closestIndex]}"`);
        
        if (closestIndex >= 0) {
          const xPos = xScale.getPixelForValue(closestIndex);
          const yTop = yScale.top + 10;
          const triangleSize = 8;

          ctx.beginPath();
          ctx.moveTo(xPos, yTop);
          ctx.lineTo(xPos - triangleSize, yTop + triangleSize);
          ctx.lineTo(xPos + triangleSize, yTop + triangleSize);
          ctx.closePath();
          
          ctx.fill();
          ctx.stroke();
          console.log(`🔺 Drew triangle at x=${xPos}, y=${yTop}`);
        }
        return;
      }

      // Get x position for this label
      const xPos = xScale.getPixelForValue(labelIndex);
      
      // Position triangle at the top of the chart area
      const yTop = yScale.top + 10; // 10px from top
      const triangleSize = 8;

      // Draw triangle pointing down
      ctx.beginPath();
      ctx.moveTo(xPos, yTop); // Top point
      ctx.lineTo(xPos - triangleSize, yTop + triangleSize); // Bottom left
      ctx.lineTo(xPos + triangleSize, yTop + triangleSize); // Bottom right
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();
      console.log(`🔺 Drew triangle at x=${xPos}, y=${yTop} for event at ${event.secondsFromStart}s`);
    });

    ctx.restore();
  };

  // Custom plugin to draw move event lines and motion threshold
  const moveEventPlugin = {
    id: 'moveEventLines',
    afterDraw: (chart: any) => {
      const currentSession = sessionRef.current;
      
      const ctx = chart.ctx;
      const yScale = chart.scales.y;
      const xScale = chart.scales.x;
      
      if (!yScale || !xScale) {
        return;
      }
      
      // Draw motion detection threshold line (variance = 12.0)
      // This shows when variance exceeds the threshold for motion detection
      const MOTION_THRESHOLD = 12.0;
      const thresholdY = yScale.getPixelForValue(MOTION_THRESHOLD);
      
      if (thresholdY !== null && !isNaN(thresholdY) && isFinite(thresholdY)) {
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xScale.left, thresholdY);
        ctx.lineTo(xScale.right, thresholdY);
        ctx.stroke();
        
        // Add label for threshold
        ctx.fillStyle = 'rgba(251, 146, 60, 0.9)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Motion Threshold (12.0)', xScale.right - 5, thresholdY - 5);
        ctx.restore();
      }
      
      // Draw temperature thresholds on right y-axis (y1)
      const y1Scale = chart.scales.y1;
      if (y1Scale) {
        // Temperature Range threshold (2.5°C)
        const RANGE_THRESHOLD = 2.5;
        const rangeThresholdY = y1Scale.getPixelForValue(RANGE_THRESHOLD);
        if (rangeThresholdY !== null && !isNaN(rangeThresholdY) && isFinite(rangeThresholdY)) {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(xScale.left, rangeThresholdY);
          ctx.lineTo(xScale.right, rangeThresholdY);
          ctx.stroke();
          ctx.restore();
        }
        
        // Temperature Change threshold lines (+2.0°C and -2.0°C)
        const TEMP_CHANGE_THRESHOLD_POS = 2.0;
        const TEMP_CHANGE_THRESHOLD_NEG = -2.0;
        const posThresholdY = y1Scale.getPixelForValue(TEMP_CHANGE_THRESHOLD_POS);
        const negThresholdY = y1Scale.getPixelForValue(TEMP_CHANGE_THRESHOLD_NEG);
        
        if (posThresholdY !== null && !isNaN(posThresholdY) && isFinite(posThresholdY)) {
          ctx.save();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(xScale.left, posThresholdY);
          ctx.lineTo(xScale.right, posThresholdY);
          ctx.stroke();
          ctx.restore();
        }
        
        if (negThresholdY !== null && !isNaN(negThresholdY) && isFinite(negThresholdY)) {
          ctx.save();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(xScale.left, negThresholdY);
          ctx.lineTo(xScale.right, negThresholdY);
          ctx.stroke();
          ctx.restore();
        }
      }
      
      // Draw manual move events (yellow, dashed)
      drawEventLines(chart, currentSession?.move_events, 'rgb(250, 204, 21)', 2, [5, 5]);
      
      // Draw detected movement events as yellow triangles
      drawMovementTriangles(chart, currentSession?.movement_detected);
    },
  };

  return <Line data={data} options={options} plugins={[moveEventPlugin]} />;
}

interface ThermalSample {
  sampleIndex: number;
  timestamp: number;
  heatmapVariance: number | null;
  patternStability: number | null;
  temperatureRange?: number | null;
  temperatureChange?: number | null;
  restlessness?: number | null;
  averageTemperature?: number | null;
  thermalData?: number[][] | null;
}

interface MoveEvent {
  timestamp: number;
  secondsFromStart: number;
}

interface ThermalSession {
  id: string;
  user_id: string;
  subject_identifier: string;
  session_number: number | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  average_surface_temp: number | null;
  average_temperature_range: number | null;
  thermal_event_count: number;
  samples: ThermalSample[] | null;
  move_events: MoveEvent[] | null;
  movement_detected: MoveEvent[] | null;
  created_at: string;
}

export default function ThermalHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ThermalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ThermalSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [testResults, setTestResults] = useState<string | null>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function initializeUser() {
      try {
        console.log('🔐 Initializing user for thermal history...');
        const guestStatus = await isGuestUser();
        console.log('👤 Guest status:', guestStatus);
        
        if (guestStatus) {
          const guestUserId = getGuestUserId();
          console.log('🎭 Guest user ID:', guestUserId);
          setUserId(guestUserId);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          console.log('🔑 Supabase user:', user);
          if (user?.id) {
            console.log('✅ Setting user ID:', user.id);
            setUserId(user.id);
          } else {
            console.log('❌ No user ID found');
          }
        }
      } catch (error) {
        console.error('💥 Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    initializeUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  // Render thermal canvas for playback (using same code as ThermalVisualization)
  useEffect(() => {
    if (!playbackCanvasRef.current || !selectedSession?.samples?.[playbackIndex]?.thermalData) return;

    const canvas = playbackCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thermalData = selectedSession.samples[playbackIndex].thermalData;

    // Set canvas size to 96x96 for larger upscaling (same as original)
    const GRID_SIZE = 96;
    
    // Get the container size and set canvas to fit properly
    const container = canvas.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      // Use a larger minimum size for the canvas
      const minSize = Math.max(400, Math.min(containerRect.width, containerRect.height) * 0.95);
      const pixelSize = Math.floor(minSize / GRID_SIZE);
      const actualSize = pixelSize * GRID_SIZE;
      
      canvas.width = actualSize;
      canvas.height = actualSize;
      canvas.style.width = `${actualSize}px`;
      canvas.style.height = `${actualSize}px`;
    } else {
      // Fallback to default size
      const defaultSize = 400;
      canvas.width = defaultSize;
      canvas.height = defaultSize;
      canvas.style.width = `${defaultSize}px`;
      canvas.style.height = `${defaultSize}px`;
    }

    // Use requestAnimationFrame for smooth rendering
    const renderFrame = () => {
      try {
        // Validate thermal data before processing
        if (!thermalData || thermalData.length === 0 || !Array.isArray(thermalData[0])) {
          console.warn('⚠️ Invalid thermal data, skipping render');
          return;
        }
        
        // Find temperature range for color mapping
        const allTemps = thermalData.flat();
        if (allTemps.length === 0) {
          console.warn('⚠️ Empty thermal data array, skipping render');
          return;
        }
        
        const minTemp = Math.min(...allTemps);
        const maxTemp = Math.max(...allTemps);
        const tempRange = maxTemp - minTemp;

        // Create upscaled thermal data (96x96 from 8x8)
        const upscaledData: number[][] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          upscaledData[y] = [];
          for (let x = 0; x < GRID_SIZE; x++) {
            // Map 96x96 coordinates to 8x8 coordinates with interpolation
            const sourceX = (x / GRID_SIZE) * 8;
            const sourceY = (y / GRID_SIZE) * 8;
            
            const x1 = Math.floor(sourceX);
            const y1 = Math.floor(sourceY);
            const x2 = Math.min(x1 + 1, 7);
            const y2 = Math.min(y1 + 1, 7);
            
            const fx = sourceX - x1;
            const fy = sourceY - y1;
            
            // Bilinear interpolation
            const temp = 
              thermalData[y1][x1] * (1 - fx) * (1 - fy) +
              thermalData[y1][x2] * fx * (1 - fy) +
              thermalData[y2][x1] * (1 - fx) * fy +
              thermalData[y2][x2] * fx * fy;
            
            upscaledData[y][x] = temp;
          }
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate pixel size for drawing
        const pixelSize = Math.floor(canvas.width / GRID_SIZE);

        // Draw upscaled thermal grid (same color mapping as original)
        upscaledData.forEach((row, y) => {
          row.forEach((temp, x) => {
            const normalizedTemp = tempRange > 0 ? (temp - minTemp) / tempRange : 0.5;
            
            // Enhanced color mapping: blue (cold) to red (hot) with better contrast
            let r, g, b;
            
            // Use the same vibrant color scheme as original
            if (normalizedTemp < 0.33) {
              // Blue to cyan
              const factor = normalizedTemp / 0.33;
              r = Math.floor(0);
              g = Math.floor(255 * factor);
              b = Math.floor(255);
            } else if (normalizedTemp < 0.66) {
              // Cyan to yellow
              const factor = (normalizedTemp - 0.33) / 0.33;
              r = Math.floor(255 * factor);
              g = Math.floor(255);
              b = Math.floor(255 * (1 - factor));
            } else {
              // Yellow to red
              const factor = (normalizedTemp - 0.66) / 0.34;
              r = Math.floor(255);
              g = Math.floor(255 * (1 - factor));
              b = Math.floor(0);
            }

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          });
        });
      } catch (error) {
        console.error('❌ Error rendering thermal canvas:', error);
      }
    };

    // Use requestAnimationFrame for smooth updates
    const animationId = requestAnimationFrame(renderFrame);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [selectedSession, playbackIndex]);

  const loadSessions = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading thermal sessions for userId:', userId);
      const response = await fetch(`/api/thermal-sessions?userId=${userId}&limit=100`);
      const result = await response.json();

      console.log('📊 Thermal sessions API response:', {
        status: response.status,
        ok: response.ok,
        result: result
      });

      if (response.ok && result.data) {
        console.log('✅ Successfully loaded sessions:', result.data.length, 'sessions');
        setSessions(result.data);
      } else {
        console.error('❌ Error loading sessions:', result.error, result.details);
      }
    } catch (error) {
      console.error('💥 Exception loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session: ThermalSession) => {
    if (selectedSession?.id === session.id) {
      setSelectedSession(null);
    } else {
      setSelectedSession(session);
    }
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!userId) return;
    
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingSession(sessionId);
      const response = await fetch('/api/thermal-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
      });

      const result = await response.json();

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      } else {
        alert(`Failed to delete session: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    } finally {
      setDeletingSession(null);
    }
  };

  const toggleSessionSelection = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const selectAllSessions = () => {
    const allSessionIds = new Set(sessions.map(s => s.id));
    setSelectedSessions(allSessionIds);
  };

  const deselectAllSessions = () => {
    setSelectedSessions(new Set());
  };

  const handleMassDelete = async () => {
    if (!userId || selectedSessions.size === 0) return;
    
    const sessionCount = selectedSessions.size;
    if (!confirm(`Are you sure you want to delete ${sessionCount} session${sessionCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const deletePromises = Array.from(selectedSessions).map(sessionId =>
        fetch('/api/thermal-sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId }),
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Filter out successfully deleted sessions
      const successfullyDeleted = Array.from(selectedSessions).filter((sessionId, index) => 
        responses[index].ok
      );

      if (successfullyDeleted.length > 0) {
        setSessions(sessions.filter(s => !successfullyDeleted.includes(s.id)));
        if (selectedSession && successfullyDeleted.includes(selectedSession.id)) {
          setSelectedSession(null);
        }
      }

      // Handle any failures
      const failedDeletions = results.filter((result, index) => !responses[index].ok);
      if (failedDeletions.length > 0) {
        alert(`Failed to delete ${failedDeletions.length} session(s). Please try again.`);
      }

      // Clear selection
      setSelectedSessions(new Set());
      
    } catch (error) {
      console.error('Error during mass delete:', error);
      alert('Failed to delete sessions');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    if (bulkSelectMode) {
      setSelectedSessions(new Set());
    }
  };

  const exportToCSV = (session: ThermalSession) => {
    if (!session.samples || session.samples.length === 0) {
      alert('No sample data to export');
      return;
    }

    const headers = ['Sample Index', 'Timestamp', 'Heatmap Variance', 'Pattern Stability (%)'];
    const rows = session.samples.map(sample => [
      sample.sampleIndex,
      new Date(sample.timestamp).toISOString(),
      sample.heatmapVariance !== null ? sample.heatmapVariance.toFixed(2) : '',
      sample.patternStability !== null ? sample.patternStability.toFixed(1) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const sessionNumberStr = session.session_number !== null ? `#${session.session_number}_` : '';
    link.setAttribute('download', `thermal_session_${sessionNumberStr}Subject_${session.subject_identifier}_${new Date(session.started_at).toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getChartData = (session: ThermalSession) => {
    if (!session || !session.samples || session.samples.length === 0) {
      return null;
    }

    try {
      // Ensure timestamps are numbers (they might come as strings from JSONB)
      const samples = session.samples.map(sample => {
        let timestamp: number;
        if (typeof sample.timestamp === 'number') {
          timestamp = sample.timestamp;
        } else if (typeof sample.timestamp === 'string') {
          const parsed = new Date(sample.timestamp).getTime();
          timestamp = isNaN(parsed) ? Date.now() : parsed;
        } else {
          timestamp = Date.now();
        }

        return {
          ...sample,
          timestamp,
        };
      });

      const baseTime = samples[0]?.timestamp ?? 0;
      const labels = samples.map((sample) => {
        const seconds = Math.floor((sample.timestamp - baseTime) / 1000);
        return `${seconds}s`;
      });

    const datasets: any[] = [
      {
        label: 'Motion / Heatmap Variance',
        data: samples.map(s => s.heatmapVariance ?? null),
        borderColor: 'rgb(34, 211, 238)',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'Average Temperature (°C)',
        data: samples.map(s => s.averageTemperature ?? null),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
        yAxisID: 'y2',
      },
      {
        label: 'Temperature Range (°C)',
        data: samples.map(s => s.temperatureRange ?? null),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
        yAxisID: 'y1',
      },
      {
        label: 'Temperature Change from Baseline (°C)',
        data: samples.map(s => s.temperatureChange ?? null),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
        yAxisID: 'y1',
      },
    ];

    return {
      labels,
      datasets,
    };
    } catch (error) {
      console.error('Error generating chart data:', error);
      return null;
    }
  };

  const getChartOptions = (session: ThermalSession) => {
    if (!session || !session.started_at) {
      return {
        responsive: true,
        maintainAspectRatio: false,
      };
    }

    try {
      const startTime = new Date(session.started_at);
      const startTimeStr = isNaN(startTime.getTime()) 
        ? 'Unknown' 
        : startTime.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

      // Build title with movement counts
      let titleText = `Sleep Activity - Subject: ${session.subject_identifier} (Started: ${startTimeStr})`;
      const movementCounts = [];
      if (session.move_events && session.move_events.length > 0) {
        movementCounts.push(`${session.move_events.length} manual`);
      }
      if (session.movement_detected && session.movement_detected.length > 0) {
        movementCounts.push(`${session.movement_detected.length} detected`);
      }
      if (movementCounts.length > 0) {
        titleText += ` [${movementCounts.join(', ')} movement events]`;
      }

      return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: titleText,
        color: 'rgb(156, 163, 175)',
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
        borderColor: 'rgb(34, 211, 238)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Move Events') {
              // Find the move event at this position
              const moveEvent = session.move_events?.find((me: MoveEvent) => {
                const xValue = context.parsed.x;
                return xValue && typeof xValue === 'string' && xValue.includes(`${me.secondsFromStart}s`);
              });
              return `Move Event at ${moveEvent?.secondsFromStart ?? '?'}s`;
            }
            if (label.includes('Temperature')) {
              return `${label}: ${value !== null ? value.toFixed(1) + '°C' : 'N/A'}`;
            }
            return `${label}: ${value !== null ? value.toFixed(2) : 'N/A'}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time (seconds from start)',
          color: 'rgb(156, 163, 175)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Motion Level / Heatmap Variance',
          color: 'rgb(34, 211, 238)',
        },
        ticks: {
          color: 'rgb(34, 211, 238)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Temperature Range/Change (°C)',
          color: 'rgb(251, 146, 60)',
        },
        ticks: {
          color: 'rgb(251, 146, 60)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear' as const,
        display: false, // Hide this axis to avoid clutter, but use for scaling
        position: 'right' as const,
        min: 20, // Typical room temperature range
        max: 40, // Typical body temperature range
      },
    },
    };
    } catch (error) {
      console.error('Error generating chart options:', error);
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: session ? `Sleep Activity - Subject: ${session.subject_identifier}` : 'Sleep Activity',
            color: 'rgb(156, 163, 175)',
          },
        },
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const chartData = selectedSession ? getChartData(selectedSession) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      
      <main className="relative mx-auto max-w-7xl px-6 sm:px-10 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4">
              <Image
                src="/digital_brain.png"
                alt="Cognitive Care Assistant logo"
                width={96}
                height={96}
                priority
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow"
              />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Thermal Session History
            </h1>
            <p className="text-sm text-gray-300">
              Review past thermal sensor recordings
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all text-sm"
          >
            ← Dashboard
          </Link>
          <Link
            href="/sleepbehaviors"
            className="px-4 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all text-sm"
          >
            New Recording
          </Link>
        </div>

        {/* Debug Info - Show when no sessions or in development */}
        {(sessions.length === 0 || process.env.NODE_ENV === 'development') && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <h3 className="text-yellow-300 font-medium mb-2">🔧 Troubleshooting Panel</h3>
            <div className="text-xs text-yellow-200 space-y-1">
              <div>User ID: {userId || 'Not set'}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Sessions count: {sessions.length}</div>
              <div>API URL: /api/thermal-sessions?userId={userId}&limit=100</div>
              <div>Environment: {process.env.NODE_ENV || 'unknown'}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={loadSessions}
                disabled={!userId || loading}
                className="px-3 py-1 text-xs rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                🔄 Reload Sessions
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  setIsTestingAPI(true);
                  setTestResults(null);
                  try {
                    console.log('🧪 Testing API call with debug mode...');
                    const response = await fetch(`/api/thermal-sessions?userId=${userId}&limit=100&debug=true`);
                    const result = await response.json();
                    console.log('🧪 Direct API test result:', {
                      url: `/api/thermal-sessions?userId=${userId}&limit=100&debug=true`,
                      status: response.status,
                      statusText: response.statusText,
                      ok: response.ok,
                      headers: Object.fromEntries(response.headers.entries()),
                      result: result
                    });
                    
                    const testResult = `API Test Results:
Status: ${response.status} ${response.statusText}
Success: ${response.ok ? 'Yes' : 'No'}
Data Count: ${result.data?.length || 0}
Error: ${result.error || 'None'}
Debug Info: ${result.debug ? JSON.stringify(result.debug, null, 2) : 'Not available'}

${result.data?.length > 0 ? 'Sessions found! They should appear above.' : 'No sessions found in database for your user ID.'}`;
                    
                    setTestResults(testResult);
                  } catch (error) {
                    console.error('🧪 Direct API test error:', error);
                    setTestResults(`API Test Error: ${error}\n\nThis usually means there's a network issue or the API server is not responding.`);
                  } finally {
                    setIsTestingAPI(false);
                  }
                }}
                disabled={!userId || isTestingAPI}
                className="px-3 py-1 text-xs rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                {isTestingAPI ? '⏳ Testing...' : '🧪 Test API'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userId || '');
                  alert('User ID copied to clipboard!');
                }}
                disabled={!userId}
                className="px-3 py-1 text-xs rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                📋 Copy User ID
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  setIsTestingAPI(true);
                  setTestResults(null);
                  try {
                    // Check if we can reach the API at all
                    const healthResponse = await fetch('/api/thermal-sessions?userId=test&limit=1');
                    const healthResult = await healthResponse.json();
                    
                    const message = `Health Check Results:
API Reachable: ${healthResponse.ok ? 'Yes' : 'No'}
Status: ${healthResponse.status}
Error: ${healthResult.error || 'None'}

${healthResponse.ok ? 'API is working! Try recording a session in Sleep Behaviors.' : 'API has issues - check server logs.'}`;
                    
                    setTestResults(message);
                    console.log('🏥 Health check result:', { healthResponse, healthResult });
                  } catch (error) {
                    setTestResults(`Health Check Failed: ${error}\n\nThis usually means the server is not running or there's a network issue.`);
                    console.error('🏥 Health check error:', error);
                  } finally {
                    setIsTestingAPI(false);
                  }
                }}
                disabled={isTestingAPI}
                className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                {isTestingAPI ? '⏳ Checking...' : '🏥 Health Check'}
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  setIsTestingAPI(true);
                  setTestResults(null);
                  try {
                    console.log('🧪 Creating test session...');
                    const now = new Date();
                    const testSession = {
                      userId,
                      subjectIdentifier: 'TEST_SUBJECT',
                      startedAt: new Date(now.getTime() - 30000).toISOString(), // 30 seconds ago
                      endedAt: now.toISOString(),
                      durationSeconds: 30,
                      averageSurfaceTemp: 25.5,
                      averageTemperatureRange: 2.1,
                      thermalEventCount: 5,
                      samples: [
                        { sampleIndex: 0, timestamp: now.getTime() - 30000, heatmapVariance: 1.2, patternStability: 85 },
                        { sampleIndex: 1, timestamp: now.getTime() - 15000, heatmapVariance: 1.5, patternStability: 82 },
                        { sampleIndex: 2, timestamp: now.getTime(), heatmapVariance: 1.1, patternStability: 88 }
                      ],
                      moveEvents: [],
                      movementDetected: []
                    };

                    const response = await fetch('/api/thermal-sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testSession),
                    });

                    const result = await response.json();
                    console.log('🧪 Test session creation result:', { response, result });

                    if (response.ok) {
                      setTestResults(`✅ Test session created successfully!
Session ID: ${result.data?.id || 'Unknown'}
Subject: TEST_SUBJECT
Duration: 30 seconds

Now click "🔄 Reload Sessions" to see if it appears.`);
                      
                      // Auto-reload sessions after successful creation
                      setTimeout(() => {
                        loadSessions();
                      }, 1000);
                    } else {
                      setTestResults(`❌ Failed to create test session:
Status: ${response.status}
Error: ${result.error || 'Unknown error'}
Details: ${result.details || 'None'}

This indicates a problem with the session saving process.`);
                    }
                  } catch (error) {
                    console.error('🧪 Test session creation error:', error);
                    setTestResults(`❌ Test session creation failed: ${error}`);
                  } finally {
                    setIsTestingAPI(false);
                  }
                }}
                disabled={isTestingAPI}
                className="px-3 py-1 text-xs rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                {isTestingAPI ? '⏳ Creating...' : '🧪 Create Test Session'}
              </button>
            </div>
            <div className="mt-2 text-xs text-yellow-300">
              💡 If no sessions appear after recording, click "🧪 Test API" to diagnose the issue.
            </div>
            {testResults && (
              <div className="mt-3 p-3 rounded bg-gray-900/50 border border-gray-600">
                <h4 className="text-xs font-medium text-white mb-2">Test Results:</h4>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {testResults}
                </pre>
                <button
                  onClick={() => setTestResults(null)}
                  className="mt-2 px-2 py-1 text-xs rounded bg-gray-600/50 text-gray-300 hover:bg-gray-600/70"
                >
                  Clear Results
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              {loading ? 'Loading thermal sessions...' : 'No thermal sessions found.'}
            </p>
            {!loading && (
              <>
                <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 max-w-md mx-auto">
                  <h3 className="text-orange-300 font-medium mb-2">⚠️ Important</h3>
                  <p className="text-orange-200 text-sm">
                    Sessions are only saved if you:
                  </p>
                  <ul className="text-orange-200 text-sm mt-2 space-y-1 text-left">
                    <li>1. Fill in the <strong>"Subject"</strong> field</li>
                    <li>2. Start the thermal sensor</li>
                    <li>3. Record for at least a few seconds</li>
                    <li>4. Stop recording</li>
                  </ul>
                  <p className="text-orange-300 text-xs mt-2">
                    Without a subject identifier, recordings are discarded!
                  </p>
                </div>
                <Link
                  href="/sleepbehaviors"
                  className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Start a Recording
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">All Sessions ({sessions.length})</h2>
                <button
                  onClick={toggleBulkSelectMode}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    bulkSelectMode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-white/5 text-gray-300 border border-white/20 hover:bg-white/10'
                  }`}
                >
                  {bulkSelectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
              
              {bulkSelectMode && (
                <div className="flex flex-col gap-3 p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
                  <div className="text-xs text-gray-400 mb-1">
                    💡 Click individual sessions or use quick select buttons below
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 font-medium">
                      {selectedSessions.size} of {sessions.length} selected
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const firstFive = new Set(sessions.slice(0, Math.min(5, sessions.length)).map(s => s.id));
                          setSelectedSessions(firstFive);
                        }}
                        disabled={sessions.length === 0}
                        className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                        title="Select first 5 sessions"
                      >
                        First 5
                      </button>
                      <button
                        onClick={() => {
                          const lastFive = new Set(sessions.slice(-Math.min(5, sessions.length)).map(s => s.id));
                          setSelectedSessions(lastFive);
                        }}
                        disabled={sessions.length === 0}
                        className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all disabled:opacity-50"
                        title="Select last 5 sessions"
                      >
                        Last 5
                      </button>
                      <button
                        onClick={() => {
                          const firstTen = new Set(sessions.slice(0, Math.min(10, sessions.length)).map(s => s.id));
                          setSelectedSessions(firstTen);
                        }}
                        disabled={sessions.length < 6}
                        className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                        title="Select first 10 sessions"
                      >
                        First 10
                      </button>
                      <button
                        onClick={selectAllSessions}
                        disabled={sessions.length === 0}
                        className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                      >
                        All
                      </button>
                      <button
                        onClick={deselectAllSessions}
                        disabled={selectedSessions.size === 0}
                        className="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 transition-all disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  {selectedSessions.size > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <button
                        onClick={handleMassDelete}
                        disabled={isDeleting}
                        className="w-full py-2 px-3 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium border border-red-500/30"
                      >
                        {isDeleting ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Deleting {selectedSessions.size} selected session{selectedSessions.size > 1 ? 's' : ''}...
                          </>
                        ) : (
                          <>
                            🗑️ Delete {selectedSessions.size} selected session{selectedSessions.size > 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => bulkSelectMode ? null : handleSessionClick(session)}
                    className={`p-4 rounded-lg border transition-all ${
                      bulkSelectMode
                        ? selectedSessions.has(session.id)
                          ? 'border-cyan-400 bg-cyan-500/20 cursor-pointer ring-2 ring-cyan-400/30'
                          : 'border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer hover:border-white/25'
                        : selectedSession?.id === session.id
                        ? 'border-cyan-400 bg-cyan-500/20 cursor-pointer'
                        : 'border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        {bulkSelectMode && (
                          <div className="mt-1 flex flex-col items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedSessions.has(session.id)}
                              onChange={(e) => toggleSessionSelection(session.id, e as any)}
                              className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 focus:ring-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {selectedSessions.has(session.id) && (
                              <span className="text-xs text-red-400 font-medium" title="Marked for deletion">
                                ⚠️
                              </span>
                            )}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            {session.session_number !== null && (
                              <span className="text-xs font-medium text-gray-400">#{session.session_number}</span>
                            )}
                            <h3 className="font-medium text-cyan-200">Subject: {session.subject_identifier}</h3>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(session.started_at)}</p>
                        </div>
                      </div>
                      {!bulkSelectMode && (
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          disabled={deletingSession === session.id}
                          className="flex items-center gap-1 px-2 py-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium transition-all disabled:opacity-50"
                          title="Delete session"
                        >
                          {deletingSession === session.id ? (
                            <>
                              <span className="animate-spin">⟳</span>
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <span>🗑️</span>
                              <span>Delete</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mt-2">
                      <div>
                        <span className="text-gray-400">Duration:</span> {formatDuration(session.duration_seconds)}
                      </div>
                      <div>
                        <span className="text-gray-400">Events:</span> {session.thermal_event_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Details */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <div className="space-y-6">
                  {/* Session Summary */}
                  <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
                    <h2 className="text-2xl font-semibold mb-4">Session Details</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Session Number</p>
                        <p className="text-lg font-medium text-cyan-200">
                          {selectedSession.session_number !== null ? `#${selectedSession.session_number}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Subject</p>
                        <p className="text-lg font-medium text-cyan-200">{selectedSession.subject_identifier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date/Time</p>
                        <p className="text-lg font-medium">{formatDateTime(selectedSession.started_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="text-lg font-medium">{formatDuration(selectedSession.duration_seconds)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Thermal Events</p>
                        <p className="text-lg font-medium">{selectedSession.thermal_event_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Avg Surface Temp</p>
                        <p className="text-lg font-medium">
                          {selectedSession.average_surface_temp !== null
                            ? `${selectedSession.average_surface_temp.toFixed(1)}°C`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Avg Temp Range</p>
                        <p className="text-lg font-medium">
                          {selectedSession.average_temperature_range !== null
                            ? `${selectedSession.average_temperature_range.toFixed(1)}°C`
                            : '—'}
                        </p>
                      </div>
                      {selectedSession.move_events && selectedSession.move_events.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400">Move Events (Manual)</p>
                          <p className="text-lg font-medium text-yellow-400">
                            {selectedSession.move_events.length} event(s)
                          </p>
                        </div>
                      )}
                      {selectedSession.movement_detected && selectedSession.movement_detected.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400">Movement Detected (Auto)</p>
                          <p className="text-lg font-medium text-yellow-400">
                            {selectedSession.movement_detected.length} event(s)
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Motion Detection Logic:</p>
                      <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                        <li>Motion is detected when variance &gt; 12.0, temperature range &gt; 2.5°C, or temperature change &gt; 2.0°C</li>
                        <li>An event is recorded after 3 consecutive frames of motion (sustained movement)</li>
                        <li>Minimum 5 seconds between recorded events to avoid duplicates</li>
                      </ul>
                    </div>
                  </div>

                  {/* Chart */}
                  {selectedSession.samples && selectedSession.samples.length > 0 ? (
                    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-semibold">
                            Motion Level Over Time - Subject: {selectedSession.subject_identifier} ({selectedSession.samples.length} samples)
                          </h3>
                          <button
                            onClick={() => exportToCSV(selectedSession)}
                            className="px-4 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all text-sm text-cyan-200"
                          >
                            Export CSV
                          </button>
                        </div>
                          <div className="text-xs text-gray-400 space-y-1">
                          <p><span className="text-orange-400">━━━</span> Orange line: Motion threshold (12.0) - values above indicate motion detected</p>
                          <p><span className="text-yellow-400">━━ ━━</span> Yellow dashed: Manual move events | <span className="text-yellow-400">▼</span> Yellow triangles: Auto-detected movement</p>
                          <p>Lines: <span className="text-cyan-400">Cyan</span> = Motion/Variance | <span className="text-green-400">Green</span> = Avg Temperature | <span className="text-orange-400">Orange</span> = Temp Range | <span className="text-purple-400">Purple</span> = Temp Change</p>
                        </div>
                      </div>
                      <div className="h-96">
                        {chartData && selectedSession ? (
                          <MoveEventChart 
                            data={chartData} 
                            options={getChartOptions(selectedSession)}
                            session={selectedSession}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">Unable to generate chart from sample data</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Debug info for movement events */}
                      <div className="mt-4 p-3 bg-gray-800 rounded text-sm">
                        <p className="text-yellow-400 font-semibold">Debug: Movement Events</p>
                        <p>Manual move events: {selectedSession.move_events?.length || 0}</p>
                        <p>Auto-detected events: {selectedSession.movement_detected?.length || 0}</p>
                        {selectedSession.movement_detected && selectedSession.movement_detected.length > 0 && (
                          <div className="mt-2">
                            <p className="text-yellow-300">Auto-detected events data:</p>
                            <pre className="text-xs text-gray-300 mt-1">
                              {JSON.stringify(selectedSession.movement_detected, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
                      <h3 className="text-xl font-semibold mb-4">Sleep Activity - Subject: {selectedSession.subject_identifier}</h3>
                      <p className="text-gray-400 text-center py-8">No sample data available for this session.</p>
                    </div>
                  )}

                  {/* Thermal Heatmap Playback */}
                  {selectedSession.samples && selectedSession.samples.length > 0 && (
                    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Thermal Heatmap Playback</h3>
                        <div className="flex items-center gap-3">
                          <select
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                            className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white text-sm"
                          >
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={4}>4x</option>
                          </select>
                          <button
                            onClick={() => {
                              if (isPlayingBack) {
                                setIsPlayingBack(false);
                              } else {
                                setIsPlayingBack(true);
                                // Auto-play through samples
                                const interval = setInterval(() => {
                                  setPlaybackIndex(prev => {
                                    if (prev >= (selectedSession.samples?.length || 0) - 1) {
                                      setIsPlayingBack(false);
                                      clearInterval(interval);
                                      return 0;
                                    }
                                    return prev + 1;
                                  });
                                }, 1000 / playbackSpeed);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              isPlayingBack
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}
                          >
                            {isPlayingBack ? '⏸️ Pause' : '▶️ Play'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">
                            Sample {playbackIndex + 1} of {selectedSession.samples.length}
                          </span>
                          <span className="text-sm text-gray-400">
                          {selectedSession.samples && selectedSession.samples[playbackIndex] ? 
                            `${Math.floor((selectedSession.samples[playbackIndex].timestamp - selectedSession.samples[0].timestamp) / 1000)}s` 
                            : '0s'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={selectedSession.samples.length - 1}
                          value={playbackIndex}
                          onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Motion Data */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-cyan-200">Motion Analysis</h4>
                          {selectedSession.samples[playbackIndex] && (
                            <div className="space-y-3">
                              {/* Motion Level Indicator */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-400">Motion Level:</span>
                                  <span className="text-cyan-300 font-medium">
                                    {selectedSession.samples[playbackIndex].heatmapVariance?.toFixed(2) ?? 'N/A'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                  <div 
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                      (selectedSession.samples[playbackIndex].heatmapVariance ?? 0) > 12 
                                        ? 'bg-red-500' 
                                        : (selectedSession.samples[playbackIndex].heatmapVariance ?? 0) > 6
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, ((selectedSession.samples[playbackIndex].heatmapVariance ?? 0) / 20) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Still (0)</span>
                                  <span>Motion Threshold (12)</span>
                                  <span>High (20+)</span>
                                </div>
                              </div>

                              {/* Pattern Stability */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-400">Pattern Stability:</span>
                                  <span className="text-purple-300 font-medium">
                                    {selectedSession.samples[playbackIndex].patternStability?.toFixed(1) ?? 'N/A'}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                  <div 
                                    className="h-3 rounded-full bg-purple-500 transition-all duration-300"
                                    style={{ 
                                      width: `${selectedSession.samples[playbackIndex].patternStability ?? 0}%` 
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Restlessness Indicator */}
                              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 border border-gray-600">
                                <span className="text-sm text-gray-400">Restlessness:</span>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    selectedSession.samples[playbackIndex].restlessness === 1 
                                      ? 'bg-red-500 animate-pulse' 
                                      : 'bg-green-500'
                                  }`} />
                                  <span className={`text-sm font-medium ${
                                    selectedSession.samples[playbackIndex].restlessness === 1 
                                      ? 'text-red-300' 
                                      : 'text-green-300'
                                  }`}>
                                    {selectedSession.samples[playbackIndex].restlessness === 1 ? 'Detected' : 'Calm'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Thermal Heatmap Visualization */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-cyan-200">Thermal Heatmap</h4>
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-center text-gray-400 text-sm mb-4">
                              Actual Recorded Thermal Data (8x8 sensor upscaled to 96x96 display)
                            </div>
                            {selectedSession.samples[playbackIndex]?.thermalData ? (
                              <div className="space-y-3">
                                <div className="flex justify-center">
                                  <canvas
                                    ref={playbackCanvasRef}
                                    className="rounded-lg border border-white/20 bg-gray-900"
                                    style={{ imageRendering: 'pixelated' }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>🟦 Cool ({selectedSession.samples[playbackIndex].thermalData!.flat().reduce((min: number, temp: number) => Math.min(min, temp), Infinity).toFixed(1)}°C)</span>
                                  <span>🟥 Warm ({selectedSession.samples[playbackIndex].thermalData!.flat().reduce((max: number, temp: number) => Math.max(max, temp), -Infinity).toFixed(1)}°C)</span>
                                </div>
                                <div className="text-center text-xs text-gray-400">
                                  Average: {(selectedSession.samples[playbackIndex].thermalData!.flat().reduce((sum: number, temp: number) => sum + temp, 0) / 64).toFixed(1)}°C | Range: {(selectedSession.samples[playbackIndex].thermalData!.flat().reduce((max: number, temp: number) => Math.max(max, temp), -Infinity) - selectedSession.samples[playbackIndex].thermalData!.flat().reduce((min: number, temp: number) => Math.min(min, temp), Infinity)).toFixed(1)}°C
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-8">
                                <p className="mb-2">No thermal grid data available</p>
                                <p className="text-xs">This session was recorded before thermal data saving was enabled</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl border border-white/15 bg-white/5">
                  <p className="text-gray-400">Select a session to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
