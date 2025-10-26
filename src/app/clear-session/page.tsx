'use client';

import { useState } from 'react';
import { clearAuthSession } from '@/lib/supabaseClient';

export default function ClearSessionPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');

  const handleClearSession = async () => {
    setIsClearing(true);
    setMessage('Clearing session...');
    
    try {
      const success = await clearAuthSession();
      if (success) {
        setMessage('Session cleared successfully! Redirecting to sign-in...');
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else {
        setMessage('Failed to clear session. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing session:', error);
      setMessage('Error clearing session. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Clear Authentication Session
          </h1>
          
          <p className="text-gray-300 mb-6 text-center">
            This will clear all authentication data and redirect you to the sign-in page.
            Use this if you're experiencing refresh token errors.
          </p>
          
          <button
            onClick={handleClearSession}
            disabled={isClearing}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Clearing...' : 'Clear Session'}
          </button>
          
          {message && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm text-center">{message}</p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <a 
              href="/signin" 
              className="text-cyan-400 hover:text-cyan-300 text-sm underline"
            >
              Go to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
