#!/usr/bin/env node

/**
 * Script to help copy workout videos to the correct location
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'public', 'videos');
const targetDir = path.join(__dirname, '..', 'public', 'videos', 'workouts');

console.log('🎥 Video Copy Helper\n');

console.log('📁 Source directory:', sourceDir);
console.log('📁 Target directory:', targetDir);

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.log('❌ Source directory does not exist');
  process.exit(1);
}

// Check if target directory exists
if (!fs.existsSync(targetDir)) {
  console.log('❌ Target directory does not exist');
  process.exit(1);
}

// Look for video files in source directory
const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv'];
const files = fs.readdirSync(sourceDir);

console.log('\n📂 Files found in source directory:');
files.forEach(file => {
  const ext = path.extname(file).toLowerCase();
  if (videoExtensions.includes(ext)) {
    console.log(`🎥 ${file} (${ext})`);
  } else {
    console.log(`📄 ${file}`);
  }
});

console.log('\n💡 To add your videos:');
console.log('1. Place your video files in:', sourceDir);
console.log('2. Rename them to:');
console.log('   - chair_arm_swings.mp4');
console.log('   - balance_posture.mp4');
console.log('   - finger_wrist_hand.mp4');
console.log('3. Run this script again to verify');

// Check for the specific files we need
const requiredFiles = [
  'chair_arm_swings.mp4',
  'balance_posture.mp4',
  'finger_wrist_hand.mp4'
];

console.log('\n🔍 Checking for required files:');
requiredFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`✅ ${file} found in source`);
    if (!fs.existsSync(targetPath)) {
      console.log(`📋 Copying ${file} to target directory...`);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ ${file} copied successfully`);
    } else {
      console.log(`✅ ${file} already exists in target`);
    }
  } else {
    console.log(`❌ ${file} not found in source`);
  }
});

console.log('\n🎉 Video copy process complete!');



