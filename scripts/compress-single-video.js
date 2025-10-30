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

async function compressVideo(inputPath, outputPath, { mobile = false } = {}) {
  console.log(`🎥 Compressing: ${inputPath}`);
  try {
    await execAsync('ffmpeg -version');
  } catch (e) {
    console.error('❌ FFmpeg not found. Please install FFmpeg and ensure it is on your PATH.');
    process.exit(1);
  }

  // H.264 + aac, web-friendly, faststart for progressive playback
  // If mobile flag, scale down to 1280x720 max with higher CRF for smaller size
  const vf = mobile ? "-vf scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" : '';
  const crf = mobile ? 32 : 28;
  const preset = mobile ? 'veryfast' : 'fast';
  const cmd = `ffmpeg -y -i "${inputPath}" ${vf} -c:v libx264 -preset ${preset} -crf ${crf} -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
  await execAsync(cmd);

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Output: ${outputPath} (${sizeMB} MB)`);
}

async function main() {
  const argv = process.argv.slice(2);
  const isMobile = argv.includes('--mobile');
  const positional = argv.filter(a => !a.startsWith('--'));
  const input = positional[0];
  let output = positional[1];

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
    output = path.join(publicVideosDir, `${name}-${isMobile ? 'mobile' : 'compressed'}${ext || '.mp4'}`);
  } else {
    const outputDir = path.dirname(path.isAbsolute(output) ? output : path.resolve(process.cwd(), output));
    await ensureDir(outputDir);
  }

  await compressVideo(inputAbs, output, { mobile: isMobile });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


