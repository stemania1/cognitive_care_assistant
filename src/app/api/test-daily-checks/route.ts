import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DAILY CHECKS API TEST ===');
    console.log('Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    
    console.log('Parameters:', { userId, date });
    
    if (!userId) {
      console.log('ERROR: No userId provided');
      return NextResponse.json({ 
        error: 'User ID is required',
        test: 'Direct API test - missing userId'
      }, { status: 400 });
    }
    
    // Test the actual daily-checks API
    const apiUrl = `/api/daily-checks?userId=${userId}${date ? `&date=${date}` : ''}`;
    console.log('Testing API URL:', apiUrl);
    
    try {
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}${apiUrl}`);
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('API Response Body (raw):', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('API Response Body (parsed):', responseData);
      } catch (parseError) {
        console.log('Failed to parse response as JSON:', parseError);
        responseData = { raw: responseText };
      }
      
      return NextResponse.json({
        test: 'Direct API test',
        apiUrl,
        responseStatus: response.status,
        responseData,
        success: response.ok
      });
      
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({
        test: 'Direct API test',
        error: 'Failed to fetch daily-checks API',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      test: 'Direct API test',
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
