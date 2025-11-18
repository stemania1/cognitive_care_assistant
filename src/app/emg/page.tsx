'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from "next/link";
import MyoWareClient from '../components/MyoWareClient';
import EMGChart from '../components/EMGChart';
import WorkoutVideo from '../components/WorkoutVideo';

interface EMGData {
  timestamp: number;
  // Single MyoWare 2.0 sensor data (0-1023 analog range, 0-5V)
  muscleActivity: number;      // Raw analog value from MyoWare 2.0
  muscleActivityProcessed: number; // Processed muscle activation (0-100%)
}

interface WorkoutExercise {
  id: string;
  name: string;
  duration: number; // in seconds
  targetMuscles: string[];
  description: string;
  instructions: string[];
  myoWareSuitable: boolean; // Whether this workout benefits from MyoWare monitoring
  myoWareReason: string; // Why MyoWare is useful for this workout
  sensorPlacement: string; // Where to place the MyoWare sensor
  videoUrl?: string; // Optional demonstration video URL
}

interface EMGMetric {
  metric: string;
  type: string;
  definition: string;
  purpose: string;
}

const WORKOUT_ROUTINES: WorkoutExercise[] = [
  {
    id: 'chair_arm_swings',
    name: 'Chair & Arm Swings',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Builds rhythm and coordination with seated marching and arm movements',
    instructions: [
      'Sit tall with good posture',
      'March in place while seated',
      'Swing arms naturally with marching',
      'Add gentle arm circles forward',
      'Switch to backward arm circles',
      'Keep rhythm steady and comfortable'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track arm swing intensity and rhythm consistency',
    sensorPlacement: 'Place on upper arm (bicep) to monitor arm movement patterns',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  },
  {
    id: 'balance_posture',
    name: 'Balance & Posture (With Support)',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Standing exercises using a chair for support and balance',
    instructions: [
      'Stand behind chair, holding back for support',
      'Rise up onto toes, hold for 3 seconds',
      'Lower heels slowly to ground',
      'Lift toes up, hold for 3 seconds',
      'Step to the side, return to center',
      'Repeat sequence 3-5 times'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on leg and balance movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on leg exercises',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  },
  {
    id: 'finger_wrist_hand',
    name: 'Finger, Wrist & Hand Movements',
    duration: 180, // 3 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Fine motor skill workout for dexterity and coordination',
    instructions: [
      'Sit with arms resting on thighs',
      'Tap each finger to thumb individually',
      'Roll wrists in circular motions',
      'Squeeze imaginary soft ball',
      'Open and close hands slowly',
      'Repeat each movement 10 times'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor forearm muscle activation during finger and wrist movements',
    sensorPlacement: 'Place on forearm to track fine motor muscle activity',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  },
  {
    id: 'leg_foot_movement',
    name: 'Leg & Foot Movement',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Improves circulation with seated leg and foot exercises',
    instructions: [
      'Sit with feet flat on floor',
      'Tap toes up and down alternately',
      'Extend one leg at a time, hold 3 seconds',
      'Make ankle circles clockwise and counterclockwise',
      'Seated kicks - lift knee up gently',
      'Repeat each movement 10 times per leg'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on leg movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on leg exercises'
  },
  {
    id: 'yoga_flow',
    name: 'Yoga Flow',
    duration: 360, // 6 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Gentle, flowing seated poses for flexibility and relaxation',
    instructions: [
      'Sit tall with spine straight',
      'Reach right arm up and over to left side',
      'Hold stretch for 3 breaths',
      'Return to center, repeat on left side',
      'Interlace fingers, reach arms overhead',
      'Gently twist spine left and right'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track arm muscle engagement during stretches and poses',
    sensorPlacement: 'Place on upper arm (bicep) to monitor stretch intensity'
  },
  {
    id: 'dance_clap_music',
    name: 'Dance and Clap to Music',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Pick a familiar, happy song and move to the rhythm',
    instructions: [
      'Choose a favorite upbeat song',
      'Clap hands to the beat',
      'Sway arms side to side',
      'Tap feet to the rhythm',
      'Add gentle head movements',
      'Enjoy the joyful movement!'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor arm movement intensity and rhythm consistency',
    sensorPlacement: 'Place on upper arm (bicep) to track dance movements'
  },
  {
    id: 'hoop_ball_play',
    name: 'Hoop & Ball Play',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Seated balloon toss or light ball catch for coordination',
    instructions: [
      'Sit with good posture',
      'Hold balloon or light ball',
      'Toss gently up and catch',
      'Pass ball from hand to hand',
      'Try gentle overhead passes',
      'Keep movements smooth and controlled'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track arm coordination and ball handling movements',
    sensorPlacement: 'Place on upper arm (bicep) to monitor ball play movements'
  },
  {
    id: 'lifting_weights',
    name: 'Lifting Weights',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Light arm exercises using water bottles or soup cans',
    instructions: [
      'Hold water bottles or soup cans',
      'Curl arms up to shoulders slowly',
      'Lower weights with control',
      'Raise arms out to sides',
      'Press weights overhead gently',
      'Repeat each movement 8-10 times'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Perfect for monitoring muscle activation during weight lifting',
    sensorPlacement: 'Place on upper arm (bicep) to track lifting intensity'
  },
  {
    id: 'visual_memory_game',
    name: 'Visual & Memory Movement Game',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Touch objects and match movements to memory cues',
    instructions: [
      'Name a color or object nearby',
      'Touch the object when named',
      'Match movements to cues',
      'Touch knees when hearing "apple"',
      'Touch head when hearing "hat"',
      'Keep movements fun and engaging'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor arm movement patterns during memory-based exercises',
    sensorPlacement: 'Place on upper arm (bicep) to track reaching movements'
  },
  {
    id: 'neck_gentle_stretch',
    name: 'Neck Gentle Stretch',
    duration: 180, // 3 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Easy movements to reduce tension in neck and shoulders',
    instructions: [
      'Sit with spine straight',
      'Gently tilt head to right, hold 3 breaths',
      'Return to center, tilt to left',
      'Roll shoulders backward slowly',
      'Gently twist neck left and right',
      'End with gentle head nods'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on neck and shoulder movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on neck and shoulder exercises'
  },
  {
    id: 'mini_tai_chi',
    name: 'Mini Tai Chi-Inspired Moves',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Slow, flowing movements inspired by Tai Chi',
    instructions: [
      'Sit or stand with feet shoulder-width apart',
      'Wave hands like clouds slowly',
      'Paint the sky with arm movements',
      'Scoop the air with cupped hands',
      'Move in slow, flowing motions',
      'Focus on smooth, continuous movement'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track smooth, flowing arm movements and muscle control',
    sensorPlacement: 'Place on upper arm (bicep) to monitor Tai Chi movements'
  },
  {
    id: 'foot_strength_balance',
    name: 'Foot Strength & Balance',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Standing exercises near a counter for support',
    instructions: [
      'Stand near counter for support',
      'Walk heel-to-toe slowly',
      'Tap toes while holding counter',
      'Do mini squats with support',
      'Stand on one foot briefly',
      'Always use counter for safety'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on leg and balance movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on leg exercises'
  },
  {
    id: 'mindful_breathing',
    name: 'Mindful Breathing & Movement',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Sit quietly and move arms with breaths for relaxation',
    instructions: [
      'Sit quietly with eyes closed',
      'Move arms up with each inhale',
      'Lower arms with each exhale',
      'Relax hands and face muscles',
      'Focus on slow, deep breathing',
      'End with 3 deep inhales and exhales'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor gentle arm movements synchronized with breathing',
    sensorPlacement: 'Place on upper arm (bicep) to track breathing movements'
  },
  {
    id: 'seated_stretch_breathe',
    name: 'Seated Stretch & Breathe',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'A calming routine with deep breaths, shoulder rolls, and gentle seated twists',
    instructions: [
      'Sit comfortably with feet flat on floor',
      'Take 3 deep breaths, inhaling through nose',
      'Roll shoulders backward 5 times',
      'Gently twist torso left, then right',
      'Reach arms overhead and stretch',
      'End with 3 more deep breaths'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor arm muscle activation during overhead reaches and shoulder rolls',
    sensorPlacement: 'Place on upper arm (bicep) to track arm movement intensity',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  }
];

const EMG_METRICS: EMGMetric[] = [
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

export default function EMGPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise | null>(null);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [emgData, setEmgData] = useState<EMGData[]>([]);
  const [chartData, setChartData] = useState<EMGData[]>([]); // Data for chart visualization
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

  // MyoWare 2.0 data processing functions
  const processMyoWareData = (rawValue: number): number => {
    // MyoWare 2.0 outputs 0-1023 analog range (0-5V)
    // Convert to percentage based on calibration data
    const cal = calibrationData['muscleActivity'];
    if (!cal) return 0;
    const range = cal.max - cal.min;
    if (range <= 0) return 0;
    const normalized = Math.max(0, Math.min(100,
      ((rawValue - cal.min) / range) * 100
    ));
    return normalized;
  };

  // Note: Simulation functions removed - only real MyoWare device data is used

  // Handle real MyoWare data
  const handleMyoWareData = (data: EMGData) => {
    setCurrentData(data);
    
    if (isRecording) {
      setEmgData(prev => [...prev, data]);
    }
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
      
      // Update connection status based on RECENT activity only (not historical data)
      // Check if we have recent heartbeat (device sends data every 1 second, so heartbeat should be recent)
      const hasRecentData = (data.data && Array.isArray(data.data) && data.data.length > 0);
      const hasRecentHeartbeat = data.timeSinceLastHeartbeat !== undefined && data.timeSinceLastHeartbeat !== null && data.timeSinceLastHeartbeat < 10000; // 10 seconds - device sends data every 1 second
      const serverSaysConnected = data.isConnected === true; // Explicitly check for true (heartbeat within 30s)
      
      console.log('Connection check:', {
        serverSaysConnected,
        isConnected: data.isConnected,
        dataCount: data.dataCount || 0,
        recentDataCount: data.data?.length || 0,
        hasRecentData,
        hasRecentHeartbeat,
        timeSinceLastHeartbeat: data.timeSinceLastHeartbeat,
        lastHeartbeat: data.lastHeartbeat
      });
      
      // Consider connected ONLY if we have RECENT activity (within 10 seconds):
      // Device sends data every 1 second, so if heartbeat is > 10 seconds old, device is disconnected
      // Note: We DON'T use serverSaysConnected (30s threshold) because it's too lenient
      // Note: We DON'T check dataCount > 0 alone because old data can remain in store after device disconnects
      const shouldBeConnected = hasRecentHeartbeat; // Only recent heartbeat (10s), not server's 30s check
      
      console.log('Connection decision:', {
        shouldBeConnected,
        currentState: isMyoWareConnected,
        willUpdate: shouldBeConnected !== isMyoWareConnected,
        detectionMethod: hasRecentHeartbeat ? 'heartbeat' : 'none'
      });
      
      // Update connection state immediately when we detect connection
      if (shouldBeConnected && !isMyoWareConnected) {
        console.log('✅ MyoWare device CONNECTED - recent heartbeat detected:', {
          hasRecentHeartbeat,
          timeSinceLastHeartbeat: data.timeSinceLastHeartbeat,
          dataCount: data.dataCount || 0,
          dataLength: data.data?.length || 0
        });
        setIsMyoWareConnected(true);
      } else if (!shouldBeConnected && isMyoWareConnected) {
        // Disconnect if heartbeat is stale (no recent activity)
        // Since device sends data every 1 second, if heartbeat is > 10 seconds old, device is disconnected
        console.log('❌ MyoWare device DISCONNECTED - no recent heartbeat (last:', data.timeSinceLastHeartbeat, 'ms ago, threshold: 10000ms)');
        setIsMyoWareConnected(false);
      }
      
      if (data.data && data.data.length > 0) {
        // Get the latest data point
        const latestData = data.data[data.data.length - 1];
        const emgData: EMGData = {
          timestamp: latestData.timestamp,
          muscleActivity: latestData.muscleActivity,
          muscleActivityProcessed: latestData.muscleActivityProcessed
        };
        // Update calibration min/max while calibrating
        if (isCalibrating) {
          if (typeof emgData.muscleActivity === 'number') {
            if (emgData.muscleActivity < calMinRef.current) calMinRef.current = emgData.muscleActivity;
            if (emgData.muscleActivity > calMaxRef.current) calMaxRef.current = emgData.muscleActivity;
          }
        }
        
        console.log('Setting current data:', emgData); // Debug log
        setCurrentData(emgData);
        
        // Always update chart data for real-time visualization
        setChartData(prev => {
          const newData = [...prev, emgData];
          // Keep only last 100 data points for chart performance
          return newData.slice(-100);
        });
        
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
      if (consecutiveFailuresRef.current >= 5) {
        console.log('Too many consecutive failures, temporarily disabling EMG polling');
        setIsMyoWareConnected(false);
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
          console.log('Network error, will retry on next interval');
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

  // Poll for real-time data
  useEffect(() => {
    // Poll immediately on mount and then every 3 seconds
    fetchRealTimeData(); // Initial poll
    
    // Always poll for data to detect device connection/disconnection
    const interval = setInterval(fetchRealTimeData, 3000); // Poll every 3 seconds for device detection
    
    return () => clearInterval(interval);
  }, []); // Run once on mount - fetchRealTimeData is stable and doesn't need to be in deps

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
        const wsResponse = await fetch('/api/emg/ws', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });
        
        if (wsResponse.ok) {
          const wsData = await wsResponse.json();
          console.log('EMG WebSocket server status:', wsData);
          
          // Then check if there's actual EMG data available
          const dataResponse = await fetch('/api/emg/data', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-cache'
          });
          
          if (dataResponse.ok) {
            const dataData = await dataResponse.json();
            console.log('EMG data status:', dataData);
            
            // Use the same connection detection logic as polling - only check RECENT activity (10 seconds)
            const hasRecentHeartbeat = dataData.timeSinceLastHeartbeat !== undefined && dataData.timeSinceLastHeartbeat !== null && dataData.timeSinceLastHeartbeat < 10000; // 10 seconds
            
            const shouldBeConnected = hasRecentHeartbeat; // Only recent heartbeat, not server's 30s check
            
            if (shouldBeConnected) {
              setIsMyoWareConnected(true);
              setUseRealData(true);
              console.log('Auto-connected to MyoWare device - recent heartbeat detected:', {
                hasRecentHeartbeat,
                timeSinceLastHeartbeat: dataData.timeSinceLastHeartbeat,
                dataCount: dataData.dataCount || 0
              });
            } else {
              console.log('EMG server running but no device connected yet:', {
                isConnected: dataData.isConnected,
                dataCount: dataData.dataCount || 0,
                dataLength: dataData.data?.length || 0,
                timeSinceHeartbeat: dataData.timeSinceLastHeartbeat
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
        console.log('MyoWare server not available for auto-connect:', error);
        
        // Handle error with proper typing
        if (error instanceof Error) {
          console.error('Auto-connect error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else {
          console.error('Unknown auto-connect error type:', error);
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

  // Connect to EMG sensors
  const connectEMG = () => {
    // Only allow connection if we have a real MyoWare device
    if (isMyoWareConnected) {
      setIsConnected(true);
    } else {
      console.log('Cannot connect: No MyoWare device detected');
    }
  };

  // Disconnect from EMG sensors
  const disconnectEMG = () => {
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

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">EMG Workout</h1>
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
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {!isMyoWareConnected ? (
              <div className="px-6 py-3 bg-gray-600 text-gray-300 rounded-lg font-medium">
                Waiting for MyoWare Device...
              </div>
            ) : !isConnected ? (
              <button
                onClick={connectEMG}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={disconnectEMG}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                >
                  Stop Recording
                </button>
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
              </>
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
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Device Connection Help</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Power on the MyoWare device</p>
                  <p>• Ensure it is connected to the same WiFi network</p>
                  <p>• The device must POST to /api/emg/ws with type "heartbeat" and "emg_data"</p>
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
                      <div className="text-xs text-gray-500">
                        <p>• Make sure your device is powered on</p>
                        <p>• Check that it's connected to WiFi</p>
                        <p>• Verify the device is sending data to the server</p>
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
                          Voltage: {(currentData.muscleActivity * 5 / 1023).toFixed(2)}V
                        </div>
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

                {/* EMG Chart */}
                <div className="mb-4">
                  <EMGChart 
                    data={isMyoWareConnected ? chartData : []} 
                    isConnected={isMyoWareConnected} 
                  />
                </div>

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


