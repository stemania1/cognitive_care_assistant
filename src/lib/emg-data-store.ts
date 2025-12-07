// EMG data storage (in production, use a database)
let emgData: any[] = [];
let calibrationData: any = null;
let lastHeartbeat = Date.now();

// Event listeners for real-time data push
type DataListener = (data: any) => void;
const dataListeners: Set<DataListener> = new Set();

export function storeEMGData(data: any) {
  emgData.push(data);
  
  // Log every 10th data store to reduce console spam (but still track data flow)
  if (emgData.length % 10 === 0) {
    console.log('💾 Storing EMG data (every 10th):', {
      type: data.type,
      timestamp: data.timestamp,
      timestampISO: new Date(data.timestamp).toISOString(),
      muscleActivity: data.muscleActivity,
      voltage: data.voltage,
      totalStored: emgData.length
    });
  }
  
  // Keep only last 1000 entries
  if (emgData.length > 1000) {
    emgData = emgData.slice(-1000);
  }
  
  // Notify all listeners of new data
  dataListeners.forEach(listener => {
    try {
      listener(data);
    } catch (error) {
      console.error('Error in data listener:', error);
    }
  });
}

export function subscribeToData(listener: DataListener) {
  dataListeners.add(listener);
  return () => {
    dataListeners.delete(listener);
  };
}

export function storeCalibrationData(data: any) {
  calibrationData = data;
}

export function updateHeartbeat() {
  const now = Date.now();
  const timeSinceLastUpdate = now - lastHeartbeat;
  lastHeartbeat = now;
  // Log heartbeat every 5 seconds to reduce console spam
  if (timeSinceLastUpdate > 5000 || emgData.length % 50 === 0) {
    console.log('💓 Heartbeat updated:', {
      timestamp: new Date(now).toISOString(),
      timeSinceLastUpdate: timeSinceLastUpdate + 'ms',
      dataCount: emgData.length
    });
  }
}

export function getEMGData() {
  const now = Date.now();
  const timeSinceLastHeartbeat = now - lastHeartbeat;
  const isConnected = timeSinceLastHeartbeat < 30000; // 30 seconds timeout
  
  // Log data store state for debugging (every 10th call to reduce spam)
  if (Math.random() < 0.1) {
    console.log('🔍 getEMGData() called:', {
      emgDataLength: emgData.length,
      now: new Date(now).toISOString(),
      lastHeartbeat: new Date(lastHeartbeat).toISOString(),
      timeSinceLastHeartbeat: timeSinceLastHeartbeat < Infinity ? (timeSinceLastHeartbeat / 1000).toFixed(1) + 's' : 'N/A',
      oldestTimestamp: emgData.length > 0 ? new Date(emgData[0]?.timestamp || 0).toISOString() : 'no data',
      newestTimestamp: emgData.length > 0 ? new Date(emgData[emgData.length - 1]?.timestamp || 0).toISOString() : 'no data'
    });
  }
  
  // Filter out stale data (older than 2 minutes) to prevent caching issues
  const twoMinutesAgo = now - 120000;
  const recentData = emgData.filter(d => {
    if (!d.timestamp) return false;
    // Handle both absolute timestamps (13+ digits) and relative timestamps
    const timestamp = typeof d.timestamp === 'number' ? d.timestamp : Date.parse(d.timestamp);
    return timestamp > twoMinutesAgo;
  });
  
  // If we filtered out data, update the array (but keep at least last 50 for continuity)
  if (recentData.length < emgData.length && emgData.length > 50) {
    const removedCount = emgData.length - recentData.length;
    if (removedCount > 0 && Math.random() < 0.1) {
      console.log(`🗑️ Filtered out ${removedCount} stale data points (older than 2 minutes)`);
    }
    emgData = recentData.length > 0 ? recentData : emgData.slice(-50);
  }
  
  const result = {
    data: emgData.slice(-50), // Return last 50 data points for chart
    calibration: calibrationData,
    lastHeartbeat: lastHeartbeat,
    dataCount: emgData.length,
    isConnected: isConnected,
    timeSinceLastHeartbeat: timeSinceLastHeartbeat
  };
  
  // Log if dataCount is 0 but we should have data
  if (result.dataCount === 0 && emgData.length > 0) {
    console.error('❌ WARNING: getEMGData() returning dataCount=0 but emgData.length > 0!', {
      emgDataLength: emgData.length,
      resultDataCount: result.dataCount,
      recentDataLength: recentData.length,
      now,
      twoMinutesAgo,
      sampleTimestamps: emgData.slice(0, 3).map(d => ({
        timestamp: d.timestamp,
        timestampISO: new Date(d.timestamp).toISOString(),
        age: ((now - d.timestamp) / 1000).toFixed(1) + 's'
      }))
    });
  }
  
  return result;
}

// Function to clear old data (useful for debugging)
export function clearEMGData() {
  emgData = [];
  console.log('🗑️ EMG data store cleared');
}
