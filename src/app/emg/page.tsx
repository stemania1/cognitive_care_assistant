'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";

interface EMGData {
  timestamp: number;
  leftBicep: number;
  rightBicep: number;
  leftTricep: number;
  rightTricep: number;
  leftForearm: number;
  rightForearm: number;
  leftQuad: number;
  rightQuad: number;
  leftHamstring: number;
  rightHamstring: number;
  leftCalf: number;
  rightCalf: number;
}

interface WorkoutExercise {
  id: string;
  name: string;
  duration: number; // in seconds
  targetMuscles: string[];
  description: string;
  instructions: string[];
}

const WORKOUT_ROUTINES: WorkoutExercise[] = [
  {
    id: 'bicep_curls',
    name: 'Bicep Curls',
    duration: 30,
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Classic bicep strengthening exercise',
    instructions: [
      'Hold weights with arms at sides',
      'Slowly curl weights up to shoulders',
      'Squeeze biceps at the top',
      'Lower weights slowly and controlled'
    ]
  },
  {
    id: 'tricep_dips',
    name: 'Tricep Dips',
    duration: 30,
    targetMuscles: ['leftTricep', 'rightTricep'],
    description: 'Target tricep muscles for arm strength',
    instructions: [
      'Sit on edge of chair or bench',
      'Place hands beside hips, fingers forward',
      'Lower body by bending elbows',
      'Push back up to starting position'
    ]
  },
  {
    id: 'squats',
    name: 'Squats',
    duration: 45,
    targetMuscles: ['leftQuad', 'rightQuad', 'leftHamstring', 'rightHamstring'],
    description: 'Full leg workout targeting quads and hamstrings',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower body as if sitting back in chair',
      'Keep knees behind toes',
      'Return to standing position'
    ]
  },
  {
    id: 'calf_raises',
    name: 'Calf Raises',
    duration: 30,
    targetMuscles: ['leftCalf', 'rightCalf'],
    description: 'Strengthen calf muscles',
    instructions: [
      'Stand with feet hip-width apart',
      'Rise up onto balls of feet',
      'Hold for a moment at the top',
      'Lower heels slowly to ground'
    ]
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate EMG data generation
  const generateEMGData = (): EMGData => {
    const now = Date.now();
    return {
      timestamp: now,
      leftBicep: Math.random() * 100,
      rightBicep: Math.random() * 100,
      leftTricep: Math.random() * 100,
      rightTricep: Math.random() * 100,
      leftForearm: Math.random() * 100,
      rightForearm: Math.random() * 100,
      leftQuad: Math.random() * 100,
      rightQuad: Math.random() * 100,
      leftHamstring: Math.random() * 100,
      rightHamstring: Math.random() * 100,
      leftCalf: Math.random() * 100,
      rightCalf: Math.random() * 100,
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

  // Start workout
  const startWorkout = (exercise: WorkoutExercise) => {
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

  // Calculate average muscle activation
  const calculateAverageActivation = () => {
    if (emgData.length === 0) return {};
    
    const muscles = ['leftBicep', 'rightBicep', 'leftTricep', 'rightTricep', 
                    'leftForearm', 'rightForearm', 'leftQuad', 'rightQuad', 
                    'leftHamstring', 'rightHamstring', 'leftCalf', 'rightCalf'];
    
    const averages: { [key: string]: number } = {};
    
    muscles.forEach(muscle => {
      const sum = emgData.reduce((acc, data) => acc + (data as any)[muscle], 0);
      averages[muscle] = sum / emgData.length;
    });
    
    return averages;
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
          
          {/* Connection Controls */}
          <div className="flex gap-4">
            {!isConnected ? (
              <button
                onClick={connectEMG}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Connect EMG Sensors
              </button>
            ) : (
              <button
                onClick={disconnectEMG}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
              >
                Disconnect EMG
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workout Routines */}
          <div className="lg:col-span-1">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-6">Workout Routines</h2>
                <div className="space-y-4">
                  {WORKOUT_ROUTINES.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors duration-200"
                    >
                      <h3 className="font-medium text-white mb-2">{exercise.name}</h3>
                      <p className="text-sm text-gray-300 mb-3">{exercise.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {exercise.duration}s • {exercise.targetMuscles.length} muscles
                        </span>
                        <button
                          onClick={() => startWorkout(exercise)}
                          disabled={!isConnected || currentWorkout !== null}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Start
                        </button>
                      </div>
                    </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(currentData).filter(([key]) => key !== 'timestamp').map(([muscle, value]) => (
                        <div key={muscle} className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1 capitalize">
                            {muscle.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {value.toFixed(1)}
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-200"
                              style={{ width: `${Math.min(value, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workout Instructions */}
                {currentWorkout && (
                  <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="font-medium text-white mb-3">Exercise Instructions</h3>
                    <ul className="space-y-2">
                      {currentWorkout.instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start">
                          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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


