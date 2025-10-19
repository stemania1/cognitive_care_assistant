#!/usr/bin/env node

/**
 * Script to help add workout demonstration videos
 * 
 * Usage:
 * 1. Place your video files in public/videos/workouts/
 * 2. Run: node scripts/add-workout-videos.js
 * 3. The script will check for missing videos and provide guidance
 */

const fs = require('fs');
const path = require('path');

// Focus on the 3 priority workouts (2nd, 3rd, 4th)
const workoutIds = [
  'chair_arm_swings',      // 2nd workout
  'balance_posture',       // 3rd workout  
  'finger_wrist_hand'      // 4th workout
];

const videoDir = path.join(__dirname, '..', 'public', 'videos', 'workouts');

console.log('🎥 Workout Video Checker\n');

// Check if video directory exists
if (!fs.existsSync(videoDir)) {
  console.log('❌ Video directory not found. Creating...');
  fs.mkdirSync(videoDir, { recursive: true });
  console.log('✅ Created video directory:', videoDir);
}

// Check for existing videos
const existingVideos = fs.readdirSync(videoDir).filter(file => file.endsWith('.mp4'));
console.log(`📁 Found ${existingVideos.length} video files in directory\n`);

// Check each workout
const missingVideos = [];
const foundVideos = [];

workoutIds.forEach(workoutId => {
  const videoFile = `${workoutId}.mp4`;
  const videoPath = path.join(videoDir, videoFile);
  
  if (fs.existsSync(videoPath)) {
    foundVideos.push(workoutId);
    console.log(`✅ ${workoutId}.mp4`);
  } else {
    missingVideos.push(workoutId);
    console.log(`❌ ${workoutId}.mp4 - MISSING`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Found: ${foundVideos.length} videos`);
console.log(`❌ Missing: ${missingVideos.length} videos`);

if (missingVideos.length > 0) {
  console.log(`\n📝 To add missing videos:`);
  console.log(`1. Record or download demonstration videos`);
  console.log(`2. Convert to MP4 format (H.264 codec recommended)`);
  console.log(`3. Rename files to match exercise IDs:`);
  missingVideos.forEach(id => {
    console.log(`   - ${id}.mp4`);
  });
  console.log(`4. Place files in: ${videoDir}`);
  console.log(`\n💡 Video Requirements:`);
  console.log(`   - Format: MP4 (H.264)`);
  console.log(`   - Resolution: 720p or 1080p`);
  console.log(`   - Duration: 30-60 seconds`);
  console.log(`   - Aspect Ratio: 16:9`);
  console.log(`   - File Size: Under 10MB`);
} else {
  console.log(`\n🎉 All workout videos are present!`);
}

console.log(`\n🔧 Next Steps:`);
console.log(`1. Add your video files to the directory`);
console.log(`2. Run this script again to verify`);
console.log(`3. Test the videos in your EMG workout page`);
