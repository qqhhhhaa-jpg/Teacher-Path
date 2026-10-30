#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Keep-Alive Ping Bot - بوت البقاء نشطاً (24/7)
بوت إرسال نبضات دورية (Ping) كل 5 دقائق لمنع خمول أو نوم السيرفر 
سواء كان على السيرفر المحلي أو مستضافاً على منصات سحابية مثل Render, Replit, Glitch...
"""

import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

# Fix Windows console UTF-8 encoding safely
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# أدخل رابط السيرفر هنا (محلي أو رابط استضافة أونلاين)
TARGET_URL = "http://localhost:8080/health"

# الفاصل الزمني بين النبضات بالثواني (300 ثانية = 5 دقائق)
INTERVAL_SECONDS = 300

def ping_server():
    print("=" * 70)
    print("بوت الإبقاء الدائم (Keep-Alive Ping Bot 24/7)")
    print(f"الرابط المستهدف: {TARGET_URL}")
    print(f"الفاصل الزمني: كل {INTERVAL_SECONDS // 60} دقائق")
    print("=" * 70)

    ping_count = 0
    success_count = 0

    while True:
        ping_count += 1
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            start = time.time()
            req = urllib.request.Request(
                TARGET_URL,
                headers={'User-Agent': 'KeepAliveBot/2.0'}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                status = response.getcode()
                latency = round((time.time() - start) * 1000)
                success_count += 1
                print(f"[{now_str}] [OK] نبضة #{ping_count}: السيرفر نشط وشغال! (كود: {status} | سرعة الاستجابة: {latency}ms)")
        except urllib.error.HTTPError as e:
            print(f"[{now_str}] [WARN] نبضة #{ping_count}: استجاب السيرفر بكود {e.code}")
        except urllib.error.URLError as e:
            print(f"[{now_str}] [ERR] نبضة #{ping_count}: تعذر الوصول للسيرفر: {e.reason}")
        except Exception as e:
            print(f"[{now_str}] [ERR] نبضة #{ping_count}: خطأ غير متوقع: {e}")

        # انتظار المدة المحددة قبل النبضة التالية
        time.sleep(INTERVAL_SECONDS)

if __name__ == '__main__':
    ping_server()
