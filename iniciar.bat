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

:: Verifica se as portas estao livres antes de abrir os servidores.
echo [1/4] Verificando portas do sistema...
powershell -NoProfile -Command "$ports = [Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners().Port; if (($ports -contains 3001) -or ($ports -contains 5173)) { exit 1 }"
if errorlevel 1 (
    echo [AVISO] A porta 3001 ou 5173 esta em uso. Confira se o COPER ja esta aberto.
    pause
    exit /b 1
)

:: 3. Verifica serviço do PostgreSQL
echo.
echo [2/4] Verificando banco de dados PostgreSQL...
sc query postgresql-x64-18 >nul 2>nul
if %errorlevel% equ 0 (
    sc query postgresql-x64-18 | find "RUNNING" >nul 2>nul
    if errorlevel 1 (
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
    if errorlevel 1 exit /b 1
    cd /d "%~dp0"
) else (
    echo   - Dependências do Backend já instaladas.
)

:: Verifica dependências do Frontend (client)
if not exist "%~dp0client\node_modules" (
    echo   - Instalando dependências em client...
    cd /d "%~dp0client"
    call npm install
    if errorlevel 1 exit /b 1
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
echo   Use o seletor de contas de demonstracao na tela de login.
echo   As credenciais e os codigos de validacao estao no README.md.
echo.
echo Mantenha as janelas do Backend e Frontend abertas enquanto usa o sistema.
echo Para fechar tudo, use o script "parar.bat".
echo =======================================================
echo.
pause
