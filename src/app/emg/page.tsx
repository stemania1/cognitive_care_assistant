'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from "next/link";
import { supabase, safeGetUser } from '@/lib/supabaseClient';
import { isGuestUser, getGuestUserId } from '@/lib/guestDataManager';
import MyoWareClient from '../components/MyoWareClient';
import EMGChart from '../components/EMGChart';
import WorkoutVideo from '../components/WorkoutVideo';
import { EMGData, MoveMarker, WorkoutExercise } from '@/types/emg';
import { WORKOUT_ROUTINES } from '@/constants/workouts';
import { EMG_METRICS } from '@/constants/emg-metrics';
import { exportCSV, formatTimestampForCSV, generateFilenameWithDate } from '@/utils/csv-export';
import { formatTime, formatToISO, formatToLocaleString, getDateString } from '@/utils/date-formatting';
import { processMyoWareData, calculateVoltage, detectMove, createSensedMoveMarker, calculateEMGStats } from '@/utils/emg-processing';

export default function EMGPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise | null>(null);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [emgData, setEmgData] = useState<EMGData[]>([]);
  const [chartData, setChartData] = useState<EMGData[]>([]); // Data for chart visualization
  const [isChartPaused, setIsChartPaused] = useState(false); // Track if chart is paused
  const isChartPausedRef = useRef(false); // Ref for SSE handler to access current pause state
  const [currentData, setCurrentData] = useState<EMGData | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [calibrationData, setCalibrationData] = useState<{ [key: string]: { min: number; max: number } }>({});
  const [isCalibrating, setIsCalibrating] = useState(false);
  const calMinRef = useRef<number>(Infinity);
  const calMaxRef = useRef<number>(-Infinity);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [isMyoWareConnected, setIsMyoWareConnected] = useState(false);
  const [useRealData, setUseRealData] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const [showWorkoutList, setShowWorkoutList] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Recording state
  const [recordingName, setRecordingName] = useState('');
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const isRecordingSessionRef = useRef(false); // Ref to track recording state for callbacks
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [recordingElapsedTime, setRecordingElapsedTime] = useState(0); // Timer in seconds
  const recordedSessionDataRef = useRef<EMGData[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // Move markers for chart visualization
  const [moveMarkers, setMoveMarkers] = useState<MoveMarker[]>([]);
  const moveMarkersRef = useRef<MoveMarker[]>([]); // Ref for callbacks
  const lastVoltageRef = useRef<number | null>(null); // Track last voltage for move detection
  const moveDetectionThreshold = 0.15; // Voltage change threshold to detect a move (V)


  // MyoWare 2.0 data processing functions
  const processMyoWareDataLocal = (rawValue: number): number => {
    // MyoWare 2.0 outputs 0-1023 analog range (0-5V)
    // Convert to percentage based on calibration data
    const cal = calibrationData['muscleActivity'];
    return processMyoWareData(rawValue, cal || null);
  };

  // Note: Simulation functions removed - only real MyoWare device data is used

  // Handle real MyoWare data
  const handleMyoWareData = (data: EMGData) => {
    setCurrentData(data);
    
    // Detect moves based on voltage changes (only when recording)
    if (isRecordingSessionRef.current && data.voltage !== undefined && data.voltage !== null) {
      const currentVoltage = data.voltage;
      
      if (detectMove(currentVoltage, lastVoltageRef.current, moveDetectionThreshold)) {
        const sensedMove = createSensedMoveMarker(data.timestamp);
        
        // Add to markers
        moveMarkersRef.current = [...moveMarkersRef.current, sensedMove];
        setMoveMarkers([...moveMarkersRef.current]);
        
        // Mark the data point with the move marker
        data.moveMarker = 'sensed';
        
        console.log('🎯 Sensed move detected:', {
          timestamp: data.timestamp,
          voltageChange: (Math.abs(currentVoltage - (lastVoltageRef.current || 0))).toFixed(3) + 'V',
          currentVoltage: currentVoltage.toFixed(3) + 'V',
          previousVoltage: (lastVoltageRef.current || 0).toFixed(3) + 'V'
        });
      }
      
      lastVoltageRef.current = currentVoltage;
    }
    
    if (isRecording) {
      setEmgData(prev => [...prev, data]);
    }
    
    // Record session data if active (use ref to ensure we have current state)
    if (isRecordingSessionRef.current) {
      const beforeCount = recordedSessionDataRef.current.length;
      recordedSessionDataRef.current.push(data);
      const afterCount = recordedSessionDataRef.current.length;
      
      // Also update chart data during recording so user can see the data being recorded
      if (!isChartPausedRef.current) {
        setChartData(prev => {
          const newData = [...prev, data];
          // Keep only last 100 data points for chart performance
          return newData.slice(-100);
        });
      }
      
      // Log first few samples and then every 50 to avoid spam
      if (afterCount <= 5 || afterCount % 50 === 0) {
        console.log('📊 Recording data:', {
          samples: afterCount,
          latestVoltage: data.voltage,
          latestMuscleActivity: data.muscleActivity,
          timestamp: data.timestamp,
          hasMoveMarker: data.moveMarker !== undefined,
          chartDataLength: chartData.length
        });
      }
    } else {
      // When not recording, still update chart data if not paused
      if (!isChartPausedRef.current) {
        setChartData(prev => {
          const newData = [...prev, data];
          const updated = newData.slice(-100);
          // Log occasionally to track chart updates when not recording
          if (updated.length % 20 === 0 || updated.length <= 5) {
            console.log('📈 Chart data updated (not recording):', {
              chartDataLength: updated.length,
              latestVoltage: data.voltage,
              isPaused: isChartPausedRef.current
            });
          }
          return updated;
        });
      }
      
      // Debug: Log when we receive data but aren't recording
      if (recordedSessionDataRef.current.length === 0) {
        // Only log occasionally to avoid spam
        const shouldLog = Math.random() < 0.1; // 10% chance
        if (shouldLog) {
          console.log('⚠️ Data received but not recording:', {
            isRecordingSessionRef: isRecordingSessionRef.current,
            isRecordingSession: isRecordingSession,
            voltage: data.voltage,
            chartDataLength: chartData.length
          });
        }
      }
    }
  };
  
  // Handle Move button click
  const handleMoveRequest = () => {
    if (!isRecordingSessionRef.current) {
      alert('Please start recording first');
      return;
    }
    
    const now = Date.now();
    const moveRequest: MoveMarker = {
      timestamp: now,
      type: 'request'
    };
    
    // Add to markers
    const newMarkers = [...moveMarkersRef.current, moveRequest];
    moveMarkersRef.current = newMarkers;
    setMoveMarkers(newMarkers);
    
    console.log('👆 Move request button clicked:', {
      timestamp: now,
      timestampISO: new Date(now).toISOString(),
      currentMarkersCount: moveMarkersRef.current.length,
      newMarkersCount: newMarkers.length,
      hasCurrentData: currentData !== null,
      sessionStartTime: sessionStartTime
    });
    
    // Add a data point with the move marker
    // Use current data if available, otherwise create a minimal data point
    const markedData: EMGData = {
      timestamp: now,
      muscleActivity: currentData?.muscleActivity || 0,
      muscleActivityProcessed: currentData?.muscleActivityProcessed || 0,
      voltage: currentData?.voltage,
      moveMarker: 'request'
    };
    
    // Add to recorded data
    if (isRecordingSessionRef.current) {
      recordedSessionDataRef.current.push(markedData);
      console.log('👆 Move request recorded with data:', {
        timestamp: now,
        voltage: currentData?.voltage,
        hasCurrentData: currentData !== null,
        recordedDataCount: recordedSessionDataRef.current.length
      });
    }
  };

  const handleMoveEnd = () => {
    if (!isRecordingSessionRef.current) {
      alert('Please start recording first');
      return;
    }
    
    const now = Date.now();
    const moveEnd: MoveMarker = {
      timestamp: now,
      type: 'end'
    };
    
    // Add to markers
    const newMarkers = [...moveMarkersRef.current, moveEnd];
    moveMarkersRef.current = newMarkers;
    setMoveMarkers(newMarkers);
    
    console.log('🛑 End move event button clicked:', {
      timestamp: now,
      timestampISO: new Date(now).toISOString(),
      currentMarkersCount: moveMarkersRef.current.length,
      newMarkersCount: newMarkers.length,
      hasCurrentData: currentData !== null,
      sessionStartTime: sessionStartTime
    });
    
    // Add a data point with the move marker
    // Use current data if available, otherwise create a minimal data point
    const markedData: EMGData = {
      timestamp: now,
      muscleActivity: currentData?.muscleActivity || 0,
      muscleActivityProcessed: currentData?.muscleActivityProcessed || 0,
      voltage: currentData?.voltage,
      moveMarker: 'end'
    };
    
    // Add to recorded data
    if (isRecordingSessionRef.current) {
      recordedSessionDataRef.current.push(markedData);
      console.log('🛑 End move event recorded with data:', {
        timestamp: now,
        voltage: currentData?.voltage,
        hasCurrentData: currentData !== null,
        recordedDataCount: recordedSessionDataRef.current.length
      });
    }
  };

  const startRecording = () => {
    if (!recordingName.trim()) {
      alert('Please enter a recording name');
      return;
    }
    
    if (!isMyoWareConnected || !isConnected) {
      alert('Please connect the MyoWare device first. Click "Start Recording" at the top to connect.');
      return;
    }
    
    console.log('🎬 Starting recording session:', {
      recordingName,
      isMyoWareConnected,
      isConnected,
      currentData: currentData ? 'available' : 'none',
      currentDataVoltage: currentData?.voltage
    });
    
    // Clear previous data and start recording
    recordedSessionDataRef.current = [];
    moveMarkersRef.current = [];
    setMoveMarkers([]);
    lastVoltageRef.current = null;
    isRecordingSessionRef.current = true; // Update ref FIRST, before state
    setIsRecordingSession(true);
    setSessionStartTime(Date.now());
    setSaveStatus('idle');
    
    console.log('✅ Recording started, waiting for data...', {
      isRecordingSessionRef: isRecordingSessionRef.current,
      refSet: true
    });
    
    // If we have current data, immediately add it to the recording
    if (currentData) {
      console.log('📥 Adding initial current data to recording');
      recordedSessionDataRef.current.push(currentData);
      console.log('📊 Initial sample count:', recordedSessionDataRef.current.length);
    }
  };

  // Timer effect - updates every second when recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecordingSession && sessionStartTime) {
      // Update timer immediately
      setRecordingElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      
      // Then update every second
      interval = setInterval(() => {
        setRecordingElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      // Reset timer when not recording
      setRecordingElapsedTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecordingSession, sessionStartTime]);

  const stopRecording = async () => {
    // Stop recording first
    isRecordingSessionRef.current = false; // Update ref immediately
    setIsRecordingSession(false);
    
    const sampleCount = recordedSessionDataRef.current.length;
    const endTime = Date.now();
    const duration = sessionStartTime ? (endTime - sessionStartTime) / 1000 : 0;
    
    console.log('⏹️ Stopping recording:', {
      samples: sampleCount,
      duration: duration,
      sessionName: recordingName,
      isMyoWareConnected,
      isConnected,
      hasCurrentData: currentData !== null
    });
    
    // Automatically save to Supabase when recording stops
    if (sampleCount > 0) {
      console.log('🔄 Auto-saving recording after stop...', {
        samples: sampleCount,
        duration: duration,
        sessionName: recordingName
      });
      
      // Save in the background (don't await to avoid blocking UI)
      saveRecordingToSupabase().catch(error => {
        console.error('Failed to auto-save recording:', error);
        // Error is already handled in saveRecordingToSupabase with alert
      });
    } else {
      // Try to capture current data if available
      if (currentData) {
        console.log('⚠️ No data recorded, but current data available - adding it now');
        recordedSessionDataRef.current.push(currentData);
        const newCount = recordedSessionDataRef.current.length;
        
        if (newCount > 0) {
          console.log('✅ Added current data, now have', newCount, 'samples - saving...');
          saveRecordingToSupabase().catch(error => {
            console.error('Failed to auto-save recording:', error);
          });
          return; // Exit early since we're now saving
        }
      }
      
      console.error('⚠️ No data recorded!', {
        sampleCount,
        isMyoWareConnected,
        isConnected,
        hasCurrentData: currentData !== null,
        currentDataVoltage: currentData?.voltage,
        wasRecording: isRecordingSessionRef.current,
        duration: duration
      });
      
      const errorDetails = {
        sampleCount,
        duration: `${duration.toFixed(1)}s`,
        isMyoWareConnected,
        isConnected,
        hasCurrentData: currentData !== null
      };
      
      console.error('Error details:', errorDetails);
      
      alert(`No data was recorded (${sampleCount} samples in ${duration.toFixed(1)}s).\n\nPossible causes:\n1. Recording stopped too quickly (wait at least 3-5 seconds)\n2. Device disconnected during recording\n3. No data received from device\n\nPlease:\n- Make sure device shows green "Connected" indicator\n- Record for at least 5 seconds\n- Check browser console (F12) for details`);
    }
  };

  const saveRecordingToSupabase = async () => {
    if (recordedSessionDataRef.current.length === 0) {
      alert('No data to save');
      return;
    }

    setSaveStatus('saving');
    try {
      const { user } = await safeGetUser();
      const userId = user?.id || (await isGuestUser() ? getGuestUserId() : 'guest');
      
      // Calculate stats and ensure voltage is included in readings
      const readings = recordedSessionDataRef.current.map(r => {
        // Ensure voltage is always present in saved data
        if (r.voltage === undefined || r.voltage === null) {
          // Calculate from muscleActivity (ESP32: 12-bit ADC, 3.3V reference)
          return {
            ...r,
            voltage: calculateVoltage(r.muscleActivity)
          };
        }
        return r;
      });
      
      const stats = calculateEMGStats(readings);
      
      if (stats.sampleCount === 0 || stats.averageVoltage === null) {
        throw new Error('No valid voltage readings to save');
      }
      
      console.log('💾 Prepared readings for save:', {
        totalReadings: readings.length,
        voltagesCount: stats.sampleCount,
        firstReading: readings[0],
        lastReading: readings[readings.length - 1],
        voltageRange: stats.minVoltage !== null && stats.maxVoltage !== null 
          ? `${stats.minVoltage.toFixed(3)}V - ${stats.maxVoltage.toFixed(3)}V` 
          : 'N/A'
      });
      
      console.log('💾 Saving recording:', {
        readingsCount: readings.length,
        voltagesCount: stats.sampleCount,
        avgVoltage: stats.averageVoltage,
        maxVoltage: stats.maxVoltage,
        sessionName: recordingName,
        userId
      });

      const sessionData = {
        userId,
        sessionName: recordingName || `EMG Session ${formatToLocaleString(new Date())}`,
        startedAt: sessionStartTime ? formatToISO(sessionStartTime) : formatToISO(new Date()),
        endedAt: formatToISO(new Date()),
        durationSeconds: Math.round((Date.now() - (sessionStartTime || Date.now())) / 1000),
        readings: readings, // Stores the full JSON array (includes moveMarker property on individual readings)
        moveMarkers: moveMarkersRef.current, // Also store move markers as separate array for easy querying
        averageVoltage: stats.averageVoltage,
        maxVoltage: stats.maxVoltage
      };

      console.log('📤 Sending session data to API:', {
        url: '/api/emg-sessions',
        method: 'POST',
        dataSize: JSON.stringify(sessionData).length,
        readingsCount: sessionData.readings.length,
        moveMarkersCount: sessionData.moveMarkers.length,
        moveMarkers: sessionData.moveMarkers
      });

      const response = await fetch('/api/emg-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      console.log('📥 API Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('📥 API Response body (raw):', responseText);

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { error: responseText || 'Unknown error', status: response.status };
        }
        
        console.error('❌ API Error Response:', {
          status: response.status,
          error: error.error,
          details: error.details,
          code: error.code,
          hint: error.hint,
          fullError: error
        });
        
        throw new Error(error.details || error.error || `Failed to save (HTTP ${response.status})`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log('✅ Session saved successfully:', {
        sessionId: result.data?.id,
        sessionName: result.data?.session_name,
        userId: result.data?.user_id,
        fullData: result.data
      });
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Show success message
      alert(`Recording saved successfully! Session ID: ${result.data?.id || 'unknown'}`);
    } catch (error) {
      console.error('💥 Error saving recording:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      setSaveStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save recording to database: ${errorMessage}`);
    }
  };

  const verifySupabaseSetup = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const response = await fetch('/api/emg-sessions/verify');
      const result = await response.json();
      setVerificationResult(result);
      console.log('🔍 Verification result:', result);
      
      if (result.status === 'PASS') {
        alert('✅ All checks passed! EMG sessions table is properly configured.');
      } else {
        alert(`❌ Some checks failed. See console for details. Status: ${result.status}`);
      }
    } catch (error) {
      console.error('Error verifying setup:', error);
      setVerificationResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      alert('Failed to verify setup. See console for details.');
    } finally {
      setVerifying(false);
    }
  };

  const exportToCSV = () => {
    if (recordedSessionDataRef.current.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Timestamp', 'Date/Time', 'Voltage (V)', 'Muscle Activity (Raw)', 'Muscle Activity (%)'];
    const rows = recordedSessionDataRef.current.map(d => [
      d.timestamp,
      formatTimestampForCSV(d.timestamp),
      d.voltage?.toFixed(4) || '0',
      d.muscleActivity,
      d.muscleActivityProcessed.toFixed(2)
    ]);

    const filename = generateFilenameWithDate(recordingName || 'emg-recording');
    exportCSV(headers, rows, filename);
  };

  // Fetch real-time data from API with retry mechanism
  const fetchRealTimeData = async (retryCount = 0) => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log('EMG API request already in progress, skipping...');
      return;
    }
    
    isFetchingRef.current = true;
    try {
      console.log(`Fetching EMG data from /api/emg/data... (attempt ${retryCount + 1})`);
      const response = await fetch('/api/emg/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        console.error(`EMG API Error: HTTP ${response.status} - ${response.statusText}`);
        
        // Retry logic for 404s and 500s
        if ((response.status === 404 || response.status === 500) && retryCount < 2) {
          console.log(`Retrying in 1 second... (attempt ${retryCount + 1}/3)`);
          isFetchingRef.current = false;
          setTimeout(() => fetchRealTimeData(retryCount + 1), 1000);
          return;
        }
        
        // Don't throw error for 404s after retries - just skip this update
        if (response.status === 404) {
          console.log('EMG API unavailable after retries, skipping this update');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Reset failure counter on successful request
      consecutiveFailuresRef.current = 0;
      
      // Log the full response structure for debugging
      console.log('🔍 Full EMG API Response:', JSON.stringify(data, null, 2));
      console.log('📊 Response fields:', {
        hasStatus: 'status' in data,
        hasData: 'data' in data,
        hasDataCount: 'dataCount' in data,
        hasIsConnected: 'isConnected' in data,
        hasTimeSinceLastHeartbeat: 'timeSinceLastHeartbeat' in data,
        dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
        dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
        dataCountValue: data.dataCount,
        isConnectedValue: data.isConnected,
        timeSinceLastHeartbeatValue: data.timeSinceLastHeartbeat
      });
      
      // Update connection status based on HEARTBEAT data (primary) and recent data (secondary)
      // Heartbeat is updated when EMG data is received or when explicit heartbeat message is sent
      const heartbeatBasedConnection = data.isConnected === true;
      const timeSinceLastHeartbeat = data.timeSinceLastHeartbeat || Infinity;
      const lastHeartbeat = data.lastHeartbeat || null;
      
      // Secondary check: verify we have recent data points (within last 60 seconds)
      const hasData = (data.data && Array.isArray(data.data) && data.data.length > 0);
      const dataCount = data.dataCount || 0;
      
      let hasRecentDataPoint = false;
      let latestDataAge = null;
      if (hasData && data.data.length > 0) {
        const latestDataPoint = data.data[data.data.length - 1];
        if (latestDataPoint.timestamp) {
          latestDataAge = Date.now() - latestDataPoint.timestamp;
          hasRecentDataPoint = latestDataAge < 60000; // Data from last 60 seconds
        }
      }
      
      // Primary: Use heartbeat-based connection status
      // Secondary: Also check for recent data points as a fallback
      // Device is connected if:
      // 1. Heartbeat is active (within 30 seconds), OR
      // 2. We have recent data (within 60 seconds) - this is the key indicator, OR
      // 3. We have any data at all AND data count > 0 (data is flowing)
      const hasActiveDataFlow = hasData && dataCount > 0;
      const shouldBeConnected = heartbeatBasedConnection 
        || hasRecentDataPoint  // If we have recent data, device is connected
        || (hasActiveDataFlow && timeSinceLastHeartbeat < 180000); // Allow connection if data is flowing and heartbeat is within 3 minutes
      
      console.log('🔍 Connection check (using heartbeat as primary):', {
        heartbeatBasedConnection,
        timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
        lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'never',
        isConnected: data.isConnected,
        dataCount: dataCount,
        recentDataCount: data.data?.length || 0,
        hasData,
        hasRecentDataPoint,
        latestDataAge: latestDataAge ? (latestDataAge / 1000).toFixed(1) + 's' : 'N/A',
        latestDataTimestamp: hasData && data.data.length > 0 ? new Date(data.data[data.data.length - 1].timestamp).toISOString() : null,
        willConnect: shouldBeConnected ? 'YES' : 'NO',
        reason: shouldBeConnected 
          ? (heartbeatBasedConnection 
              ? 'heartbeat active' 
              : hasRecentDataPoint 
                ? 'recent data point' 
                : hasActiveDataFlow 
                  ? 'active data flow' 
                  : 'unknown')
          : 'no indicators'
      });
      
      console.log('🔍 Connection decision:', {
        shouldBeConnected,
        currentState: isMyoWareConnected,
        willUpdate: shouldBeConnected !== isMyoWareConnected,
        primaryMethod: heartbeatBasedConnection ? 'heartbeat' : 'none',
        secondaryMethod: hasRecentDataPoint ? 'recent data' : 'none',
        reason: shouldBeConnected 
          ? (heartbeatBasedConnection 
              ? `Heartbeat active (${(timeSinceLastHeartbeat / 1000).toFixed(1)}s ago)` 
              : `Recent data point (${latestDataAge ? (latestDataAge / 1000).toFixed(1) : 'N/A'}s ago)`)
          : `No heartbeat (${timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) : 'N/A'}s since last) and no recent data`
      });
      
      // Update connection state immediately when we detect connection
      if (shouldBeConnected && !isMyoWareConnected) {
        console.log('✅ MyoWare device CONNECTED - heartbeat active:', {
          heartbeatBasedConnection,
          timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
          lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'never',
          hasRecentDataPoint,
          latestDataAge: latestDataAge ? (latestDataAge / 1000).toFixed(1) + 's' : 'N/A',
          dataCount: data.dataCount || 0,
          dataLength: data.data?.length || 0
        });
        setIsMyoWareConnected(true);
        // Reset failures on connection
        consecutiveFailuresRef.current = 0;
      } else if (!shouldBeConnected && isMyoWareConnected) {
        // Disconnect if heartbeat is stale
        console.log('❌ MyoWare device DISCONNECTED - heartbeat stale:', {
          timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
          lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'never',
          hasRecentDataPoint,
          latestDataAge: latestDataAge ? (latestDataAge / 1000).toFixed(1) + 's' : 'N/A',
          threshold: '30s (heartbeat timeout)'
        });
        setIsMyoWareConnected(false);
      }
      
      if (data.data && data.data.length > 0) {
        // Get the latest data point
        const latestData = data.data[data.data.length - 1];
        
        // Debug: Log raw values to understand voltage calculation
        // Check if values are varying (important for detecting constant data issue)
        try {
          const calculatedVoltage = latestData.voltage !== undefined 
            ? 'N/A (using ESP32 value)' 
            : (typeof latestData.muscleActivity === 'number' 
                ? (calculateVoltage(latestData.muscleActivity).toFixed(3) + 'V')
                : 'Invalid');
          
          // Check last few values to see if they're varying
          const recentValues = data.data.slice(-5).map((d: any) => d.muscleActivity);
          const isVarying = recentValues.length > 1 && 
            Math.max(...recentValues) - Math.min(...recentValues) > 10; // At least 10 ADC units difference
          
          console.log('📊 Raw EMG Data from API:', {
            muscleActivity: latestData.muscleActivity,
            voltageFromESP32: latestData.voltage,
            calculatedVoltage: calculatedVoltage,
            muscleActivityProcessed: latestData.muscleActivityProcessed,
            last5Values: recentValues,
            isVarying: isVarying ? '✅ Values are varying' : '⚠️ WARNING: Values appear constant!',
            variation: isVarying ? `${Math.max(...recentValues) - Math.min(...recentValues)} ADC units` : '0 (constant)'
          });
          
          if (!isVarying && recentValues.length > 1) {
            console.warn('⚠️ CONSTANT DATA DETECTED: muscleActivity values are not varying. This suggests:');
            console.warn('   1. Sensor may not be properly connected');
            console.warn('   2. Sensor may not be positioned on active muscle');
            console.warn('   3. ESP32 may be sending constant values');
            console.warn('   4. Smoothing algorithm may be too aggressive');
          }
        } catch (err) {
          console.warn('Error logging raw EMG data:', err);
        }
        
        // Calculate voltage - ensure it's not capped
        let calculatedVoltage: number;
        if (latestData.voltage !== undefined && latestData.voltage !== null) {
          calculatedVoltage = latestData.voltage;
        } else {
          // ESP32: 12-bit ADC (0-4095), 3.3V reference
          calculatedVoltage = calculateVoltage(latestData.muscleActivity);
        }
        
        // Warn if voltage is suspiciously high (sensor might be disconnected)
        if (calculatedVoltage > 2.9) {
          console.warn('⚠️ HIGH VOLTAGE WARNING:', {
            voltage: calculatedVoltage.toFixed(3) + 'V',
            muscleActivity: latestData.muscleActivity,
            diagnosis: latestData.muscleActivity >= 4000 
              ? 'Sensor likely DISCONNECTED (floating input reads max ~4095)'
              : 'Voltage unusually high - check sensor connection',
            troubleshooting: [
              '1. Check wireless shield connection to MyoWare sensor',
              '2. Ensure sensor is properly attached to muscle with good contact',
              '3. Verify sensor wires (red=power, black=ground, white=signal) are secure',
              '4. For wireless shield: check Bluetooth/WiFi connection',
              '5. Try power cycling the wireless shield'
            ]
          });
        }
        
        const emgData: EMGData = {
          timestamp: latestData.timestamp,
          muscleActivity: latestData.muscleActivity,
          muscleActivityProcessed: latestData.muscleActivityProcessed,
          voltage: calculatedVoltage
        };
        
        // Additional debug: Show what voltage we're using
        if (emgData.voltage !== undefined) {
          console.log('🔌 Final voltage value:', emgData.voltage.toFixed(3) + 'V', 
            latestData.voltage !== undefined ? '(from ESP32)' : '(calculated in app)',
            '| muscleActivity:', latestData.muscleActivity);
        }
        // Update calibration min/max while calibrating
        if (isCalibrating) {
          if (typeof emgData.muscleActivity === 'number') {
            if (emgData.muscleActivity < calMinRef.current) calMinRef.current = emgData.muscleActivity;
            if (emgData.muscleActivity > calMaxRef.current) calMaxRef.current = emgData.muscleActivity;
          }
        }
        
        console.log('Setting current data:', emgData); // Debug log
        setCurrentData(emgData);
        
        // Trigger movement detection and recording
        handleMyoWareData(emgData);
        
        // Debug: Check recording state after handling data (log first few and then occasionally)
        if (isRecordingSessionRef.current) {
          const count = recordedSessionDataRef.current.length;
          if (count <= 5 || count % 20 === 0) {
            console.log('✅ Recording active - sample count:', count);
          }
        }
        
        // Update chart data for real-time visualization (only if not paused and not already updated by recording)
        // During recording, chartData is updated in handleMyoWareData, so skip here to avoid duplicates
        if (!isChartPausedRef.current && !isRecordingSessionRef.current) {
          setChartData(prev => {
            const newData = [...prev, emgData];
            // Keep only last 100 data points for chart performance
            const updated = newData.slice(-100);
            // Log occasionally to track chart data updates
            if (updated.length % 10 === 0 || updated.length <= 5) {
              console.log('📈 Chart data updated:', {
                newLength: updated.length,
                latestVoltage: emgData.voltage,
                isPaused: isChartPausedRef.current,
                isRecording: isRecordingSessionRef.current
              });
            }
            return updated;
          });
        } else {
          // Log why chart data isn't being updated
          if (Math.random() < 0.1) {
            console.log('⚠️ Chart data NOT updated:', {
              reason: isChartPausedRef.current ? 'chart is paused' : 'recording session active',
              isPaused: isChartPausedRef.current,
              isRecording: isRecordingSessionRef.current,
              hasData: !!emgData
            });
          }
        }
        
        if (isRecording) {
          setEmgData(prev => [...prev, emgData]);
        }
      } else {
        console.log('No EMG data available - device may be connected but not sending data'); // Debug log
      }
    } catch (error) {
      // Increment failure counter
      consecutiveFailuresRef.current += 1;
      
      console.error('Failed to fetch real-time data:', error);
      
      // If too many consecutive failures, temporarily disable polling
      // Increased threshold to 15 to account for network blips at higher sample rates
      if (consecutiveFailuresRef.current >= 15) {
        console.log('Too many consecutive failures (15+), temporarily disabling EMG polling');
        setIsMyoWareConnected(false);
        // Reset failures so we can try again after a pause
        setTimeout(() => { consecutiveFailuresRef.current = 0; }, 5000);
        return;
      }
      
      // Handle different types of errors
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Handle specific error types
        if (error.name === 'AbortError') {
          console.log('Request timed out, will retry on next interval');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('❌ Failed to fetch - Next.js server may not be running!', {
            error: error.message,
            suggestion: 'Check if Next.js dev server is running on port 3000',
            command: 'Run: npm run dev'
          });
        } else if (error.message.includes('HTTP error')) {
          console.log('HTTP error, will retry on next interval');
        }
      } else {
        console.error('Unknown error type:', error);
      }
      
      // If we can't fetch data, assume device is disconnected
      if (isMyoWareConnected) {
        setIsMyoWareConnected(false);
        console.log('Lost connection to EMG server');
      }
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Connect to real-time data stream using Server-Sent Events
  useEffect(() => {
    console.log('🔄 Setting up SSE connection to /api/emg/stream');
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000; // 2 seconds
    
    const startPollingFallback = () => {
      console.log('🔄 Starting polling fallback mode');
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Poll immediately, then every second
      const pollOnce = async () => {
        try {
          const pollStartTime = Date.now();
          let response: Response;
          try {
            response = await fetch('/api/emg/data', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-cache',
              signal: AbortSignal.timeout(5000)
            });
          } catch (fetchError: any) {
            // Handle network errors (Next.js not running, CORS, etc.)
            if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
              console.warn('⏱️ Request timeout - Next.js may be slow to respond');
              throw fetchError;
            } else if (fetchError.message?.includes('Failed to fetch')) {
              console.error('❌ CRITICAL: Failed to fetch from Next.js API!', {
                error: fetchError.message,
                possibleCauses: [
                  'Next.js dev server is not running',
                  'Next.js server crashed',
                  'Port 3000 is blocked or in use',
                  'Network/CORS issue'
                ],
                action: 'Check Next.js terminal - is the server running?',
                command: 'Run: npm run dev in a new terminal'
              });
              throw fetchError;
            } else {
              throw fetchError;
            }
          }
          
          const pollDuration = Date.now() - pollStartTime;
          
          if (response.ok) {
            const data = await response.json();
            
            // Log every polling response for debugging
            const latestData = data.data && data.data.length > 0 ? data.data[data.data.length - 1] : null;
            const latestDataAge = latestData ? ((Date.now() - latestData.timestamp) / 1000).toFixed(1) + 's' : 'N/A';
            const isDataFresh = latestData && (Date.now() - latestData.timestamp) < 5000; // Less than 5 seconds old
            
            console.log('📊 Polling response:', {
              status: response.status,
              pollDuration: pollDuration + 'ms',
              isConnected: data.isConnected,
              dataCount: data.dataCount,
              hasData: data.data && Array.isArray(data.data) && data.data.length > 0,
              dataArrayLength: data.data?.length || 0,
              timeSinceLastHeartbeat: data.timeSinceLastHeartbeat < Infinity ? (data.timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
              lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat).toISOString() : 'never',
              latestDataTimestamp: latestData ? new Date(latestData.timestamp).toISOString() : 'no data',
              latestDataAge: latestDataAge,
              isDataFresh: isDataFresh ? '✅ Fresh' : '⚠️ Stale',
              latestVoltage: latestData?.voltage?.toFixed(3) + 'V' || 'N/A',
              latestMuscleActivity: latestData?.muscleActivity || 'N/A'
            });
            
            if (!isDataFresh && latestData) {
              console.warn('⚠️ WARNING: Latest data is stale!', {
                age: latestDataAge,
                timestamp: new Date(latestData.timestamp).toISOString(),
                now: new Date().toISOString(),
                issue: 'ESP32 may have stopped sending data or EMG server stopped forwarding'
              });
            }
            
            // Parse connection status - handle both boolean and string values
            const heartbeatBasedConnection = data.isConnected === true || data.isConnected === 'true';
            const hasData = (data.data && Array.isArray(data.data) && data.data.length > 0);
            const dataCount = data.dataCount || 0;
            const timeSinceLastHeartbeat = data.timeSinceLastHeartbeat || Infinity;
            
            // Connection detection: require actual data or active heartbeat
            // Device is connected if:
            // 1. Heartbeat is active (within 30s) - PRIMARY METHOD, OR
            // 2. We have actual data points in the response (even if heartbeat is stale), OR  
            // 3. We have data count > 0 AND heartbeat was recent (within 2 minutes)
            // Also check if latest data is fresh (within last 10 seconds) as additional indicator
            // Note: latestData and latestDataAge are already defined above
            const latestDataAgeMs = latestData ? (Date.now() - latestData.timestamp) : Infinity;
            const hasFreshData = latestDataAgeMs < 10000; // Data less than 10 seconds old
            
            // Prioritize heartbeat-based connection, but also accept fresh data as connection indicator
            const shouldBeConnected = heartbeatBasedConnection || hasData || (dataCount > 0 && (timeSinceLastHeartbeat < 120000 || hasFreshData));
            
            console.log('🔍 Connection decision (polling):', {
              shouldBeConnected,
              currentState: isMyoWareConnected,
              heartbeatBasedConnection,
              hasData,
              hasFreshData: hasFreshData ? '✅ Fresh' : '❌ Stale',
              latestDataAge: latestDataAgeMs < Infinity ? (latestDataAgeMs / 1000).toFixed(1) + 's' : 'N/A',
              dataCount,
              dataArrayLength: data.data?.length || 0,
              timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
              willUpdate: shouldBeConnected !== isMyoWareConnected,
              reason: shouldBeConnected 
                ? (heartbeatBasedConnection 
                    ? 'heartbeat active' 
                    : hasFreshData
                      ? 'fresh data received'
                      : hasData 
                        ? 'has data array' 
                        : 'data count > 0')
                : 'no heartbeat and no data'
            });
            
            if (shouldBeConnected) {
              if (!isMyoWareConnected) {
                const reason = heartbeatBasedConnection 
                  ? 'heartbeat active' 
                  : (hasData && data.data.length > 0) 
                    ? `has ${data.data.length} data points` 
                    : (dataCount > 0 && timeSinceLastHeartbeat < 120000)
                      ? `data count ${dataCount} within ${(timeSinceLastHeartbeat / 1000).toFixed(0)}s`
                      : 'unknown';
                console.log('✅ MyoWare device CONNECTED via polling:', {
                  heartbeatBasedConnection,
                  hasData,
                  dataCount,
                  timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
                  reason
                });
              }
              setIsMyoWareConnected(true);
              
              if (hasData && data.data.length > 0) {
                const latestData = data.data[data.data.length - 1];
                const emgData: EMGData = {
                  timestamp: latestData.timestamp,
                  muscleActivity: latestData.muscleActivity,
                  muscleActivityProcessed: latestData.muscleActivityProcessed,
                  voltage: latestData.voltage,
                };
                
                setCurrentData(emgData);
                handleMyoWareData(emgData);
                
                // Update chart data if not paused
                if (!isChartPausedRef.current) {
                  setChartData(prev => {
                    // Avoid duplicates by checking timestamp
                    const isDuplicate = prev.some(d => d.timestamp === emgData.timestamp);
                    if (isDuplicate) {
                      console.log('⚠️ Duplicate data detected, skipping:', {
                        timestamp: new Date(emgData.timestamp).toISOString()
                      });
                      return prev;
                    }
                    const newData = [...prev, emgData];
                    const trimmed = newData.slice(-100);
                    console.log('📈 Updating chart data:', {
                      previousCount: prev.length,
                      newCount: trimmed.length,
                      timestamp: new Date(emgData.timestamp).toISOString(),
                      voltage: emgData.voltage?.toFixed(3) + 'V',
                      isPaused: isChartPausedRef.current,
                      wasDuplicate: isDuplicate
                    });
                    return trimmed;
                  });
                } else {
                  console.log('⏸️ Chart is paused, skipping data update');
                }
              }
            } else {
              if (isMyoWareConnected) {
                console.log('❌ MyoWare device DISCONNECTED via polling:', {
                  heartbeatBasedConnection,
                  hasData,
                  dataCount,
                  timeSinceLastHeartbeat: data.timeSinceLastHeartbeat
                });
              }
              setIsMyoWareConnected(false);
            }
          } else {
            console.warn('⚠️ Polling response not OK:', {
              status: response.status,
              statusText: response.statusText,
              pollDuration: pollDuration + 'ms'
            });
            setIsMyoWareConnected(false);
          }
        } catch (pollError) {
          console.error('❌ Polling error:', {
            error: pollError,
            message: pollError instanceof Error ? pollError.message : String(pollError),
            name: pollError instanceof Error ? pollError.name : 'Unknown'
          });
          setIsMyoWareConnected(false);
        }
      };
      
      // Poll immediately
      pollOnce();
      
      // Then poll every second
      pollingInterval = setInterval(pollOnce, 1000);
      console.log('✅ Polling interval set - will poll every 1 second');
    };
    
    const connectSSE = () => {
      try {
        console.log('🔄 Creating EventSource connection to /api/emg/stream');
        eventSource = new EventSource('/api/emg/stream');
        
        eventSource.onopen = () => {
          console.log('✅ SSE connection opened successfully');
          reconnectAttempts = 0;
          consecutiveFailuresRef.current = 0;
        };
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'initial' || data.type === 'update' || data.type === 'heartbeat') {
              // Update connection status
              const heartbeatBasedConnection = data.isConnected === true;
              const timeSinceLastHeartbeat = data.timeSinceLastHeartbeat || Infinity;
              const lastHeartbeat = data.lastHeartbeat || null;
              const hasData = (data.data && Array.isArray(data.data) && data.data.length > 0);
              const dataCount = data.dataCount || 0;
              
              // More lenient connection detection: heartbeat OR has data OR has data count
              const shouldBeConnected = heartbeatBasedConnection || hasData || dataCount > 0;
              
              if (shouldBeConnected && !isMyoWareConnected) {
                console.log('✅ MyoWare device CONNECTED via SSE:', {
                  heartbeatBasedConnection,
                  hasData,
                  dataCount,
                  timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A'
                });
                setIsMyoWareConnected(true);
                consecutiveFailuresRef.current = 0;
              } else if (!shouldBeConnected && isMyoWareConnected) {
                console.log('❌ MyoWare device DISCONNECTED via SSE');
                setIsMyoWareConnected(false);
              }
              
              // Process new data if available
              if (data.type === 'update' && data.newData) {
                const emgData: EMGData = {
                  timestamp: data.newData.timestamp,
                  muscleActivity: data.newData.muscleActivity,
                  muscleActivityProcessed: data.newData.muscleActivityProcessed,
                  voltage: data.newData.voltage,
                };
                
                setCurrentData(emgData);
                handleMyoWareData(emgData);
                
                // Only update chart if not paused (use ref to get current value)
                if (!isChartPausedRef.current) {
                  setChartData(prev => {
                    const newData = [...prev, emgData];
                    return newData.slice(-100);
                  });
                }
                
                if (isRecording) {
                  setEmgData(prev => [...prev, emgData]);
                }
              } else if (data.type === 'initial' && hasData && data.data.length > 0 && !isChartPausedRef.current) {
                const latestData = data.data[data.data.length - 1];
                const emgData: EMGData = {
                  timestamp: latestData.timestamp,
                  muscleActivity: latestData.muscleActivity,
                  muscleActivityProcessed: latestData.muscleActivityProcessed,
                  voltage: latestData.voltage,
                };
                
                setCurrentData(emgData);
                setChartData([emgData]);
              }
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };
        
        eventSource.onerror = (error) => {
          const readyState = eventSource?.readyState;
          const stateNames = ['CONNECTING', 'OPEN', 'CLOSED'];
          const stateName = readyState !== undefined ? stateNames[readyState] : 'UNKNOWN';
          
          console.error('❌ SSE connection error:', {
            error,
            readyState,
            stateName,
            url: eventSource?.url,
            reconnectAttempts,
            withCredentials: eventSource?.withCredentials
          });
          
          // Check readyState to determine error type
          if (eventSource) {
            if (readyState === EventSource.CLOSED) {
              console.log('SSE connection closed - will attempt reconnect');
              eventSource.close();
              
              if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`🔄 Attempting to reconnect SSE (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
                reconnectTimeout = setTimeout(() => {
                  connectSSE();
                }, reconnectDelay);
              } else {
                console.error('❌ Max reconnect attempts reached, falling back to polling');
                setIsMyoWareConnected(false);
                // Fall back to polling
                startPollingFallback();
              }
            } else if (readyState === EventSource.CONNECTING) {
              console.log('SSE connection is connecting... (this is normal on first connect)');
            }
          }
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        console.log('⚠️ SSE not supported or failed, falling back to polling mode');
        setIsMyoWareConnected(false);
        startPollingFallback();
      }
    };
    
    // Start polling immediately as primary method
    // SSE is disabled for now due to compatibility issues
    console.log('🚀 Initializing EMG data connection (polling mode)...');
    startPollingFallback();
    
    // SSE disabled - using polling only for now
    // Uncomment below to enable SSE (may cause errors in some environments)
    // connectSSE();
    
    // Test API endpoint and EMG server forwarding status
    const runDiagnostics = async () => {
      try {
        // Test Next.js API
        let apiResponse: Response;
        try {
          apiResponse = await fetch('/api/emg/data', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
        } catch (fetchError: any) {
          console.warn('⚠️ Cannot reach Next.js API /api/emg/data:', fetchError.message);
          return; // Exit early if we can't reach the API
        }
        
        if (!apiResponse.ok) {
          console.warn(`⚠️ Next.js API returned error: ${apiResponse.status} ${apiResponse.statusText}`);
          return;
        }
        
        const apiData = await apiResponse.json();
        console.log('🧪 Next.js API status:', {
          dataCount: apiData.dataCount,
          isConnected: apiData.isConnected,
          hasData: apiData.data && Array.isArray(apiData.data) && apiData.data.length > 0,
          timeSinceLastHeartbeat: apiData.timeSinceLastHeartbeat,
          lastHeartbeat: apiData.lastHeartbeat ? new Date(apiData.lastHeartbeat).toISOString() : 'never'
        });
        
        // Test EMG server forwarding status
        try {
          const emgServerResponse = await fetch('http://localhost:3001/api/emg/ws', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }).catch((fetchError) => {
            // Handle network errors gracefully
            throw new Error(`Network error: ${fetchError.message}`);
          });
          
          if (!emgServerResponse.ok) {
            throw new Error(`HTTP ${emgServerResponse.status}: ${emgServerResponse.statusText}`);
          }
          
          const emgServerData = await emgServerResponse.json();
          console.log('🧪 EMG Server status:', {
            status: emgServerData.status,
            connectedDevices: emgServerData.connectedDevices,
            forwardingStats: emgServerData.forwardingStats
          });
          
          if (emgServerData.forwardingStats) {
            const stats = emgServerData.forwardingStats;
            console.log('📊 Forwarding Statistics:', {
              success: stats.success,
              failures: stats.failures,
              lastError: stats.lastError,
              lastSuccess: stats.lastSuccess,
              nextjsUrl: stats.nextjsUrl
            });
            
            // Check if lastSuccess is recent (within last 5 seconds)
            if (stats.lastSuccess) {
              const lastSuccessTime = new Date(stats.lastSuccess).getTime();
              const timeSinceLastSuccess = Date.now() - lastSuccessTime;
              const isRecentSuccess = timeSinceLastSuccess < 5000; // 5 seconds
              
              console.log('⏱️ Last successful forward:', {
                time: stats.lastSuccess,
                age: (timeSinceLastSuccess / 1000).toFixed(1) + 's',
                isRecent: isRecentSuccess ? '✅ YES' : '❌ NO - stale'
              });
              
              if (!isRecentSuccess && stats.success > 0) {
                console.warn('⚠️ WARNING: EMG server shows successful forwards, but last success was ' + 
                  (timeSinceLastSuccess / 1000).toFixed(1) + ' seconds ago');
                console.warn('   ⚠️ CRITICAL: POST requests may have STOPPED reaching Next.js!');
                console.warn('   🔍 ACTION REQUIRED: Check Next.js server console (terminal running "npm run dev")');
                console.warn('   Look for: "🔔 POST /api/emg/ws - Request received" messages');
                console.warn('   If you don\'t see these messages, POST requests are NOT reaching Next.js');
                console.warn('   Possible causes:');
                console.warn('   1. Next.js server restarted and EMG server is forwarding to old instance');
                console.warn('   2. Network/firewall blocking localhost:3000');
                console.warn('   3. Next.js API route not responding');
              }
            }
            
            if (stats.failures > 0 && stats.success === 0) {
              // Use console.warn instead of console.error to avoid React error boundary
              console.warn('⚠️ WARNING: EMG server is NOT forwarding data to Next.js!');
              console.warn('   This may be normal if:');
              console.warn('   1. No data has been sent from the MyoWare sensor yet');
              console.warn('   2. Next.js server was just restarted');
              console.warn('   3. EMG server is still starting up');
              console.warn('   Check that Next.js is running on port 3000');
              console.warn('   Check that the URL is correct:', stats.nextjsUrl);
              if (stats.lastError) {
                console.warn('   Last error:', stats.lastError);
              }
            } else if (stats.success > 0) {
              console.log('✅ EMG server IS forwarding data successfully');
              console.log('   ⚠️ IMPORTANT: Check Next.js server console (terminal running "npm run dev")');
              console.log('   Look for: "🔔 POST /api/emg/ws - Request received" messages');
              console.log('   If you don\'t see these, POST requests aren\'t reaching Next.js!');
            }
          }
        } catch (emgError: any) {
          // Silently handle EMG server connection errors - it's optional for diagnostics
          console.warn('⚠️ Cannot reach EMG server at http://localhost:3001 (this is OK if EMG server is not running)');
          if (emgError.message) {
            console.warn('   Error:', emgError.message);
          }
        }
      } catch (error) {
        console.error('🧪 Diagnostic test failed:', error);
      }
    };
    
    // Run diagnostics after a short delay (to ensure page is ready) and then every 10 seconds
    // Wrap in try-catch to prevent unhandled promise rejections
    setTimeout(() => {
      runDiagnostics().catch((err) => {
        // Silently handle - errors are already logged inside runDiagnostics
        console.debug('Diagnostic run completed with errors (this is normal)');
      });
    }, 1000);
    
    const diagnosticInterval = setInterval(() => {
      runDiagnostics().catch((err) => {
        // Silently handle - errors are already logged inside runDiagnostics
        console.debug('Diagnostic run completed with errors (this is normal)');
      });
    }, 10000);
    
    return () => {
      console.log('🛑 Cleaning up SSE connection and polling');
      clearInterval(diagnosticInterval);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []); // Run once on mount

  // Auto-connect to MyoWare when page loads
  useEffect(() => {
    // Reset connection state on page load
    setIsMyoWareConnected(false);
    setUseRealData(false);
    setIsConnected(false);
    
    const autoConnect = async () => {
      try {
        console.log('Auto-connecting to MyoWare...');
        
        // First check if the EMG server is running
        // Add timeout and error handling for when Next.js isn't ready
        let wsResponse: Response;
        try {
          wsResponse = await fetch('/api/emg/ws', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-cache',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError' || fetchError.message?.includes('Failed to fetch')) {
            console.log('Next.js API not ready yet (this is normal if Next.js is starting up). Will retry in polling.');
            setIsMyoWareConnected(false);
            setUseRealData(false);
            return; // Exit early, polling will retry later
          }
          throw fetchError; // Re-throw unexpected errors
        }
        
        if (wsResponse.ok) {
          const wsData = await wsResponse.json();
          console.log('EMG WebSocket server status:', wsData);
          
          // Then check if there's actual EMG data available
          let dataResponse: Response;
          try {
            dataResponse = await fetch('/api/emg/data', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              cache: 'no-cache',
              signal: AbortSignal.timeout(3000) // 3 second timeout
            });
          } catch (fetchError: any) {
            if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError' || fetchError.message?.includes('Failed to fetch')) {
              console.log('Next.js API not ready yet (this is normal if Next.js is starting up). Will retry in polling.');
              setIsMyoWareConnected(false);
              setUseRealData(false);
              return; // Exit early, polling will retry later
            }
            throw fetchError; // Re-throw unexpected errors
          }
          
          if (dataResponse.ok) {
            const dataData = await dataResponse.json();
            console.log('EMG data status:', dataData);
            
            // Use heartbeat-based connection detection (primary) with recent data as fallback
            const heartbeatBasedConnection = dataData.isConnected === true;
            const timeSinceLastHeartbeat = dataData.timeSinceLastHeartbeat || Infinity;
            const lastHeartbeat = dataData.lastHeartbeat || null;
            
            // Secondary check: verify we have recent data points (within last 60 seconds)
            let hasRecentDataPoint = false;
            let latestDataAge = null;
            if (dataData.data && Array.isArray(dataData.data) && dataData.data.length > 0) {
              const latestDataPoint = dataData.data[dataData.data.length - 1];
              if (latestDataPoint.timestamp) {
                latestDataAge = Date.now() - latestDataPoint.timestamp;
                hasRecentDataPoint = latestDataAge < 60000; // Data from last 60 seconds
              }
            }
            
            // Primary: Use heartbeat-based connection status
            // Secondary: Also check for recent data points as a fallback
            const shouldBeConnected = heartbeatBasedConnection || (hasRecentDataPoint && timeSinceLastHeartbeat < 90000); // 90s fallback
            
            if (shouldBeConnected) {
              setIsMyoWareConnected(true);
              setUseRealData(true);
              console.log('Auto-connected to MyoWare device - heartbeat active:', {
                heartbeatBasedConnection,
                timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
                lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'never',
                hasRecentDataPoint,
                latestDataAge: latestDataAge ? (latestDataAge / 1000).toFixed(1) + 's' : 'N/A',
                dataCount: dataData.dataCount || 0
              });
            } else {
              console.log('EMG server running but no device connected yet:', {
                heartbeatBasedConnection,
                timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
                lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'never',
                isConnected: dataData.isConnected,
                dataCount: dataData.dataCount || 0,
                dataLength: dataData.data?.length || 0,
                hasRecentDataPoint
              });
              setIsMyoWareConnected(false);
              setUseRealData(false);
            }
          } else {
            console.log('Failed to fetch EMG data during auto-connect');
            setIsMyoWareConnected(false);
            setUseRealData(false);
          }
        } else {
          console.log('EMG WebSocket server not responding');
          setIsMyoWareConnected(false);
          setUseRealData(false);
        }
      } catch (error) {
        // Don't log as error if it's just Next.js not being ready yet
        if (error instanceof Error && (error.message?.includes('Failed to fetch') || error.name === 'AbortError' || error.name === 'TimeoutError')) {
          console.log('Next.js API not ready yet (this is normal if Next.js is starting up). Will retry in polling.');
        } else {
          console.log('MyoWare server not available for auto-connect:', error);
          
          // Handle error with proper typing
          if (error instanceof Error) {
            console.error('Auto-connect error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
          }
        }
        
        setIsMyoWareConnected(false);
        setUseRealData(false);
      }
    };
    
    // Check connection after a short delay
    setTimeout(autoConnect, 1000);
  }, []);

  const liveMetrics = useMemo(() => {
    if (!chartData.length) {
      return {
        averageActivation: null,
        peakActivation: null,
        variability: null,
        snr: null,
        sampleCount: 0,
        restSamples: 0,
      };
    }

    const processedValues = chartData.map(d => d.muscleActivityProcessed).filter(v => Number.isFinite(v));
    const rawValues = chartData.map(d => d.muscleActivity).filter(v => Number.isFinite(v));

    if (!processedValues.length || !rawValues.length) {
      return {
        averageActivation: null,
        peakActivation: null,
        variability: null,
        snr: null,
        sampleCount: chartData.length,
        restSamples: 0,
      };
    }

    const mean = processedValues.reduce((acc, v) => acc + v, 0) / processedValues.length;
    const peak = Math.max(...processedValues);
    const variance = processedValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / processedValues.length;
    const stdDev = Math.sqrt(variance);
    const variability = mean > 0 ? (stdDev / mean) * 100 : 0;

    const restSamples = chartData.filter(d => d.muscleActivityProcessed < 5);
    let noise = 0;
    if (restSamples.length > 5) {
      const restValues = restSamples.map(d => d.muscleActivity);
      const restMean = restValues.reduce((acc, v) => acc + v, 0) / restValues.length;
      const restVariance = restValues.reduce((acc, v) => acc + Math.pow(v - restMean, 2), 0) / restValues.length;
      noise = Math.sqrt(restVariance);
    } else {
      const rawMean = rawValues.reduce((acc, v) => acc + v, 0) / rawValues.length;
      const rawVariance = rawValues.reduce((acc, v) => acc + Math.pow(v - rawMean, 2), 0) / rawValues.length;
      noise = Math.sqrt(rawVariance);
    }
    const rawMean = rawValues.reduce((acc, v) => acc + v, 0) / rawValues.length;
    const snr = noise > 0 ? rawMean / noise : null;

    return {
      averageActivation: mean,
      peakActivation: peak,
      variability,
      snr,
      sampleCount: processedValues.length,
      restSamples: restSamples.length,
    };
  }, [chartData]);

  const formatPercent = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return '—';
    return `${value.toFixed(1)}%`;
  };

  const formatVariability = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return '—';
    return `${value.toFixed(1)}% CV`;
  };

  const formatSnr = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return '—';
    return `${value.toFixed(1)} : 1`;
  };

  const getVariabilityStatus = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return { label: 'No data yet', tone: 'bg-gray-500/20 text-gray-200 border-gray-500/30' };
    if (value < 15) return { label: 'Steady', tone: 'bg-green-500/20 text-green-100 border-green-500/40' };
    if (value < 30) return { label: 'Variable', tone: 'bg-yellow-500/20 text-yellow-100 border-yellow-500/40' };
    return { label: 'Fatigued', tone: 'bg-red-500/25 text-red-100 border-red-500/40' };
  };

  const getSnrStatus = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return { label: 'Need signal', tone: 'bg-gray-500/20 text-gray-200 border-gray-500/30' };
    if (value >= 5) return { label: 'Excellent contact', tone: 'bg-green-500/20 text-green-100 border-green-500/40' };
    if (value >= 3) return { label: 'Usable', tone: 'bg-yellow-500/20 text-yellow-100 border-yellow-500/40' };
    return { label: 'Check sensor', tone: 'bg-red-500/25 text-red-100 border-red-500/40' };
  };

  const variabilityStatus = useMemo(() => getVariabilityStatus(liveMetrics.variability), [liveMetrics.variability]);
  const snrStatus = useMemo(() => getSnrStatus(liveMetrics.snr), [liveMetrics.snr]);

  // Handle MyoWare connection changes
  const handleMyoWareConnection = (connected: boolean) => {
    // Do NOT set connected=true here. We only trust server data to mark connected.
    if (!connected) {
      if (isMyoWareConnected) {
        setIsMyoWareConnected(false);
      }
      if (isConnected) {
        // If device disconnects while recording, stop recording
        setIsConnected(false);
        console.log('MyoWare device disconnected - stopping recording');
      }
    }
  };

  // Connect to EMG sensors and start recording
  const connectEMG = () => {
    // Only allow connection if we have a real MyoWare device
    if (isMyoWareConnected) {
      setIsConnected(true);
      
      // Use provided recording name or auto-generate one
      const finalRecordingName = recordingName.trim() || `EMG Session ${new Date().toLocaleString()}`;
      if (!recordingName.trim()) {
        setRecordingName(finalRecordingName);
      }
      
      // Clear previous data and start recording
      recordedSessionDataRef.current = [];
      moveMarkersRef.current = [];
      setMoveMarkers([]);
      lastVoltageRef.current = null;
      isRecordingSessionRef.current = true; // Update ref FIRST, before state
      setIsRecordingSession(true);
      setSessionStartTime(Date.now());
      setSaveStatus('idle');
      
      console.log('🎬 Auto-started recording session:', {
        recordingName: finalRecordingName,
        isMyoWareConnected,
        isConnected: true,
        currentData: currentData ? 'available' : 'none'
      });
      
      // If we have current data, immediately add it to the recording
      if (currentData) {
        console.log('📥 Adding initial current data to recording');
        recordedSessionDataRef.current.push(currentData);
        console.log('📊 Initial sample count:', recordedSessionDataRef.current.length);
      }
    } else {
      console.log('Cannot connect: No MyoWare device detected');
    }
  };

  // Disconnect from EMG sensors and stop recording
  const disconnectEMG = async () => {
    // Stop recording first if active
    if (isRecordingSessionRef.current) {
      await stopRecording();
    }
    
    setIsConnected(false);
    setCurrentData(null);
  };

  // Navigation functions
  const nextWorkout = () => {
    setCurrentWorkoutIndex((prev) => (prev + 1) % WORKOUT_ROUTINES.length);
  };

  const prevWorkout = () => {
    setCurrentWorkoutIndex((prev) => (prev - 1 + WORKOUT_ROUTINES.length) % WORKOUT_ROUTINES.length);
  };

  const selectWorkout = (index: number) => {
    setCurrentWorkoutIndex(index);
  };

  // Start workout
  const startWorkout = () => {
    const exercise = WORKOUT_ROUTINES[currentWorkoutIndex];
    setCurrentWorkout(exercise);
    setWorkoutTime(0);
    setEmgData([]);
    setIsRecording(true);
  };

  // Stop workout
  const stopWorkout = () => {
    if (currentWorkout) {
      const workoutSession = {
        id: Date.now().toString(),
        exercise: currentWorkout,
        duration: workoutTime,
        dataPoints: emgData.length,
        avgMuscleActivation: calculateAverageActivation(),
        timestamp: new Date().toISOString()
      };
      
      setWorkoutHistory(prev => [workoutSession, ...prev]);
    }
    
    setCurrentWorkout(null);
    setWorkoutTime(0);
    setIsRecording(false);
    setEmgData([]);
  };

  // Calibration functions for MyoWare 2.0
  const finalizeCalibration = async () => {
    setIsCalibrating(false);
    const min = Number.isFinite(calMinRef.current) ? calMinRef.current : 400;
    const max = Number.isFinite(calMaxRef.current) && calMaxRef.current > min ? calMaxRef.current : 600;
    const newCal = {
      muscleActivity: { min, max }
    };
    setCalibrationData(newCal);
    // Persist calibration to server
    try {
      await fetch('/api/emg/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'calibration_data', min, max, range: max - min })
      });
    } catch (e) {
      // Swallow errors; UI state already updated
    }
  };

  const startCalibration = () => {
    calMinRef.current = Infinity;
    calMaxRef.current = -Infinity;
    setIsCalibrating(true);
    // Auto-calibrate after 5 seconds
    setTimeout(() => {
      finalizeCalibration();
    }, 5000);
  };

  const stopCalibration = () => {
    finalizeCalibration();
  };

  // Calculate average muscle activation
  const calculateAverageActivation = () => {
    if (emgData.length === 0) return 0;
    
    const sum = emgData.reduce((acc, data) => acc + data.muscleActivityProcessed, 0);
    return sum / emgData.length;
  };

  // Workout timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentWorkout && isRecording) {
      timer = setInterval(() => {
        setWorkoutTime(prev => {
          const newTime = prev + 1;
          if (newTime >= currentWorkout.duration) {
            stopWorkout();
            return prev;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentWorkout, isRecording]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevWorkout();
      } else if (event.key === 'ArrowRight') {
        nextWorkout();
      } else if (event.key === 'Enter' && !currentWorkout) {
        startWorkout();
      } else if (event.key === 'Escape' && currentWorkout) {
        stopWorkout();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentWorkout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any active intervals
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">EMG Workout</h1>
                <Link 
                  href="/emg-history" 
                  className="text-sm px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 hover:text-cyan-200 transition-all"
                >
                  View History
                </Link>
                <button
                  onClick={verifySupabaseSetup}
                  disabled={verifying}
                  className="text-sm px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all disabled:opacity-50"
                  title="Verify Supabase migration and configuration"
                >
                  {verifying ? 'Verifying...' : 'Verify Setup'}
                </button>
              </div>
              <p className="text-gray-300">Monitor muscle activation during exercises</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isMyoWareConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-300">
                {isMyoWareConnected ? 'MyoWare Device Connected' : 'No MyoWare Device Detected'}
              </span>
              {isMyoWareConnected && isConnected && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-300">Recording Active</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Workout Demonstration Video */}
          <div className="mb-4">
            <h3 className="font-medium text-white mb-3">
              {currentWorkout ? 'Exercise Demonstration' : 'Workout Preview'}
            </h3>
            <WorkoutVideo
              videoUrl={(currentWorkout || WORKOUT_ROUTINES[currentWorkoutIndex]).videoUrl}
              exerciseId={(currentWorkout || WORKOUT_ROUTINES[currentWorkoutIndex]).id}
              exerciseName={(currentWorkout || WORKOUT_ROUTINES[currentWorkoutIndex]).name}
              className="w-full"
            />
          </div>
          
          {/* Workout Selection */}
          <div className="mb-4">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-3">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-4">Select Workout</h2>
                
                {/* Current Workout Display */}
                <div className="p-3 rounded-lg border border-white/20 bg-white/10 mb-3">
                  <div className="text-center mb-3">
                    <div className="text-sm text-gray-400 mb-2">
                      Workout {currentWorkoutIndex + 1} of {WORKOUT_ROUTINES.length}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {WORKOUT_ROUTINES[currentWorkoutIndex].name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-3">
                      {WORKOUT_ROUTINES[currentWorkoutIndex].description}
                    </p>
                    <div className="text-xs text-gray-400 mb-3">
                      Duration: {formatTime(WORKOUT_ROUTINES[currentWorkoutIndex].duration)}
                    </div>
                    
                    {/* MyoWare Suitability Indicator */}
                    <div className={`p-3 rounded-lg mb-3 ${
                      WORKOUT_ROUTINES[currentWorkoutIndex].myoWareSuitable 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-orange-500/20 border border-orange-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          WORKOUT_ROUTINES[currentWorkoutIndex].myoWareSuitable 
                            ? 'bg-green-400' 
                            : 'bg-orange-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          WORKOUT_ROUTINES[currentWorkoutIndex].myoWareSuitable 
                            ? 'text-green-200' 
                            : 'text-orange-200'
                        }`}>
                          {WORKOUT_ROUTINES[currentWorkoutIndex].myoWareSuitable 
                            ? 'MyoWare Recommended' 
                            : 'MyoWare Not Needed'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        {WORKOUT_ROUTINES[currentWorkoutIndex].myoWareReason}
                      </p>
                      <p className="text-xs text-gray-400">
                        {WORKOUT_ROUTINES[currentWorkoutIndex].sensorPlacement}
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={prevWorkout}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={nextWorkout}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
                    >
                      Next →
                    </button>
                  </div>
                  
                  {/* Start Workout Button */}
                  <button
                    onClick={startWorkout}
                    disabled={!isMyoWareConnected || !isConnected || currentWorkout !== null}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isMyoWareConnected ? 'Connect MyoWare Device First' : 
                     !isConnected ? 'Start Recording First' :
                     currentWorkout ? 'Workout in Progress' : 'Start Workout'}
                  </button>
                </div>
                
                {/* Workout List (Collapsible) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-300">All Workouts</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-400">
                        {currentWorkoutIndex + 1}/{WORKOUT_ROUTINES.length}
                      </div>
                      <button
                        onClick={() => setShowWorkoutList(v => !v)}
                        className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                        aria-expanded={showWorkoutList}
                        aria-controls="workout-list"
                      >
                        {showWorkoutList ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentWorkoutIndex + 1) / WORKOUT_ROUTINES.length) * 100}%` }}
                    />
                  </div>

                  {showWorkoutList && (
                    <div id="workout-list" className="space-y-2">
                      {WORKOUT_ROUTINES.map((exercise, index) => (
                        <button
                          key={exercise.id}
                          onClick={() => selectWorkout(index)}
                          className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                            index === currentWorkoutIndex
                              ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium">{exercise.name}</div>
                                <div className="text-xs text-gray-400">
                                  {formatTime(exercise.duration)}
                                </div>
                              </div>
                              {/* MyoWare Indicator */}
                              <div className={`w-2 h-2 rounded-full ${
                                exercise.myoWareSuitable ? 'bg-green-400' : 'bg-orange-400'
                              }`} title={
                                exercise.myoWareSuitable 
                                  ? 'MyoWare Recommended' 
                                  : 'MyoWare Not Needed'
                              } />
                            </div>
                            {index === currentWorkoutIndex && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* MyoWare Guidance */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 text-xl">💡</div>
              <div>
                <h3 className="text-sm font-medium text-blue-200 mb-2">MyoWare 2.0 Sensor Guidance</h3>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><span className="text-green-400">●</span> <strong>Green workouts</strong> are perfect for MyoWare monitoring - they involve arm movements that the sensor can track effectively.</p>
                  <p><span className="text-orange-400">●</span> <strong>Orange workouts</strong> focus on other body parts (legs, neck, balance) where MyoWare won't provide useful data.</p>
                  <p><strong>Sensor placement:</strong> For arm-focused workouts, place the MyoWare sensor on your upper arm (bicep) for best results.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Connection Controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start items-center">
              {!isMyoWareConnected ? (
                <div className="px-6 py-3 bg-gray-600 text-gray-300 rounded-lg font-medium">
                  Waiting for MyoWare Device...
                </div>
              ) : !isConnected ? (
                <>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Recording Name (optional)"
                      value={recordingName}
                      onChange={(e) => setRecordingName(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
                    />
                    <button
                      onClick={connectEMG}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      Start Recording
                    </button>
                  </div>
                  {!isRecordingSession && (
                    <button
                      onClick={isCalibrating ? stopCalibration : startCalibration}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isCalibrating 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                      }`}
                    >
                      {isCalibrating ? 'Finish Calibration' : 'Calibrate (5s)'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={disconnectEMG}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                  >
                    Stop Recording
                  </button>
                  {isRecordingSession && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-300">
                        Recording: {formatTime(recordingElapsedTime)} ({recordedSessionDataRef.current.length} samples)
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Real-time EMG Data Graph - moved here */}
            {isMyoWareConnected && (
              <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-4">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-blue-500/10 blur-xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Real-time EMG Data</h2>
                    <button
                      onClick={() => {
                        if (isChartPaused) {
                          // Restart: clear chart and resume
                          setChartData([]);
                          moveMarkersRef.current = [];
                          setMoveMarkers([]);
                          lastVoltageRef.current = null;
                          setIsChartPaused(false);
                          isChartPausedRef.current = false;
                        } else {
                          // Pause: stop updating chart
                          setIsChartPaused(true);
                          isChartPausedRef.current = true;
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isChartPaused
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      }`}
                    >
                      {isChartPaused ? 'Restart' : 'Pause'}
                    </button>
                  </div>
                  <EMGChart 
                    data={chartData} 
                    isConnected={isMyoWareConnected}
                    moveMarkers={moveMarkers}
                    sessionStartTime={sessionStartTime}
                    onReset={() => {
                      // Clear the chart data when reset is clicked
                      setChartData([]);
                      moveMarkersRef.current = [];
                      setMoveMarkers([]);
                      lastVoltageRef.current = null;
                      setIsChartPaused(false); // Also resume if paused
                      isChartPausedRef.current = false;
                    }}
                  />
                  {/* Mark Move Event and End Move Event buttons - only show when recording */}
                  {isRecordingSession && (
                    <div className="mt-3 flex justify-center gap-3">
                      <button
                        onClick={handleMoveRequest}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg"
                      >
                        Mark Move Event
                      </button>
                      <button
                        onClick={handleMoveEnd}
                        className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
                      >
                        End Move Event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* MyoWare Client */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <MyoWareClient 
                onDataReceived={handleMyoWareData}
                onConnectionChange={handleMyoWareConnection}
                deviceConnected={isMyoWareConnected}
              />
              
              {/* Device Help */}
              {/* Device Help */}
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Device Connection Help</h3>
                <div className="text-xs text-gray-400 space-y-1 mb-3">
                  <p>• Power on the MyoWare device</p>
                  <p>• Ensure it is connected to the same WiFi network</p>
                  <p>• The device must POST to /api/emg/ws with type "heartbeat" and "emg_data"</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      // Test the endpoint
                      const testResponse = await fetch('/api/emg/ws', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'test',
                          message: 'Connection test from browser',
                          timestamp: Date.now()
                        })
                      });
                      
                      const testResult = await testResponse.json();
                      alert(`Connection Test:\nStatus: ${testResponse.ok ? '✅ Success' : '❌ Failed'}\nResponse: ${JSON.stringify(testResult, null, 2)}`);
                    } catch (error) {
                      alert(`Connection Test Failed:\n${error instanceof Error ? error.message : String(error)}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-500/20 text-blue-200 rounded text-xs hover:bg-blue-500/30 transition-all"
                >
                  🔍 Test Connection
                </button>
                <div className="mt-3 text-xs text-gray-500 space-y-2">
                  <div>
                    <p><strong>Expected Device URL:</strong></p>
                    <p className="font-mono break-all">http://{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:{typeof window !== 'undefined' ? window.location.port || '3000' : '3000'}/api/emg/ws</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p><strong>💡 No Arduino Changes Needed!</strong></p>
                    <p className="text-xs text-gray-400 mb-2">
                      Use the standalone EMG server that runs on port 3001 (where your Arduino already sends data):
                    </p>
                    <div className="bg-gray-900 p-2 rounded text-[10px] font-mono text-green-300 mb-2">
                      npm run emg-server
                    </div>
                    <p className="text-xs text-gray-400">
                      The server will forward data to Next.js automatically. See <code className="text-blue-300">MYOWARE_CONNECTION_SETUP.md</code> for details.
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p><strong>Troubleshooting Steps:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 mt-1">
                      <li>Start the EMG server: <code className="text-blue-300">npm run emg-server</code></li>
                      <li>Check device is powered on</li>
                      <li>Verify WiFi SSID matches your network</li>
                      <li>Check Serial Monitor for connection errors</li>
                      <li>Ensure device sends "heartbeat" every 5 seconds</li>
                    </ol>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p><strong>Required Data Format:</strong></p>
                    <pre className="text-[10px] bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
{`{
  "type": "emg_data",
  "timestamp": 1234567890,
  "muscleActivity": 512,
  "muscleActivityProcessed": 50.0
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EMG Visualization */}
          <div className="xl:col-span-2">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-blue-500/10 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">EMG Data Visualization</h2>
                  
                  {/* Recording Status */}
                  {isRecordingSession && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-300">
                          Recording: {formatTime(recordingElapsedTime)} ({recordedSessionDataRef.current.length} samples)
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {recordingName}
                      </span>
                    </div>
                  )}

                  {/* Export/Save Controls (visible when data exists and not recording) */}
                  {recordedSessionDataRef.current.length > 0 && !isRecordingSession && (
                    <div className="flex gap-2">
                      <button
                        onClick={saveRecordingToSupabase}
                        disabled={saveStatus === 'saving' || saveStatus === 'success'}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          saveStatus === 'success' 
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved ✓' : 'Save to Cloud'}
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                      >
                        Export CSV
                      </button>
                    </div>
                  )}

                  {currentWorkout && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {formatTime(workoutTime)} / {formatTime(currentWorkout.duration)}
                      </div>
                      <div className="text-sm text-gray-300">{currentWorkout.name}</div>
                    </div>
                  )}
                </div>

                {/* Real-time EMG Data */}
                {!isMyoWareConnected ? (
                  <div className="mb-6 p-6 rounded-lg bg-gray-800 border border-gray-700">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🔌</div>
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No MyoWare Device Connected</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Connect your MyoWare 2.0 device to start monitoring muscle activity
                      </p>
                      <div className="text-left text-xs text-gray-400 space-y-2 mb-4 p-4 bg-gray-900/50 rounded-lg">
                        <p className="font-semibold text-yellow-400 mb-2">⚠️ Troubleshooting Steps:</p>
                        <p>1. <strong>Start the EMG Server:</strong> Open a new terminal and run:</p>
                        <code className="block bg-gray-800 p-2 rounded mt-1 text-cyan-300">npm run emg-server</code>
                        <p className="mt-2">2. <strong>Or start both servers together:</strong></p>
                        <code className="block bg-gray-800 p-2 rounded mt-1 text-cyan-300">npm run dev:all</code>
                        <p className="mt-2">3. Make sure your MyoWare device is:</p>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                          <li>Powered on</li>
                          <li>Connected to WiFi</li>
                          <li>Configured to send data to <code className="text-cyan-300">http://localhost:3001/api/emg/ws</code></li>
                        </ul>
                        <p className="mt-2">4. Check the browser console (F12) for connection status messages</p>
                      </div>
                    </div>
                  </div>
                ) : currentData && (
                  <div className="mb-4">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-white">MyoWare 2.0 Sensor Data</h3>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isMyoWareConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                          <span className={`text-sm ${isMyoWareConnected ? 'text-green-200' : 'text-red-200'}`}>
                            {isMyoWareConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                      {isCalibrating && (
                        <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30 mb-4">
                          <p className="text-orange-200 text-sm">
                            🔧 Calibrating sensor... Please contract and relax your muscles for 5 seconds.
                          </p>
                        </div>
                      )}
                      {!isMyoWareConnected && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 mb-4">
                          <p className="text-red-200 text-sm">
                            ⚠️ MyoWare sensor disconnected. Turn on the sensor to resume data collection.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Raw MyoWare 2.0 Data */}
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-lg font-medium text-white mb-3">Raw Sensor Data</div>
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                          {currentData.muscleActivity}
                        </div>
                        <div className="text-sm text-gray-400 mb-3">Analog Value (0-1023)</div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-cyan-500 h-3 rounded-full transition-all duration-200"
                            style={{ width: `${Math.min((currentData.muscleActivity / 1023) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Voltage: {currentData.voltage !== undefined 
                            ? currentData.voltage.toFixed(2) 
                            : calculateVoltage(currentData.muscleActivity).toFixed(2)
                          }V
                          {currentData.voltage !== undefined && currentData.voltage > 2.9 && (
                            <span className="ml-2 text-yellow-400 text-xs">⚠️ High - Check sensor</span>
                          )}
                        </div>
                        {currentData.muscleActivity >= 4000 && (
                          <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-200">
                            ⚠️ Sensor reading max value ({currentData.muscleActivity}) - Wireless shield sensor may be disconnected!
                          </div>
                        )}
                      </div>
                      
                      {/* Processed Percentage */}
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-lg font-medium text-white mb-3">Muscle Activation</div>
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {currentData.muscleActivityProcessed.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400 mb-3">Processed Percentage</div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-200"
                            style={{ width: `${Math.min(currentData.muscleActivityProcessed, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Range: {calibrationData.muscleActivity?.min || 400}-{calibrationData.muscleActivity?.max || 600}
                        </div>
                      </div>
                    </div>

                  {/* Live Metrics Summary */}
                  <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Live Sensor Snapshot</h3>
                        <p className="text-xs text-gray-300">
                          Updates automatically while the MyoWare sensor is streaming data.
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {liveMetrics.sampleCount > 0
                          ? `Window: last ${liveMetrics.sampleCount} samples`
                          : 'Waiting for live samples...'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-inner">
                        <h4 className="text-sm font-semibold text-white mb-1">Average Activation</h4>
                        <div className="text-2xl font-bold text-blue-300 mb-2">
                          {formatPercent(liveMetrics.averageActivation)}
                        </div>
                        <p className="text-xs text-gray-300">
                          Typical muscle effort compared to your calibrated rest and max values.
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-inner">
                        <h4 className="text-sm font-semibold text-white mb-1">Peak Activation</h4>
                        <div className="text-2xl font-bold text-fuchsia-300 mb-2">
                          {formatPercent(liveMetrics.peakActivation)}
                        </div>
                        <p className="text-xs text-gray-300">
                          Highest activation detected in the current window.
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-inner">
                        <h4 className="text-sm font-semibold text-white mb-1">Activation Steadiness</h4>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-emerald-300">
                            {formatVariability(liveMetrics.variability)}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${variabilityStatus.tone}`}
                          >
                            {variabilityStatus.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300">
                          Lower values mean steadier repetitions; higher values can signal fatigue.
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-inner">
                        <h4 className="text-sm font-semibold text-white mb-1">Signal Quality (SNR)</h4>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-cyan-300">
                            {formatSnr(liveMetrics.snr)}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${snrStatus.tone}`}
                          >
                            {snrStatus.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300">
                          Higher ratios mean clean sensor contact; if low, reseat the pads.
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                )}

                {/* EMG Metrics */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowMetrics((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                    aria-expanded={showMetrics}
                    aria-controls="emg-metrics-panel"
                  >
                    <div>
                      <h3 className="font-medium text-white">
                        EMG Metrics to Track
                      </h3>
                      <p className="text-xs text-gray-300">
                        Learn how the live numbers above are calculated so caregivers and clinicians can act quickly.
                      </p>
                    </div>
                    <span className="text-lg text-gray-200">
                      {showMetrics ? '−' : '+'}
                    </span>
                  </button>
                  {showMetrics && (
                    <div
                      id="emg-metrics-panel"
                      className="mt-4 space-y-3"
                    >
                      {EMG_METRICS.map((item) => (
                        <div
                          key={item.metric}
                          className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-inner"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                            <h4 className="text-base font-semibold text-white">
                              {item.metric}
                            </h4>
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-gray-200">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200 mb-2">
                            <span className="font-medium text-white">Definition:</span> {item.definition}
                          </p>
                          <p className="text-sm text-gray-200">
                            <span className="font-medium text-white">Purpose:</span> {item.purpose}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workout Instructions */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white mb-3">
                    {currentWorkout ? 'Exercise Instructions' : 'Workout Instructions'}
                  </h3>
                  <ul className="space-y-2">
                    {(currentWorkout || WORKOUT_ROUTINES[currentWorkoutIndex]).instructions.map((instruction, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start">
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                  {!currentWorkout && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-blue-200">
                        💡 Use arrow keys to navigate between workouts, Enter to start, or click the buttons above.
                      </p>
                    </div>
                  )}
                </div>

                {/* Workout Controls */}
                {currentWorkout && (
                  <div className="flex gap-3">
                    <button
                      onClick={stopWorkout}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                    >
                      Stop Workout
                    </button>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-300">
                        {isRecording ? 'Recording' : 'Not Recording'}
        </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workout History */}
        {workoutHistory.length > 0 && (
          <div className="mt-6">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-4">Workout History</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workoutHistory.slice(0, 6).map((session) => (
                    <div key={session.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-medium text-white text-sm">{session.exercise.name}</h3>
                        <p className="text-xs text-gray-300">
                          {formatTime(session.duration)} • {session.dataPoints} points
                        </p>
                        <p className="text-xs text-gray-400">
                          Avg: {session.avgMuscleActivation.toFixed(1)}%
                        </p>
                        <div className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-6 py-3 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-base font-medium">Return to Dashboard</span>
              <span className="text-lg opacity-60 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


