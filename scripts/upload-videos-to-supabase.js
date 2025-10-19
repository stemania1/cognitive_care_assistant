const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupVideoStorage() {
  console.log('🎬 Setting up video storage...');
  
  try {
    // Create video storage bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('workout-videos', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg']
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError;
    }

    console.log('✅ Video storage bucket ready');

    // Set up storage policies
    const policies = [
      {
        name: 'Public video access',
        operation: 'SELECT',
        target: 'public',
        definition: "bucket_id = 'workout-videos'"
      },
      {
        name: 'Admin video upload',
        operation: 'INSERT',
        target: 'service_role',
        definition: "bucket_id = 'workout-videos'"
      }
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('create_storage_policy', {
          policy_name: policy.name,
          operation: policy.operation,
          target_role: policy.target,
          policy_definition: policy.definition
        });
      } catch (err) {
        // Policy might already exist, continue
        console.log(`Policy ${policy.name} already exists or created`);
      }
    }

    console.log('✅ Storage policies configured');
    return true;
  } catch (error) {
    console.error('❌ Error setting up video storage:', error.message);
    return false;
  }
}

async function uploadVideo(filePath, fileName) {
  console.log(`📤 Uploading ${fileName}...`);
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    console.log(`   File size: ${fileSizeMB} MB`);
    
    if (fileSize > 50 * 1024 * 1024) {
      console.error(`❌ File ${fileName} is too large (${fileSizeMB} MB). Max size is 50MB.`);
      return null;
    }

    const { data, error } = await supabase.storage
      .from('workout-videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true // Overwrite if exists
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('workout-videos')
      .getPublicUrl(fileName);

    console.log(`✅ Uploaded ${fileName}`);
    console.log(`   URL: ${urlData.publicUrl}`);
    
    return {
      fileName,
      publicUrl: urlData.publicUrl,
      size: fileSizeMB
    };
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error.message);
    return null;
  }
}

async function createCompressedVideos() {
  console.log('🎥 Using existing compressed videos...');
  
  const compressedDir = path.join(__dirname, '..', 'compressed-videos');

  // Check if compressed directory exists
  if (!fs.existsSync(compressedDir)) {
    console.error('❌ Compressed videos directory not found. Run compress-videos.js first.');
    process.exit(1);
  }

  return compressedDir;
}

async function main() {
  console.log('🚀 Starting video upload process...\n');

  // Setup storage
  const storageReady = await setupVideoStorage();
  if (!storageReady) {
    process.exit(1);
  }

  console.log('\n📁 Creating compressed videos...\n');
  const compressedDir = await createCompressedVideos();

  console.log('\n📁 Uploading videos...\n');

  // Video files to upload
  const videoFiles = [
    'balance_posture.mp4',
    'chair_arm_swings.mp4', 
    'finger_wrist_hand.mp4'
  ];

  const uploadResults = [];

  for (const fileName of videoFiles) {
    const filePath = path.join(compressedDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      continue;
    }

    const result = await uploadVideo(filePath, fileName);
    if (result) {
      uploadResults.push(result);
    }
  }

  console.log('\n📊 Upload Summary:');
  console.log('==================');
  
  if (uploadResults.length === 0) {
    console.log('❌ No videos were uploaded successfully');
    process.exit(1);
  }

  uploadResults.forEach(result => {
    console.log(`✅ ${result.fileName}: ${result.size} MB`);
    console.log(`   ${result.publicUrl}`);
  });

  console.log('\n🎉 Video upload complete!');
  console.log('\nNext steps:');
  console.log('1. Update your WorkoutVideo component to use these URLs');
  console.log('2. Test the videos in your app');
  console.log('3. Deploy the updated app');
}

// Run the script
main().catch(console.error);
