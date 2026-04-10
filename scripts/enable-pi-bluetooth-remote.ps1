# PowerShell script to enable Raspberry Pi Bluetooth via SSH
# This will SSH into the Pi and run the bluetooth commands

$piHost = "192.168.254.200"
$piUser = "pi"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Enable Raspberry Pi Bluetooth" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔵 Connecting to Raspberry Pi at $piHost..." -ForegroundColor Yellow
Write-Host ""

# Ask for password or use SSH key
$sshCommand = @"
sudo bluetoothctl <<'BLUETOOTH_EOF'
power on
discoverable on
pairable on
agent on
default-agent
exit
BLUETOOTH_EOF
"@

try {
    Write-Host "📡 Running Bluetooth commands on Raspberry Pi..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try SSH with password prompt (user will need to enter password)
    ssh "$piUser@$piHost" $sshCommand
    
    Write-Host ""
    Write-Host "✅ Bluetooth commands executed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Open Windows Settings → Bluetooth & devices" -ForegroundColor White
    Write-Host "   2. Click 'Add device' → 'Bluetooth'" -ForegroundColor White
    Write-Host "   3. Look for 'raspberrypi' and click 'Pair'" -ForegroundColor White
    Write-Host "   4. Make sure it shows as 'Connected' (green checkmark)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error connecting to Raspberry Pi: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Run manually on Raspberry Pi:" -ForegroundColor Yellow
    Write-Host "   sudo bluetoothctl" -ForegroundColor White
    Write-Host "   power on" -ForegroundColor White
    Write-Host "   discoverable on" -ForegroundColor White
    Write-Host "   pairable on" -ForegroundColor White
    Write-Host "   exit" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or copy enable-pi-bluetooth.sh to the Pi and run:" -ForegroundColor White
    Write-Host "   sudo bash enable-pi-bluetooth.sh" -ForegroundColor White
    Write-Host ""
}
