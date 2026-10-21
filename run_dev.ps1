# NeuroData BI - Concurrent Development Runner
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  NeuroData BI - AI Data Analyst & Scientist Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev"

Write-Host ""
Write-Host "Services launched successfully!" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:8000/docs" -ForegroundColor Yellow
