/**
 * Utility functions for CSV export functionality
 */

/**
 * Escapes a CSV cell value by wrapping in quotes and escaping internal quotes
 */
export function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // Escape quotes by doubling them and wrap in quotes
  return `"${stringValue.replace(/"/g, '""')}"`;
}

/**
 * Converts an array of rows to CSV string
 * @param rows Array of arrays representing CSV rows
 * @param escapeCells Whether to escape cells (default: false for simple CSV, true for proper CSV)
 * @returns CSV string
 */
export function rowsToCSV(rows: (string | number)[][], escapeCells: boolean = false): string {
  if (escapeCells) {
    return rows
      .map(row => row.map(cell => escapeCSVCell(cell)).join(','))
      .join('\r\n');
  }
  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Downloads a CSV file to the user's computer
 * @param csvContent The CSV content as a string
 * @param filename The filename for the downloaded file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates a CSV file from headers and rows and downloads it
 * @param headers Array of header strings
 * @param rows Array of row arrays
 * @param filename The filename for the downloaded file
 * @param escapeCells Whether to escape cells (default: false)
 */
export function exportCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  escapeCells: boolean = false
): void {
  const csvContent = rowsToCSV([headers, ...rows], escapeCells);
  downloadCSV(csvContent, filename);
}

/**
 * Formats a timestamp for CSV export (ISO string)
 */
export function formatTimestampForCSV(timestamp: number | string | Date): string {
  const date = typeof timestamp === 'number' || typeof timestamp === 'string'
    ? new Date(timestamp)
    : timestamp;
  return date.toISOString();
}

/**
 * Generates a filename with current date
 * @param prefix Filename prefix
 * @param extension File extension (default: 'csv')
 */
export function generateFilenameWithDate(prefix: string, extension: string = 'csv'): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return `${prefix}_${dateStr}.${extension}`;
}

