@echo off
echo Parando OlympIA Telegram Bot...
pm2 stop olympia-telegram
pm2 delete olympia-telegram
echo Bot parado!
pause