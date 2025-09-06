import { NextRequest } from 'next/server';

// WebSocket endpoint for MyoWare 2.0 data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'connect') {
    // Handle WebSocket connection
    return new Response('WebSocket connection established', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  return new Response('EMG WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Handle WebSocket upgrade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    // Handle different message types from MyoWare client
    switch (type) {
      case 'emg_data':
        // Process EMG data
        console.log('Received EMG data:', data);
        return new Response(JSON.stringify({ status: 'received' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      case 'calibration_data':
        // Process calibration data
        console.log('Received calibration data:', data);
        return new Response(JSON.stringify({ status: 'calibrated' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      case 'heartbeat':
        // Handle heartbeat
        console.log('Received heartbeat:', data);
        return new Response(JSON.stringify({ status: 'alive' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      default:
        return new Response(JSON.stringify({ error: 'Unknown message type' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
    }
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
