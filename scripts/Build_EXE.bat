@echo off
echo ===== Controle Financeiro - Build EXE =====

where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo Node.js nao encontrado. Instale o Node LTS a partir de https://nodejs.org/ e rode este script novamente.
  pause
  exit /b 1
)

echo.
echo Instalando dependencias...
call npm install

IF %ERRORLEVEL% NEQ 0 (
  echo Falha no npm install.
  pause
  exit /b 1
)

echo.
echo Gerando build do React...
call npm run build

IF %ERRORLEVEL% NEQ 0 (
  echo Falha no build do React.
  pause
  exit /b 1
)

echo.
echo Empacotando com electron-builder...
call npm run dist

echo.
echo Pronto! Verifique a pasta "release".
pause