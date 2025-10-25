'use client';

import { Question } from '@/types/daily-questions';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import Image from 'next/image';

interface QuestionCardProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  photoUrl?: string;
  onPhotoChange?: (url: string) => void;
  userId?: string;
  questionNumber?: number;
  onSave?: (questionId: string) => void;
}

export function QuestionCard({ question, value, onChange, photoUrl, onPhotoChange, userId, questionNumber, onSave }: QuestionCardProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !onPhotoChange) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Photo is too big. Please choose a smaller photo (less than 5MB).');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a photo file.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('daily-check-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          setUploadError('Storage not set up. Please run the database migration first.');
        } else {
          setUploadError(`Upload failed: ${error.message}`);
        }
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('daily-check-photos')
        .getPublicUrl(fileName);

      console.log('Photo uploaded successfully! URL:', publicUrl);
      onPhotoChange(publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadError('Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    if (onPhotoChange) {
      onPhotoChange('');
    }
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave(question.id);
        setSaved(true);
        // Reset saved state after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      } catch (error) {
        console.error('Error saving answer:', error);
      }
    }
  };

  return (
    <div className={`rounded-lg border p-4 transition-all duration-300 ${
      saved 
        ? 'border-green-500/50 bg-green-500/5' 
        : 'border-white/10 bg-white/5'
    }`}>
      {questionNumber && (
        <div className="text-yellow-400 font-bold text-lg mb-2">Question {questionNumber}</div>
      )}
      <h3 className="text-sm font-medium mb-3 text-white/90">{question.text}</h3>
      
      {question.choices ? (
        <div className="space-y-2">
          {question.choices.map((choice) => (
            <button
              key={choice}
              onClick={() => onChange(choice)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                value === choice
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
              type="button"
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here..."
          rows={3}
          className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/40 resize-none"
        />
      )}

      {/* Photo Upload Section */}
      {question.allowPhoto && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <label className="text-xs font-medium text-white/70 mb-2 block">
            Add a photo (optional)
          </label>
          
          {photoUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-white/20 bg-white/5">
              <Image
                src={photoUrl}
                alt="Your photo"
                width={400}
                height={300}
                className="w-full h-auto object-cover"
                unoptimized
                onError={(e) => {
                  console.error('Error loading image:', photoUrl);
                  setUploadError('Could not display photo. The image may not be accessible.');
                }}
                onLoad={() => {
                  console.log('Photo loaded successfully');
                  setUploadError(null);
                }}
              />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 text-xs transition-colors"
                type="button"
              >
                Remove Photo
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center justify-center w-full rounded-md border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 px-4 py-6 cursor-pointer transition-colors">
                <div className="text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-white/40"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-xs text-white/60">
                    {uploading ? 'Uploading...' : 'Click to choose a photo'}
                  </p>
                  <p className="text-xs text-white/40">
                    (Up to 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              
              {uploadError && (
                <p className="text-xs text-red-400">{uploadError}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Save Checkmark Button */}
      {onSave && value.trim() && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
              saved 
                ? 'bg-green-500/30 text-green-300 border-green-400' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300 border-green-500/30'
            }`}
            type="button"
            title={saved ? "Answer saved!" : "Save this answer"}
            disabled={saved}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">
              {saved ? 'Saved!' : 'Save Answer'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
