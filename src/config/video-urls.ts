// Video URLs from Supabase Storage
export const SUPABASE_VIDEO_URLS = {
  'chair_arm_swings': 'https://tyupegrvmyoumevczxnw.supabase.co/storage/v1/object/public/workout-videos/chair_arm_swings.mp4',
  'balance_posture': 'https://tyupegrvmyoumevczxnw.supabase.co/storage/v1/object/public/workout-videos/balance_posture.mp4',
  'finger_wrist_hand': 'https://tyupegrvmyoumevczxnw.supabase.co/storage/v1/object/public/workout-videos/finger_wrist_hand.mp4',
  'seated_stretch_breathe': '' // No video uploaded yet for this exercise
};

// Fallback to local videos for development
export const LOCAL_VIDEO_URLS = {
  'chair_arm_swings': '/videos/workouts/chair_arm_swings.mp4',
  'balance_posture': '/videos/workouts/balance_posture.mp4',
  'finger_wrist_hand': '/videos/workouts/finger_wrist_hand.mp4',
  'seated_stretch_breathe': '/videos/workouts/seated_stretch_breathe.mp4'
};

// Get video URL - always uses Supabase URLs for consistency
export const getVideoUrl = (exerciseId: string): string => {
  const supabaseUrl = SUPABASE_VIDEO_URLS[exerciseId as keyof typeof SUPABASE_VIDEO_URLS];
  if (supabaseUrl && supabaseUrl.trim() !== '') {
    return supabaseUrl;
  }
  
  // Fallback to local if no Supabase URL available
  return LOCAL_VIDEO_URLS[exerciseId as keyof typeof LOCAL_VIDEO_URLS] || '';
};
