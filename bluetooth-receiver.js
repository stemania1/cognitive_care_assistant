/**
 * Bluetooth Receiver for MyoWare EMG Data
 * 
 * This script receives data from the ESP32 via Bluetooth Serial
 * and forwards it to the EMG server HTTP API
 * 
 * Requires: npm install serialport
 * 
 * Usage: node bluetooth-receiver.js <COM_PORT>
 * Example: node bluetooth-receiver.js COM3 (Windows)
 *          node bluetooth-receiver.js /dev/tty.Bluetooth-Incoming-Port (Mac)
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
// Node.js 18+ has native fetch, no need for node-fetch

// Configuration
const EMG_SERVER_URL = process.env.EMG_SERVER_URL || 'http://localhost:3001/api/emg/ws';
const SERIAL_PORT = process.argv[2] || process.env.BLUETOOTH_PORT;

if (!SERIAL_PORT) {
  console.error('❌ Error: Serial port not specified!');
  console.log('\nUsage:');
  console.log('  node bluetooth-receiver.js <COM_PORT>');
  console.log('\nExamples:');
  console.log('  Windows: node bluetooth-receiver.js COM3');
  console.log('  Mac:     node bluetooth-receiver.js /dev/tty.Bluetooth-Incoming-Port');
  console.log('  Linux:   node bluetooth-receiver.js /dev/rfcomm0');
  console.log('\nTo find available ports:');
  console.log('  Windows: Check Device Manager > Ports (COM & LPT)');
  console.log('  Mac/Linux: ls /dev/tty.* or ls /dev/rfcomm*');
  process.exit(1);
}

console.log('🔵 Bluetooth Receiver for MyoWare EMG Data');
console.log('==========================================');
console.log(`📡 Serial Port: ${SERIAL_PORT}`);
console.log(`🌐 Forwarding to: ${EMG_SERVER_URL}`);
console.log('');

// Create serial port connection
const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: 115200,
  autoOpen: true
});

// Create parser for reading line-delimited JSON
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

let forwardStats = {
  success: 0,
  failures: 0,
  lastError: null,
  lastSuccess: null
};

let lastLog = 0; // Track last log time to avoid spam

port.on('open', () => {
  console.log('✅ Bluetooth Serial port opened successfully!');
  console.log('📥 Waiting for data from ESP32...\n');
});

port.on('error', (err) => {
  console.error('❌ Serial port error:', err.message);
  console.error('   Make sure:');
  console.error('   1. The ESP32 is paired and connected');
  console.error('   2. The correct COM port is specified');
  console.error('   3. No other program is using this port');
});

parser.on('data', async (line) => {
  try {
    // Parse JSON data from ESP32
    const data = JSON.parse(line.trim());
    
    // Log received data (only for emg_data, and not too frequently)
    if (data.type === 'emg_data') {
      const now = Date.now();
      if (now - lastLog > 5000) {
        console.log('📥 Received EMG data:', {
          muscleActivity: data.muscleActivity,
          voltage: data.voltage?.toFixed(3),
          timestamp: data.timestamp
        });
        lastLog = now;
      }
    } else {
      console.log('📥 Received:', data.type, data);
    }
    
    // Forward to EMG server HTTP API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(EMG_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        forwardStats.success++;
        forwardStats.lastSuccess = new Date().toISOString();
        
        if (data.type === 'emg_data' && forwardStats.success % 10 === 0) {
          const result = await response.json();
          console.log('✅ Forwarded to EMG server:', {
            dataCount: result.dataCount,
            successCount: forwardStats.success
          });
        }
      } else {
        forwardStats.failures++;
        forwardStats.lastError = {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        };
        console.error('❌ Server returned error:', response.status, response.statusText);
      }
    } catch (fetchError) {
      forwardStats.failures++;
      forwardStats.lastError = {
        message: fetchError.message,
        timestamp: new Date().toISOString()
      };
      console.error('❌ Error forwarding to server:', fetchError.message);
    }
  } catch (parseError) {
    // If it's not JSON, just log it (might be debug output from ESP32)
    if (line.trim().length > 0 && !line.trim().startsWith('✅') && !line.trim().startsWith('📡')) {
      console.log('📄 Non-JSON data:', line.trim());
    }
  }
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n📊 Statistics:');
  console.log(`   Success: ${forwardStats.success}`);
  console.log(`   Failures: ${forwardStats.failures}`);
  console.log('\n👋 Closing Bluetooth connection...');
  port.close(() => {
    console.log('✅ Port closed. Goodbye!');
    process.exit(0);
  });
});

console.log('💡 Press Ctrl+C to stop\n');

