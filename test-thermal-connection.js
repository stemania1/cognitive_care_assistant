/**
 * Test Thermal Bluetooth Connection Script
 * This script helps diagnose Raspberry Pi thermal sensor Bluetooth connection issues
 * Run: node test-thermal-connection.js [COM_PORT]
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const TEST_PORT = process.argv[2];

console.log('');
console.log('========================================');
console.log('Raspberry Pi Thermal Sensor Bluetooth Test');
console.log('========================================');
console.log('');

async function testConnection() {
  // Step 1: List all ports
  console.log('📋 Step 1: Scanning for available ports...');
  console.log('');
  
  try {
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.error('❌ No serial ports found!');
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('   1. Make sure Raspberry Pi is powered on');
      console.log('   2. Connect Raspberry Pi via USB or pair via Bluetooth');
      console.log('   3. Check Device Manager → Ports (COM & LPT)');
      return;
    }
    
    console.log(`✅ Found ${ports.length} port(s):`);
    ports.forEach(port => {
      console.log(`   - ${port.path}`);
      console.log(`     Manufacturer: ${port.manufacturer || 'Unknown'}`);
      console.log(`     Description: ${port.pnpId || 'N/A'}`);
      console.log('');
    });
    
    // Step 2: If port specified, test it
    if (TEST_PORT) {
      console.log(`🔌 Step 2: Testing specified port ${TEST_PORT}...`);
      console.log('');
      await testPort(TEST_PORT);
    } else {
      // Step 2: Try all ports
      console.log('🔌 Step 2: Testing all ports for thermal sensor data...');
      console.log('');
      console.log('💡 This will try to connect to each port for 5 seconds');
      console.log('   Make sure your Raspberry Pi is:');
      console.log('   - Powered on and paired');
      console.log('   - Running bluetooth-thermal-sender.py');
      console.log('');
      
      let foundPort = null;
      for (const portInfo of ports) {
        const portName = portInfo.path;
        console.log(`Testing ${portName}...`);
        
        const result = await testPort(portName);
        if (result) {
          foundPort = portName;
          break;
        }
      }
      
      if (!foundPort) {
        console.log('');
        console.log('❌ Could not find Raspberry Pi thermal sensor on any port.');
        console.log('');
        console.log('💡 Troubleshooting:');
        console.log('   1. Make sure Raspberry Pi is powered on');
        console.log('   2. Pair Raspberry Pi in Windows: Settings → Bluetooth & devices');
        console.log('   3. Look for "raspberrypi" and pair it');
        console.log('   4. Make sure it shows as "Connected" (green checkmark)');
        console.log('   5. Check Device Manager → Ports (COM & LPT) for COM port number');
        console.log('   6. Make sure bluetooth-thermal-sender.py is running on Raspberry Pi');
        console.log('   7. Try manually: node test-thermal-connection.js COM9 (use your COM port)');
      } else {
        console.log('');
        console.log(`✅ SUCCESS! Raspberry Pi thermal sensor found on ${foundPort}`);
        console.log('');
        console.log(`💡 To connect, run:`);
        console.log(`   node bluetooth-thermal-receiver.js ${foundPort}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Make sure serialport is installed: npm install');
  }
}

function testPort(portName) {
  return new Promise((resolve) => {
    console.log(`   Attempting to open ${portName}...`);
    
    const port = new SerialPort({
      path: portName,
      baudRate: 115200,
      autoOpen: false
    });
    
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    let receivedData = false;
    let timeout;
    let errorOccurred = false;
    
    port.on('open', () => {
      console.log(`   ✅ Port ${portName} opened successfully`);
      console.log(`   ⏳ Waiting for data (5 seconds)...`);
      
      timeout = setTimeout(() => {
        if (!receivedData && !errorOccurred) {
          console.log(`   ⚠️  No data received from ${portName}`);
          console.log(`   (This port might not be the Raspberry Pi)`);
          console.log('');
          port.close(() => resolve(false));
        }
      }, 5000);
    });
    
    parser.on('data', (line) => {
      if (!receivedData) {
        receivedData = true;
        clearTimeout(timeout);
        
        console.log(`   ✅ RECEIVED DATA from ${portName}!`);
        console.log(`   📥 First message: ${line.toString().substring(0, 100)}`);
        
        // Try to parse as JSON
        try {
          const data = JSON.parse(line.trim());
          if (data.type === 'thermal_data' || data.thermal_data !== undefined) {
            console.log(`   🎯 THIS IS YOUR RASPBERRY PI THERMAL SENSOR!`);
            console.log(`   Data type: ${data.type || 'thermal_data'}`);
            if (data.thermal_data) {
              const avgTemp = data.thermal_data.flat().reduce((a, b) => a + b, 0) / data.thermal_data.flat().length;
              console.log(`   Average temperature: ${avgTemp.toFixed(1)}°C`);
            }
          }
        } catch (e) {
          console.log(`   📄 Data format: ${line.trim().substring(0, 50)}...`);
        }
        
        port.close(() => resolve(true));
      }
    });
    
    port.on('error', (err) => {
      if (!errorOccurred) {
        errorOccurred = true;
        clearTimeout(timeout);
        
        if (err.message.includes('Access is denied') || err.message.includes('being used')) {
          console.log(`   ⚠️  Port ${portName} is busy (might be in use by another program)`);
        } else if (err.message.includes('cannot find') || err.message.includes('does not exist')) {
          console.log(`   ⚠️  Port ${portName} does not exist`);
        } else {
          console.log(`   ❌ Error: ${err.message}`);
        }
        console.log('');
        
        port.close(() => resolve(false));
      }
    });
    
    // Try to open the port
    port.open((err) => {
      if (err && !errorOccurred) {
        errorOccurred = true;
        clearTimeout(timeout);
        console.log(`   ❌ Cannot open ${portName}: ${err.message}`);
        console.log('');
        resolve(false);
      }
    });
  });
}

// Run the test
testConnection().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
