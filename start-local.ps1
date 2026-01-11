# Cognitive Care Assistant - Local Startup Script
# This script starts the app locally with WiFi mode (simplest)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cognitive Care Assistant - Local Startup" -ForegroundColor Cyan
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

Write-Host "🚀 Starting Next.js app and EMG server..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 App will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📡 EMG server will run on: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start both servers using the existing script
npm run dev:all

