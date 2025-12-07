import { NextRequest } from 'next/server';
import { storeEMGData, storeCalibrationData, updateHeartbeat, getEMGData } from '@/lib/emg-data-store';

// Counter to ensure unique timestamps for rapid data
let timestampCounter = 0;

// ESP32 timestamp baseline tracking (for converting relative millis() to absolute timestamps)
let firstESP32Timestamp: number | null = null;
let firstServerTimestamp: number | null = null;

// Next.js route configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  const requestTime = Date.now();
  console.log('🔔 POST /api/emg/ws - Request received at:', new Date(requestTime).toISOString());
  
  try {
    // Log request details for debugging (but reduce frequency for non-emg_data)
    const bodyText = await request.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Failed to parse request body as JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }
    
    // Always log emg_data requests to track data flow
    if (body.type === 'emg_data') {
      console.log('📋 EMG Data Request:', {
        method: request.method,
        url: request.url,
        bodyType: body.type,
        hasBody: !!body,
        timestamp: body.timestamp,
        muscleActivity: body.muscleActivity,
        voltage: body.voltage,
        requestTime: new Date(requestTime).toISOString()
      });
    } else if (Math.random() < 0.1) {
      console.log('📋 Request details:', {
        method: request.method,
        url: request.url,
        bodyType: body.type,
        hasBody: !!body
      });
    }
    
    // Only log body parsing for non-emg_data occasionally
    if (body.type !== 'emg_data' || Math.random() < 0.1) {
      console.log('📦 Request body parsed:', {
        hasBody: !!body,
        bodyType: typeof body,
        bodyKeys: body ? Object.keys(body) : [],
        bodyPreview: body ? JSON.stringify(body).substring(0, 200) : 'no body'
      });
    }
    const { type, data, timestamp, muscleActivity, muscleActivityProcessed, voltage, calibrated } = body;
    
    // Log EVERY emg_data request to diagnose why data isn't being stored
    if (type === 'emg_data') {
      console.log('📥 EMG data received in Next.js API:', { 
        type, 
        timestamp, 
        muscleActivity, 
        voltage,
        processed: muscleActivityProcessed,
        hasVoltage: voltage !== undefined && voltage !== null,
        hasMuscleActivity: muscleActivity !== undefined && muscleActivity !== null
      });
    } else {
      // Log other types occasionally
      if (Math.random() < 0.1) {
        console.log('📥 Request received:', { type, timestamp });
      }
    }
    
    // Debug: Show voltage calculation details (only if valid data)
    if (type === 'emg_data' && muscleActivity !== undefined && typeof muscleActivity === 'number') {
      try {
        const calculatedVoltage = (muscleActivity * 3.3) / 4095.0;
        
        // Detect potential connection issues
        const isNearZero = calculatedVoltage < 0.1; // Less than 0.1V
        const isNearMax = calculatedVoltage > 2.9; // Greater than 2.9V (suspiciously high)
        const isExtreme = isNearZero || isNearMax;
        
        const voltageAnalysis: any = {
          muscleActivityRaw: muscleActivity,
          voltageFromESP32: voltage,
          calculatedVoltage: calculatedVoltage.toFixed(3) + 'V',
          difference: voltage !== undefined && typeof voltage === 'number' ? Math.abs(voltage - calculatedVoltage).toFixed(3) + 'V' : 'N/A',
        };
        
        if (isExtreme) {
          voltageAnalysis.warning = isNearZero 
            ? '⚠️ CRITICAL: Reading near 0V - possible disconnected sensor or loose connection!'
            : '⚠️ CRITICAL: Reading near 3V+ - possible sensor issue!';
          voltageAnalysis.troubleshooting = [
            '1. Check sensor connections (red, black, white wires)',
            '2. Ensure sensor is properly attached to skin with good contact',
            '3. Verify ESP32 power supply is stable (3.3V)',
            '4. Check for loose or damaged wires',
            '5. Try re-seating the sensor on the muscle',
            '6. If voltage is stuck at ~3V, sensor may be disconnected (floating input)',
            '7. Check if muscleActivity value is stuck at 4095 (max ADC reading)'
          ];
          if (isNearMax) {
            voltageAnalysis.sensorDiagnosis = `Sensor reading: ${muscleActivity} (max is 4095). If stuck at 4095, sensor is likely disconnected or there's a hardware issue.`;
          }
        } else if (calculatedVoltage < 0.5 || calculatedVoltage > 2.8) {
          voltageAnalysis.warning = '⚠️ Unusual voltage reading - may indicate connection issue';
        }
        
        console.log('🔌 Voltage Analysis:', voltageAnalysis);
        
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
        // Convert ESP32 millis() (relative) to absolute timestamp if needed
        // ESP32 millis() is typically 8-10 digits, Date.now() is 13 digits
        let absoluteTimestamp = timestamp || Date.now();
        
        // If timestamp is from ESP32 (millis), it's relative and needs conversion
        // We'll use the current server time as the reference
        // Note: This is approximate - ideally ESP32 should send absolute time
        if (timestamp && timestamp < 1000000000000) {
          // Timestamp is less than 13 digits, likely from ESP32 millis()
          // Convert to absolute by tracking the first ESP32 timestamp and calculating offset
          const now = Date.now();
          
          // On first ESP32 timestamp, establish the baseline
          if (firstESP32Timestamp === null) {
            firstESP32Timestamp = timestamp;
            firstServerTimestamp = now;
            console.log('🕐 Establishing ESP32 timestamp baseline:', {
              firstESP32Timestamp: firstESP32Timestamp,
              firstServerTimestamp: firstServerTimestamp,
              note: 'All future timestamps will be relative to this baseline'
            });
          }
          
          // Calculate absolute timestamp: server baseline + (ESP32 current - ESP32 baseline)
          // At this point, firstESP32Timestamp and firstServerTimestamp are guaranteed to be non-null
          const baselineESP32 = firstESP32Timestamp!;
          const baselineServer = firstServerTimestamp!;
          const esp32Elapsed = timestamp - baselineESP32;
          absoluteTimestamp = baselineServer + esp32Elapsed;
          
          // Ensure timestamps are always increasing (handle ESP32 resets)
          // Only reset if ESP32 timestamp went backwards significantly (more than 1 second)
          // This prevents false resets from small timestamp variations
          const lastData = getEMGData();
          const lastTimestamp = lastData.data.length > 0 ? lastData.data[lastData.data.length - 1].timestamp : 0;
          
          // Check if ESP32 timestamp went backwards (reset) or if calculated timestamp is too old
          const esp32WentBackwards = timestamp < baselineESP32 - 1000; // More than 1 second backwards
          const calculatedTimestampTooOld = absoluteTimestamp < lastTimestamp - 5000; // More than 5 seconds in the past
          
          if (esp32WentBackwards || calculatedTimestampTooOld) {
            // ESP32 may have reset, update baseline
            console.log('⚠️ ESP32 timestamp reset detected, updating baseline:', {
              esp32WentBackwards,
              calculatedTimestampTooOld,
              oldBaseline: firstESP32Timestamp,
              newBaseline: timestamp,
              oldServerBaseline: firstServerTimestamp,
              newServerBaseline: now
            });
            firstESP32Timestamp = timestamp;
            firstServerTimestamp = now;
            absoluteTimestamp = now;
          } else if (absoluteTimestamp <= lastTimestamp) {
            // Timestamp is not increasing, but not a reset - just ensure it's slightly ahead
            // This handles cases where multiple requests arrive simultaneously
            absoluteTimestamp = lastTimestamp + 1; // Ensure it's at least 1ms ahead
          }
          
          // Add microsecond-level offset to ensure uniqueness for simultaneous requests
          timestampCounter = (timestampCounter + 1) % 1000000; // Larger counter range
          absoluteTimestamp = absoluteTimestamp + (timestampCounter / 1000000); // Add 0-1ms offset
        } else {
          // Already an absolute timestamp (13+ digits), use as-is
          absoluteTimestamp = timestamp;
        }
        
        const emgEntry = {
          type: 'emg_data',
          timestamp: absoluteTimestamp,
          muscleActivity: muscleActivity,
          muscleActivityProcessed: muscleActivityProcessed,
          voltage: voltage,
          calibrated: calibrated
        };
        
        // Store in shared data store (this is the source of truth)
        console.log('💾 About to store EMG data:', {
          timestamp: emgEntry.timestamp,
          muscleActivity: emgEntry.muscleActivity,
          voltage: emgEntry.voltage
        });
        
        storeEMGData(emgEntry);
        
        // Update heartbeat on data receipt to reflect active device
        updateHeartbeat();
        
        // Get current data count from shared store IMMEDIATELY after storing
        const currentData = getEMGData();
        
        console.log('✅ EMG Data stored successfully:', {
          timestamp: emgEntry.timestamp,
          muscleActivity: emgEntry.muscleActivity,
          voltage: emgEntry.voltage,
          totalDataCount: currentData.dataCount,
          recentDataCount: currentData.data?.length || 0,
          timeSinceLastHeartbeat: currentData.timeSinceLastHeartbeat,
          isConnected: currentData.isConnected,
          lastHeartbeat: new Date(currentData.lastHeartbeat).toISOString(),
          verification: currentData.dataCount > 0 ? '✅ Data is in store' : '❌ WARNING: Data count is still 0!'
        });
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