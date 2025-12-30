"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, safeGetUser } from "@/lib/supabaseClient";
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

interface EMGReading {
  timestamp: number;
  muscleActivity: number;
  muscleActivityProcessed: number;
  voltage?: number;
  moveMarker?: 'request' | 'sensed' | 'end'; // Optional move marker type
}

interface MoveMarker {
  timestamp: number;
  type: 'request' | 'sensed' | 'end';
}

interface EMGSession {
  id: string;
  user_id: string;
  session_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  readings: EMGReading[] | null;
  move_markers?: MoveMarker[] | null; // Move markers array
  average_voltage: number | null;
  max_voltage: number | null;
  created_at: string;
}

export default function EMGHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<EMGSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<EMGSession | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<EMGSession[]>([]);
  const [overlapMode, setOverlapMode] = useState(false);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingGraphTitle, setIsEditingGraphTitle] = useState(false);
  const [editingGraphTitle, setEditingGraphTitle] = useState<string>('');
  const [graphTitle, setGraphTitle] = useState<string>('');
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  useEffect(() => {
    async function initializeUser() {
      try {
        console.log('🔐 Initializing user for EMG history...');
        const guestStatus = await isGuestUser();
        console.log('👤 Guest status:', guestStatus);
        
        if (guestStatus) {
          const guestUserId = getGuestUserId();
          console.log('🎭 Guest user ID:', guestUserId);
          setUserId(guestUserId);
        } else {
          const { user, error } = await safeGetUser();
          console.log('🔑 Supabase user:', user);
          if (error) {
            console.log('⚠️ Auth error:', error.message);
          }
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

  // Sync graph title with selected session (only if not manually edited)
  useEffect(() => {
    if (overlapMode) {
      if (selectedSessions.length > 0 && !isEditingGraphTitle) {
        const defaultTitle = `${selectedSessions.length} Sessions Overlapping`;
        // Only update if title is empty or matches the old default pattern
        if (!graphTitle || graphTitle.match(/^\d+ Sessions Overlapping$/)) {
          setGraphTitle(defaultTitle);
        }
      }
    } else {
      if (selectedSession && !isEditingGraphTitle) {
        // Only update if title matches the session name (user hasn't customized it)
        if (!graphTitle || graphTitle === selectedSession.session_name) {
          setGraphTitle(selectedSession.session_name);
        }
      }
    }
  }, [selectedSession?.id, selectedSessions.length, overlapMode, isEditingGraphTitle]);

  const loadSessions = async () => {
    if (!userId) {
      console.log('⚠️ No userId, skipping loadSessions');
      return;
    }

    try {
      console.log('📡 Loading EMG sessions for userId:', userId);
      const response = await fetch(`/api/emg-sessions?userId=${userId}`);
      const result = await response.json();

      console.log('📊 API Response:', {
        ok: response.ok,
        status: response.status,
        dataCount: result.data?.length || 0,
        error: result.error
      });

      if (response.ok && result.data) {
        console.log('✅ Loaded sessions:', result.data.length);
        // Log move markers for debugging
        result.data.forEach((session: EMGSession, index: number) => {
          if (session.move_markers && Array.isArray(session.move_markers) && session.move_markers.length > 0) {
            console.log(`📌 Session ${index} (${session.session_name}) has ${session.move_markers.length} move markers:`, session.move_markers);
          } else {
            console.log(`📌 Session ${index} (${session.session_name}) has no move markers`, {
              move_markers: session.move_markers,
              isArray: Array.isArray(session.move_markers)
            });
          }
        });
        setSessions(result.data);
      } else {
        console.error('❌ Failed to load sessions:', result.error);
        alert(`Failed to load sessions: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Error loading sessions:', error);
      alert(`Error loading sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSessionClick = (session: EMGSession) => {
    if (overlapMode) {
      // Toggle session in selectedSessions array
      setSelectedSessions(prev => {
        const isSelected = prev.some(s => s.id === session.id);
        if (isSelected) {
          return prev.filter(s => s.id !== session.id);
        } else {
          return [...prev, session];
        }
      });
    } else {
      setSelectedSession(session);
      setSelectedSessions([]);
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
      const response = await fetch('/api/emg-sessions', {
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

  const handleRenameClick = (session: EMGSession, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.session_name);
  };

  const handleCancelRename = (event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleSaveRename = async (sessionId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    if (!userId || !editingName.trim()) {
      handleCancelRename();
      return;
    }

    const trimmedName = editingName.trim();
    if (trimmedName === sessions.find(s => s.id === sessionId)?.session_name) {
      handleCancelRename();
      return;
    }

    try {
      setIsRenaming(true);
      const response = await fetch('/api/emg-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          sessionId, 
          sessionName: trimmedName 
        }),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setSessions(sessions.map(s => 
          s.id === sessionId 
            ? { ...s, session_name: trimmedName }
            : s
        ));
        
        if (selectedSession?.id === sessionId) {
          setSelectedSession({ ...selectedSession, session_name: trimmedName });
        }
        
        setEditingSessionId(null);
        setEditingName('');
      } else {
        alert(`Failed to rename session: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error renaming session:', error);
      alert('Failed to rename session');
    } finally {
      setIsRenaming(false);
    }
  };

  const exportMultipleSessionsToCSV = (sessions: EMGSession[]) => {
    if (sessions.length === 0) {
      alert('No sessions to export');
      return;
    }

    if (sessions.length === 1) {
      exportToCSV(sessions[0]);
      return;
    }

    // Combine all sessions into one CSV
    const allRows: any[] = [];
    
    sessions.forEach((session, sessionIndex) => {
      if (!session.readings || session.readings.length === 0) {
        return;
      }

      // Get move markers for this session
      let moveMarkers: MoveMarker[] = [];
      if (session.move_markers && Array.isArray(session.move_markers)) {
        moveMarkers = session.move_markers;
      } else if (session.readings) {
        session.readings.forEach((reading) => {
          if (reading.moveMarker && reading.timestamp) {
            moveMarkers.push({
              timestamp: reading.timestamp,
              type: reading.moveMarker as 'request' | 'sensed' | 'end'
            });
          }
        });
      }

      const markerMap = new Map<number, string>();
      moveMarkers.forEach(marker => {
        markerMap.set(marker.timestamp, marker.type);
      });

      // Add session header
      if (sessionIndex > 0) {
        allRows.push([]); // Empty row separator
      }
      allRows.push([`Session: ${session.session_name}`, `Started: ${new Date(session.started_at).toISOString()}`]);
      allRows.push(['Timestamp', 'Date/Time', 'Voltage (V)', 'Muscle Activity (Raw)', 'Muscle Activity (%)', 'Move Marker']);

      // Add readings for this session
      session.readings.forEach(reading => {
        const timestamp = typeof reading.timestamp === 'number' 
          ? reading.timestamp 
          : new Date(reading.timestamp as any).getTime();
        const markerType = markerMap.get(timestamp) || '';
        
        allRows.push([
          timestamp,
          new Date(timestamp).toISOString(),
          reading.voltage?.toFixed(3) || '',
          reading.muscleActivity,
          reading.muscleActivityProcessed.toFixed(2),
          markerType
        ]);
      });
    });

    // Build CSV content
    const csvContent = allRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sessionNames = sessions.map(s => s.session_name.replace(/[^a-z0-9]/gi, '_')).join('_');
    a.download = `emg_overlapped_sessions_${sessionNames}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = (session: EMGSession) => {
    if (!session.readings || session.readings.length === 0) {
      alert('No data to export');
      return;
    }

    // Get move markers from session (either from move_markers array or extract from readings)
    let moveMarkers: MoveMarker[] = [];
    if (session.move_markers && Array.isArray(session.move_markers)) {
      moveMarkers = session.move_markers;
    } else if (session.readings) {
      // Extract move markers from readings that have moveMarker property
      session.readings.forEach((reading) => {
        if (reading.moveMarker && reading.timestamp) {
          moveMarkers.push({
            timestamp: reading.timestamp,
            type: reading.moveMarker as 'request' | 'sensed' | 'end' | 'end'
          });
        }
      });
    }

    // Create a map of timestamps to move markers for quick lookup
    const markerMap = new Map<number, string>();
    moveMarkers.forEach(marker => {
      markerMap.set(marker.timestamp, marker.type);
    });

    const headers = ['Timestamp', 'Date/Time', 'Voltage (V)', 'Muscle Activity (Raw)', 'Muscle Activity (%)', 'Move Marker'];
    const rows = session.readings.map(reading => {
      const timestamp = typeof reading.timestamp === 'number' 
        ? reading.timestamp 
        : new Date(reading.timestamp as any).getTime();
      const markerType = markerMap.get(timestamp) || '';
      
      return [
        timestamp,
        new Date(timestamp).toISOString(),
        reading.voltage?.toFixed(3) || '',
        reading.muscleActivity,
        reading.muscleActivityProcessed.toFixed(2),
        markerType
      ];
    });

    // Build CSV content
    const csvLines: string[] = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ];

    // Add move markers sections at the end
    if (moveMarkers.length > 0) {
      // Separate move requests, sensed moves, and end move events
      const moveRequests = moveMarkers.filter(m => m.type === 'request');
      const sensedMoves = moveMarkers.filter(m => m.type === 'sensed');
      const endMoves = moveMarkers.filter(m => m.type === 'end');

      if (moveRequests.length > 0) {
        csvLines.push(''); // Empty line separator
        csvLines.push('Move Requests:');
        csvLines.push('Timestamp,Date/Time');
        moveRequests.forEach(marker => {
          const timestamp = marker.timestamp;
          csvLines.push([
            timestamp,
            new Date(timestamp).toISOString()
          ].join(','));
        });
      }

      if (sensedMoves.length > 0) {
        csvLines.push(''); // Empty line separator
        csvLines.push('Sensed Moves:');
        csvLines.push('Timestamp,Date/Time');
        sensedMoves.forEach(marker => {
          const timestamp = marker.timestamp;
          csvLines.push([
            timestamp,
            new Date(timestamp).toISOString()
          ].join(','));
        });
      }

      if (endMoves.length > 0) {
        csvLines.push(''); // Empty line separator
        csvLines.push('End Move Events:');
        csvLines.push('Timestamp,Date/Time');
        endMoves.forEach(marker => {
          const timestamp = marker.timestamp;
          csvLines.push([
            timestamp,
            new Date(timestamp).toISOString()
          ].join(','));
        });
      }
    }

    const csvContent = csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emg_session_${session.session_name.replace(/[^a-z0-9]/gi, '_')}_${session.id.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getChartData = (sessionsToDisplay: EMGSession[]) => {
    if (sessionsToDisplay.length === 0) {
      return null;
    }

    // Filter out sessions without readings
    const validSessions = sessionsToDisplay.filter(s => s.readings && s.readings.length > 0);
    if (validSessions.length === 0) {
      return null;
    }

    try {
      // Color palette for multiple sessions
      const colors = [
        { border: 'rgb(251, 146, 60)', background: 'rgba(251, 146, 60, 0.1)' }, // Orange
        { border: 'rgb(34, 211, 238)', background: 'rgba(34, 211, 238, 0.1)' }, // Cyan
        { border: 'rgb(34, 197, 94)', background: 'rgba(34, 197, 94, 0.1)' }, // Green
        { border: 'rgb(168, 85, 247)', background: 'rgba(168, 85, 247, 0.1)' }, // Purple
        { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.1)' }, // Red
        { border: 'rgb(250, 204, 21)', background: 'rgba(250, 204, 21, 0.1)' }, // Yellow
        { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.1)' }, // Blue
        { border: 'rgb(236, 72, 153)', background: 'rgba(236, 72, 153, 0.1)' }, // Pink
      ];

      // Get the maximum duration to set label range
      let maxDuration = 0;
      const allDatasets: any[] = [];

      validSessions.forEach((session, sessionIndex) => {
        const readings = session.readings!.map(reading => {
          let timestamp: number;
          if (typeof reading.timestamp === 'number') {
            timestamp = reading.timestamp;
          } else if (typeof reading.timestamp === 'string') {
            const parsed = new Date(reading.timestamp).getTime();
            timestamp = isNaN(parsed) ? Date.now() : parsed;
          } else {
            timestamp = Date.now();
          }

          // Calculate voltage if not present
          let voltage = reading.voltage;
          if (voltage === undefined || voltage === null) {
            if (reading.muscleActivity !== undefined && reading.muscleActivity !== null) {
              voltage = (reading.muscleActivity * 3.3) / 4095.0;
            } else {
              voltage = 0;
            }
          }

          return {
            ...reading,
            timestamp,
            voltage,
          };
        });

        // Find the first reading timestamp for this session (its own start time)
        const sessionStartTime = readings[0]?.timestamp ?? new Date(session.started_at).getTime();

        // Calculate seconds from this session's own start time (so all sessions start at x=0)
        const dataPoints = readings.map((reading) => {
          const seconds = (reading.timestamp - sessionStartTime) / 1000;
          return { seconds, voltage: reading.voltage ?? 0 };
        });

        const duration = dataPoints[dataPoints.length - 1]?.seconds ?? 0;
        maxDuration = Math.max(maxDuration, duration);

        const color = colors[sessionIndex % colors.length];
        allDatasets.push({
          label: `${session.session_name} (Voltage)`,
          data: dataPoints.map(p => ({ x: p.seconds, y: p.voltage })),
          borderColor: color.border,
          backgroundColor: color.background,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 4,
        });
      });

      return {
        datasets: allDatasets,
      };
    } catch (error) {
      console.error('❌ Error generating chart data:', error);
      return null;
    }
  };

  const getChartOptions = (sessionsToDisplay: EMGSession[]) => {
    if (sessionsToDisplay.length === 0) {
      return {
        responsive: true,
        maintainAspectRatio: false,
      };
    }

    try {
      // Calculate min/max voltages across all sessions
      let allVoltages: number[] = [];
      sessionsToDisplay.forEach(session => {
        const voltages = session.readings?.map(r => {
          if (r.voltage !== undefined && r.voltage !== null) {
            return r.voltage;
          }
          if (r.muscleActivity !== undefined && r.muscleActivity !== null) {
            return (r.muscleActivity * 3.3) / 4095.0;
          }
          return 0;
        }) || [];
        allVoltages = [...allVoltages, ...voltages];
      });

      const maxVoltage = Math.max(...allVoltages, 1.0);
      const minVoltage = Math.min(...allVoltages, 0);

      // Build title
      let titleText: string;
      if (sessionsToDisplay.length === 1) {
        const startTime = new Date(sessionsToDisplay[0].started_at);
        const startTimeStr = isNaN(startTime.getTime()) 
          ? 'Unknown' 
          : startTime.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
        titleText = `EMG Session: ${sessionsToDisplay[0].session_name} (Started: ${startTimeStr})`;
      } else {
        titleText = `EMG Sessions Overlap: ${sessionsToDisplay.length} sessions`;
      }

      // Get move markers from all sessions
      // For overlapping graphs, each session starts at x=0, so we need to calculate
      // markers relative to each session's own start time
      let allMoveMarkers: Array<{ marker: MoveMarker; sessionName: string; sessionStartTime: number }> = [];
      let allMovementPeaks: Array<{ peak: { timestamp: number; voltage: number; seconds: number }; sessionName: string; sessionStartTime: number }> = [];
      
      sessionsToDisplay.forEach(session => {
        // Get this session's start time
        let sessionStartTime: number;
        if (session.readings && session.readings.length > 0) {
          const firstReading = session.readings[0];
          if (typeof firstReading.timestamp === 'number') {
            sessionStartTime = firstReading.timestamp;
          } else if (typeof firstReading.timestamp === 'string') {
            sessionStartTime = new Date(firstReading.timestamp).getTime();
          } else {
            sessionStartTime = new Date(session.started_at).getTime();
          }
        } else {
          sessionStartTime = new Date(session.started_at).getTime();
        }
        
        let sessionMarkers: MoveMarker[] = [];
        if (session.move_markers && Array.isArray(session.move_markers)) {
          sessionMarkers = session.move_markers;
        } else if (session.readings) {
          session.readings.forEach((reading) => {
            if (reading.moveMarker && reading.timestamp) {
              sessionMarkers.push({
                timestamp: reading.timestamp,
                type: reading.moveMarker as 'request' | 'sensed' | 'end'
              });
            }
          });
        }
        
        sessionMarkers.forEach(marker => {
          allMoveMarkers.push({ 
            marker, 
            sessionName: session.session_name,
            sessionStartTime 
          });
        });

        // Calculate peaks for each movement period
        if (session.readings && session.readings.length > 0 && sessionMarkers.length > 0) {
          // Sort markers by timestamp
          const sortedMarkers = [...sessionMarkers].sort((a, b) => a.timestamp - b.timestamp);
          
          // Find movement periods (from request/sensed to end)
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
                const periodReadings = session.readings
                  .map(reading => {
                    // Calculate voltage if not present
                    let voltage = reading.voltage;
                    if (voltage === undefined || voltage === null) {
                      if (reading.muscleActivity !== undefined && reading.muscleActivity !== null) {
                        voltage = (reading.muscleActivity * 3.3) / 4095.0;
                      } else {
                        voltage = 0;
                      }
                    }
                    
                    const timestamp = typeof reading.timestamp === 'number' 
                      ? reading.timestamp 
                      : new Date(reading.timestamp as any).getTime();
                    
                    return {
                      ...reading,
                      timestamp,
                      voltage
                    };
                  })
                  .filter(reading => {
                    return reading.timestamp >= startMarker.timestamp && 
                           reading.timestamp <= endMarker.timestamp && 
                           reading.voltage !== undefined && 
                           reading.voltage !== null &&
                           reading.voltage > 0;
                  });
                
                if (periodReadings.length > 0) {
                  // Find the reading with maximum voltage within THIS period only
                  let peakReading = periodReadings[0];
                  let maxVoltage = peakReading.voltage || 0;
                  
                  for (const reading of periodReadings) {
                    const readingVoltage = reading.voltage || 0;
                    if (readingVoltage > maxVoltage) {
                      maxVoltage = readingVoltage;
                      peakReading = reading;
                    }
                  }
                  
                  if (peakReading.voltage !== undefined && peakReading.voltage !== null) {
                    const peakTimestamp = typeof peakReading.timestamp === 'number' 
                      ? peakReading.timestamp 
                      : new Date(peakReading.timestamp as any).getTime();
                    const peakSeconds = (peakTimestamp - sessionStartTime) / 1000;
                    
                    console.log(`📊 Movement period peak:`, {
                      period: `Start: ${new Date(startMarker.timestamp).toISOString()} → End: ${new Date(endMarker.timestamp).toISOString()}`,
                      peakVoltage: peakReading.voltage,
                      peakTimestamp: new Date(peakTimestamp).toISOString(),
                      readingsInPeriod: periodReadings.length
                    });
                    
                    allMovementPeaks.push({
                      peak: {
                        timestamp: peakTimestamp,
                        voltage: peakReading.voltage,
                        seconds: peakSeconds
                      },
                      sessionName: session.session_name,
                      sessionStartTime
                    });
                  }
                }
              }
            }
          }
        }
      });

      // Create plugin to draw move markers and peaks (will be added to plugins array)
      const moveMarkerPlugin = {
        id: 'moveMarkerLines',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const xScale = chart.scales.x;
          const yScale = chart.scales.y;

          if (!xScale || !yScale) {
            return;
          }

          ctx.save();

          // Draw move markers
          if (allMoveMarkers && allMoveMarkers.length > 0) {

          let drawnCount = 0;
          allMoveMarkers.forEach(({ marker, sessionName, sessionStartTime }, index) => {
            // Calculate seconds from this session's own start time (so it aligns with x=0 start)
            const markerSeconds = (marker.timestamp - sessionStartTime) / 1000;
            
            // Get the actual data range from the chart to understand what's visible
            const chartData = chart.data;
            const dataMin = chartData.labels && chartData.labels.length > 0 
              ? Math.min(...(chartData.labels as number[]))
              : xScale.min;
            const dataMax = chartData.labels && chartData.labels.length > 0
              ? Math.max(...(chartData.labels as number[]))
              : xScale.max;
            
            console.log(`📍 Processing marker ${index}:`, {
              type: marker.type,
              timestamp: marker.timestamp,
              timestampDate: new Date(marker.timestamp).toISOString(),
              sessionStartTime: sessionStartTime,
              sessionStartTimeDate: new Date(sessionStartTime).toISOString(),
              markerSeconds: markerSeconds.toFixed(3),
              xScaleMin: xScale.min,
              xScaleMax: xScale.max,
              dataMin: dataMin,
              dataMax: dataMax,
              xScaleLeft: xScale.left,
              xScaleRight: xScale.right
            });
            
            // Get pixel position for this x value
            let xPos: number | null = null;
            try {
              xPos = xScale.getPixelForValue(markerSeconds);
            } catch (error) {
              console.warn(`⚠️ Error getting pixel for marker ${index}:`, error);
              return; // Skip this marker if we can't get position
            }
            
            console.log(`  → xPos: ${xPos?.toFixed(1)}, bounds: [${xScale.left.toFixed(1)}, ${xScale.right.toFixed(1)}]`);
            
            // Check if position is valid
            if (xPos !== null && !isNaN(xPos) && isFinite(xPos)) {
              // Clamp xPos to chart bounds to ensure visibility
              const clampedXPos = Math.max(xScale.left, Math.min(xScale.right, xPos));
              
              // Only draw if the marker is reasonably close to the visible range
              // (within 10% of the chart width outside bounds)
              const chartWidth = xScale.right - xScale.left;
              const margin = chartWidth * 0.1; // 10% margin
              const isWithinReasonableRange = xPos >= (xScale.left - margin) && xPos <= (xScale.right + margin);
              
              if (isWithinReasonableRange) {
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
                // Use clamped position if original was outside bounds
                const drawX = clampedXPos;
                ctx.beginPath();
                ctx.moveTo(drawX, yScale.top);
                ctx.lineTo(drawX, yScale.bottom);
                ctx.stroke();
                
                drawnCount++;
                if (xPos !== clampedXPos) {
                  console.log(`  ✅ Drew ${marker.type} line at clamped x=${drawX.toFixed(1)} (original: ${xPos.toFixed(1)})`);
                } else {
                  console.log(`  ✅ Drew ${marker.type} line at x=${drawX.toFixed(1)}`);
                }
              } else {
                console.warn(`  ❌ Marker ${index} too far outside bounds: xPos=${xPos.toFixed(1)}, bounds: [${xScale.left.toFixed(1)}, ${xScale.right.toFixed(1)}]`);
              }
            } else {
              console.warn(`  ❌ Marker ${index} invalid xPos: ${xPos}`);
            }
          });

          }

          // Draw movement peaks
          if (allMovementPeaks && allMovementPeaks.length > 0) {
            let peaksDrawn = 0;
            allMovementPeaks.forEach(({ peak, sessionName, sessionStartTime }) => {
              const peakSeconds = (peak.timestamp - sessionStartTime) / 1000;
              
              try {
                const xPos = xScale.getPixelForValue(peakSeconds);
                const yPos = yScale.getPixelForValue(peak.voltage);
                
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
                  ctx.fillText(`${peak.voltage.toFixed(2)}V`, xPos, yPos - 8);
                  
                  peaksDrawn++;
                }
              } catch (error) {
                console.warn('⚠️ Error drawing peak:', error);
              }
            });
            console.log(`✅ Drew ${allMoveMarkers.length} move markers and ${peaksDrawn} movement peaks`);
          } else if (allMoveMarkers && allMoveMarkers.length > 0) {
            console.log(`✅ Drew ${allMoveMarkers.length} move markers`);
          }

          ctx.restore();
        },
      };

      const chartOptions: any = {
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
            display: false, // Hide default legend, use custom dropdown instead
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
            borderColor: 'rgb(251, 146, 60)',
            borderWidth: 1,
            callbacks: {
              label: function(context: any) {
                return `Voltage: ${context.parsed.y.toFixed(3)}V`;
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
              text: 'Time (seconds from start)',
              color: 'rgb(156, 163, 175)',
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
              stepSize: 1,
              callback: function(value: any) {
                return Number.isInteger(value) ? value : '';
              },
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
              text: 'Voltage (V)',
              color: 'rgb(251, 146, 60)',
            },
            ticks: {
              color: 'rgb(251, 146, 60)',
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            min: Math.max(0, minVoltage - 0.1), // Add padding below
            max: Math.max(1.0, Math.min(3.5, maxVoltage * 1.1)), // Add 10% padding above, cap at 3.5V, minimum 1.0V
          },
        },
      };

      // Store the plugin and peaks on chartOptions so it can be retrieved in the render function
      chartOptions._moveMarkerPlugin = moveMarkerPlugin;
      chartOptions._movementPeaks = allMovementPeaks;

      return chartOptions;
    } catch (error) {
      console.error('Error generating chart options:', error);
      return {
        responsive: true,
        maintainAspectRatio: false,
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/emg" 
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300"
            >
              ← Back to EMG Workouts
            </Link>
            <button
              onClick={() => {
                if (userId) {
                  loadSessions();
                }
              }}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 hover:text-cyan-200 transition-all"
            >
              🔄 Refresh
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-2">EMG Session History</h1>
          <p className="text-gray-400">View and manage your recorded EMG sessions</p>
          {sessions.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                💡 <strong>Tip:</strong> After recording on the EMG page, make sure to click <strong>"Save to Cloud"</strong> to save your session here.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Sessions ({sessions.length})</h2>
              <button
                onClick={() => {
                  setOverlapMode(!overlapMode);
                  if (overlapMode) {
                    setSelectedSessions([]);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  overlapMode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'bg-white/5 text-gray-300 border border-white/20 hover:bg-white/10'
                }`}
              >
                {overlapMode ? '✓ Overlap Mode' : '📊 Overlap Graphs'}
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No EMG sessions recorded yet.</p>
                <Link href="/emg" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
                  Go to EMG page to record a session
                </Link>
              </div>
            ) : (
              <>
                {overlapMode && selectedSessions.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30">
                    <p className="text-sm text-cyan-200">
                      {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''} selected for overlap
                    </p>
                  </div>
                )}
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {sessions.map((session) => {
                  const isSelected = overlapMode 
                    ? selectedSessions.some(s => s.id === session.id)
                    : selectedSession?.id === session.id;
                  return (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/20 cursor-pointer'
                        : 'border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      {editingSessionId === session.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRename(session.id);
                              } else if (e.key === 'Escape') {
                                handleCancelRename();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveRename(session.id, e)}
                            disabled={isRenaming}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 rounded text-sm disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => handleCancelRename(e)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2 flex-1">
                            {overlapMode && (
                              <input
                                type="checkbox"
                                checked={selectedSessions.some(s => s.id === session.id)}
                                onChange={() => handleSessionClick(session)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{session.session_name}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {new Date(session.started_at).toLocaleString()}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-300">
                              <span>Duration: {Math.round(session.duration_seconds / 60)}m {session.duration_seconds % 60}s</span>
                              {session.average_voltage !== null && (
                                <span>Avg: {session.average_voltage.toFixed(2)}V</span>
                              )}
                              {session.max_voltage !== null && (
                                <span>Max: {session.max_voltage.toFixed(2)}V</span>
                              )}
                            </div>
                            {session.readings && (
                              <p className="text-xs text-gray-500 mt-1">
                                {session.readings.length} readings
                              </p>
                            )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleRenameClick(session, e)}
                              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm"
                              title="Rename"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              disabled={deletingSession === session.id}
                              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-sm disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingSession === session.id ? '...' : '🗑️'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}
                </div>
              </>
            )}
          </div>

          {/* Session Details */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            {(overlapMode ? selectedSessions.length > 0 : selectedSession) ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">
                  {overlapMode ? `Overlapping ${selectedSessions.length} Session${selectedSessions.length > 1 ? 's' : ''}` : 'Session Details'}
                </h2>
                {!overlapMode && selectedSession && (
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedSession.session_name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Started</p>
                        <p>{new Date(selectedSession.started_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Ended</p>
                        <p>{new Date(selectedSession.ended_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Duration</p>
                        <p>{Math.round(selectedSession.duration_seconds / 60)}m {selectedSession.duration_seconds % 60}s</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Readings</p>
                        <p>{selectedSession.readings?.length || 0}</p>
                      </div>
                      {selectedSession.average_voltage !== null && (
                        <div>
                          <p className="text-gray-400">Average Voltage</p>
                          <p>{selectedSession.average_voltage.toFixed(3)}V</p>
                        </div>
                      )}
                      {selectedSession.max_voltage !== null && (
                        <div>
                          <p className="text-gray-400">Max Voltage</p>
                          <p>{selectedSession.max_voltage.toFixed(3)}V</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToCSV(selectedSession)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded"
                    >
                      Export to CSV
                    </button>
                  </div>
                </div>
                )}
                {(() => {
                  const sessionsToDisplay = overlapMode ? selectedSessions : (selectedSession ? [selectedSession] : []);
                  if (sessionsToDisplay.length === 0) return null;
                  
                  const chartData = getChartData(sessionsToDisplay);
                  if (!chartData) return null;
                  
                  const options = getChartOptions(sessionsToDisplay);
                  const moveMarkerPlugin = (options as any)._moveMarkerPlugin;
                  
                  // Get title for display above chart
                  const defaultTitle = overlapMode 
                    ? `${sessionsToDisplay.length} Sessions Overlapping`
                    : sessionsToDisplay[0]?.session_name || 'EMG Session';
                  
                  const currentTitle = graphTitle || defaultTitle;
                  
                  return (
                    <div>
                      {/* Legend Dropdown */}
                      <div className="mb-4">
                        <button
                          onClick={() => setIsLegendOpen(!isLegendOpen)}
                          className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left flex items-center justify-between transition-all"
                        >
                          <span className="text-cyan-300 font-medium">📊 Data Key / Legend</span>
                          <span className="text-gray-400">{isLegendOpen ? '▼' : '▶'}</span>
                        </button>
                        {isLegendOpen && (
                          <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
                            <div>
                              <h4 className="text-cyan-200 font-semibold mb-2">Session Lines</h4>
                              <div className="space-y-2 text-sm">
                                {sessionsToDisplay.map((session, index) => {
                                  const colors = [
                                    { border: 'rgb(251, 146, 60)', name: 'Orange' },
                                    { border: 'rgb(34, 211, 238)', name: 'Cyan' },
                                    { border: 'rgb(34, 197, 94)', name: 'Green' },
                                    { border: 'rgb(168, 85, 247)', name: 'Purple' },
                                    { border: 'rgb(239, 68, 68)', name: 'Red' },
                                    { border: 'rgb(250, 204, 21)', name: 'Yellow' },
                                    { border: 'rgb(59, 130, 246)', name: 'Blue' },
                                    { border: 'rgb(236, 72, 153)', name: 'Pink' },
                                  ];
                                  const color = colors[index % colors.length];
                                  return (
                                    <div key={session.id} className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-0.5" 
                                        style={{ backgroundColor: color.border }}
                                      />
                                      <span className="text-gray-300">
                                        {session.session_name} - Voltage (V)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                                <div>
                                  <h4 className="text-cyan-200 font-semibold mb-2">Move Markers</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-0.5 bg-blue-500" />
                                      <span className="text-gray-300">Move Request (solid blue line)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-0.5 bg-green-500 border-dashed" style={{ borderTop: '2px dashed rgb(34, 197, 94)' }} />
                                      <span className="text-gray-300">Sensed Move (dotted green line)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-0.5 bg-red-500" />
                                      <span className="text-gray-300">End Move Event (solid red line)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-yellow-500 border-2" style={{ borderColor: 'rgb(217, 119, 6)' }} />
                                      <span className="text-gray-300">Movement Peak (yellow circle with voltage label)</span>
                                    </div>
                                  </div>
                                </div>
                            <div>
                              <h4 className="text-cyan-200 font-semibold mb-2">Axis Information</h4>
                              <div className="space-y-1 text-sm text-gray-400">
                                <p>X-Axis: Time (seconds from start)</p>
                                <p>Y-Axis: Voltage (V) - Range: 0V to 3.5V</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Title - Right above graph */}
                      <div className="mb-2">
                        {isEditingGraphTitle ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingGraphTitle}
                              onChange={(e) => setEditingGraphTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setGraphTitle(editingGraphTitle.trim() || defaultTitle);
                                  setIsEditingGraphTitle(false);
                                  setEditingGraphTitle('');
                                } else if (e.key === 'Escape') {
                                  setIsEditingGraphTitle(false);
                                  setEditingGraphTitle('');
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-white/10 border border-cyan-400/50 rounded text-cyan-200 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                setGraphTitle(editingGraphTitle.trim() || defaultTitle);
                                setIsEditingGraphTitle(false);
                                setEditingGraphTitle('');
                              }}
                              className="px-3 py-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded text-sm transition-all"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingGraphTitle(false);
                                setEditingGraphTitle('');
                              }}
                              className="px-3 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 rounded text-sm transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-semibold text-cyan-200 flex-1">
                              {currentTitle}
                            </h3>
                            <button
                              onClick={() => {
                                setEditingGraphTitle(currentTitle);
                                setIsEditingGraphTitle(true);
                              }}
                              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm text-cyan-300 transition-all"
                              title="Edit title"
                            >
                              ✏️
                            </button>
                            {sessionsToDisplay.length > 0 && (
                              <button
                                onClick={() => exportMultipleSessionsToCSV(sessionsToDisplay)}
                                className="px-4 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all text-sm text-cyan-200"
                              >
                                Export CSV
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="h-96">
                        <Line 
                          data={chartData} 
                          options={options}
                          plugins={moveMarkerPlugin ? [moveMarkerPlugin] : []}
                        />
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Select a session to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

