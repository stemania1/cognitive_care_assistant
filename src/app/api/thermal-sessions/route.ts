import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Number(searchParams.get('limit') || '50');
    const debug = searchParams.get('debug') === 'true';
    
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

    console.log('🔍 Fetching thermal sessions for userId:', userId, 'limit:', limit, 'debug:', debug);
    
    // If debug mode, also check total count and recent sessions
    if (debug) {
      const { count: totalCount } = await supabaseAdmin
        .from('thermal_sessions')
        .select('*', { count: 'exact', head: true });
      
      const { count: userCount } = await supabaseAdmin
        .from('thermal_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      const { data: recentSessions } = await supabaseAdmin
        .from('thermal_sessions')
        .select('id, user_id, subject_identifier, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('🔍 Debug info:', {
        totalSessionsInDB: totalCount,
        sessionsForThisUser: userCount,
        recentSessions: recentSessions
      });
    }
    
    const { data, error } = await supabaseAdmin
      .from('thermal_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log('📊 Database query result:', {
      error: error,
      dataCount: data?.length || 0,
      firstSession: data?.[0] ? {
        id: data[0].id,
        user_id: data[0].user_id,
        subject_identifier: data[0].subject_identifier,
        created_at: data[0].created_at
      } : null
    });

    if (error) {
      console.error('❌ Error fetching thermal sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 });
    }
    
    console.log('✅ Returning', data?.length || 0, 'thermal sessions');
    return NextResponse.json({ data, debug: debug ? { totalCount: data?.length || 0 } : undefined });
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
      samples, // Array of { sampleIndex, timestamp, heatmapVariance, patternStability }
      moveEvents, // Array of { timestamp, secondsFromStart }
      movementDetected // Array of { timestamp, secondsFromStart }
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

    // Update session with samples and move events data (stored as JSONB)
    const updateData: { samples?: any; move_events?: any; movement_detected?: any } = {};
    if (samples && Array.isArray(samples) && samples.length > 0) {
      updateData.samples = samples;
    }
    if (moveEvents && Array.isArray(moveEvents) && moveEvents.length > 0) {
      updateData.move_events = moveEvents;
    }
    if (movementDetected && Array.isArray(movementDetected) && movementDetected.length > 0) {
      updateData.movement_detected = movementDetected;
    }
    
    if (Object.keys(updateData).length > 0 && sessionData) {
      const { error: updateError } = await supabaseAdmin
        .from('thermal_sessions')
        .update(updateData)
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

