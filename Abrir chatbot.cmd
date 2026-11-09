@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 22 o posterior antes de abrir el chatbot.
  pause
  exit /b 1
)
echo Mantiene esta ventana abierta mientras utilizas el chatbot.
echo Abre en el navegador la direccion que aparece a continuacion.
node server.cjs
pause
