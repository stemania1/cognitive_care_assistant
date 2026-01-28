# PowerShell script to test demo setup
# This tests if everything is ready for demo mode

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Demo Mode Setup Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Node.js is available
Write-Host "1️⃣  Testing Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Check if thermal receiver script exists
Write-Host "2️⃣  Checking thermal receiver script..." -ForegroundColor Yellow
if (Test-Path "bluetooth-thermal-receiver.js") {
    Write-Host "   ✅ bluetooth-thermal-receiver.js found" -ForegroundColor Green
} else {
    Write-Host "   ❌ bluetooth-thermal-receiver.js not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 3: Check if test script exists
Write-Host "3️⃣  Checking test connection script..." -ForegroundColor Yellow
if (Test-Path "test-thermal-connection.js") {
    Write-Host "   ✅ test-thermal-connection.js found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  test-thermal-connection.js not found (optional)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Test Bluetooth connection
Write-Host "4️⃣  Testing Bluetooth connection..." -ForegroundColor Yellow
Write-Host "   Running test-thermal-connection.js..." -ForegroundColor Gray
Write-Host ""
Write-Host "   💡 Make sure:" -ForegroundColor Cyan
Write-Host "      - Raspberry Pi is powered on" -ForegroundColor White
Write-Host "      - Raspberry Pi is paired in Windows Bluetooth settings" -ForegroundColor White
Write-Host "      - Raspberry Pi shows as 'Connected'" -ForegroundColor White
Write-Host ""
Write-Host "   Press any key to run the test..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

node test-thermal-connection.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. If connection test passed, run: npm run start:thermal" -ForegroundColor White
Write-Host "   2. Open: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Navigate to Sleep Behaviors page" -ForegroundColor White
Write-Host "   4. Click 'Start Sensor'" -ForegroundColor White
Write-Host ""
