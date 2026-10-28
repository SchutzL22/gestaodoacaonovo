@echo off
chcp 65001 >nul
title Sistema COPER - Encerrar Servidores

echo =======================================================
echo          🛑 SISTEMA COPER - PARAR SERVIÇOS
echo =======================================================
echo.

echo Encerrando processos nas portas 3001 (Backend) e 5173 (Frontend)...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ports = @(3001, 5173); foreach ($port in $ports) { $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { try { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('Processo encerrado na porta ' + $port + ' (PID ' + $c.OwningProcess + ')') } catch {} } } else { Write-Host ('Nenhum processo ativo na porta ' + $port) } }"

echo.
echo =======================================================
echo          ✅ TODOS OS SERVIÇOS FORAM ENCERRADOS!
echo =======================================================
echo.
pause
