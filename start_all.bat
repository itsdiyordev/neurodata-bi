@echo off
echo ========================================================
echo   NeuroData BI - AI Data Analyst & Scientist Platform
echo ========================================================
echo.

echo [1/2] Starting FastAPI + DuckDB Backend on http://localhost:8000 ...
start "NeuroData BI Backend (FastAPI + DuckDB)" cmd /k "cd backend && venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
start "NeuroData BI Frontend (Vite + React)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API docs: http://localhost:8000/docs
echo.
pause
