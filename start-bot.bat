@echo off
echo Iniciando OlympIA Telegram Bot...
cd /d "C:\Users\Pichau\Desktop\Moltbot"
pm2 start ecosystem.config.json
echo Bot iniciado com PM2!
pause