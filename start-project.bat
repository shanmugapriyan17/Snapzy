@echo off
echo ==============================================
echo       Starting Snapzy on Localhost
echo ==============================================

echo [1/4] Starting Blockchain Node (Hardhat)...
start "Snapzy - Blockchain" cmd /k "cd blockchain && npx hardhat node"
timeout /t 5 >nul

echo [2/4] Starting AI Service (Python/FastAPI)...
start "Snapzy - AI Moderation" cmd /k "cd ml-service && uvicorn main:app --port 8001"

echo [3/4] Starting Backend Server (Express)...
start "Snapzy - Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul

echo [4/4] Starting Frontend App (Vite)...
start "Snapzy - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services have been launched in separate windows!
echo Please wait a moment for the Frontend server to compile.
echo Accessible at: http://localhost:5173
echo ==============================================
