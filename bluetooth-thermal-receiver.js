/**
 * Bluetooth Thermal Receiver for AMG8833
 * 
 * This script receives thermal data from the Raspberry Pi via Bluetooth Serial
 * and forwards it to the Next.js API endpoint
 * 
 * Requires: npm install serialport @serialport/parser-readline
 * 
 * Usage: node bluetooth-thermal-receiver.js <COM_PORT>
 * Example: node bluetooth-thermal-receiver.js COM9 (Windows)
 *          node bluetooth-thermal-receiver.js /dev/tty.Bluetooth-Incoming-Port (Mac)
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Configuration
const NEXTJS_API_URL = process.env.NEXTJS_API_URL || 'http://localhost:3000/api/thermal/bt';
const SERIAL_PORT = process.argv[2] || process.env.THERMAL_BLUETOOTH_PORT;

if (!SERIAL_PORT) {
  console.error('❌ Error: Serial port not specified!');
  console.log('\nUsage:');
  console.log('  node bluetooth-thermal-receiver.js <COM_PORT>');
  console.log('\nExamples:');
  console.log('  Windows: node bluetooth-thermal-receiver.js COM9');
  console.log('  Mac:     node bluetooth-thermal-receiver.js /dev/tty.Bluetooth-Incoming-Port');
  console.log('  Linux:   node bluetooth-thermal-receiver.js /dev/rfcomm0');
  console.log('\nTo find available ports:');
  console.log('  Windows: Check Device Manager > Ports (COM & LPT)');
  console.log('  Mac/Linux: ls /dev/tty.* or ls /dev/rfcomm*');
  process.exit(1);
}

console.log('🔵 Bluetooth Thermal Receiver for AMG8833');
console.log('==========================================');
console.log(`📡 Serial Port: ${SERIAL_PORT}`);
console.log(`🌐 Forwarding to: ${NEXTJS_API_URL}`);
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
  console.log('📥 Waiting for thermal data from Raspberry Pi...\n');
});

port.on('error', (err) => {
  console.error('❌ Serial port error:', err.message);
  console.error('   Make sure:');
  console.error('   1. Raspberry Pi is paired and connected');
  console.error('   2. The correct COM port is specified');
  console.error('   3. No other program is using this port');
  console.error('   4. bluetooth-thermal-sender.py is running on Raspberry Pi');
});

parser.on('data', async (line) => {
  try {
    // Parse JSON data from Raspberry Pi
    const data = JSON.parse(line.trim());
    
    // Log received data (not too frequently)
    if (data.type === 'thermal_data') {
      const now = Date.now();
      if (now - lastLog > 5000) { // Log every 5 seconds
        const avgTemp = data.thermal_data 
          ? (data.thermal_data.flat().reduce((a, b) => a + b, 0) / data.thermal_data.flat().length).toFixed(1)
          : 'N/A';
        console.log('📥 Received thermal data:', {
          avgTemp: `${avgTemp}°C`,
          gridSize: data.grid_size,
          timestamp: data.timestamp
        });
        lastLog = now;
      }
      
      // Forward to Next.js API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(NEXTJS_API_URL, {
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
          
          // Log success every 10th frame
          if (forwardStats.success % 10 === 0) {
            console.log('✅ Forwarded to Next.js API (every 10th):', {
              successCount: forwardStats.success,
              status: response.status
            });
          }
        } else {
          forwardStats.failures++;
          forwardStats.lastError = {
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          };
          console.error('❌ API returned error:', response.status, response.statusText);
        }
      } catch (fetchError) {
        forwardStats.failures++;
        forwardStats.lastError = {
          message: fetchError.message,
          timestamp: new Date().toISOString()
        };
        if (fetchError.name !== 'AbortError') {
          console.error('❌ Error forwarding to API:', fetchError.message);
        }
      }
    } else {
      console.log('📥 Received:', data.type, data);
    }
  } catch (parseError) {
    // If it's not JSON, just log it (might be debug output from Raspberry Pi)
    if (line.trim().length > 0 && !line.trim().startsWith('✅') && !line.trim().startsWith('📡')) {
      console.log('📄 Non-JSON data:', line.trim().substring(0, 100));
    }
  }
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n📊 Statistics:');
  console.log(`   Success: ${forwardStats.success}`);
  console.log(`   Failures: ${forwardStats.failures}`);
  if (forwardStats.lastError) {
    console.log('   Last Error:', forwardStats.lastError);
  }
  if (forwardStats.lastSuccess) {
    console.log('   Last Success:', forwardStats.lastSuccess);
  }
  console.log('\n👋 Closing Bluetooth connection...');
  port.close(() => {
    console.log('✅ Port closed. Goodbye!');
    process.exit(0);
  });
});

console.log('💡 Press Ctrl+C to stop\n');

