import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Number(searchParams.get('limit') || '50');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === '<your-service-role-key>') {
      return NextResponse.json({ 
        error: 'Service role key not configured', 
        details: 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data, error } = await supabaseAdmin
      .from('thermal_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_number', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching thermal sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (e) {
    console.error('Unexpected error in GET:', e);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      subjectIdentifier, 
      startedAt, 
      endedAt, 
      durationSeconds,
      averageSurfaceTemp,
      averageTemperatureRange,
      thermalEventCount,
      samples // Array of { sampleIndex, timestamp, heatmapVariance, patternStability }
    } = body;

    if (!userId || !subjectIdentifier || !startedAt || !endedAt || typeof durationSeconds !== 'number') {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['userId', 'subjectIdentifier', 'startedAt', 'endedAt', 'durationSeconds']
      }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === '<your-service-role-key>') {
      return NextResponse.json({ 
        error: 'Service role key not configured', 
        details: 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the next session number for this user
    const { data: existingSessions, error: countError } = await supabaseAdmin
      .from('thermal_sessions')
      .select('session_number')
      .eq('user_id', userId)
      .order('session_number', { ascending: false })
      .limit(1);

    const nextSessionNumber = existingSessions && existingSessions.length > 0
      ? (existingSessions[0].session_number ?? 0) + 1
      : 1;

    // Insert the session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('thermal_sessions')
      .insert({
        user_id: userId,
        subject_identifier: subjectIdentifier,
        session_number: nextSessionNumber,
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        average_surface_temp: averageSurfaceTemp ?? null,
        average_temperature_range: averageTemperatureRange ?? null,
        thermal_event_count: thermalEventCount ?? 0,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error inserting thermal session:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to save session', 
        details: sessionError.message 
      }, { status: 500 });
    }

    // Update session with samples data (stored as JSONB)
    if (samples && Array.isArray(samples) && samples.length > 0 && sessionData) {
      const { error: updateError } = await supabaseAdmin
        .from('thermal_sessions')
        .update({ samples: samples })
        .eq('id', sessionData.id);

      if (updateError) {
        console.error('Error updating session with samples:', updateError);
        // Note: We still return success for the session, but log the samples error
      } else {
        // Refetch the updated session
        const { data: updatedSession } = await supabaseAdmin
          .from('thermal_sessions')
          .select('*')
          .eq('id', sessionData.id)
          .single();
        
        if (updatedSession) {
          return NextResponse.json({ data: updatedSession });
        }
      }
    }

    return NextResponse.json({ data: sessionData });
  } catch (e) {
    console.error('Unexpected error in POST:', e);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'User ID and Session ID are required' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === '<your-service-role-key>') {
      return NextResponse.json({ 
        error: 'Service role key not configured', 
        details: 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete the session (samples are stored as JSONB, so they're deleted automatically)
    const { error } = await supabaseAdmin
      .from('thermal_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting session:', error);
      return NextResponse.json({ 
        error: 'Failed to delete session', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Unexpected error in DELETE:', e);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}

