# Test script to check both EMG and Thermal sensor connections

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Both Sensors Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check COM ports
Write-Host "1️⃣  Checking COM Ports..." -ForegroundColor Yellow
$ports = Get-WmiObject -Class Win32_SerialPort | Select-Object DeviceID, Description, Name

if ($ports.Count -eq 0) {
    Write-Host "   ❌ No COM ports found!" -ForegroundColor Red
} else {
    Write-Host "   ✅ Found $($ports.Count) COM port(s):" -ForegroundColor Green
    foreach ($port in $ports) {
        $isBluetooth = $port.Description -like "*Bluetooth*" -or $port.Description -like "*BT*"
        if ($isBluetooth) {
            Write-Host "      ✅ $($port.DeviceID) - $($port.Description)" -ForegroundColor Cyan
        } else {
            Write-Host "      - $($port.DeviceID) - $($port.Description)" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Test 2: Check Windows Bluetooth devices
Write-Host "2️⃣  Checking Windows Bluetooth Devices..." -ForegroundColor Yellow
Write-Host "   💡 Open: Settings → Bluetooth & devices" -ForegroundColor Gray
Write-Host "   Look for:" -ForegroundColor White
Write-Host "      - MyoWare_EMG (ESP32) - Should show 'Connected'" -ForegroundColor White
Write-Host "      - raspberrypi (Raspberry Pi) - Should show 'Connected'" -ForegroundColor White
Write-Host ""

# Test 3: Test EMG connection
Write-Host "3️⃣  Testing EMG (ESP32) Connection..." -ForegroundColor Yellow
Write-Host "   Running: node test-bluetooth-connection.js" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Test EMG connection now? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    node test-bluetooth-connection.js
}

Write-Host ""

# Test 4: Test Thermal connection
Write-Host "4️⃣  Testing Thermal (Raspberry Pi) Connection..." -ForegroundColor Yellow
Write-Host "   Running: node test-thermal-connection.js" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Test Thermal connection now? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    node test-thermal-connection.js
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Troubleshooting Tips" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you can't connect to both:" -ForegroundColor Yellow
Write-Host "   1. Pair them ONE AT A TIME" -ForegroundColor White
Write-Host "      - First pair ESP32 (MyoWare_EMG)" -ForegroundColor White
Write-Host "      - Then pair Raspberry Pi (raspberrypi)" -ForegroundColor White
Write-Host ""
Write-Host "   2. Make sure both are powered on" -ForegroundColor White
Write-Host ""
Write-Host "   3. Check Device Manager → Ports for both COM ports" -ForegroundColor White
Write-Host ""
Write-Host "   4. Try removing and re-pairing if connection fails" -ForegroundColor White
Write-Host ""
Write-Host "   5. Windows can handle multiple Bluetooth connections" -ForegroundColor White
Write-Host "      Both should work at the same time" -ForegroundColor White
Write-Host ""
