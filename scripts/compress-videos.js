const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function compressVideo(inputPath, outputPath, targetSizeMB = 40) {
  console.log(`🎥 Compressing ${path.basename(inputPath)}...`);
  
  try {
    // Check if FFmpeg is available
    try {
      await execAsync('ffmpeg -version');
      console.log('✅ FFmpeg found, using compression');
      
      // Calculate target bitrate (rough estimation)
      const targetBitrate = Math.floor(targetSizeMB * 8 * 1000 / 60); // Assuming 60 second video
      
      const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
      
      await execAsync(command);
      console.log(`✅ Compressed: ${path.basename(outputPath)}`);
      
    } catch (ffmpegError) {
      console.log('⚠️ FFmpeg not found, copying original file');
      fs.copyFileSync(inputPath, outputPath);
    }
    
    // Check final size
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   Final size: ${sizeMB} MB`);
    
    return sizeMB;
    
  } catch (error) {
    console.error(`❌ Error compressing ${path.basename(inputPath)}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🎬 Starting video compression...\n');
  
  const videosDir = path.join(__dirname, '..', 'public', 'videos', 'workouts');
  const compressedDir = path.join(__dirname, '..', 'compressed-videos');
  
  // Create compressed directory
  if (!fs.existsSync(compressedDir)) {
    fs.mkdirSync(compressedDir, { recursive: true });
  }
  
  const videoFiles = [
    'balance_posture.mp4',
    'chair_arm_swings.mp4', 
    'finger_wrist_hand.mp4'
  ];
  
  const results = [];
  
  for (const fileName of videoFiles) {
    const inputPath = path.join(videosDir, fileName);
    const outputPath = path.join(compressedDir, fileName);
    
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ File not found: ${inputPath}`);
      continue;
    }
    
    const originalSize = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`📁 Original size: ${originalSize} MB`);
    
    const compressedSize = await compressVideo(inputPath, outputPath);
    
    if (compressedSize) {
      results.push({
        fileName,
        originalSize: parseFloat(originalSize),
        compressedSize: parseFloat(compressedSize),
        compressionRatio: ((parseFloat(originalSize) - parseFloat(compressedSize)) / parseFloat(originalSize) * 100).toFixed(1)
      });
    }
  }
  
  console.log('\n📊 Compression Summary:');
  console.log('======================');
  
  results.forEach(result => {
    console.log(`✅ ${result.fileName}`);
    console.log(`   Original: ${result.originalSize} MB`);
    console.log(`   Compressed: ${result.compressedSize} MB`);
    console.log(`   Compression: ${result.compressionRatio}%`);
    console.log('');
  });
  
  console.log('🎉 Video compression complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/upload-videos-to-supabase.js');
  console.log('2. Update video URLs in src/config/video-urls.ts');
  console.log('3. Deploy the updated app');
}

main().catch(console.error);
