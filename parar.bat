@echo off
chcp 65001 >nul
title Sistema COPER - Encerrar Servidores

echo =======================================================
echo          🛑 SISTEMA COPER - PARAR SERVIÇOS
echo =======================================================
echo.

set "COPER_PROJECT_DIR=%~dp0"
echo Encerrando as janelas abertas pelo iniciar.bat deste projeto...
powershell -NoProfile -Command ^
  "$root = $env:COPER_PROJECT_DIR; $shells = @(Get-CimInstance Win32_Process -Filter 'Name = ''cmd.exe''' -ErrorAction Stop | Where-Object { $cmd = $_.CommandLine; $cmd -and (($cmd.Contains($root + 'backend') -and $cmd.Contains('title COPER 3.0 API')) -or ($cmd.Contains($root + 'client') -and $cmd.Contains('title COPER 3.0 Frontend'))) }); if (!$shells.Count) { Write-Host 'Nenhuma janela do COPER encontrada.' }; foreach ($shell in $shells) { taskkill /PID $shell.ProcessId /T /F; if ($LASTEXITCODE) { exit 1 } }"
if errorlevel 1 echo [AVISO] Nao foi possivel encerrar automaticamente. Feche as janelas do COPER.
pause
