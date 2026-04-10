# Test script to send sample EMG data to the server
$body = @{
    type = "emg_data"
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    muscleActivity = 2048
    muscleActivityProcessed = 50.0
    voltage = 1.65
    calibrated = $false
} | ConvertTo-Json

Write-Host "Sending test EMG data to http://localhost:3001/api/emg/ws"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/emg/ws" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Success! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

