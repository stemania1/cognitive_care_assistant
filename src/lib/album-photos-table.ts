/**
 * Supabase/PostgREST errors when `album_photos` has not been created (or cache is stale).
 */
export function isAlbumPhotosTableMissing(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  const code = String(error.code || "");

  if (code === "42P01") return true;
  // PostgREST: table not exposed / not in schema cache
  if (code === "PGRST205") return true;
  if (msg.includes("schema cache") && msg.includes("album_photos")) return true;
  if (msg.includes("could not find the table") && msg.includes("album_photos")) return true;
  if (msg.includes("relation") && msg.includes("album_photos") && msg.includes("does not exist")) {
    return true;
  }
  return false;
}

export const ALBUM_TABLE_SETUP_MESSAGE =
  "The album_photos table is missing in Supabase. Open Dashboard → SQL, paste the contents of supabase/migrations/015_create_album_photos_table.sql, run it, then wait a minute or restart the project so the API picks up the new table.";
