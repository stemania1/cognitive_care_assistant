# Script to find Bluetooth COM ports
Write-Host "Scanning for COM ports..." -ForegroundColor Cyan
Write-Host ""

# Get all COM ports
$ports = Get-WmiObject -Class Win32_SerialPort | Select-Object DeviceID, Description, Name

if ($ports.Count -eq 0) {
    Write-Host "No COM ports found!" -ForegroundColor Red
    exit
}

Write-Host "Found COM Ports:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""

foreach ($port in $ports) {
    $deviceId = $port.DeviceID
    $description = $port.Description
    $name = $port.Name
    
    # Highlight Bluetooth ports
    $isBluetooth = $description -like "*Bluetooth*" -or $description -like "*BT*" -or $name -like "*Bluetooth*"
    
    if ($isBluetooth) {
        Write-Host "$deviceId" -ForegroundColor Yellow -NoNewline
        Write-Host " - $description" -ForegroundColor Yellow
        Write-Host "   (Name: $name)" -ForegroundColor Yellow
        Write-Host "   ⭐ This looks like a Bluetooth port!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "$deviceId" -ForegroundColor White -NoNewline
        Write-Host " - $description" -ForegroundColor Gray
        Write-Host "   (Name: $name)" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host ""
Write-Host "💡 Tips to identify your ESP32 Bluetooth port:" -ForegroundColor Cyan
Write-Host "   1. Look for ports with 'Bluetooth' or 'BT' in the name" -ForegroundColor White
Write-Host "   2. Unplug/reconnect your ESP32 and see which port appears/disappears" -ForegroundColor White
Write-Host "   3. Try the Bluetooth ports one at a time with: node bluetooth-receiver.js COMX" -ForegroundColor White

