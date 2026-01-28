# Cognitive Care Assistant - Thermal Sensor Startup Script
# This script starts the Next.js app and thermal Bluetooth receiver
# Note: You also need to run bluetooth-thermal-sender.py on the Raspberry Pi

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cognitive Care Assistant - Thermal Startup" -ForegroundColor Cyan
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

Write-Host "🚀 Starting thermal sensor services..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Next.js app: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔵 Bluetooth receiver: Auto-detecting Raspberry Pi..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure Raspberry Pi is:" -ForegroundColor Yellow
Write-Host "   - Powered on and paired in Windows Bluetooth settings" -ForegroundColor White
Write-Host "   - Running bluetooth-thermal-sender.py" -ForegroundColor White
Write-Host "   - Connected (green checkmark in Bluetooth settings)" -ForegroundColor White
Write-Host ""
Write-Host "💡 To test connection first, run:" -ForegroundColor Yellow
Write-Host "   node test-thermal-connection.js" -ForegroundColor White
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start both services using concurrently
npx concurrently --names "NEXT,THERMAL" --prefix-colors "blue,green" `
    "npm run dev" `
    "node bluetooth-thermal-receiver.js"
