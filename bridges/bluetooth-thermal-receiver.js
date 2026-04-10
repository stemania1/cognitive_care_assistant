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

// Configuration — 127.0.0.1 avoids Windows IPv6 localhost / fetch issues with Next.js
function resolveThermalApiUrl() {
  const raw = process.env.NEXTJS_API_URL || 'http://127.0.0.1:3000/api/thermal/bt';
  if (raw.includes('localhost')) {
    return raw.replace(/localhost/g, '127.0.0.1');
  }
  return raw;
}
const NEXTJS_API_URL = resolveThermalApiUrl();
let SERIAL_PORT = process.argv[2] || process.env.THERMAL_BLUETOOTH_PORT;
const DEFAULT_BAUD = parseInt(process.env.THERMAL_SERIAL_BAUD || '115200', 10) || 115200;

// Options that work better with USB serial (e.g. Pi USB gadget); some drivers fail with flow control
function serialPortOptions(baudRate) {
  return {
    path: SERIAL_PORT,
    baudRate: baudRate || DEFAULT_BAUD,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    autoOpen: false
  };
}

/**
 * Auto-detect Raspberry Pi Bluetooth port by scanning all available ports
 */
async function autoDetectPort() {
  console.log('🔍 Auto-detecting Raspberry Pi Bluetooth port...\n');
  
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
      console.error('❌ No Bluetooth ports found by name!');
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
          console.log(`\n✅ Found Raspberry Pi on ${portName}!\n`);
          return portName;
        } else {
          console.log(`   ⚠️  ${portName}: No thermal data received\n`);
        }
      }
      
      console.error('\n❌ Could not find Raspberry Pi on any port.');
      console.log('\n💡 Troubleshooting:');
      console.log('  1. Make sure Raspberry Pi is powered on');
      console.log('  2. Pair Raspberry Pi in Windows: Settings → Bluetooth & devices');
      console.log('  3. Check connection status: Settings → Bluetooth → Is Raspberry Pi connected?');
      console.log('  4. Check Device Manager → Ports (COM & LPT) for the COM port number');
      console.log('  5. Make sure bluetooth-thermal-sender.py is running on Raspberry Pi');
      console.log('  6. Try manually with COM port: node bluetooth-thermal-receiver.js COM9');
      return null;
    }
    
    console.log(`📋 Found ${bluetoothPorts.length} Bluetooth port(s):`);
    bluetoothPorts.forEach(port => {
      console.log(`  - ${port.path} (${port.manufacturer || 'Unknown'})`);
    });
    console.log('');
    
    // Try each Bluetooth port to find the one receiving thermal data
    for (const portInfo of bluetoothPorts) {
      const portName = portInfo.path;
      console.log(`🔌 Testing ${portName} (waiting 5 seconds for data)...`);
      
      const foundPort = await testPort(portName);
      if (foundPort) {
        console.log(`\n✅ Found Raspberry Pi on ${portName}!\n`);
        return portName;
      } else {
        console.log(`   ⚠️  ${portName}: No thermal data received\n`);
      }
    }
    
    console.error('\n❌ Could not find Raspberry Pi on any Bluetooth port.');
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Make sure Raspberry Pi is powered on');
    console.log('  2. Pair Raspberry Pi in Windows: Settings → Bluetooth & devices');
    console.log('  3. Check connection status: Settings → Bluetooth → Is Raspberry Pi connected?');
    console.log('  4. Check Device Manager → Ports (COM & LPT) for the COM port number');
    console.log('  5. Make sure bluetooth-thermal-sender.py is running on Raspberry Pi');
    console.log('  6. Try manually with COM port: node bluetooth-thermal-receiver.js COM9');
    return null;
  } catch (error) {
    console.error('❌ Error scanning ports:', error.message);
    return null;
  }
}

/**
 * Test a port to see if it's receiving thermal data
 */
