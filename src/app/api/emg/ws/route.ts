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
  console.log('🔔 POST /api/emg/ws - Request received at:', new Date().toISOString());
  console.log('🔔 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.json();
    console.log('🔔 POST /api/emg/ws - Request body:', JSON.stringify(body, null, 2));
    
    const { type, data, timestamp, muscleActivity, muscleActivityProcessed, voltage, calibrated } = body;
    
    console.log('📥 Received EMG data:', { 
      type, 
      data, 
      timestamp, 
      muscleActivity, 
      muscleActivityProcessed,
      voltage,
      voltageCalculation: voltage !== undefined ? `ESP32 sent: ${voltage}V` : `Not provided, will calculate from muscleActivity`
    });
    
    // Debug: Show voltage calculation details (only if valid data)
    if (type === 'emg_data' && muscleActivity !== undefined && typeof muscleActivity === 'number') {
      try {
        const calculatedVoltage = (muscleActivity * 3.3) / 4095.0;
        console.log('🔌 Voltage Analysis:', {
          muscleActivityRaw: muscleActivity,
          voltageFromESP32: voltage,
          calculatedVoltage: calculatedVoltage.toFixed(3) + 'V',
          difference: voltage !== undefined && typeof voltage === 'number' ? Math.abs(voltage - calculatedVoltage).toFixed(3) + 'V' : 'N/A',
          isConstant: '⚠️ Check if muscleActivity is varying - constant values indicate sensor issue'
        });
        
        // Track if values are constant (potential issue)
        if (typeof muscleActivity === 'number') {
          // This will help identify if the sensor is stuck at one value
          console.log('📊 Data variation check - muscleActivity:', muscleActivity, 
            '(If this number doesn\'t change, the ESP32 sensor is reading constant values)');
        }
      } catch (err) {
        console.warn('Error in voltage analysis:', err);
      }
    }
    
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
    console.error('❌ Error processing EMG message:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return new Response(JSON.stringify({ 
      error: 'Invalid request',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}