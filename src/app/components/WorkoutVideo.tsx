'use client';

import { useState, useRef } from 'react';
import { getVideoUrl } from '@/config/video-urls';

interface WorkoutVideoProps {
  videoUrl?: string;
  exerciseId: string;
  exerciseName: string;
  className?: string;
}

export default function WorkoutVideo({ 
  videoUrl, 
  exerciseId, 
  exerciseName, 
  className = "" 
}: WorkoutVideoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get video URL from Supabase or local fallback
  const videoSource = videoUrl || getVideoUrl(exerciseId);

  console.log('WorkoutVideo Debug:', {
    exerciseId,
    exerciseName,
    videoUrl,
    videoSource,
    hasError,
    isTextPlaceholder: videoSource ? isTextPlaceholder(videoSource) : false
  });

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setShowOverlay(false);
  };

  const handlePlay = () => {
    setIsLoading(true);
    setShowOverlay(false);
  };

  const handleVideoClick = async () => {
    setShowOverlay(false);
    setIsLoading(true);
    // Trigger video play
    if (videoRef.current) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.error('Video play failed:', error);
        setIsLoading(false);
        setHasError(true);
      }
    } else {
      console.error('Video ref not found');
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Check if the file is a text placeholder (only for .txt files)
  const isTextPlaceholder = (url: string) => {
    return url.endsWith('.txt') || url.includes('sample-video-placeholder');
  };

  if (!videoSource) {
    return (
      <div className={`bg-gray-800 rounded-lg p-8 text-center ${className}`}>
        <div className="text-gray-400 mb-2">📹</div>
        <p className="text-sm text-gray-300">No demonstration video available</p>
        <p className="text-xs text-gray-500 mt-1">Follow the written instructions below</p>
      </div>
    );
  }

  if (hasError || isTextPlaceholder(videoSource)) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">📹</div>
        <p className="text-sm text-gray-300 mb-2">Video placeholder ready</p>
        <p className="text-xs text-gray-500">Replace with actual MP4 video file</p>
        <div className="mt-3 p-3 bg-gray-700 rounded text-xs text-gray-400">
          <p>To add your video:</p>
          <p>1. Record demonstration</p>
          <p>2. Convert to MP4 (H.264)</p>
          <p>3. Replace this file</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video Element - Always rendered */}
      {(videoSource.startsWith('/videos/') || videoSource.startsWith('https://')) ? (
        <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black">
          <video
            ref={videoRef}
            src={videoSource}
            controls
            width="100%"
            height="200"
            onLoadedData={handleLoad}
            onError={handleError}
            onPlay={handlePlay}
            className="w-full h-48 sm:h-56"
            poster={`/images/workouts/${exerciseId}-thumbnail.jpg`}
            preload="none"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black">
          <iframe
            src={videoSource}
            width="100%"
            height="200"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-48 sm:h-56"
            title={`${exerciseName} demonstration video`}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
            <p className="text-sm text-gray-300">Loading video...</p>
            <p className="text-xs text-gray-500 mt-1">Large file - please wait</p>
          </div>
        </div>
      )}
      
      {/* Play Button Overlay */}
      {!isLoading && !hasError && showOverlay && (
        <div 
          className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10 cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className="text-center">
            <div className="text-4xl text-white mb-2">▶️</div>
            <p className="text-sm text-white">Click to play video</p>
            <p className="text-xs text-gray-300 mt-1">Large file - may take a moment to load</p>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          💡 Watch the demonstration, then follow along with your MyoWare sensor
        </p>
      </div>
    </div>
  );
}
