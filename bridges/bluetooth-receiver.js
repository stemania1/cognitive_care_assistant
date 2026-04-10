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
let SERIAL_PORT = process.argv[2] || process.env.BLUETOOTH_PORT;

/**
 * Auto-detect ESP32 Bluetooth port by scanning all available ports
 */
async function autoDetectPort() {
  console.log('🔍 Auto-detecting ESP32 Bluetooth port...\n');
  
  try {
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.error('❌ No serial ports found!');
      return null;
    }
    
    // Filter for Bluetooth ports (case-insensitive search)
    const bluetoothPorts = ports.filter(port => {
      const desc = (port.manufacturer || '').toLowerCase() + ' ' + (port.pnpId || '').toLowerCase();
      const path = port.path.toLowerCase();
      return desc.includes('bluetooth') || desc.includes('bt') || 
             path.includes('bluetooth') || path.includes('bt');
    });
    
    if (bluetoothPorts.length === 0) {
      console.error('❌ No Bluetooth ports found by name/description!');
      console.log('\n🔍 Will try all available ports instead...');
      console.log('\nAvailable ports:');
      ports.forEach(port => {
        console.log(`  - ${port.path} (${port.manufacturer || 'Unknown'} ${port.pnpId || ''})`);
      });
      console.log('');
      
      // Try all ports if no Bluetooth ports found by name
      for (const portInfo of ports) {
        const portName = portInfo.path;
        console.log(`🔌 Testing ${portName}...`);
        
        const foundPort = await testPort(portName);
        if (foundPort) {
          console.log(`\n✅ Found ESP32 on ${portName}!\n`);
          return portName;
        }
      }
      
      console.error('\n❌ Could not find ESP32 on any port.');
      console.log('\n💡 Troubleshooting:');
      console.log('  1. Make sure ESP32 is powered on');
      console.log('  2. Pair ESP32 in Windows: Settings → Bluetooth & devices');
      console.log('  3. Check Device Manager → Ports (COM & LPT) for the COM port');
      console.log('  4. Try manually: node bluetooth-receiver.js COM8 (use your COM port)');
      return null;
    }
    
    console.log(`📋 Found ${bluetoothPorts.length} Bluetooth port(s):`);
    bluetoothPorts.forEach(port => {
      console.log(`  - ${port.path} (${port.manufacturer || 'Unknown'})`);
    });
    console.log('');
    
    // Try each Bluetooth port to find the one receiving EMG data
    for (const portInfo of bluetoothPorts) {
      const portName = portInfo.path;
      console.log(`🔌 Testing ${portName} (waiting 3 seconds for data)...`);
      
      const foundPort = await testPort(portName);
      if (foundPort) {
        console.log(`\n✅ Found ESP32 on ${portName}!\n`);
        return portName;
      } else {
        console.log(`   ⚠️  ${portName}: No EMG data received\n`);
      }
    }
    
    console.error('\n❌ Could not find ESP32 on any Bluetooth port.');
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Make sure ESP32 is powered on');
    console.log('  2. Pair ESP32 in Windows: Settings → Bluetooth & devices → Pair "MyoWare_EMG"');
    console.log('  3. Check connection status: Settings → Bluetooth → Is "MyoWare_EMG" connected?');
    console.log('  4. Check Device Manager → Ports (COM & LPT) for the COM port number');
    console.log('  5. Try manually with COM port: node bluetooth-receiver.js COM8');
    console.log('  6. Check ESP32 Serial Monitor - is it sending data?');
    return null;
  } catch (error) {
    console.error('❌ Error scanning ports:', error.message);
    return null;
  }
}

/**
 * Test a port to see if it's receiving EMG data
 */
function testPort(portName) {
  return new Promise((resolve) => {
    const testPort = new SerialPort({
      path: portName,
      baudRate: 115200,
      autoOpen: false
    });
    
    const parser = testPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    let receivedData = false;
    let timeout;
    
    parser.on('data', (line) => {
      try {
        const data = JSON.parse(line.trim());
        if (data.type === 'emg_data' || data.muscleActivity !== undefined) {
          receivedData = true;
          clearTimeout(timeout);
          testPort.close(() => resolve(true));
        }
      } catch (e) {
        // Not JSON or not EMG data
      }
    });
    
    testPort.on('error', () => {
      clearTimeout(timeout);
      testPort.close(() => resolve(false));
    });
    
    testPort.on('open', () => {
      timeout = setTimeout(() => {
        if (!receivedData) {
          testPort.close(() => resolve(false));
        }
      }, 5000); // Wait 5 seconds for data (increased from 3)
    });
    
    testPort.open((err) => {
      if (err) {
        resolve(false);
      }
    });
  });
}

// Main execution
(async () => {
  // If no port specified, try to auto-detect
  if (!SERIAL_PORT) {
    SERIAL_PORT = await autoDetectPort();
    if (!SERIAL_PORT) {
      console.log('\n💡 You can also specify the port manually:');
      console.log('   node bluetooth-receiver.js COM8');
      process.exit(1);
    }
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
})();

