/**
 * Helper functions for fetching data from Supabase API routes
 */

export interface EMGSession {
  id: string;
  user_id: string;
  session_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  readings: any[] | null;
  move_markers?: any[] | null;
  average_voltage: number | null;
  max_voltage: number | null;
  created_at: string;
}

export interface ThermalSession {
  id: string;
  user_id: string;
  subject_identifier: string;
  session_number: number | null;
  started_at: string;
  ended_at: string;
  duration_seconds?: number;
  average_surface_temp?: number | null;
  average_temperature_range?: number | null;
  thermal_event_count?: number;
  samples: any[];
  move_events?: any[] | null;
  movement_detected?: any[] | null;
  created_at: string;
}

export interface DailyCheck {
  id: string;
  user_id: string;
  question_id: string;
  question_text: string;
  answer: string;
  answer_type: string;
  date: string;
  photo_url?: string | null;
  created_at: string;
}

export interface DailyCheckSession {
  id: string;
  user_id: string;
  date: string;
  set_start_index: number;
  duration_ms: number;
  created_at: string;
}

/**
 * Fetches EMG sessions for a user
 */
export async function fetchEMGSessions(
  userId: string,
  options?: { limit?: number; debug?: boolean }
): Promise<{ data: EMGSession[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({ userId });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.debug) params.append('debug', 'true');

    const response = await fetch(`/api/emg-sessions?${params.toString()}`);
    
    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      let errorMessage = `Failed to fetch sessions (${response.status})`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorResult.details || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      return { data: null, error: errorMessage };
    }

    const result = await response.json();

    if (result.data) {
      return { data: result.data, error: null };
    } else {
      return { 
        data: null, 
        error: result.error || result.details || 'Failed to fetch EMG sessions' 
      };
    }
  } catch (error) {
    console.error('Error in fetchEMGSessions:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error fetching EMG sessions'
    };
  }
}

/**
 * Fetches thermal sessions for a user
 */
export async function fetchThermalSessions(
  userId: string,
  options?: { limit?: number; debug?: boolean }
): Promise<{ data: ThermalSession[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({ userId });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.debug) params.append('debug', 'true');

    const response = await fetch(`/api/thermal-sessions?${params.toString()}`);
    
    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      let errorMessage = `Failed to fetch sessions (${response.status})`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorResult.details || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      return { data: null, error: errorMessage };
    }

    const result = await response.json();

    if (result.data) {
      return { data: result.data, error: null };
    } else {
      return { 
        data: null, 
        error: result.error || result.details || 'Failed to fetch thermal sessions' 
      };
    }
  } catch (error) {
    console.error('Error in fetchThermalSessions:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error fetching thermal sessions'
    };
  }
}

/**
 * Fetches daily checks for a user
 */
export async function fetchDailyChecks(
  userId: string,
  options?: { date?: string }
): Promise<{ data: DailyCheck[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({ userId });
    if (options?.date) params.append('date', options.date);

    const response = await fetch(`/api/daily-checks?${params.toString()}`);
    const result = await response.json();

    if (response.ok && result.data) {
      return { data: result.data, error: null };
    } else {
      return { data: null, error: result.error || 'Failed to fetch daily checks' };
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error fetching daily checks'
    };
  }
}

/**
 * Fetches daily check sessions for a user
 */
export async function fetchDailyCheckSessions(
  userId: string,
  options?: { limit?: number }
): Promise<{ data: DailyCheckSession[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({ userId });
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`/api/daily-check-sessions?${params.toString()}`);
    const result = await response.json();

    if (response.ok && result.data) {
      return { data: result.data, error: null };
    } else {
      return { data: null, error: result.error || 'Failed to fetch daily check sessions' };
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error fetching daily check sessions'
    };
  }
}

