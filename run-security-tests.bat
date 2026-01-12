@echo off
REM ============================================
REM Script de Verificação de Segurança
REM Connect Landing Page
REM ============================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     VERIFICAÇÃO DE SEGURANÇA - CONNECT LANDING PAGE       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verificar se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js não encontrado. Por favor, instale o Node.js.
    pause
    exit /b 1
)

echo [INFO] Node.js encontrado: 
node --version
echo.

REM Verificar se as dependências estão instaladas
if not exist "node_modules\" (
    echo [AVISO] Dependências não encontradas. Instalando...
    call npm install
    echo.
)

echo ════════════════════════════════════════════════════════════
echo  TESTE 1: Verificação de Segurança do Frontend
echo ════════════════════════════════════════════════════════════
echo.

node security-test.js
set FRONTEND_TEST=%ERRORLEVEL%

echo.
echo ════════════════════════════════════════════════════════════
echo  TESTE 2: Verificação de Segurança do Banco de Dados
echo ════════════════════════════════════════════════════════════
echo.

REM Verificar se o arquivo .env.local existe
if not exist ".env.local" (
    echo [AVISO] Arquivo .env.local não encontrado!
    echo.
    echo Por favor, crie o arquivo .env.local com:
    echo VITE_SUPABASE_URL=sua_url_aqui
    echo VITE_SUPABASE_ANON_KEY=sua_chave_aqui
    echo.
    set DATABASE_TEST=1
) else (
    node database-security-test.mjs
    set DATABASE_TEST=%ERRORLEVEL%
)

echo.
echo ════════════════════════════════════════════════════════════
echo  RELATÓRIO FINAL
echo ════════════════════════════════════════════════════════════
echo.

if %FRONTEND_TEST% EQU 0 (
    echo [✓] Teste de Frontend: PASSOU
) else (
    echo [✗] Teste de Frontend: FALHOU
)

if %DATABASE_TEST% EQU 0 (
    echo [✓] Teste de Banco de Dados: PASSOU
) else (
    echo [✗] Teste de Banco de Dados: FALHOU
)

echo.
echo ════════════════════════════════════════════════════════════
echo  PRÓXIMOS PASSOS
echo ════════════════════════════════════════════════════════════
echo.

if %FRONTEND_TEST% NEQ 0 (
    echo 1. Revise o arquivo SECURITY_AUDIT.md
)

if %DATABASE_TEST% NEQ 0 (
    echo 2. Execute o script fix-database-vulnerabilities.sql no Supabase
    echo 3. Rotacione a chave anônima no Supabase Dashboard
    echo 4. Atualize o arquivo .env.local com a nova chave
)

echo.
echo Para mais informações, consulte:
echo - SECURITY_SUMMARY.md (Resumo executivo)
echo - SECURITY_FIX_GUIDE.md (Guia de correção)
echo - DATABASE_SECURITY_AUDIT.md (Auditoria do banco)
echo.

if %FRONTEND_TEST% EQU 0 if %DATABASE_TEST% EQU 0 (
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║              ✓ TODOS OS TESTES PASSARAM!                 ║
    echo ║                Sistema está seguro!                       ║
    echo ╚═══════════════════════════════════════════════════════════╝
    exit /b 0
) else (
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║         ✗ VULNERABILIDADES DETECTADAS!                    ║
    echo ║          Ação imediata necessária!                        ║
    echo ╚═══════════════════════════════════════════════════════════╝
    exit /b 1
)

pause
