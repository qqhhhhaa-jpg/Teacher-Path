@echo off
chcp 65001 > nul
title 🛑 إيقاف سيرفر مُعَلِّم برو
color 0C

echo ===============================================================================
echo                🛑 جاري إيقاف السيرفر وإنهاء كافة العمليات...
echo ===============================================================================
echo.
cd /d "%~dp0"

:: إنهاء العمليات المرتبطة
for /f "tokens=2 delims=," %%p in ('tasklist /fo csv /nh ^| findstr /i "python"') do (
    wmic process where "commandline like '%%server_watchdog.py%%'" call terminate > nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo تم العثور على السيرفر على المنفذ 8080 برقم العملية (PID: %%a)، جاري الإيقاف...
    taskkill /F /PID %%a > nul 2>&1
)

taskkill /F /IM cloudflared.exe > nul 2>&1

echo.
echo ✅ تم إيقاف السيرفر بنجاح!
timeout /t 2 > nul
