import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing configuration...');
    
    // Check environment variables
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hcaptchaKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    
    const config = {
      hasServiceRoleKey: !!serviceRoleKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!anonKey,
      hasHcaptchaKey: !!hcaptchaKey,
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
      supabaseUrlLength: supabaseUrl?.length || 0,
      anonKeyLength: anonKey?.length || 0,
      hcaptchaKeyLength: hcaptchaKey?.length || 0,
      supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not set',
      hcaptchaKeyPreview: hcaptchaKey ? hcaptchaKey.substring(0, 20) + '...' : 'Not set',
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('HCAPTCHA') || key.includes('SUPABASE')),
    };
    
    console.log('Configuration check:', config);
    
    // Test Supabase connection
    if (serviceRoleKey && supabaseUrl) {
      try {
        console.log('Testing Supabase connection...');
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
        
        // Test a simple query to verify connection
        const { data, error } = await supabaseAdmin
          .from('daily_checks')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error('Supabase connection test failed:', error);
          return NextResponse.json({
            config,
            supabaseTest: {
              success: false,
              error: error.message,
              code: error.code,
              details: error.details
            }
          });
        }
        
        console.log('Supabase connection test successful');
        return NextResponse.json({
          config,
          supabaseTest: {
            success: true,
            message: 'Connection successful',
            data: data
          }
        });
        
      } catch (connectionError) {
        console.error('Supabase connection error:', connectionError);
        return NextResponse.json({
          config,
          supabaseTest: {
            success: false,
            error: connectionError instanceof Error ? connectionError.message : 'Unknown connection error'
          }
        });
      }
    }
    
    return NextResponse.json({
      config,
      supabaseTest: {
        success: false,
        error: 'Missing Supabase configuration'
      }
    });
    
  } catch (error) {
    console.error('Configuration test error:', error);
    return NextResponse.json({
      error: 'Configuration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
