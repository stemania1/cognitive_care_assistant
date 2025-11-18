"use client";

import { useEffect, useState } from "react";
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

interface ThermalSample {
  sampleIndex: number;
  timestamp: number;
  heatmapVariance: number | null;
  patternStability: number | null;
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
  created_at: string;
}

export default function ThermalHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ThermalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ThermalSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  useEffect(() => {
    async function initializeUser() {
      try {
        const guestStatus = await isGuestUser();
        if (guestStatus) {
          const guestUserId = getGuestUserId();
          setUserId(guestUserId);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            setUserId(user.id);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
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
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/thermal-sessions?userId=${userId}&limit=100`);
      const result = await response.json();

      if (response.ok && result.data) {
        setSessions(result.data);
      } else {
        console.error('Error loading sessions:', result.error);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
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

    return {
      labels,
      datasets: [
        {
          label: 'Heatmap Variance',
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
          label: 'Pattern Stability (%)',
          data: samples.map(s => s.patternStability ?? null),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          yAxisID: 'y1',
        },
      ],
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
        text: `Thermal Sample Data (Started: ${startTimeStr})`,
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
            if (label.includes('Stability')) {
              return `${label}: ${value !== null ? value.toFixed(1) + '%' : 'N/A'}`;
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
          text: 'Heatmap Variance',
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
          text: 'Pattern Stability (%)',
          color: 'rgb(168, 85, 247)',
        },
        ticks: {
          color: 'rgb(168, 85, 247)',
        },
        grid: {
          drawOnChartArea: false,
        },
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
            text: 'Thermal Sample Data',
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

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No thermal sessions found.</p>
            <Link
              href="/sleepbehaviors"
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              Start a Recording
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold mb-4">All Sessions ({sessions.length})</h2>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSession?.id === session.id
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {session.session_number !== null && (
                            <span className="text-xs font-medium text-gray-400">#{session.session_number}</span>
                          )}
                          <h3 className="font-medium text-cyan-200">Subject: {session.subject_identifier}</h3>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(session.started_at)}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        disabled={deletingSession === session.id}
                        className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                      >
                        {deletingSession === session.id ? '...' : '×'}
                      </button>
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
                    </div>
                  </div>

                  {/* Chart */}
                  {selectedSession.samples && selectedSession.samples.length > 0 ? (
                    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                          Sample Data Chart ({selectedSession.samples.length} samples)
                        </h3>
                        <button
                          onClick={() => exportToCSV(selectedSession)}
                          className="px-4 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all text-sm text-cyan-200"
                        >
                          Export CSV
                        </button>
                      </div>
                      <div className="h-96">
                        {chartData && selectedSession ? (
                          <Line data={chartData} options={getChartOptions(selectedSession)} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">Unable to generate chart from sample data</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
                      <h3 className="text-xl font-semibold mb-4">Sample Data</h3>
                      <p className="text-gray-400 text-center py-8">No sample data available for this session.</p>
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
