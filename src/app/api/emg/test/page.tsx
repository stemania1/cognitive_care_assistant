'use client';

import { useEffect, useState } from 'react';

export default function EMGTestPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:3000/api/emg/ws');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setMessages(prev => [...prev, 'Connected to WebSocket']);
    };

    websocket.onmessage = (event) => {
      console.log('Received:', event.data);
      setMessages(prev => [...prev, `Received: ${event.data}`]);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => [...prev, `Error: ${error}`]);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setMessages(prev => [...prev, 'Disconnected from WebSocket']);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const sendTestMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'test',
        message: 'Hello from browser',
        timestamp: Date.now()
      };
      ws.send(JSON.stringify(message));
      setMessages(prev => [...prev, `Sent: ${JSON.stringify(message)}`]);
    }
  };

  const sendStartCommand = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'start',
        timestamp: Date.now()
      };
      ws.send(JSON.stringify(message));
      setMessages(prev => [...prev, `Sent: ${JSON.stringify(message)}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">EMG WebSocket Test</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-white">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={sendTestMessage}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Send Test Message
            </button>
            <button
              onClick={sendStartCommand}
              disabled={!isConnected}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Send START Command
            </button>
          </div>

          <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2">Messages:</h3>
            <div className="space-y-1">
              {messages.map((msg, idx) => (
                <div key={idx} className="text-sm text-gray-300 font-mono">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

