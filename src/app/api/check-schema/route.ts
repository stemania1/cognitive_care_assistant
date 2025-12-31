import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE SCHEMA CHECK ===');
    
    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      return NextResponse.json({ 
        error: adminError?.message || 'Missing environment variables',
        details: adminError?.details
      }, { status: 500 });
    }

    // Check daily_checks table schema
    const { data: dailyChecksSchema, error: dailyChecksError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'daily_checks')
      .eq('column_name', 'user_id');

    // Check daily_check_sessions table schema
    const { data: sessionsSchema, error: sessionsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'daily_check_sessions')
      .eq('column_name', 'user_id');

    // Check if there are any sessions in the database
    const { data: sessions, error: sessionsDataError } = await supabaseAdmin
      .from('daily_check_sessions')
      .select('id, user_id, date, created_at')
      .limit(5);

    // Check if there are any daily checks in the database
    const { data: dailyChecks, error: dailyChecksDataError } = await supabaseAdmin
      .from('daily_checks')
      .select('id, user_id, question_id, date, created_at')
      .limit(5);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      dailyChecksSchema: {
        data: dailyChecksSchema,
        error: dailyChecksError?.message
      },
      sessionsSchema: {
        data: sessionsSchema,
        error: sessionsError?.message
      },
      sampleSessions: {
        data: sessions,
        error: sessionsDataError?.message,
        count: sessions?.length || 0
      },
      sampleDailyChecks: {
        data: dailyChecks,
        error: dailyChecksDataError?.message,
        count: dailyChecks?.length || 0
      },
      summary: {
        dailyChecksUserIdType: dailyChecksSchema?.[0]?.data_type || 'unknown',
        sessionsUserIdType: sessionsSchema?.[0]?.data_type || 'unknown',
        hasSessions: (sessions?.length || 0) > 0,
        hasDailyChecks: (dailyChecks?.length || 0) > 0
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Schema check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
