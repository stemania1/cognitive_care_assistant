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
    
    // Test with both the provided userId and a proper UUID format
    const testUuid = '123e4567-e89b-12d3-a456-426614174000';
    const apiUrl = `/api/daily-checks?userId=${userId}${date ? `&date=${date}` : ''}`;
    const uuidApiUrl = `/api/daily-checks?userId=${testUuid}${date ? `&date=${date}` : ''}`;
    
    console.log('Testing API URL:', apiUrl);
    console.log('Testing UUID API URL:', uuidApiUrl);
    
    try {
      // Test both URLs
      const [response, uuidResponse] = await Promise.all([
        fetch(`http://localhost:${process.env.PORT || 3000}${apiUrl}`),
        fetch(`http://localhost:${process.env.PORT || 3000}${uuidApiUrl}`)
      ]);
      
      console.log('API Response Status:', response.status);
      console.log('UUID API Response Status:', uuidResponse.status);
      
      const responseText = await response.text();
      const uuidResponseText = await uuidResponse.text();
      
      console.log('API Response Body (raw):', responseText);
      console.log('UUID API Response Body (raw):', uuidResponseText);
      
      let responseData, uuidResponseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('API Response Body (parsed):', responseData);
      } catch (parseError) {
        console.log('Failed to parse response as JSON:', parseError);
        responseData = { raw: responseText };
      }
      
      try {
        uuidResponseData = JSON.parse(uuidResponseText);
        console.log('UUID API Response Body (parsed):', uuidResponseData);
      } catch (parseError) {
        console.log('Failed to parse UUID response as JSON:', parseError);
        uuidResponseData = { raw: uuidResponseText };
      }
      
      return NextResponse.json({
        test: 'Direct API test',
        originalTest: {
          apiUrl,
          responseStatus: response.status,
          responseData,
          success: response.ok
        },
        uuidTest: {
          apiUrl: uuidApiUrl,
          responseStatus: uuidResponse.status,
          responseData: uuidResponseData,
          success: uuidResponse.ok
        }
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
