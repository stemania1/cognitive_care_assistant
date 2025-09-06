import { NextRequest } from 'next/server';
import { storeEMGData, storeCalibrationData, updateHeartbeat } from '@/lib/emg-data-store';

// EMG data storage (in production, use a database)
let emgData: any[] = [];
let calibrationData: any = null;
let lastHeartbeat = Date.now();

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({
    status: 'EMG WebSocket server running',
    connectedDevices: 1,
    timestamp: Date.now(),
    dataCount: emgData.length,
    lastHeartbeat: lastHeartbeat
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, timestamp, muscleActivity, muscleActivityProcessed, voltage, calibrated } = body;
    
    console.log('Received EMG data:', { type, data, timestamp, muscleActivity, muscleActivityProcessed });
    
    // Handle different message types from MyoWare client
    switch (type) {
      case 'emg_data':
        // Store EMG data
        const emgEntry = {
          type: 'emg_data',
          timestamp: timestamp || Date.now(),
          muscleActivity: muscleActivity,
          muscleActivityProcessed: muscleActivityProcessed,
          voltage: voltage,
          calibrated: calibrated
        };
        
        emgData.push(emgEntry);
        storeEMGData(emgEntry);
        // Update heartbeat on data receipt to reflect active device
        lastHeartbeat = Date.now();
        updateHeartbeat();
        
        // Keep only last 1000 entries
        if (emgData.length > 1000) {
          emgData = emgData.slice(-1000);
        }
        
        console.log('EMG Data stored:', emgEntry);
        return new Response(JSON.stringify({ 
          status: 'received', 
          timestamp: Date.now(),
          dataCount: emgData.length 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      case 'calibration_data':
        // Store calibration data
        calibrationData = {
          min: data?.min || body.min,
          max: data?.max || body.max,
          range: data?.range || body.range,
          timestamp: Date.now()
        };
        
        storeCalibrationData(calibrationData);
        console.log('Calibration Data stored:', calibrationData);
        return new Response(JSON.stringify({ 
          status: 'calibrated', 
          timestamp: Date.now(),
          calibration: calibrationData 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      case 'heartbeat':
        // Update heartbeat
        lastHeartbeat = Date.now();
        updateHeartbeat();
        console.log('Heartbeat received:', data);
        return new Response(JSON.stringify({ 
          status: 'alive', 
          timestamp: Date.now(),
          lastHeartbeat: lastHeartbeat 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      case 'test':
        // Handle test messages
        console.log('Test message received:', data);
        return new Response(JSON.stringify({ 
          status: 'test_received', 
          message: 'Hello from EMG server!',
          timestamp: Date.now() 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      default:
        return new Response(JSON.stringify({ error: 'Unknown message type' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
    }
  } catch (error) {
    console.error('Error processing EMG message:', error);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}