# Cognitive Care Assistant - EMG Startup Script
# This script starts all EMG-related services:
# 1. Next.js app (localhost:3000)
# 2. EMG server (localhost:3001)
# 3. Bluetooth receiver (auto-detects ESP32 COM port)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cognitive Care Assistant - EMG Startup" -ForegroundColor Cyan
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

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found!" -ForegroundColor Yellow
    Write-Host "   Make sure environment variables are configured." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🚀 Starting all EMG services..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Next.js app: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📡 EMG server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔵 Bluetooth receiver: Auto-detecting ESP32..." -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Make sure your ESP32 is:" -ForegroundColor Yellow
Write-Host "   - Powered on" -ForegroundColor White
Write-Host "   - Paired in Windows Bluetooth settings" -ForegroundColor White
Write-Host "   - Connected" -ForegroundColor White
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start all three services using concurrently
npx concurrently --names "NEXT,EMG,BT" --prefix-colors "blue,yellow,green" `
    "npm run dev" `
    "npm run emg-server" `
    "node bluetooth-receiver.js"
