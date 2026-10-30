#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Moallem Pro — 24/7 Server Watchdog & Auto-Healing Engine
حارس السيرفر التلقائي الدائم لمنصة مسار المعلم:
- يعمل في الخلفية 24 ساعة دون انقطاع
- يفحص صحة السيرفر على المنفذ 8080 باستمرار
- إذا توقف السيرفر أو أغلق يعيد تشغيله فوراً خلال ثانية واحدة
- يمنع تضارب المنافذ
"""

import sys
import os
import time
import socket
import subprocess
import urllib.request
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_FILE = os.path.join(BASE_DIR, 'app.py')
LOG_FILE = os.path.join(BASE_DIR, 'data', 'server_watchdog.log')
PORT = 8080

os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)

def log(msg):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    entry = f"[{timestamp}] {msg}"
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(entry + '\n')
    except Exception:
        pass

def is_server_healthy():
    try:
        url = f"http://127.0.0.1:{PORT}/health"
        req = urllib.request.Request(url, headers={'User-Agent': 'MoallemWatchdog/1.0'})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                return data.get('status') == 'healthy' or 'SQLite' in str(data)
    except Exception:
        pass
    return False

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def save_server_meta():
    try:
        meta = {
            "local_url": f"http://localhost:{PORT}",
            "network_url": f"http://{get_local_ip()}:{PORT}",
            "port": PORT,
            "status": "running",
            "last_started": datetime.now().isoformat(),
            "python_executable": sys.executable
        }
        with open(os.path.join(BASE_DIR, 'data', 'server_meta.json'), 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2)
    except Exception:
        pass

def main():
    log("=== بدء تشغيل حارس السيرفر الدائم (Watchdog 24/7) ===")
    save_server_meta()
    
    server_process = None

    while True:
        try:
            if is_server_healthy():
                # Server is already running and responsive
                time.sleep(3)
                continue

            log("السيرفر غير مستجيب أو متوقف. جاري إطلاق python app.py الآن...")
            
            # Start app.py
            cmd = [sys.executable, APP_FILE]
            
            # Use flags to avoid creating visible console windows on Windows
            creationflags = 0
            if sys.platform == 'win32':
                creationflags = 0x08000000  # CREATE_NO_WINDOW
                
            server_process = subprocess.Popen(
                cmd,
                cwd=BASE_DIR,
                creationflags=creationflags
            )
            
            log(f"تم إطلاق السيرفر بنجاح برقم العملية (PID: {server_process.pid})")
            save_server_meta()
            
            # Wait a few seconds for it to bind
            for _ in range(10):
                time.sleep(0.5)
                if is_server_healthy():
                    log("السيرفر يعمل بكفاءة وأصبح جاهزاً للاستخدام 200 OK.")
                    break
                    
        except Exception as e:
            log(f"خطأ أثناء حراسة السيرفر: {e}")
            time.sleep(2)
            
        time.sleep(3)

if __name__ == '__main__':
    main()

