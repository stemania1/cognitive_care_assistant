"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThermalVisualization from "../components/ThermalVisualization";

interface ThermalData {
  type: string;
  timestamp: number;
  thermal_data: number[][];
  sensor_info: any;
  grid_size: { width: number; height: number };
}

export default function SleepBehaviors() {
  const [isThermalActive, setIsThermalActive] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(22.5);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [thermalData, setThermalData] = useState<ThermalData | null>(null);
  const [sessionData, setSessionData] = useState<ThermalData[]>([]);

  // Handle real thermal data from sensor
  const handleThermalDataReceived = (data: ThermalData) => {
    setThermalData(data);
    
    // Update current temperature (average of all pixels)
    if (data.thermal_data && data.thermal_data.length > 0) {
      const allTemps = data.thermal_data.flat();
      const avgTemp = allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length;
      setCurrentTemp(avgTemp);
    }
    
    // Store session data if recording
    if (isRecording) {
      setSessionData(prev => [...prev, data]);
    }
  };

  // Session timer
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleThermal = () => {
    setIsThermalActive(!isThermalActive);
    if (!isThermalActive) {
      setCurrentTemp(22.5);
    }
  };

  const toggleRecording = () => {
    if (isThermalActive) {
      setIsRecording(!isRecording);
      if (!isRecording) {
        setSessionDuration(0);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-20">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-6 mb-10">
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
                 Sleep Behaviors
               </h1>
               <p className="text-sm text-gray-300">
                 Monitor thermal patterns and sleep analysis
               </p>
             </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Thermal Sensor Monitor */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-blue-500/10 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Thermal Sensor Monitor</h2>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isThermalActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-sm">{isThermalActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>

                {/* Thermal Sensor Display */}
                <div className="relative aspect-video rounded-xl border border-white/20 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden mb-6">
                  {isThermalActive ? (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <ThermalVisualization 
                        isActive={isThermalActive}
                        onDataReceived={handleThermalDataReceived}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-400">Sensor Offline</p>
                        <p className="text-xs text-gray-500 mt-2">Click "Start Sensor" to connect to thermal sensor</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={toggleThermal}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isThermalActive
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    }`}
                  >
                    {isThermalActive ? 'Stop Sensor' : 'Start Sensor'}
                  </button>
                  
                  <button
                    onClick={toggleRecording}
                    disabled={!isThermalActive}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isRecording
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Temperature Display */}
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-orange-500/10 via-red-500/5 to-pink-500/10 blur-xl" />
              <div className="relative text-center">
                <h3 className="text-lg font-medium mb-4">Current Temperature</h3>
                <div className="text-4xl font-bold text-orange-400 mb-2">
                  {currentTemp.toFixed(1)}°C
                </div>
                <p className="text-sm text-gray-300">Room Temperature</p>
              </div>
            </div>

            {/* Recording Status */}
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative text-center">
                <h3 className="text-lg font-medium mb-4">Recording Status</h3>
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {isRecording ? formatTime(sessionDuration) : '00:00'}
                </div>
                <p className="text-sm text-gray-300">
                  {isRecording ? 'Session Active' : 'Not Recording'}
                </p>
              </div>
            </div>

                         {/* Quick Actions */}
             <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
               <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-cyan-500/10 blur-xl" />
               <div className="relative">
                 <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                 <div className="space-y-3">
                   <Link
                     href="/sensors"
                     className="block w-full py-2 px-4 rounded-lg border border-white/20 bg-white/10 text-white text-sm hover:bg-white/15 transition-colors duration-200 text-center"
                   >
                     View Sensors
                   </Link>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Session Data Display */}
        {isRecording && sessionData.length > 0 && (
          <div className="mb-8">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-4">Recording Session Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Session Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Data Points:</span>
                        <span className="text-white">{sessionData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Duration:</span>
                        <span className="text-white">{formatTime(sessionDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Avg Temperature:</span>
                        <span className="text-white">{currentTemp.toFixed(1)}°C</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Temperature Range</h3>
                    <div className="space-y-2 text-sm">
                      {thermalData && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Min:</span>
                            <span className="text-blue-400">
                              {Math.min(...thermalData.thermal_data.flat()).toFixed(1)}°C
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Max:</span>
                            <span className="text-red-400">
                              {Math.max(...thermalData.thermal_data.flat()).toFixed(1)}°C
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-5 py-6 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Dashboard</h3>
                <p className="text-sm text-gray-300">Return to main dashboard</p>
              </div>
              <span className="text-2xl opacity-60 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/sensors"
            className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-5 py-6 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Sensors</h3>
                <p className="text-sm text-gray-300">View all sensor data</p>
              </div>
              <span className="text-2xl opacity-60 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>
       </main>
     </div>
   );
}

