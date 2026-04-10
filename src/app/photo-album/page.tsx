"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { ALBUM_TABLE_SETUP_MESSAGE } from "@/lib/album-photos-table";
import { fetchDailyChecks, fetchAlbumPhotos } from "@/lib/supabase-queries";
import { LoadingSpinner } from "@/components/LoadingSpinner";

/** Categories for drop-off uploads (stored as photo_type). */
const ALBUM_PHOTO_TYPES = [
  { value: "family_friends", label: "Family & friends" },
  { value: "places_events", label: "Places & events" },
  { value: "celebrations", label: "Celebrations & milestones" },
  { value: "pets", label: "Pets" },
  { value: "nature", label: "Nature & outdoors" },
  { value: "favorite_things", label: "Favorite things" },
  { value: "other", label: "Other" },
] as const;

type PhotoSource = "daily_question" | "album_drop";

interface PhotoEntry {
  id: string;
  photo_url: string;
  source: PhotoSource;
  photo_type?: string;
  answer?: string;
  question_text?: string;
  date?: string;
  created_at: string;
}

const DAILY_SECTION_KEY = "__daily__";

function sectionTitle(key: string): string {
  if (key === DAILY_SECTION_KEY) return "From daily questions";
  const t = ALBUM_PHOTO_TYPES.find((x) => x.value === key);
  return t?.label ?? key.replace(/_/g, " ");
}

