import { NextRequest } from 'next/server';
import { storeEMGData, storeCalibrationData, updateHeartbeat, getEMGData } from '@/lib/emg-data-store';

export async function GET(request: NextRequest) {
  const emgDataState = getEMGData();
  return new Response(JSON.stringify({
    status: 'EMG WebSocket server running',
    connectedDevices: 1,
    timestamp: Date.now(),
    dataCount: emgDataState.dataCount,
    lastHeartbeat: emgDataState.lastHeartbeat
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
        
        // Store in shared data store (this is the source of truth)
        storeEMGData(emgEntry);
        // Update heartbeat on data receipt to reflect active device
        updateHeartbeat();
        
        // Get current data count from shared store
        const currentData = getEMGData();
        
        console.log('EMG Data stored:', emgEntry, 'Total data count:', currentData.dataCount);
        return new Response(JSON.stringify({ 
          status: 'received', 
          timestamp: Date.now(),
          dataCount: currentData.dataCount,
          isConnected: true
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      case 'calibration_data':
        // Store calibration data
        const calibrationEntry = {
          min: data?.min || body.min,
          max: data?.max || body.max,
          range: data?.range || body.range,
          timestamp: Date.now()
        };
        
        storeCalibrationData(calibrationEntry);
        console.log('Calibration Data stored:', calibrationEntry);
        return new Response(JSON.stringify({ 
          status: 'calibrated', 
          timestamp: Date.now(),
          calibration: calibrationEntry 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
        
      case 'heartbeat':
        // Update heartbeat
        updateHeartbeat();
        const heartbeatData = getEMGData();
        console.log('Heartbeat received:', data);
        return new Response(JSON.stringify({ 
          status: 'alive', 
          timestamp: Date.now(),
          lastHeartbeat: heartbeatData.lastHeartbeat 
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