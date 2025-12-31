/**
 * Date and time formatting utilities
 */

/**
 * Formats a duration in seconds to MM:SS format
 * @param seconds Duration in seconds
 * @returns Formatted string like "05:30" or "125:45"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats a date to ISO string
 * @param date Date, timestamp, or date string
 * @returns ISO string
 */
export function formatToISO(date: Date | number | string): string {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;
  return dateObj.toISOString();
}

/**
 * Formats a date to locale string
 * @param date Date, timestamp, or date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Locale string
 */
export function formatToLocaleString(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;
  return dateObj.toLocaleString(undefined, options);
}

/**
 * Formats a date to locale date string
 * @param date Date, timestamp, or date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Locale date string
 */
export function formatToLocaleDateString(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;
  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Formats a date to locale time string
 * @param date Date, timestamp, or date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Locale time string
 */
export function formatToLocaleTimeString(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'number' || typeof date === 'string'
    ? new Date(date)
    : date;
  return dateObj.toLocaleTimeString(undefined, options);
}

/**
 * Gets the date portion of an ISO string (YYYY-MM-DD)
 * @param date Date, timestamp, or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateString(date: Date | number | string): string {
  return formatToISO(date).split('T')[0];
}