function testPort(portName) {
  return new Promise((resolve) => {
    const testPort = new SerialPort({
      ...serialPortOptions(115200),
      path: portName
    });
    
    const parser = testPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    let receivedData = false;
    let timeout;
    
    parser.on('data', (line) => {
      try {
        const data = JSON.parse(line.trim());
        const ok =
          data.type === 'thermal_data' ||
          (Array.isArray(data.thermal_data) && data.thermal_data.length > 0) ||
          (Array.isArray(data.pixels) && data.pixels.length === 64);
        if (ok) {
          receivedData = true;
          clearTimeout(timeout);
          testPort.close(() => resolve(true));
        }
      } catch (e) {
        // Not JSON or not thermal data
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
      }, 5000); // Wait 5 seconds for data
    });
    
    testPort.open((err) => {
      if (err) {
        resolve(false);
      }
    });
  });
}

/** Wait for Next.js API to be ready (avoids "fetch failed" when started with npm run dev). */
async function waitForApi() {
  const baseUrl = NEXTJS_API_URL.replace(/\/api\/thermal\/bt.*$/, '') || 'http://127.0.0.1:3000';
  const maxWait = 45000;
  const interval = 500;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 3000);
      const r = await fetch(baseUrl, { method: 'GET', signal: c.signal });
      clearTimeout(t);
      if (r.status < 500) {
        console.log('✅ Next.js reachable at', baseUrl);
        return;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, interval));
  }
  console.warn('⚠️ Next.js not reachable yet — POSTs may fail until dev server is ready.');
}

function formatFetchError(e) {
  const parts = [e && e.message];
  if (e && e.cause) {
    const c = e.cause;
    parts.push(c.code || c.message || String(c));
  }
  if (e && e.code) parts.push(e.code);
  return parts.filter(Boolean).join(' | ');
}

