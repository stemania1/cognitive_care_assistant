import { NextRequest, NextResponse } from 'next/server';
import { storeThermalData, getThermalData } from '@/lib/thermal-data-store';

export const runtime = "nodejs";

/**
 * POST endpoint to receive thermal data from Bluetooth receiver
 * Similar to /api/emg/ws for EMG data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.thermal_data || !Array.isArray(body.thermal_data)) {
      return NextResponse.json(
        { error: 'Invalid data: thermal_data is required and must be an array' },
        { status: 400 }
      );
    }
    
    // Convert ISO timestamp to number if needed
    const timestamp = typeof body.timestamp === 'string' 
      ? new Date(body.timestamp).getTime()
      : (body.timestamp || Date.now());
    
    // Build thermal data object matching expected format
    const thermalData = {
      type: body.type || 'thermal_data',
      timestamp: timestamp,
      thermal_data: body.thermal_data,
      sensor_info: body.sensor_info || {
        model: 'AMG8833',
        temperature_unit: 'C',
        data_source: 'sensor'
      },
      grid_size: body.grid_size || { width: 8, height: 8 },
      status: body.status || 'active'
    };
    
    // Store in memory
    storeThermalData(thermalData);
    
    const stored = getThermalData();
    
    console.log('✅ Thermal data stored via Bluetooth:', {
      timestamp: new Date(timestamp).toISOString(),
      gridSize: thermalData.grid_size,
      isConnected: stored.isConnected,
      timeSinceLastUpdate: stored.timeSinceLastUpdate < Infinity 
        ? `${(stored.timeSinceLastUpdate / 1000).toFixed(1)}s` 
        : 'N/A'
    });
    
    return NextResponse.json({
      status: 'received',
      timestamp: Date.now(),
      isConnected: stored.isConnected
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('❌ Error processing thermal data:', error);
    return NextResponse.json(
      { 
        error: 'Invalid JSON or data format',
        details: error.message 
      },
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * GET endpoint to retrieve latest thermal data
 * Similar to /api/emg/data for EMG data
 */
export async function GET(request: NextRequest) {
  try {
    const data = getThermalData();
    
    if (!data.data) {
      return NextResponse.json({
        status: 'no_data',
        isConnected: false,
        data: null,
        timeSinceLastUpdate: Infinity
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return NextResponse.json({
      status: 'success',
      ...data.data,
      isConnected: data.isConnected,
      timeSinceLastUpdate: data.timeSinceLastUpdate,
      lastUpdateTime: data.lastUpdateTime
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('❌ Error getting thermal data:', error);
    return NextResponse.json(
      { error: 'Failed to get thermal data', details: error.message },
      { status: 500 }
    );
  }
}

