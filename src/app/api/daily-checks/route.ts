import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DAILY CHECKS GET REQUEST ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');

    console.log('Request params:', { date, userId });

    if (!userId) {
      console.log('ERROR: Missing userId parameter');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create a Supabase client with service role key for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    console.log('Environment check:', {
      hasServiceRoleKey: !!serviceRoleKey,
      hasSupabaseUrl: !!supabaseUrl,
      serviceRoleKeyLength: serviceRoleKey?.length || 0
    });

    if (!serviceRoleKey || serviceRoleKey === '<your-service-role-key>') {
      console.log('Service role key not configured properly');
      return NextResponse.json({ 
        error: 'Service role key not configured', 
        details: 'Please create .env.local file with SUPABASE_SERVICE_ROLE_KEY. See README for setup instructions.' 
      }, { status: 500 });
    }

    if (!supabaseUrl) {
      console.log('Supabase URL not configured');
      return NextResponse.json({ 
        error: 'Supabase URL not configured', 
        details: 'Please create .env.local file with NEXT_PUBLIC_SUPABASE_URL. See README for setup instructions.' 
      }, { status: 500 });
    }

    console.log('Creating Supabase admin client');
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

    console.log('Building query for daily_checks table');
    const query = supabaseAdmin
      .from('daily_checks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (date) {
      query.eq('date', date);
    }

    console.log('Executing Supabase query');
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch daily checks', 
        details: error.message || 'Database query failed' 
      }, { status: 500 });
    }

    console.log('Query successful, returning data:', data?.length || 0, 'records');
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Unexpected error in daily checks GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questionId, questionText, answer, answerType = 'text', date, photoUrl } = body;

    if (!userId || !questionId || !questionText || !answer) {
      const missing = [];
      if (!userId) missing.push('userId');
      if (!questionId) missing.push('questionId');
      if (!questionText) missing.push('questionText');
      if (!answer) missing.push('answer');
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: `Missing: ${missing.join(', ')}` 
      }, { status: 400 });
    }

    // Create a Supabase client with service role key for admin operations
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

    // Check if answer already exists for this user, question, and date
    const { data: existing } = await supabaseAdmin
      .from('daily_checks')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .eq('date', date || new Date().toISOString().split('T')[0])
      .single();

    let result;
    if (existing) {
      // Update existing answer
      const updateData: any = {
        answer,
        answer_type: answerType,
        updated_at: new Date().toISOString()
      };
      if (photoUrl !== undefined) {
        updateData.photo_url = photoUrl;
      }
      result = await supabaseAdmin
        .from('daily_checks')
        .update(updateData)
        .eq('id', existing.id)
        .select();
    } else {
      // Insert new answer
      const insertData: any = {
        user_id: userId,
        question_id: questionId,
        question_text: questionText,
        answer,
        answer_type: answerType,
        date: date || new Date().toISOString().split('T')[0]
      };
      if (photoUrl) {
        insertData.photo_url = photoUrl;
      }
      result = await supabaseAdmin
        .from('daily_checks')
        .insert(insertData)
        .select();
    }

    if (result.error) {
      console.error('Error saving daily check:', result.error);
      return NextResponse.json({ 
        error: 'Failed to save daily check', 
        details: result.error.message || 'Unknown database error' 
      }, { status: 500 });
    }

    return NextResponse.json({ data: result.data[0] });
  } catch (error) {
    console.error('Error in daily checks POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create a Supabase client with service role key for admin operations
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

    if (entryId) {
      // Delete specific entry (for photo deletion)
      const { data: entry, error: fetchError } = await supabaseAdmin
        .from('daily_checks')
        .select('photo_url, user_id')
        .eq('id', entryId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
      }

      // Delete photo from storage if it exists
      if (entry.photo_url) {
        try {
          // Extract file path from URL
          const url = new URL(entry.photo_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.findIndex(part => part === 'daily-check-photos');
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            
            const { error: storageError } = await supabaseAdmin.storage
              .from('daily-check-photos')
              .remove([filePath]);

            if (storageError) {
              console.warn('Failed to delete photo from storage:', storageError);
              // Continue with database deletion even if storage deletion fails
            }
          }
        } catch (error) {
          console.warn('Error parsing photo URL for deletion:', error);
          // Continue with database deletion
        }
      }

      // Delete the database entry
      const { error: deleteError } = await supabaseAdmin
        .from('daily_checks')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else {
      // Legacy behavior: delete all entries for a date (keeping for backward compatibility)
      console.log('=== DELETE DAILY CHECKS API DEBUG ===');
      const body = await request.json();
      console.log('Request body:', body);
      const { date } = body;
      console.log('Date to delete:', date);
      
      if (!date) {
        console.log('Date is required for bulk deletion');
        return NextResponse.json({ error: 'Date is required for bulk deletion' }, { status: 400 });
      }

      console.log('Attempting to delete daily checks from database');
      console.log('Query: DELETE FROM daily_checks WHERE user_id =', userId, 'AND date =', date);
      
      const { error } = await supabaseAdmin
        .from('daily_checks')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);

      console.log('Delete result error:', error);
      
      if (error) {
        console.error('Database delete error:', error);
        return NextResponse.json({ error: 'Failed to delete daily checks', details: error.message }, { status: 500 });
      }
      
      console.log('Daily checks deleted successfully');
      return NextResponse.json({ success: true });
    }
  } catch (e) {
    console.error('Error in daily checks DELETE:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
