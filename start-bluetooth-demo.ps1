# Cognitive Care Assistant - Bluetooth Demo Startup Script
# This script helps start the app for Bluetooth-only demos

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cognitive Care Assistant - Bluetooth Demo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Bluetooth Demo Setup Instructions" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to start 4 terminals manually:" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1: Next.js App" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2: EMG Server" -ForegroundColor Cyan
Write-Host "  npm run emg-server" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 3: ESP32 Bluetooth Receiver" -ForegroundColor Cyan
Write-Host "  node bluetooth-receiver.js COM8" -ForegroundColor White
Write-Host "  (Replace COM8 with your ESP32's COM port)" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 4: Thermal Bluetooth Receiver" -ForegroundColor Cyan
Write-Host "  node bluetooth-thermal-receiver.js COM9" -ForegroundColor White
Write-Host "  (Replace COM9 with your Raspberry Pi's COM port)" -ForegroundColor Gray
Write-Host ""
Write-Host "Raspberry Pi (via SSH):" -ForegroundColor Cyan
Write-Host "  ssh pi@192.168.254.200" -ForegroundColor White
Write-Host "  python3 bluetooth-thermal-sender.py" -ForegroundColor White
Write-Host ""
Write-Host "📍 App URL: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "💡 See DEMO_BLUETOOTH_STARTUP.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to start the first two servers
$response = Read-Host "Would you like to start Next.js and EMG server now? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Starting Next.js and EMG server..." -ForegroundColor Green
    Write-Host "💡 You still need to start the Bluetooth receivers manually" -ForegroundColor Yellow
    Write-Host ""
    npm run dev:all
} else {
    Write-Host ""
    Write-Host "👋 Start the services manually using the instructions above." -ForegroundColor Cyan
}

