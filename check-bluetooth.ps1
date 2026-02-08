# Quick Bluetooth Diagnostic Script
# This helps troubleshoot ESP32 Bluetooth connection issues

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ESP32 Bluetooth Connection Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Bluetooth Service
Write-Host "1️⃣  Checking Bluetooth Service..." -ForegroundColor Yellow
try {
    $btService = Get-Service -Name bthserv -ErrorAction SilentlyContinue
    if ($btService -and $btService.Status -eq 'Running') {
        Write-Host "   ✅ Bluetooth service is running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Bluetooth service status: $($btService.Status)" -ForegroundColor Yellow
        Write-Host "   💡 Try: Start-Service bthserv" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Could not check Bluetooth service" -ForegroundColor Yellow
}
Write-Host ""

# Check 2: Find COM Ports
Write-Host "2️⃣  Scanning for COM Ports..." -ForegroundColor Yellow
try {
    $ports = Get-WmiObject -Class Win32_SerialPort | Select-Object DeviceID, Description, Name
    if ($ports.Count -eq 0) {
        Write-Host "   ❌ No COM ports found!" -ForegroundColor Red
    } else {
        Write-Host "   📋 Found $($ports.Count) COM port(s):" -ForegroundColor Green
        $foundBt = $false
        foreach ($port in $ports) {
            $isBluetooth = $port.Description -like "*Bluetooth*" -or $port.Description -like "*BT*" -or $port.Name -like "*Bluetooth*"
            if ($isBluetooth) {
                Write-Host "      ✅ $($port.DeviceID) - $($port.Description)" -ForegroundColor Cyan
                Write-Host "         (Name: $($port.Name))" -ForegroundColor Cyan
                $foundBt = $true
            } else {
                Write-Host "      - $($port.DeviceID) - $($port.Description)" -ForegroundColor Gray
            }
        }
        if (-not $foundBt) {
            Write-Host "   ⚠️  No Bluetooth ports found by name" -ForegroundColor Yellow
            Write-Host "   💡 ESP32 might be on one of the ports above" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Error scanning ports: $_" -ForegroundColor Red
}
Write-Host ""

# Check 3: Bluetooth Devices
Write-Host "3️⃣  Checking Paired Bluetooth Devices..." -ForegroundColor Yellow
Write-Host "   💡 Open: Settings → Bluetooth & devices" -ForegroundColor Gray
Write-Host "   💡 Look for 'MyoWare_EMG' in the list" -ForegroundColor Gray
Write-Host "   💡 Make sure it shows as 'Connected' (not just 'Paired')" -ForegroundColor Gray
Write-Host ""

# Check 4: Node.js check
Write-Host "4️⃣  Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
}
Write-Host ""

# Check 5: Serialport module
Write-Host "5️⃣  Checking serialport module..." -ForegroundColor Yellow
try {
    if (Test-Path "node_modules\serialport") {
        Write-Host "   ✅ serialport module is installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  serialport module not found" -ForegroundColor Yellow
        Write-Host "   💡 Try: npm install" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Could not check serialport module" -ForegroundColor Yellow
}
Write-Host ""

# Summary and Recommendations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Recommendations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If ESP32 is not connecting:" -ForegroundColor White
Write-Host "  1. Power on your ESP32" -ForegroundColor Gray
Write-Host "  2. Pair in Windows: Settings → Bluetooth & devices → Add device" -ForegroundColor Gray
Write-Host "  3. Look for 'MyoWare_EMG' and pair it" -ForegroundColor Gray
Write-Host "  4. Make sure it shows as 'Connected' (green checkmark)" -ForegroundColor Gray
Write-Host "  5. Check Device Manager → Ports (COM & LPT) for COM port number" -ForegroundColor Gray
Write-Host "  6. Try manually: node bluetooth-receiver.js COM8 (replace COM8)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 The auto-detection will try all ports if Bluetooth name is not found" -ForegroundColor Yellow
Write-Host ""

# Start Bluetooth Service Command
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Start Bluetooth Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Bluetooth service..." -ForegroundColor Yellow
try {
    Start-Service -Name bthserv -ErrorAction Stop
    Write-Host "✅ Bluetooth service started successfully!" -ForegroundColor Green
    Write-Host ""
    # Verify it's running
    Start-Sleep -Seconds 1
    $btService = Get-Service -Name bthserv
    Write-Host "Service Status: $($btService.Status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to start Bluetooth service: $_" -ForegroundColor Red
    Write-Host "💡 You may need to run PowerShell as Administrator" -ForegroundColor Yellow
}
Write-Host ""