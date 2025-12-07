import { NextRequest } from 'next/server';
import { getEMGData } from '@/lib/emg-data-store';

export async function GET(request: NextRequest) {
  try {
    const data = getEMGData();
    
    // Log every request to debug connection issues
    console.log('📊 GET /api/emg/data:', {
      dataCount: data.dataCount,
      isConnected: data.isConnected,
      timeSinceLastHeartbeat: data.timeSinceLastHeartbeat,
      recentDataCount: data.data?.length || 0,
      lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat).toISOString() : 'never',
      latestDataTimestamp: data.data && data.data.length > 0 ? new Date(data.data[data.data.length - 1].timestamp).toISOString() : 'no data',
      latestDataAge: data.data && data.data.length > 0 ? ((Date.now() - data.data[data.data.length - 1].timestamp) / 1000).toFixed(1) + 's' : 'N/A'
    });
    
    return new Response(JSON.stringify({
      status: 'success',
      ...data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Error in GET /api/emg/data:', error);
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      dataCount: 0,
      isConnected: false,
      timeSinceLastHeartbeat: Infinity
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
