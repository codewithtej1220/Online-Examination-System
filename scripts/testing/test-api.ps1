# Test API Script
Write-Host "`n=== Testing Online Examination System API ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`nTest 1: Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Host "✓ Server is healthy: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}

# Test 2: Database Tables
Write-Host "`nTest 2: Database Tables..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/tables" -Method Get
    Write-Host "✓ Found $($response.tables.Count) tables" -ForegroundColor Green
    Write-Host "Tables: $($response.tables -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "✗ Tables check failed: $_" -ForegroundColor Red
}

# Test 3: Query Users
Write-Host "`nTest 3: Query Users Table..." -ForegroundColor Yellow
try {
    $body = @{ sql = "SELECT COUNT(*) AS count FROM users;" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/query" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Users in database: $($response.rows[0].count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nYour application is ready! Open: http://localhost:5000" -ForegroundColor Green
Write-Host ""
