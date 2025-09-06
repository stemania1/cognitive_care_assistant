// EMG data storage (in production, use a database)
let emgData: any[] = [];
let calibrationData: any = null;
let lastHeartbeat = Date.now();

export function storeEMGData(data: any) {
  emgData.push(data);
  
  // Keep only last 1000 entries
  if (emgData.length > 1000) {
    emgData = emgData.slice(-1000);
  }
}

export function storeCalibrationData(data: any) {
  calibrationData = data;
}

export function updateHeartbeat() {
  lastHeartbeat = Date.now();
}

export function getEMGData() {
  return {
    data: emgData.slice(-50), // Return last 50 data points for chart
    calibration: calibrationData,
    lastHeartbeat: lastHeartbeat,
    dataCount: emgData.length
  };
}
