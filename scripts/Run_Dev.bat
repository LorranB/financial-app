@echo off
echo ===== Controle Financeiro - Dev =====

where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js nao encontrado. Instale o Node LTS: https://nodejs.org/
  pause
  exit /b 1
)

call npm install
call npm run dev