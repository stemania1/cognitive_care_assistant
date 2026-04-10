/**
 * Test script to find which COM port is the ESP32
 * This will try to connect to each Bluetooth port and see which one responds
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// List of Bluetooth COM ports found
const portsToTest = ['COM4', 'COM5', 'COM8', 'COM9'];

console.log('🔍 Testing Bluetooth COM ports to find ESP32...');
console.log('==================================================\n');

let testComplete = false;
let successfulPort = null;

async function testPort(portName) {
  return new Promise((resolve) => {
    console.log(`Testing ${portName}...`);
    
    const port = new SerialPort({
      path: portName,
      baudRate: 115200,
      autoOpen: false
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    let receivedData = false;
    let timeout;

    port.on('open', () => {
      console.log(`  ✅ ${portName}: Port opened successfully`);
      console.log(`  ⏳ ${portName}: Waiting for data (5 seconds)...`);
      
      timeout = setTimeout(() => {
        if (!receivedData) {
          console.log(`  ⚠️  ${portName}: No data received (port might not be connected or wrong device)\n`);
          port.close();
          resolve(false);
        }
      }, 5000);
    });

    parser.on('data', (data) => {
      if (!receivedData) {
        receivedData = true;
        clearTimeout(timeout);
        console.log(`  ✅ ${portName}: RECEIVED DATA!`);
        console.log(`  📥 ${portName}: First message: ${data.toString().substring(0, 100)}...`);
        console.log(`  🎯 ${portName}: THIS IS YOUR ESP32!\n`);
        port.close();
        successfulPort = portName;
        resolve(true);
      }
    });

    port.on('error', (err) => {
      clearTimeout(timeout);
      if (err.message.includes('Access is denied') || err.message.includes('being used')) {
        console.log(`  ⚠️  ${portName}: Port is busy (might be in use by another program)\n`);
      } else {
        console.log(`  ❌ ${portName}: ${err.message}\n`);
      }
      resolve(false);
    });

    // Try to open the port
    port.open((err) => {
      if (err) {
        clearTimeout(timeout);
        console.log(`  ❌ ${portName}: Cannot open - ${err.message}\n`);
        resolve(false);
      }
    });
  });
}

async function testAllPorts() {
  console.log('📋 Instructions:');
  console.log('1. Make sure your ESP32 is powered on');
  console.log('2. Make sure ESP32 Bluetooth is paired and connected in Windows');
  console.log('3. This script will test each port for 5 seconds');
  console.log('4. The port that receives data is your ESP32\n');
  console.log('Starting tests in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  for (const port of portsToTest) {
    if (successfulPort) {
      console.log(`⏭️  Skipping remaining ports (found ESP32 on ${successfulPort})`);
      break;
    }
    await testPort(port);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log('\n' + '='.repeat(50));
  if (successfulPort) {
    console.log(`\n✅ SUCCESS! Your ESP32 is on: ${successfulPort}`);
    console.log(`\n💡 Run the Bluetooth receiver with:`);
    console.log(`   node bluetooth-receiver.js ${successfulPort}`);
  } else {
    console.log('\n❌ Could not find ESP32 on any port.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure ESP32 is powered on');
    console.log('   2. Check Windows Bluetooth settings - is "MyoWare_EMG" connected?');
    console.log('   3. Check Device Manager - are any ports showing errors?');
    console.log('   4. Try unplugging/replugging ESP32 USB cable');
    console.log('   5. Make sure no other program is using the Bluetooth port');
  }
  console.log('');

  process.exit(0);
}

testAllPorts().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

