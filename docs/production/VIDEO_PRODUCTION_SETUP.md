# Video Setup for Production Deployment

This guide explains how to set up videos to work in the deployed version of your Cognitive Care Assistant app.

## Problem

The videos in your app are too large (>100MB each) to be stored in GitHub, so they don't work in the deployed version. We need to host them on Supabase storage instead.

## Solution

Upload compressed videos to Supabase storage and update the app to use those URLs.

## Quick Setup

### 1. Run the Setup Script
```bash
node scripts/setup-videos.js
```

### 2. Compress Videos (if needed)
```bash
node scripts/compress-videos.js
```

### 3. Upload to Supabase
```bash
node scripts/upload-videos-to-supabase.js
```

### 4. Update Video URLs
After uploading, copy the Supabase URLs and update `src/config/video-urls.ts`:

```typescript
export const SUPABASE_VIDEO_URLS = {
  'chair_arm_swings': 'https://your-project.supabase.co/storage/v1/object/public/workout-videos/chair_arm_swings.mp4',
  'balance_posture': 'https://your-project.supabase.co/storage/v1/object/public/workout-videos/balance_posture.mp4',
  'finger_wrist_hand': 'https://your-project.supabase.co/storage/v1/object/public/workout-videos/finger_wrist_hand.mp4',
  'seated_stretch_breathe': 'https://your-project.supabase.co/storage/v1/object/public/workout-videos/seated_stretch_breathe.mp4'
};
```

## Manual Setup (Alternative)

If the scripts don't work, follow these manual steps:

### 1. Compress Videos
- Use FFmpeg, HandBrake, or online tools
- Target size: under 50MB each
- Format: MP4 with H.264 codec

### 2. Set Up Supabase Storage
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called `workout-videos`
4. Make it **public**
5. Set file size limit to 50MB

### 3. Upload Videos
1. Upload your compressed videos to the bucket
2. Copy the public URLs for each video

### 4. Update App Configuration
Update `src/config/video-urls.ts` with the Supabase URLs.

### 5. Deploy
Commit and push your changes to deploy the updated app.

## Environment Variables

Make sure you have these in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Video Requirements

- **Format**: MP4 (H.264 codec)
- **Size**: Under 50MB each
- **Resolution**: 720p or 1080p
- **Duration**: 30-60 seconds per exercise

## Troubleshooting

### Videos Still Not Playing
1. Check the Supabase URLs are correct
2. Verify the bucket is public
3. Test URLs directly in browser
4. Check browser console for errors

### Upload Script Fails
1. Verify environment variables
2. Check Supabase project permissions
3. Try manual upload via dashboard

### Compression Issues
1. Install FFmpeg: `choco install ffmpeg` (Windows)
2. Use online tools like CloudConvert
3. Reduce video resolution or duration

## File Structure

```
scripts/
├── setup-videos.js              # Main setup script
├── compress-videos.js           # Video compression
├── upload-videos-to-supabase.js # Supabase upload
└── upload-videos.js             # Original upload script

src/config/
└── video-urls.ts                # Video URL configuration

public/videos/workouts/
├── *.mp4                        # Original videos (local only)
└── compressed-videos/          # Compressed versions
```

## Next Steps

After setting up videos:
1. Test locally with Supabase URLs
2. Deploy to production
3. Verify videos play in deployed app
4. Monitor Supabase storage usage
