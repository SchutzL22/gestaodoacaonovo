@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title Sistema COPER 3.0 - Inicialização Automática

echo =======================================================
echo          🤝 SISTEMA COPER 3.0 - INICIALIZADOR
echo =======================================================
echo.

:: 1. Verifica se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não foi encontrado no PATH do sistema!
    echo Por favor, instale o Node.js em https://nodejs.org/ e tente novamente.
    echo.
    pause
    exit /b 1
)

:: 2. Limpeza prévia de processos presos nas portas 3001 e 5173
echo [1/4] Verificando portas do sistema...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ports = @(3001, 5173); foreach ($port in $ports) { $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { try { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('  - Porta ' + $port + ' liberada (PID ' + $c.OwningProcess + ').') } catch {} } } }"
echo   - Portas 3001 e 5173 prontas.

:: 3. Verifica serviço do PostgreSQL
echo.
echo [2/4] Verificando banco de dados PostgreSQL...
sc query postgresql-x64-18 >nul 2>nul
if %errorlevel% equ 0 (
    sc query postgresql-x64-18 | find "RUNNING" >nul 2>nul
    if %errorlevel% neq 0 (
        echo   - Iniciando o serviço postgresql-x64-18...
        net start postgresql-x64-18 >nul 2>nul
    ) else (
        echo   - Serviço PostgreSQL em execução.
    )
) else (
    echo   - Serviço PostgreSQL verificado.
)

:: 4. Verifica dependências do Backend (COPER 3.0)
echo.
echo [3/4] Verificando dependências do Backend e Frontend...
if not exist "%~dp0backend\node_modules" (
    echo   - Instalando dependências em backend...
    cd /d "%~dp0backend"
    call npm install
    cd /d "%~dp0"
) else (
    echo   - Dependências do Backend já instaladas.
)

:: Verifica dependências do Frontend (client)
if not exist "%~dp0client\node_modules" (
    echo   - Instalando dependências em client...
    cd /d "%~dp0client"
    call npm install
    cd /d "%~dp0"
) else (
    echo   - Dependências do Frontend já instaladas.
)

:: 5. Inicializa os servidores em janelas independentes
echo.
echo [4/4] Inicializando os servidores...
echo   -> Iniciando API Backend COPER 3.0 (Porta 3001)...
start "COPER 3.0 - Backend API" cmd /k "cd /d ""%~dp0backend"" && title COPER 3.0 API (Porta 3001) && npm run dev"

:: Aguarda 3 segundos para o backend subir
timeout /t 3 /nobreak >nul

echo   -> Iniciando Frontend Vite (Porta 5173)...
start "COPER 3.0 - Frontend Web" cmd /k "cd /d ""%~dp0client"" && title COPER 3.0 Frontend (Porta 5173) && npm run dev"

:: Aguarda 3 segundos para o frontend subir
timeout /t 3 /nobreak >nul

:: 6. Abre a aplicação no navegador padrão
echo   -> Abrindo no navegador: http://localhost:5173
start http://localhost:5173

echo.
echo =======================================================
echo          ✅ SISTEMA INICIADO COM SUCESSO!
echo =======================================================
echo.
echo   • Frontend:  http://localhost:5173
echo   • API:       http://localhost:3001
echo.
echo   Credenciais de Teste:
echo   - Admin (COPER): coper@coper.edu.br  (ou admin@fmpsc.edu.br)  /  admin123
echo   - Aluno (Lucas): lucas.aluno@aluno.coper.edu.br  /  aluno123
echo   - Aluna (Mariana): mariana.aluna@aluno.coper.edu.br  /  aluno123
echo   - Professor: professor.libras@coper.edu.br  /  prof123
echo   - Empresário: contato@techparceira.com.br  /  empresa123
echo.
echo   Códigos de Validação Pública (Certificados):
echo   - tok-luc-001  (Lucas - Declaração de Alimentos)
echo   - tok-edu-001  (Mariana - Declaração de Agasalho)
echo.
echo Mantenha as janelas do Backend e Frontend abertas enquanto usa o sistema.
echo Para fechar tudo, use o script "parar.bat".
echo =======================================================
echo.
pause
