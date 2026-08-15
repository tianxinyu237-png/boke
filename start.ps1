# ============================================
# devlog-blog Docker 启动脚本
# 使用方法：在 PowerShell 中右键运行，或：
#   powershell -ExecutionPolicy Bypass -File start.ps1
# ============================================

$projectDir = "D:\zhiyudalao123\博客"

Write-Host "=== devlog-blog Docker Deploy ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker not found or not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop first."
    Write-Host "If Docker fails to start, check:"
    Write-Host "  - WSL2 is installed: wsl --install"
    Write-Host "  - Hyper-V is enabled (may conflict with VMware)"
    pause
    exit 1
}
Write-Host "  $dockerVersion" -ForegroundColor Green

# 2. Build & start
Write-Host ""
Write-Host "[2/4] Building and starting containers..." -ForegroundColor Yellow
Set-Location $projectDir
docker compose up -d --build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Compose failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  Containers started!" -ForegroundColor Green

# 3. Wait for health
Write-Host ""
Write-Host "[3/4] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Test
Write-Host ""
Write-Host "[4/4] Testing services..." -ForegroundColor Yellow

Write-Host "  Backend (port 8080):"
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8080/api/posts?page=1" -UseBasicParsing -TimeoutSec 5
    Write-Host "    OK - Status: $($backend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    NOT READY - $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "  Frontend (port 3000):"
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    Write-Host "    OK - Status: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    NOT READY - $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "  Nginx (port 80):"
try {
    $nginx = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
    Write-Host "    OK - Status: $($nginx.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "    NOT READY - $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Local access:" -ForegroundColor White
Write-Host "  http://localhost       (via nginx)" -ForegroundColor Gray
Write-Host "  http://localhost:3000  (frontend direct)" -ForegroundColor Gray
Write-Host "  http://localhost:8080  (backend direct)" -ForegroundColor Gray
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  docker compose ps          (check status)" -ForegroundColor Gray
Write-Host "  docker compose logs -f     (view logs)" -ForegroundColor Gray
Write-Host "  docker compose down        (stop all)" -ForegroundColor Gray
Write-Host "  docker compose restart     (restart all)" -ForegroundColor Gray
Write-Host ""
Write-Host "For external access via tianboyuan.top, see EXTERNAL_ACCESS.txt" -ForegroundColor Yellow

pause
