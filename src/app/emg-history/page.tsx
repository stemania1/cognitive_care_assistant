"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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

interface EMGReading {
  timestamp: number;
  muscleActivity: number;
  muscleActivityProcessed: number;
  voltage?: number;
}

interface EMGSession {
  id: string;
  user_id: string;
  session_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  readings: EMGReading[] | null;
  average_voltage: number | null;
  max_voltage: number | null;
  created_at: string;
}

export default function EMGHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<EMGSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<EMGSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState(false);

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
    setSelectedSession(session);
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

  const exportToCSV = (session: EMGSession) => {
    if (!session.readings || session.readings.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Timestamp', 'Date/Time', 'Voltage (V)', 'Muscle Activity (Raw)', 'Muscle Activity (%)'];
    const rows = session.readings.map(reading => [
      reading.timestamp,
      new Date(reading.timestamp).toISOString(),
      reading.voltage?.toFixed(3) || '',
      reading.muscleActivity,
      reading.muscleActivityProcessed.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

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

  const getChartData = (session: EMGSession) => {
    if (!session.readings || session.readings.length === 0) {
      return null;
    }

    try {
      const readings = session.readings.map(reading => {
        let timestamp: number;
        if (typeof reading.timestamp === 'number') {
          timestamp = reading.timestamp;
        } else if (typeof reading.timestamp === 'string') {
          const parsed = new Date(reading.timestamp).getTime();
          timestamp = isNaN(parsed) ? Date.now() : parsed;
        } else {
          timestamp = Date.now();
        }

        return {
          ...reading,
          timestamp,
        };
      });

      const baseTime = readings[0]?.timestamp ?? new Date(session.started_at).getTime();
      const labels = readings.map((reading) => {
        const seconds = Math.floor((reading.timestamp - baseTime) / 1000);
        return seconds;
      });

      const voltages = readings.map(r => r.voltage || 0);
      const maxVoltage = Math.max(...voltages, 1.0);

      return {
        labels,
        datasets: [
          {
            label: 'Voltage (V)',
            data: voltages,
            borderColor: 'rgb(251, 146, 60)',
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 1,
            pointHoverRadius: 4,
          },
        ],
      };
    } catch (error) {
      console.error('Error generating chart data:', error);
      return null;
    }
  };

  const getChartOptions = (session: EMGSession) => {
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

      const voltages = session.readings?.map(r => r.voltage || 0) || [];
      const maxVoltage = Math.max(...voltages, 1.0);

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
            text: `EMG Session: ${session.session_name} (Started: ${startTimeStr})`,
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
            min: 0,
            max: Math.max(maxVoltage * 1.1, 1.0),
          },
        },
      };
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
            <h2 className="text-2xl font-semibold mb-4">Sessions ({sessions.length})</h2>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No EMG sessions recorded yet.</p>
                <Link href="/emg" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
                  Go to EMG page to record a session
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedSession?.id === session.id
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
                ))}
              </div>
            )}
          </div>

          {/* Session Details */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
            {selectedSession ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">Session Details</h2>
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
                {selectedSession.readings && selectedSession.readings.length > 0 && (
                  <div className="h-96">
                    <Line data={getChartData(selectedSession)!} options={getChartOptions(selectedSession)} />
                  </div>
                )}
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

