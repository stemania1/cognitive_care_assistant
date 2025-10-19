#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎬 Cognitive Care Assistant - Video Setup');
console.log('==========================================\n');

console.log('This script will help you set up videos for the deployed version.\n');

console.log('📋 Steps to complete:');
console.log('1. Compress your videos to under 50MB each');
console.log('2. Upload videos to Supabase storage');
console.log('3. Update video URLs in the app');
console.log('4. Deploy the updated app\n');

console.log('🚀 Available commands:');
console.log('');

console.log('1. Compress videos:');
console.log('   node scripts/compress-videos.js');
console.log('');

console.log('2. Upload to Supabase:');
console.log('   node scripts/upload-videos-to-supabase.js');
console.log('');

console.log('3. Manual setup (if scripts fail):');
console.log('   - Go to your Supabase dashboard');
console.log('   - Create a "workout-videos" bucket');
console.log('   - Make it public');
console.log('   - Upload your compressed videos');
console.log('   - Copy the public URLs');
console.log('   - Update src/config/video-urls.ts with the URLs');
console.log('');

console.log('📝 Environment Variables Needed:');
console.log('Make sure you have these in your .env.local file:');
console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
console.log('');

console.log('💡 Tips:');
console.log('- Videos should be under 50MB for Supabase free tier');
console.log('- Use H.264 codec for best compatibility');
console.log('- Test videos in your browser before deploying');
console.log('');

// Check if environment file exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Warning: .env.local file not found');
  console.log('   Create this file with your Supabase credentials');
  console.log('');
}

// Check if videos exist
const videosDir = path.join(__dirname, '..', 'public', 'videos', 'workouts');
const videoFiles = ['balance_posture.mp4', 'chair_arm_swings.mp4', 'finger_wrist_hand.mp4'];

console.log('📁 Checking for video files...');
videoFiles.forEach(fileName => {
  const filePath = path.join(videosDir, fileName);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ ${fileName}: ${sizeMB} MB`);
  } else {
    console.log(`❌ ${fileName}: Not found`);
  }
});

console.log('\n🎯 Ready to start! Run the commands above to set up your videos.');
