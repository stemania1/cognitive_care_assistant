import { NextRequest } from 'next/server';

// Store the last command sent (in a real implementation, this would be sent to the sensor)
let lastCommand: string | null = null;
let commandTimestamp: number | null = null;

// Store calibration data for real-time chart
let calibrationData: {
  rawValue: number;
  min: number;
  max: number;
  progress: number;
  timestamp: number;
} | null = null;

export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST request received to /api/emg/command');
    const body = await request.json();
    console.log('📦 Request body:', body);
    const { command, calibrationData: calData } = body;
    
    // Handle calibration data from sensor
    if (calData) {
      calibrationData = {
        rawValue: calData.rawValue || 0,
        min: calData.min || 0,
        max: calData.max || 0,
        progress: calData.progress || 0,
        timestamp: Date.now()
      };
      
      console.log('Calibration data received:', calibrationData);
      
      return new Response(JSON.stringify({ 
        status: 'calibration_data_received',
        timestamp: Date.now()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    if (!command) {
      return new Response(JSON.stringify({ error: 'Command is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Store the command
    lastCommand = command.toUpperCase();
    commandTimestamp = Date.now();
    
    console.log('✅ Command stored:', lastCommand, 'at', new Date(commandTimestamp).toISOString());
    
    // In a real implementation, this would send the command to the ESP32
    // For now, we'll just store it and the ESP32 can poll for commands
    
    return new Response(JSON.stringify({ 
      status: 'command_received', 
      command: lastCommand,
      timestamp: commandTimestamp
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error processing command:', error);
    return new Response(JSON.stringify({ error: 'Failed to process command' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function GET(request: NextRequest) {
  // Allow ESP32 to poll for commands
  const response = {
    command: lastCommand,
    timestamp: commandTimestamp,
    hasCommand: lastCommand !== null,
    calibrationData: calibrationData
  };
  
  // Debug logging
  if (lastCommand) {
    console.log('📤 GET: Sending command to ESP32:', lastCommand);
  }
  
  // Clear the command after it's been retrieved, but keep it available for 10 seconds
  if (lastCommand && commandTimestamp && (Date.now() - commandTimestamp > 10000)) {
    console.log('⏰ Clearing old command:', lastCommand);
    lastCommand = null;
    commandTimestamp = null;
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
