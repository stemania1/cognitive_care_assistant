import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const query = supabase
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
    const { userId, questionId, questionText, answer, answerType = 'text', date } = body;

    if (!userId || !questionId || !questionText || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if answer already exists for this user, question, and date
    const { data: existing } = await supabase
      .from('daily_checks')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .eq('date', date || new Date().toISOString().split('T')[0])
      .single();

    let result;
    if (existing) {
      // Update existing answer
      result = await supabase
        .from('daily_checks')
        .update({
          answer,
          answer_type: answerType,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();
    } else {
      // Insert new answer
      result = await supabase
        .from('daily_checks')
        .insert({
          user_id: userId,
          question_id: questionId,
          question_text: questionText,
          answer,
          answer_type: answerType,
          date: date || new Date().toISOString().split('T')[0]
        })
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
