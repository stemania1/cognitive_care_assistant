'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";

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
}

const WORKOUT_ROUTINES: WorkoutExercise[] = [
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
    sensorPlacement: 'Place on upper arm (bicep) to track arm movement intensity'
  },
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
    sensorPlacement: 'Place on upper arm (bicep) to monitor arm movement patterns'
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
    sensorPlacement: 'Not recommended - focus on leg exercises'
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
    sensorPlacement: 'Place on forearm to track fine motor muscle activity'
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
  }
];

export default function EMGPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutExercise | null>(null);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [emgData, setEmgData] = useState<EMGData[]>([]);
  const [currentData, setCurrentData] = useState<EMGData | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [calibrationData, setCalibrationData] = useState<{ [key: string]: { min: number; max: number } }>({});
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // MyoWare 2.0 data processing functions
  const processMyoWareData = (rawValue: number): number => {
    // MyoWare 2.0 outputs 0-1023 analog range (0-5V)
    // Convert to percentage based on calibration data
    const cal = calibrationData['muscleActivity'];
    if (!cal) return 0;
    
    const normalized = Math.max(0, Math.min(100, 
      ((rawValue - cal.min) / (cal.max - cal.min)) * 100
    ));
    return normalized;
  };

  // Simulate MyoWare 2.0 EMG data generation
  const generateEMGData = (): EMGData => {
    const now = Date.now();
    
    // Generate raw MyoWare 2.0 analog value (0-1023)
    const muscleActivity = Math.floor(Math.random() * 200) + 400; // 400-600 range
    
    // Process raw data to percentage
    const muscleActivityProcessed = processMyoWareData(muscleActivity);

    return {
      timestamp: now,
      muscleActivity,
      muscleActivityProcessed,
    };
  };

  // Start EMG data simulation
  const startEMGSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      const newData = generateEMGData();
      setCurrentData(newData);
      
      if (isRecording) {
        setEmgData(prev => [...prev, newData]);
      }
    }, 100); // 10Hz sampling rate
  };

  // Stop EMG data simulation
  const stopEMGSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Connect to EMG sensors
  const connectEMG = () => {
    setIsConnected(true);
    startEMGSimulation();
  };

  // Disconnect from EMG sensors
  const disconnectEMG = () => {
    setIsConnected(false);
    stopEMGSimulation();
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
  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationData({});
    
    // Initialize calibration data with default range for single sensor
    const defaultCal = {
      muscleActivity: { min: 400, max: 600 } // Default MyoWare 2.0 range
    };
    
    setCalibrationData(defaultCal);
    
    // Auto-calibrate after 5 seconds
    setTimeout(() => {
      setIsCalibrating(false);
    }, 5000);
  };

  const stopCalibration = () => {
    setIsCalibrating(false);
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
      stopEMGSimulation();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">EMG Workout</h1>
              <p className="text-gray-300">Monitor muscle activation during exercises</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-300">
                {isConnected ? 'EMG Connected' : 'EMG Disconnected'}
              </span>
            </div>
          </div>
          
          {/* MyoWare Guidance */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-6">
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
          <div className="flex gap-4 flex-wrap">
            {!isConnected ? (
              <button
                onClick={connectEMG}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Connect MyoWare 2.0 Sensors
              </button>
            ) : (
              <>
                <button
                  onClick={disconnectEMG}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                >
                  Disconnect EMG
                </button>
                <button
                  onClick={isCalibrating ? stopCalibration : startCalibration}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isCalibrating 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  }`}
                >
                  {isCalibrating ? 'Stop Calibration' : 'Calibrate Sensors'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workout Selection */}
          <div className="lg:col-span-1">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-6">Select Workout</h2>
                
                {/* Current Workout Display */}
                <div className="p-6 rounded-lg border border-white/20 bg-white/10 mb-6">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-400 mb-2">
                      Workout {currentWorkoutIndex + 1} of {WORKOUT_ROUTINES.length}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {WORKOUT_ROUTINES[currentWorkoutIndex].name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4">
                      {WORKOUT_ROUTINES[currentWorkoutIndex].description}
                    </p>
                    <div className="text-xs text-gray-400 mb-4">
                      Duration: {formatTime(WORKOUT_ROUTINES[currentWorkoutIndex].duration)}
                    </div>
                    
                    {/* MyoWare Suitability Indicator */}
                    <div className={`p-3 rounded-lg mb-4 ${
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
                  <div className="flex gap-2 mb-4">
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
                    disabled={!isConnected || currentWorkout !== null}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentWorkout ? 'Workout in Progress' : 'Start Workout'}
                  </button>
                </div>
                
                {/* Workout List (Collapsed) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-300">All Workouts:</div>
                    <div className="text-xs text-gray-400">
                      {currentWorkoutIndex + 1}/{WORKOUT_ROUTINES.length}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentWorkoutIndex + 1) / WORKOUT_ROUTINES.length) * 100}%` }}
                    />
                  </div>
                  
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
              </div>
            </div>
          </div>

          {/* EMG Visualization */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-blue-500/10 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
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
                {currentData && (
                  <div className="mb-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-white mb-2">MyoWare 2.0 Sensor Data</h3>
                      {isCalibrating && (
                        <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30 mb-4">
                          <p className="text-orange-200 text-sm">
                            🔧 Calibrating sensor... Please contract and relax your muscles for 5 seconds.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Raw MyoWare 2.0 Data */}
                      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-lg font-medium text-white mb-4">Raw Sensor Data</div>
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                          {currentData.muscleActivity}
                        </div>
                        <div className="text-sm text-gray-400 mb-4">Analog Value (0-1023)</div>
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
                      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-lg font-medium text-white mb-4">Muscle Activation</div>
                        <div className="text-4xl font-bold text-green-400 mb-2">
                          {currentData.muscleActivityProcessed.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400 mb-4">Processed Percentage</div>
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
                  </div>
                )}

                {/* Workout Instructions */}
                <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white mb-3">
                    {currentWorkout ? 'Exercise Instructions' : 'Workout Preview'}
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
                  <div className="flex gap-4">
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
          <div className="mt-8">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-6">Workout History</h2>
                <div className="space-y-4">
                  {workoutHistory.slice(0, 5).map((session) => (
                    <div key={session.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">{session.exercise.name}</h3>
                          <p className="text-sm text-gray-300">
                            {formatTime(session.duration)} • {session.dataPoints} data points
                          </p>
                          <p className="text-xs text-gray-400">
                            Avg Activation: {session.avgMuscleActivation.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {new Date(session.timestamp).toLocaleTimeString()}
                          </div>
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
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-6 py-4 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg font-medium">Return to Dashboard</span>
              <span className="text-xl opacity-60 transition-transform group-hover:translate-x-1">→</span>
            </div>
      </Link>
        </div>
      </div>
    </div>
  );
}


