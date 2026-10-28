@echo off
chcp 65001 >nul
title Sistema COPER - Inicialização Automática

echo =======================================================
echo          🤝 SISTEMA COPER - INICIALIZADOR
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

:: 2. Tenta iniciar o serviço do MySQL se necessário
echo [1/4] Verificando serviço MySQL...
sc query MySQL95 >nul 2>nul
if %errorlevel% equ 0 (
    sc query MySQL95 | find "RUNNING" >nul 2>nul
    if %errorlevel% neq 0 (
        echo Iniciando o serviço MySQL95...
        net start MySQL95 >nul 2>nul
    ) else (
        echo MySQL95 já está em execução.
    )
) else (
    echo [INFO] Serviço de banco verificado.
)

:: 3. Verifica e instala dependências do Backend se necessário
echo.
echo [2/4] Verificando dependências do Backend (server)...
if not exist "%~dp0server\node_modules" (
    echo Instalando dependências em server...
    cd /d "%~dp0server"
    call npm install
    cd /d "%~dp0"
) else (
    echo Dependências do Backend já instaladas.
)

:: 4. Verifica e instala dependências do Frontend se necessário
echo.
echo [3/4] Verificando dependências do Frontend (client)...
if not exist "%~dp0client\node_modules" (
    echo Instalando dependências em client...
    cd /d "%~dp0client"
    call npm install
    cd /d "%~dp0"
) else (
    echo Dependências do Frontend já instaladas.
)

:: 5. Inicia o Backend (Porta 3001)
echo.
echo [4/4] Inicializando os servidores...
echo   -> Iniciando API Backend (Porta 3001)...
start "COPER - Backend API" cmd /k "cd /d ""%~dp0server"" && title COPER API (Porta 3001) && npm start"

:: Aguarda 2 segundos
timeout /t 2 /nobreak >nul

:: 6. Inicia o Frontend (Porta 5173)
echo   -> Iniciando Frontend Vite (Porta 5173)...
start "COPER - Frontend Web" cmd /k "cd /d ""%~dp0client"" && title COPER Frontend (Porta 5173) && npm run dev"

:: Aguarda 3 segundos para os servidores subirem
timeout /t 3 /nobreak >nul

:: 7. Abre a aplicação no navegador padrão
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
echo   - Administrador: admin@fmpsc.edu.br  /  admin123
echo   - Aluno (Lucas): lucas@aluno.fmpsc.edu.br  /  lucas123
echo.
echo Mantenha as janelas do Backend e Frontend abertas enquanto usa o sistema.
echo Para fechar tudo, use o script "parar.bat".
echo =======================================================
echo.
pause
