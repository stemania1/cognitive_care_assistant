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

    console.log('🔍 Fetching EMG sessions for userId:', userId, 'limit:', limit, 'debug:', debug);
    
    // If debug mode, also check total count and recent sessions
    if (debug) {
      const { count: totalCount } = await supabaseAdmin
        .from('emg_sessions')
        .select('*', { count: 'exact', head: true });
      
      const { count: userCount } = await supabaseAdmin
        .from('emg_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      const { data: recentSessions } = await supabaseAdmin
        .from('emg_sessions')
        .select('id, user_id, session_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('🔍 Debug info:', {
        totalSessionsInDB: totalCount,
        sessionsForThisUser: userCount,
        recentSessions: recentSessions
      });
    }
    
    const { data, error } = await supabaseAdmin
      .from('emg_sessions')
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
        session_name: data[0].session_name,
        created_at: data[0].created_at
      } : null
    });

    if (error) {
      console.error('❌ Error fetching EMG sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 });
    }
    
    console.log('✅ Returning', data?.length || 0, 'EMG sessions');
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
      sessionName, 
      startedAt, 
      endedAt, 
      durationSeconds,
      readings,
      averageVoltage,
      maxVoltage
    } = body;

    if (!userId || !sessionName || !startedAt || !endedAt || typeof durationSeconds !== 'number') {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['userId', 'sessionName', 'startedAt', 'endedAt', 'durationSeconds']
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

    // Insert the session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('emg_sessions')
      .insert({
        user_id: userId,
        session_name: sessionName,
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        readings: readings || [],
        average_voltage: averageVoltage ?? null,
        max_voltage: maxVoltage ?? null,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error inserting EMG session:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to save session', 
        details: sessionError.message 
      }, { status: 500 });
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, sessionName } = body;
    
    if (!userId || !sessionId || !sessionName) {
      return NextResponse.json({ 
        error: 'User ID, Session ID, and Session Name are required' 
      }, { status: 400 });
    }

    if (typeof sessionName !== 'string' || sessionName.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Session Name must be a non-empty string' 
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

    // Update the session's session_name
    const { data: updatedSession, error } = await supabaseAdmin
      .from('emg_sessions')
      .update({ session_name: sessionName.trim() })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json({ 
        error: 'Failed to update session', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ data: updatedSession });
  } catch (e) {
    console.error('Unexpected error in PATCH:', e);
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

    // Delete the session
    const { error } = await supabaseAdmin
      .from('emg_sessions')
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

