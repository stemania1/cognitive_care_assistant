# PowerShell script to check Raspberry Pi Bluetooth pairing via SSH
# This will show the current Bluetooth status and any pairing information

$piHost = "192.168.254.200"
$piUser = "pi"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Raspberry Pi Bluetooth Pairing Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "📡 Connecting to Raspberry Pi at $piHost..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check Bluetooth service status
    Write-Host "1️⃣  Checking Bluetooth Service..." -ForegroundColor Cyan
    ssh "$piUser@$piHost" "sudo systemctl is-active bluetooth && echo '✅ Bluetooth service is running' || echo '❌ Bluetooth service is NOT running'"
    Write-Host ""
    
    # Show Bluetooth controller status
    Write-Host "2️⃣  Bluetooth Controller Status:" -ForegroundColor Cyan
    ssh "$piUser@$piHost" "sudo bluetoothctl show" | Select-String -Pattern "Controller|Powered|Discoverable|Pairable|Agent"
    Write-Host ""
    
    # Show paired devices
    Write-Host "3️⃣  Paired Devices:" -ForegroundColor Cyan
    ssh "$piUser@$piHost" "sudo bluetoothctl devices"
    Write-Host ""
    
    Write-Host "💡 Note about PIN:" -ForegroundColor Yellow
    Write-Host "   - The PIN (133462) is generated during pairing" -ForegroundColor White
    Write-Host "   - It should appear on BOTH Windows and Raspberry Pi" -ForegroundColor White
    Write-Host "   - To see PIN in real-time on Pi, run: sudo bluetoothctl" -ForegroundColor White
    Write-Host "   - Then attempt pairing from Windows - PIN will display" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error connecting to Raspberry Pi: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Raspberry Pi is powered on and accessible" -ForegroundColor White
    Write-Host "   2. SSH is enabled: sudo systemctl enable ssh" -ForegroundColor White
    Write-Host "   3. You can connect: ssh pi@$piHost" -ForegroundColor White
    Write-Host ""
}
