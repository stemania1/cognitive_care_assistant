const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function compressVideo(inputPath, outputPath) {
  console.log(`🎥 Compressing: ${inputPath}`);
  try {
    await execAsync('ffmpeg -version');
  } catch (e) {
    console.error('❌ FFmpeg not found. Please install FFmpeg and ensure it is on your PATH.');
    process.exit(1);
  }

  // H.264 + aac, web-friendly, faststart for progressive playback
  const cmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
  await execAsync(cmd);

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Output: ${outputPath} (${sizeMB} MB)`);
}

async function main() {
  const input = process.argv[2];
  let output = process.argv[3];

  if (!input) {
    console.error('Usage: node scripts/compress-single-video.js <inputPath> [outputPath]');
    process.exit(1);
  }

  const inputAbs = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  if (!fs.existsSync(inputAbs)) {
    console.error(`❌ Input file not found: ${inputAbs}`);
    process.exit(1);
  }

  if (!output) {
    const publicVideosDir = path.resolve(__dirname, '..', 'public', 'videos');
    await ensureDir(publicVideosDir);
    const base = path.basename(inputAbs).replace(/\s+/g, '-').toLowerCase();
    const ext = path.extname(base);
    const name = base.slice(0, -ext.length);
    output = path.join(publicVideosDir, `${name}-compressed${ext || '.mp4'}`);
  } else {
    const outputDir = path.dirname(path.isAbsolute(output) ? output : path.resolve(process.cwd(), output));
    await ensureDir(outputDir);
  }

  await compressVideo(inputAbs, output);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


