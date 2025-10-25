import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        usage: 'Add ?userId=YOUR_USER_ID to the URL'
      }, { status: 400 });
    }
    
    // Test both daily-checks and daily-check-sessions APIs
    const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
    
    const [dailyChecksResponse, sessionsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/daily-checks?userId=${userId}`),
      fetch(`${baseUrl}/api/daily-check-sessions?userId=${userId}`)
    ]);
    
    const dailyChecksData = await dailyChecksResponse.json();
    const sessionsData = await sessionsResponse.json();
    
    return NextResponse.json({
      userId,
      timestamp: new Date().toISOString(),
      dailyChecks: {
        status: dailyChecksResponse.status,
        data: dailyChecksData,
        count: dailyChecksData.data?.length || 0
      },
      sessions: {
        status: sessionsResponse.status,
        data: sessionsData,
        count: sessionsData.data?.length || 0
      },
      summary: {
        totalAnswers: dailyChecksData.data?.length || 0,
        totalSessions: sessionsData.data?.length || 0,
        hasData: (dailyChecksData.data?.length || 0) > 0 || (sessionsData.data?.length || 0) > 0
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
