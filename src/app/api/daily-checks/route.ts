import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
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

    const query = supabaseAdmin
      .from('daily_checks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (date) {
      query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily checks:', error);
      return NextResponse.json({ error: 'Failed to fetch daily checks' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in daily checks GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const body = await request.json();
    const { userId, date } = body;
    if (!userId || !date) {
      return NextResponse.json({ error: 'User ID and date are required' }, { status: 400 });
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

    const { error } = await supabaseAdmin
      .from('daily_checks')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);

    if (error) return NextResponse.json({ error: 'Failed to delete daily checks' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
