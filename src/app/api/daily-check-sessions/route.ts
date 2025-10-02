import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = Number(searchParams.get('limit') || '14');
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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


