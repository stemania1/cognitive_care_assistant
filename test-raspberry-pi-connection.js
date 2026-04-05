/**
 * Test Raspberry Pi Connection
 * 
 * This script tests the connection to your Raspberry Pi thermal sensor.
 * Run this from the browser console or as a Node.js script.
 * 
 * Usage in browser console:
 *   - Copy and paste this entire file into the browser console
 *   - Or import it as a module
 * 
 * Usage as Node.js script:
 *   node test-raspberry-pi-connection.js
 */

const RASPBERRY_PI_IP = '192.168.254.200';
const HTTP_PORT = 8091;
const WEBSOCKET_PORT = 8092;

// Test HTTP connection
async function testHttpConnection() {
  console.log(`\n🔍 Testing HTTP connection to ${RASPBERRY_PI_IP}:${HTTP_PORT}...`);
  
  try {
    // In browser, use the API route
    const apiUrl = typeof window !== 'undefined' 
      ? `/api/thermal?ip=${encodeURIComponent(RASPBERRY_PI_IP)}&port=${HTTP_PORT}`
      : `http://${RASPBERRY_PI_IP}:${HTTP_PORT}/thermal-data`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data && (data.thermal_data || data.data) && !data.error) {
        console.log('✅ HTTP Connection: SUCCESS');
        console.log('   - Received thermal data');
        console.log('   - Timestamp:', data.timestamp || 'N/A');
        const grid = data.thermal_data || data.data;
        if (grid && Array.isArray(grid)) {
          console.log('   - Grid size:', `${grid.length}x${grid[0]?.length || 0}`);
          const avgTemp = grid.flat().reduce((a, b) => a + b, 0) / grid.flat().length;
          console.log('   - Average temperature:', avgTemp.toFixed(1) + '°C');
        }
        return true;
      } else {
        console.log('⚠️ HTTP Connection: Connected but invalid data');
        console.log('   Response:', data);
        return false;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ HTTP Connection: FAILED');
      console.log('   Status:', response.status, response.statusText);
      console.log('   Error:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ HTTP Connection: FAILED');
    if (error.name === 'AbortError') {
      console.log('   Error: Connection timeout (5 seconds)');
      console.log('   → Raspberry Pi may be offline or unreachable');
    } else {
      console.log('   Error:', error.message);
    }
    return false;
  }
}

// Test WebSocket connection (browser only)
async function testWebSocketConnection() {
  if (typeof window === 'undefined') {
    console.log('\n⚠️ WebSocket test skipped (Node.js environment)');
    return false;
  }
  
  console.log(`\n🔍 Testing WebSocket connection to ${RASPBERRY_PI_IP}:${WEBSOCKET_PORT}...`);
  
  return new Promise((resolve) => {
    const wsUrl = `ws://${RASPBERRY_PI_IP}:${WEBSOCKET_PORT}`;
    const ws = new WebSocket(wsUrl);
    
    const timeout = setTimeout(() => {
      ws.close();
      console.log('❌ WebSocket Connection: FAILED (timeout after 5 seconds)');
      resolve(false);
    }, 5000);
    
    ws.onopen = () => {
      clearTimeout(timeout);
      console.log('✅ WebSocket Connection: SUCCESS');
      console.log('   - Connected to', wsUrl);
      ws.close();
      resolve(true);
    };
    
    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.log('❌ WebSocket Connection: FAILED');
      console.log('   Error: WebSocket connection error');
      console.log('   → Check if WebSocket server is running on Raspberry Pi');
      resolve(false);
    };
    
    ws.onclose = (event) => {
      if (event.code !== 1000) {
        clearTimeout(timeout);
        console.log('❌ WebSocket Connection: FAILED');
        console.log('   Close code:', event.code);
        console.log('   Reason:', event.reason || 'No reason provided');
        resolve(false);
      }
    };
  });
}

// Test network connectivity (ping-like test)
async function testNetworkConnectivity() {
  console.log(`\n🔍 Testing network connectivity to ${RASPBERRY_PI_IP}...`);
  
  try {
    // Try to fetch a simple endpoint with a very short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const apiUrl = typeof window !== 'undefined'
      ? `/api/thermal?ip=${encodeURIComponent(RASPBERRY_PI_IP)}&port=${HTTP_PORT}`
      : `http://${RASPBERRY_PI_IP}:${HTTP_PORT}/thermal-data`;
    
    await fetch(apiUrl, {
      method: 'GET',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Network Connectivity: SUCCESS');
    console.log('   - Raspberry Pi is reachable on the network');
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Even a timeout means the network route exists
      console.log('⚠️ Network Connectivity: PARTIAL');
      console.log('   - Raspberry Pi may be reachable but not responding');
    } else {
      console.log('❌ Network Connectivity: FAILED');
      console.log('   Error:', error.message);
      console.log('   → Check if Raspberry Pi is on the same network');
      console.log('   → Verify IP address:', RASPBERRY_PI_IP);
    }
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Raspberry Pi Connection Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\nConfiguration:`);
  console.log(`  IP Address: ${RASPBERRY_PI_IP}`);
  console.log(`  HTTP Port: ${HTTP_PORT}`);
  console.log(`  WebSocket Port: ${WEBSOCKET_PORT}`);
  
  const results = {
    network: await testNetworkConnectivity(),
    http: await testHttpConnection(),
    websocket: await testWebSocketConnection()
  };
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Network Connectivity: ${results.network ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  HTTP Connection:      ${results.http ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  WebSocket Connection: ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.http) {
    console.log('\n✅ SUCCESS: Raspberry Pi is connected and working!');
    console.log('   Your app should be able to receive thermal data.');
  } else if (results.network) {
    console.log('\n⚠️ PARTIAL: Raspberry Pi is reachable but HTTP service may not be running.');
    console.log('   Troubleshooting:');
    console.log('   1. Check if the thermal sensor service is running:');
    console.log('      sudo systemctl status amg883-headless.service');
    console.log('   2. Try restarting the service:');
    console.log('      sudo systemctl restart amg883-headless.service');
    console.log('   3. Test directly on Raspberry Pi:');
    console.log(`      curl http://${RASPBERRY_PI_IP}:${HTTP_PORT}/thermal-data`);
  } else {
    console.log('\n❌ FAILED: Cannot reach Raspberry Pi.');
    console.log('   Troubleshooting:');
    console.log('   1. Verify Raspberry Pi is powered on');
    console.log('   2. Check if IP address is correct:', RASPBERRY_PI_IP);
    console.log('   3. Ensure both devices are on the same network');
    console.log('   4. Try pinging the Raspberry Pi:');
    console.log(`      ping ${RASPBERRY_PI_IP}`);
    console.log('   5. Check firewall settings');
  }
  
  return results;
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testHttpConnection, testWebSocketConnection, testNetworkConnectivity };
}

// Auto-run if executed directly in browser
if (typeof window !== 'undefined') {
  console.log('💡 To run the connection test, call: runAllTests()');
  window.testRaspberryPiConnection = runAllTests;
  window.testHttpConnection = testHttpConnection;
  window.testWebSocketConnection = testWebSocketConnection;
  window.testNetworkConnectivity = testNetworkConnectivity;
}

// Auto-run if executed as Node.js script
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  runAllTests().catch(console.error);
}
