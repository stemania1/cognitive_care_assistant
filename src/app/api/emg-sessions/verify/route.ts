import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Diagnostic endpoint to verify EMG sessions table setup
 * GET /api/emg-sessions/verify
 */
export async function GET(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasServiceRoleKey: !!serviceRoleKey,
        serviceRoleKeyLength: serviceRoleKey?.length || 0,
        serviceRoleKeyPreview: serviceRoleKey 
          ? `${serviceRoleKey.substring(0, 10)}...${serviceRoleKey.substring(serviceRoleKey.length - 10)}`
          : 'NOT SET',
        hasSupabaseUrl: !!supabaseUrl,
        supabaseUrl: supabaseUrl || 'NOT SET',
      },
      table: {
        exists: false,
        error: null as string | null,
      },
      policies: {
        count: 0,
        details: [] as any[],
        error: null as string | null,
      },
      testInsert: {
        success: false,
        error: null as string | null,
        insertedId: null as string | null,
      },
      testQuery: {
        success: false,
        count: 0,
        error: null as string | null,
      }
    };

    // Check if service role key is configured
    if (!serviceRoleKey || serviceRoleKey === '<your-service-role-key>') {
      return NextResponse.json({
        ...diagnostics,
        error: 'Service role key not configured',
        message: 'Please set SUPABASE_SERVICE_ROLE_KEY in .env.local'
      }, { status: 500 });
    }

    if (!supabaseUrl) {
      return NextResponse.json({
        ...diagnostics,
        error: 'Supabase URL not configured',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL in .env.local'
      }, { status: 500 });
    }

    // Create admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if table exists by trying to query it
    try {
      const { data, error, count } = await supabaseAdmin
        .from('emg_sessions')
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        diagnostics.table.exists = false;
        diagnostics.table.error = error.message;
      } else {
        diagnostics.table.exists = true;
        diagnostics.testQuery.success = true;
        diagnostics.testQuery.count = count || 0;
      }
    } catch (e) {
      diagnostics.table.exists = false;
      diagnostics.table.error = e instanceof Error ? e.message : 'Unknown error';
    }

    // Check RLS policies
    try {
      const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('get_table_policies', { table_name: 'emg_sessions' });

      if (policiesError) {
        // Try alternative method: query pg_policies directly
        const { data: pgPolicies, error: pgError } = await supabaseAdmin
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'emg_sessions');

        if (!pgError && pgPolicies) {
          diagnostics.policies.count = pgPolicies.length;
          diagnostics.policies.details = pgPolicies;
        } else {
          diagnostics.policies.error = 'Cannot query policies (this is normal if RLS is enabled)';
        }
      } else if (policies) {
        diagnostics.policies.count = Array.isArray(policies) ? policies.length : 0;
        diagnostics.policies.details = policies;
      }
    } catch (e) {
      diagnostics.policies.error = e instanceof Error ? e.message : 'Unknown error';
    }

    // Test insert (will be rolled back)
    try {
      const testData = {
        user_id: 'test-verification-user',
        session_name: 'VERIFICATION TEST - DELETE ME',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 0,
        readings: [],
        average_voltage: 0,
        max_voltage: 0,
      };

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('emg_sessions')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        diagnostics.testInsert.success = false;
        diagnostics.testInsert.error = insertError.message;
        diagnostics.testInsert.errorCode = insertError.code;
        diagnostics.testInsert.errorDetails = insertError.details;
        diagnostics.testInsert.errorHint = insertError.hint;
      } else {
        diagnostics.testInsert.success = true;
        diagnostics.testInsert.insertedId = inserted?.id;

        // Clean up test record
        if (inserted?.id) {
          await supabaseAdmin
            .from('emg_sessions')
            .delete()
            .eq('id', inserted.id);
        }
      }
    } catch (e) {
      diagnostics.testInsert.success = false;
      diagnostics.testInsert.error = e instanceof Error ? e.message : 'Unknown error';
    }

    // Overall status
    const allChecksPassed = 
      diagnostics.table.exists &&
      diagnostics.testQuery.success &&
      diagnostics.testInsert.success;

    return NextResponse.json({
      ...diagnostics,
      status: allChecksPassed ? 'PASS' : 'FAIL',
      message: allChecksPassed 
        ? 'All checks passed! EMG sessions table is properly configured.'
        : 'Some checks failed. See details above.'
    }, { status: allChecksPassed ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined
    }, { status: 500 });
  }
}