function groupPhotos(photos: PhotoEntry[]): { key: string; title: string; items: PhotoEntry[] }[] {
  const byKey = new Map<string, PhotoEntry[]>();
  for (const p of photos) {
    const k = p.source === "daily_question" ? DAILY_SECTION_KEY : p.photo_type || "other";
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(p);
  }
  for (const arr of byKey.values()) {
    arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const order = [DAILY_SECTION_KEY, ...ALBUM_PHOTO_TYPES.map((t) => t.value)];
  const used = new Set<string>();
  const out: { key: string; title: string; items: PhotoEntry[] }[] = [];

  for (const k of order) {
    const items = byKey.get(k);
    if (items?.length) {
      out.push({ key: k, title: sectionTitle(k), items });
      used.add(k);
    }
  }
  for (const [k, items] of byKey) {
    if (!used.has(k) && items.length) {
      out.push({ key: k, title: sectionTitle(k), items });
    }
  }
  return out;
}

export default function PhotoAlbumPage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<PhotoEntry | null>(null);
  const [albumType, setAlbumType] = useState<string>(ALBUM_PHOTO_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [albumTableMissing, setAlbumTableMissing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  const sections = useMemo(() => groupPhotos(photos), [photos]);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (clerkUser?.id) setUserId(clerkUser.id);
    else {
      setUserId(null);
      setLoading(false);
    }
  }, [clerkUser, clerkLoaded]);

  const loadPhotos = useCallback(async () => {
    if (!userId || !clerkLoaded) return;
    try {
      setLoading(true);
      const [dailyRes, albumRes] = await Promise.all([
        fetchDailyChecks(userId),
        fetchAlbumPhotos(userId),
      ]);

      const merged: PhotoEntry[] = [];

      if (dailyRes.data) {
        for (const entry of dailyRes.data) {
          if (!entry.photo_url) continue;
          merged.push({
            id: entry.id,
            photo_url: entry.photo_url,
            source: "daily_question",
            answer: entry.answer,
            question_text: entry.question_text,
            date: entry.date,
            created_at: entry.created_at,
          });
        }
      }

      if (albumRes.data) {
        for (const row of albumRes.data) {
          merged.push({
            id: row.id,
            photo_url: row.photo_url,
            source: "album_drop",
            photo_type: row.photo_type,
            created_at: row.created_at,
            answer: "",
            question_text: "Album upload",
          });
        }
      }

      setAlbumTableMissing(Boolean(albumRes.tableMissing));

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPhotos(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, clerkLoaded]);

  useEffect(() => {
    if (userId && clerkLoaded) loadPhotos();
    else if (clerkLoaded && !userId) setLoading(false);
  }, [userId, clerkLoaded, loadPhotos]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatAddedDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!userId) return;
    if (albumTableMissing) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      alert("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large (max 5MB).`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        const up = await fetch("/api/photos/upload", { method: "POST", body: formData });
        const upJson = await up.json();
        if (!up.ok) {
          throw new Error(upJson.error || upJson.details || "Upload failed");
        }
        const save = await fetch("/api/album-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            photoUrl: upJson.url,
            photoType: albumType,
          }),
        });
        const saveJson = await save.json();
        if (!save.ok) {
          if (saveJson.code === "ALBUM_TABLE_MISSING") {
            setAlbumTableMissing(true);
          }
          throw new Error(
            saveJson.error ||
              "Could not save photo to album. If this is the first time, create the database table (see supabase/migrations/015_create_album_photos_table.sql)."
          );
        }
        const row = saveJson.data;
        if (row) {
          setPhotos((prev) => [
            {
              id: row.id,
              photo_url: row.photo_url,
              source: "album_drop",
              photo_type: row.photo_type,
              created_at: row.created_at,
              question_text: "Album upload",
              answer: "",
            },
            ...prev,
          ]);
        }
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photo: PhotoEntry) => {
    if (!userId) return;
    try {
      setDeletingPhoto(photo.id);
      const url =
        photo.source === "album_drop"
          ? `/api/album-photos?id=${encodeURIComponent(photo.id)}&userId=${encodeURIComponent(userId)}`
          : `/api/daily-checks?entryId=${encodeURIComponent(photo.id)}&userId=${encodeURIComponent(userId)}`;

      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        setShowDeleteConfirm(null);
        if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.error || "Failed to delete photo.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete photo.");
    } finally {
      setDeletingPhoto(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50 to-sky-100 text-slate-900 dark:from-black dark:via-[#0b0520] dark:to-[#0b1a3a] dark:text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative p-6 sm:p-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Photo Album</h1>
              <p className="text-white/60">Memories from daily questions and your own uploads</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Back to Home
            </Link>
          </div>

          {loading && <LoadingSpinner message="Loading your photos..." className="py-20" />}

          {!loading && !userId && clerkLoaded && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-white/60 mb-6">You need to be signed in to view your photo album.</p>
              <Link
                href="/signin"
                className="inline-block rounded-full bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600"
              >
                Sign In
              </Link>
            </div>
          )}

          {!loading && userId && (
            <>
              {albumTableMissing && (
                <div
                  className="mb-6 rounded-xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100 sm:px-5"
                  role="status"
                >
                  <p className="font-semibold text-amber-50">Album uploads need a database table</p>
                  <p className="mt-2 leading-relaxed text-amber-100/90">{ALBUM_TABLE_SETUP_MESSAGE}</p>
                  <p className="mt-2 font-mono text-xs text-amber-200/80">
                    supabase/migrations/015_create_album_photos_table.sql
                  </p>
                </div>
              )}

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (!albumTableMissing) setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={albumTableMissing ? (e) => e.preventDefault() : onDrop}
                className={`mb-8 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:px-8 ${
                  albumTableMissing
                    ? "cursor-not-allowed border-white/15 bg-white/[0.03] opacity-75"
                    : dragActive
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/25 bg-white/5 hover:border-white/40"
                }`}
              >
                <p className="text-lg font-medium text-white mb-2">
                  {albumTableMissing ? "Album drop-off paused" : "Drop photos here"}
                </p>
                <p className="text-sm text-white/60 mb-4">
                  {albumTableMissing
                    ? "Run the Supabase migration above to enable album saves. Daily question photos still appear below."
                    : "or choose files — JPEG, PNG, WebP, etc. (max 5MB each)"}
                </p>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                  <label className="text-sm text-white/80">
                    <span className="mr-2">Type of photo</span>
                    <select
                      value={albumType}
                      onChange={(e) => setAlbumType(e.target.value)}
                      disabled={albumTableMissing}
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ALBUM_PHOTO_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-slate-900">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    disabled={uploading || albumTableMissing}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "Choose photos"}
                  </button>
                </div>
              </div>

              {!loading && photos.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center mb-8">
                  <div className="text-5xl mb-3">📸</div>
                  <h2 className="text-lg font-semibold mb-2">No photos yet</h2>
                  <p className="text-white/60 text-sm">
                    Upload images above or add photos when you answer{" "}
                    <Link href="/daily-questions" className="text-cyan-400 underline">
                      daily questions
                    </Link>
                    .
                  </p>
                </div>
              )}

              {photos.length > 0 && (
                <div className="mb-4 text-sm text-white/60">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"} total
                </div>
              )}

              {sections.map((section) => (
                <section key={section.key} className="mb-10" aria-labelledby={`section-${section.key}`}>
                  <h2
                    id={`section-${section.key}`}
                    className="mb-4 text-lg font-semibold tracking-tight text-cyan-200 border-b border-white/10 pb-2"
                  >
                    {section.title}
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((photo) => (
                      <div
                        key={`${photo.source}-${photo.id}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-transform hover:scale-[1.02] hover:border-cyan-500/30"
                      >
                        <div
                          className="relative aspect-square cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <Image
                            src={photo.photo_url}
                            alt={photo.answer || photo.question_text || "Album photo"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(photo);
                            }}
                            className="absolute top-2 right-2 z-10 rounded-full bg-red-500/80 p-2 text-white opacity-0 transition-opacity hover:bg-red-600/80 group-hover:opacity-100"
                            aria-label="Delete photo"
                            disabled={deletingPhoto === photo.id}
                          >
                            {deletingPhoto === photo.id ? (
                              <span className="block h-4 w-4 animate-pulse">…</span>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="text-xs font-medium text-cyan-300/95 mb-1">
                            Added to album: {formatAddedDateTime(photo.created_at)}
                          </div>
                          {photo.source === "daily_question" && (
                            <>
                              <div className="text-xs text-white/50 mb-1">Question day: {formatDate(photo.date!)}</div>
                              <div className="text-sm font-medium line-clamp-1">{photo.question_text}</div>
                              <div className="text-sm text-white/60 line-clamp-2">{photo.answer}</div>
                            </>
                          )}
                          {photo.source === "album_drop" && (
                            <div className="text-sm text-white/70">
                              {sectionTitle(photo.photo_type || "other")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </main>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(selectedPhoto);
                }}
                className="rounded-full bg-red-500/80 p-2 text-white hover:bg-red-600/80"
                aria-label="Delete photo"
                disabled={deletingPhoto === selectedPhoto.id}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative aspect-video">
              <Image
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.answer || "Photo"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
            <div className="border-t border-white/10 p-6">
              <div className="text-sm font-medium text-cyan-300 mb-2">
                Added to album: {formatAddedDateTime(selectedPhoto.created_at)}
              </div>
              {selectedPhoto.source === "daily_question" && (
                <>
                  <div className="text-sm text-white/50 mb-1">Question day: {formatDate(selectedPhoto.date!)}</div>
                  <h3 className="text-lg font-semibold mb-2">{selectedPhoto.question_text}</h3>
                  <p className="text-white/80">{selectedPhoto.answer}</p>
                </>
              )}
              {selectedPhoto.source === "album_drop" && (
                <p className="text-white/80">{sectionTitle(selectedPhoto.photo_type || "other")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold">Delete photo?</h3>
            <p className="mb-6 text-white/80">
              {showDeleteConfirm.source === "daily_question"
                ? "This removes the daily check entry that contains this photo."
                : "This removes the photo from your album."}{" "}
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                disabled={deletingPhoto === showDeleteConfirm.id}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePhoto(showDeleteConfirm)}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
                disabled={deletingPhoto === showDeleteConfirm.id}
              >
                {deletingPhoto === showDeleteConfirm.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
