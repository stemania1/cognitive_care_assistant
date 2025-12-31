import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Number(searchParams.get('limit') || '14');
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // Create a Supabase client with service role key for admin operations
    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json({ 
        error: adminError?.message || 'Service role key not configured', 
        details: adminError?.details || 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' 
      }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('daily_check_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, setStartIndex, durationMs } = body;
    if (!userId || typeof setStartIndex !== 'number' || typeof durationMs !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a Supabase client with service role key for admin operations
    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json({ 
        error: adminError?.message || 'Service role key not configured', 
        details: adminError?.details || 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' 
      }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('daily_check_sessions')
      .insert({
        user_id: userId,
        date: date || new Date().toISOString().split('T')[0],
        set_start_index: setStartIndex,
        duration_ms: durationMs,
      })
      .select();

    if (error) return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    return NextResponse.json({ data: data?.[0] });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DELETE SESSION API DEBUG ===');
    const body = await request.json();
    console.log('Request body:', body);
    const { userId, sessionId } = body;
    console.log('UserId:', userId, 'SessionId:', sessionId);
    
    if (!userId || !sessionId) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'User ID and Session ID are required' }, { status: 400 });
    }

    // Create a Supabase client with service role key for admin operations
    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      console.log('Service role key not configured');
      return NextResponse.json({ 
        error: adminError?.message || 'Service role key not configured', 
        details: adminError?.details || 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' 
      }, { status: 500 });
    }

    console.log('Attempting to delete session from database');
    console.log('Query: DELETE FROM daily_check_sessions WHERE id =', sessionId, 'AND user_id =', userId);
    
    const { error } = await supabaseAdmin
      .from('daily_check_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    console.log('Delete result error:', error);
    
    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json({ error: 'Failed to delete session', details: error.message }, { status: 500 });
    }
    
    console.log('Session deleted successfully');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Unexpected error in DELETE:', e);
    return NextResponse.json({ error: 'Internal server error', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}