// Main execution
(async () => {
  // If no port specified, try to auto-detect
  if (!SERIAL_PORT) {
    SERIAL_PORT = await autoDetectPort();
    if (!SERIAL_PORT) {
      console.log('\n💡 You can also specify the port manually:');
      console.log('   node bluetooth-thermal-receiver.js COM9');
      process.exit(1);
    }
  }

  console.log('🔵 Bluetooth Thermal Receiver for AMG8833');
  console.log('==========================================');
  console.log(`📡 Serial Port: ${SERIAL_PORT}`);
  console.log(`🌐 Forwarding to: ${NEXTJS_API_URL}`);
  console.log('💡 Connection will auto-reconnect if Bluetooth drops.\n');
  console.log('   Press Ctrl+C to stop\n');

  // When run with npm run dev, Next.js may not be ready yet; wait so first POSTs don't fail
  try {
    await waitForApi();
  } catch (_) {}

  let port;
  let exiting = false;
  const RECONNECT_DELAY_MS = 5000;

  let forwardStats = {
    success: 0,
    failures: 0,
    lastError: null,
    lastSuccess: null
  };

  let lastLog = 0;

  const POST_TIMEOUT_MS = 8000;
  let pendingPayload = null;
  let flushRunning = false;

  async function flushPostQueue() {
    if (flushRunning) return;
    flushRunning = true;
    try {
      while (pendingPayload !== null) {
        const data = pendingPayload;
        pendingPayload = null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
        try {
          const res = await fetch(NEXTJS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            forwardStats.success++;
            forwardStats.lastSuccess = new Date().toISOString();
            if (forwardStats.success % 10 === 0) {
              console.log('✅ Forwarded to Next.js API (every 10th):', { successCount: forwardStats.success, status: res.status });
            }
          } else {
            forwardStats.failures++;
            forwardStats.lastError = { status: res.status, statusText: res.statusText, timestamp: new Date().toISOString() };
            const text = await res.text().catch(() => '');
            console.error('❌ API returned error:', res.status, res.statusText, text.slice(0, 200));
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          forwardStats.failures++;
          forwardStats.lastError = { message: fetchError.message, timestamp: new Date().toISOString() };
          if (fetchError.name !== 'AbortError') {
            if (forwardStats.failures % 15 === 1) {
              console.error('❌ Error forwarding to API:', formatFetchError(fetchError), '|', NEXTJS_API_URL);
            }
          } else if (forwardStats.failures % 30 === 1) {
            console.error('❌ POST timed out — is Next.js running?', NEXTJS_API_URL);
          }
        }
      }
    } finally {
      flushRunning = false;
      if (pendingPayload !== null) {
        setImmediate(() => flushPostQueue());
      }
    }
  }

  function queuePost(data) {
    pendingPayload = data;
    flushPostQueue();
  }

  function looksLikeThermalJson(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.type === 'thermal_data') return true;
    if (Array.isArray(data.thermal_data) && data.thermal_data.length === 8) return true;
    if (Array.isArray(data.pixels) && data.pixels.length === 64) return true;
    return false;
  }

  function handleLine(line) {
    try {
      const data = JSON.parse(line.trim());
      if (looksLikeThermalJson(data)) {
        const now = Date.now();
        if (now - lastLog > 5000) {
          const avgTemp = data.thermal_data
            ? (data.thermal_data.flat().reduce((a, b) => a + b, 0) / data.thermal_data.flat().length).toFixed(1)
            : 'N/A';
          console.log('📥 Received thermal data:', { avgTemp: `${avgTemp}°C`, gridSize: data.grid_size, timestamp: data.timestamp });
          lastLog = now;
        }
        queuePost(data);
      } else if (data.type) {
        console.log('📥 Received (ignored):', data.type);
      }
    } catch (e) {
      if (line.trim().length > 0 && !line.trim().startsWith('✅') && !line.trim().startsWith('📡')) {
        console.log('📄 Non-JSON data:', line.trim().substring(0, 100));
      }
    }
  }

  function connect(baudToTry = DEFAULT_BAUD) {
    const opts = serialPortOptions(baudToTry);
    opts.autoOpen = true;
    port = new SerialPort(opts);
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
      if (baudToTry !== DEFAULT_BAUD) {
        console.log(`✅ Serial port opened at ${baudToTry} baud (fallback; 115200 failed on this device).\n`);
      } else {
        console.log('✅ Bluetooth Serial port opened. Waiting for thermal data from Raspberry Pi...\n');
      }
    });

    port.on('error', (err) => {
      const isError31 = /error code 31|Error 31|GEN_FAILURE/i.test(err.message);
      if (isError31 && baudToTry === 115200) {
        console.error('❌ Serial port error (31): USB serial driver rejected 115200. Retrying with 9600...');
        if (port && port.isOpen) port.close(() => connect(9600));
        else setTimeout(() => connect(9600), 300);
        return;
      }
      if (isError31 && baudToTry === 9600) {
        console.error('❌ Serial port error (31): Open failed at 9600 too. Close any other app using COM3 (PuTTY, Arduino, etc.) or try another USB port.');
      } else {
        console.error('❌ Serial port error:', err.message);
      }
    });

    port.on('close', () => {
      if (exiting) return;
      console.log('🔄 Connection lost. Reconnecting in 5 seconds... (re-pair in Settings → Bluetooth if needed)\n');
      setTimeout(connect, RECONNECT_DELAY_MS);
    });

    parser.on('data', handleLine);
  }

  connect();

  process.on('SIGINT', () => {
    exiting = true;
    console.log('\n\n📊 Statistics:');
    console.log(`   Success: ${forwardStats.success}`);
    console.log(`   Failures: ${forwardStats.failures}`);
    if (forwardStats.lastError) console.log('   Last Error:', forwardStats.lastError);
    if (forwardStats.lastSuccess) console.log('   Last Success:', forwardStats.lastSuccess);
    console.log('\n👋 Closing Bluetooth connection...');
    if (port && port.isOpen) {
      port.close(() => { console.log('✅ Port closed. Goodbye!'); process.exit(0); });
    } else {
      process.exit(0);
    }
  });
})();

