@echo off
echo ========================================
echo 🚀 VERIFICAÇÃO PRÉ-DEPLOY OLYMPIA BOT
echo ========================================
echo.

echo 📋 Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    pause
    exit /b 1
)
echo ✅ Node.js OK
echo.

echo 📦 Verificando dependências...
if not exist "node_modules" (
    echo 📥 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Falha ao instalar dependências!
        pause
        exit /b 1
    )
)
echo ✅ Dependências OK
echo.

echo 🔧 Verificando sintaxe...
node -c telegram-bot.js
if %errorlevel% neq 0 (
    echo ❌ Erro de sintaxe no telegram-bot.js!
    pause
    exit /b 1
)
echo ✅ Sintaxe OK
echo.

echo ⚙️ Verificando variáveis de ambiente...
if not exist ".env" (
    echo ⚠️ Arquivo .env não encontrado!
    echo 📄 Copie .env.example para .env e configure suas chaves
    echo.
    echo Exemplo: copy .env.example .env
    pause
    exit /b 1
)
echo ✅ Arquivo .env encontrado
echo.

echo 🚂 Verificando configuração Railway...
if not exist "railway.json" (
    echo ❌ Arquivo railway.json não encontrado!
    pause
    exit /b 1
)
echo ✅ Configuração Railway OK
echo.

echo ========================================
echo ✅ PRÉ-DEPLOY CONCLUÍDO COM SUCESSO!
echo ========================================
echo.
echo 🎯 PRÓXIMOS PASSOS:
echo 1. Configure suas variáveis no .env
echo 2. Teste localmente: npm run telegram
echo 3. Faça deploy no Railway seguindo RAILWAY-DEPLOY.md
echo.
echo 📚 Documentação: RAILWAY-DEPLOY.md
echo.
pause