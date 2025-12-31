"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase, safeGetUser } from "@/lib/supabaseClient";
import { fetchDailyChecks } from "@/lib/supabase-queries";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface PhotoEntry {
  id: string;
  photo_url: string;
  answer: string;
  question_text: string;
  date: string;
  created_at: string;
}

export default function PhotoAlbumPage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<PhotoEntry | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { user } = await safeGetUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Fetch photos
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const { data, error } = await fetchDailyChecks(userId);

        if (error) {
          console.error('Error fetching photos:', error);
          return;
        }

        if (data) {
          // Filter entries that have photos
          const photosOnly = data
            .filter((entry: any) => entry.photo_url)
            .map((entry: any) => ({
              id: entry.id,
              photo_url: entry.photo_url,
              answer: entry.answer,
              question_text: entry.question_text,
              date: entry.date,
              created_at: entry.created_at,
            }))
            .sort((a: PhotoEntry, b: PhotoEntry) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

          setPhotos(photosOnly);
        }
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPhotos();
    }
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDeletePhoto = async (photo: PhotoEntry) => {
    if (!userId) return;

    try {
      setDeletingPhoto(photo.id);
      const response = await fetch(`/api/daily-checks?entryId=${photo.id}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove photo from local state
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        setShowDeleteConfirm(null);
        // Close photo modal if it's open for the deleted photo
        if (selectedPhoto && selectedPhoto.id === photo.id) {
          setSelectedPhoto(null);
        }
      } else {
        const error = await response.json();
        console.error('Failed to delete photo:', error);
        alert('Failed to delete photo. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setDeletingPhoto(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative p-6 sm:p-12">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Photo Album</h1>
              <p className="text-white/60">Your memories from daily questions</p>
            </div>
            <Link 
              href="/dashboard" 
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Back to Home
            </Link>
          </div>

          {/* Loading State */}
          {loading && <LoadingSpinner message="Loading your photos..." className="py-20" />}

          {/* No Photos State */}
          {!loading && photos.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-xl font-semibold mb-2">No Photos Yet</h2>
              <p className="text-white/60 mb-6">
                Start adding photos to your daily questions to build your memory album!
              </p>
              <Link 
                href="/daily-questions"
                className="inline-block rounded-full bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
              >
                Answer Daily Questions
              </Link>
            </div>
          )}

          {/* Photo Grid */}
          {!loading && photos.length > 0 && (
            <>
              <div className="mb-4 text-sm text-white/60">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} in your album
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-transform hover:scale-105 hover:border-cyan-500/30"
                  >
                    <div 
                      className="aspect-square relative cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={photo.photo_url}
                        alt={photo.answer || "Memory photo"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(photo);
                        }}
                        className="absolute top-2 right-2 z-10 rounded-full bg-red-500/80 p-2 text-white hover:bg-red-600/80 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete photo"
                        disabled={deletingPhoto === photo.id}
                      >
                        {deletingPhoto === photo.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <div className="text-xs text-cyan-400 mb-1">
                        {formatDate(photo.date)}
                      </div>
                      <div className="text-sm font-medium mb-1 line-clamp-1">
                        {photo.question_text}
                      </div>
                      <div className="text-sm text-white/60 line-clamp-2">
                        {photo.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Photo Modal/Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(selectedPhoto);
                }}
                className="rounded-full bg-red-500/80 p-2 text-white hover:bg-red-600/80 transition-colors"
                aria-label="Delete photo"
                disabled={deletingPhoto === selectedPhoto.id}
              >
                {deletingPhoto === selectedPhoto.id ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="relative aspect-video">
              <Image
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.answer || "Memory photo"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>

            <div className="p-6 border-t border-white/10">
              <div className="text-sm text-cyan-400 mb-2">
                {formatDate(selectedPhoto.date)}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedPhoto.question_text}
              </h3>
              <p className="text-white/80">
                {selectedPhoto.answer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="relative max-w-md w-full bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Delete Photo?</h3>
            <p className="text-white/80 mb-6">
              Are you sure you want to delete this photo? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                disabled={deletingPhoto === showDeleteConfirm.id}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePhoto(showDeleteConfirm)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={deletingPhoto === showDeleteConfirm.id}
              >
                {deletingPhoto === showDeleteConfirm.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

