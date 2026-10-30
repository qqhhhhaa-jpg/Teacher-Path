@echo off
chcp 65001 > nul
title منصة مُعَلِّم برو 24/7 - سيرفر المزامنة الفورية (لابتوب + موبايل)
color 0B

echo ===============================================================================
echo       🚀 منصة مُعَلِّم بـرو - إطلاق السيرفر والمزامنة الفورية بين الأجهزة
echo ===============================================================================
echo.
cd /d "%~dp0"

:: تشغيل حارس السيرفر الصامت في الخلفية
start "" pythonw server_watchdog.py
timeout /t 2 /nobreak > nul

for /f "delims=" %%I in ('python -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2^>nul') do set "LOCAL_IP=%%I"
if "%LOCAL_IP%"=="" set "LOCAL_IP=192.168.0.29"

echo.
echo ===============================================================================
echo 🌐 روابط الوصول والمزامنة المباشرة:
echo   💻 من هذا الكمبيوتر (اللابتوب):  http://localhost:8080
echo   📱 من الهاتف المحمول (الموبايل): http://%LOCAL_IP%:8080
echo ===============================================================================
echo.
echo جاري فتح المنصة في متصفحك الافتراضي...
start http://localhost:8080
timeout /t 3 > nul
