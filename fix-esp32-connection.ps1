# Quick script to help fix ESP32 Bluetooth connection

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ESP32 Bluetooth Connection Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Steps to fix ESP32 connection:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Remove ESP32 from Bluetooth:" -ForegroundColor White
Write-Host "   - Settings → Bluetooth & devices" -ForegroundColor Gray
Write-Host "   - Find 'MyoWare_EMG' → Click three dots (⋮)" -ForegroundColor Gray
Write-Host "   - Click 'Remove device'" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Power cycle ESP32:" -ForegroundColor White
Write-Host "   - Turn OFF ESP32" -ForegroundColor Gray
Write-Host "   - Wait 5 seconds" -ForegroundColor Gray
Write-Host "   - Turn ON ESP32" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Re-pair ESP32:" -ForegroundColor White
Write-Host "   - Settings → Bluetooth & devices" -ForegroundColor Gray
Write-Host "   - Click 'Add device' → 'Bluetooth'" -ForegroundColor Gray
Write-Host "   - Look for 'MyoWare_EMG'" -ForegroundColor Gray
Write-Host "   - Click 'Pair'" -ForegroundColor Gray
Write-Host "   - Wait for 'Connected' (green checkmark)" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Check Device Manager for COM port:" -ForegroundColor White
Write-Host "   - Press Win + X → Device Manager" -ForegroundColor Gray
Write-Host "   - Expand 'Ports (COM & LPT)'" -ForegroundColor Gray
Write-Host "   - Look for Bluetooth Serial port (e.g., COM8)" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Test connection:" -ForegroundColor White
Write-Host "   node test-bluetooth-connection.js" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Press Enter after you've tried these steps to test connection"
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow
Write-Host ""

node test-bluetooth-connection.js

Write-Host ""
