#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Moallem Pro - 24/7 Server Watchdog & Central Data Engine
سيرفر وبوت حارس منصة مسار المعلم الذكية 4.0 - يعمل 24 ساعة لحفظ البيانات بالكامل:
- إدارة وحفظ الحسابات وأسماء المستخدمين وكلمات المرور
- تتبع وتسجيل كل ما يدور بالمنصة كاملاً في قاعدة بيانات مركزية SQLite + JSON
- مزامنة بنك الأسئلة والأرشيف السحابي
- حارس الجلسات الحية ومنع تعدد الأجهزة
- لوحة تحكم ورادار مباشر للأنشطة /dashboard
"""

import sys
import os
import time
import socket
import logging
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
import json
import re
from urllib.parse import urlparse, parse_qs

# Fix Windows console UTF-8 encoding safely
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Configuration
PORT = int(os.environ.get('PORT', 8080))
HOST = '0.0.0.0' # Allows local network access (PC, Mobile, Tablet)
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
START_TIME = time.time()

# Setup logging
LOG_FILE = os.path.join(WORKSPACE_DIR, 'server_bot.log')
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Import Central SQLite Database Engine
try:
    import server_db
except Exception as e:
    logging.error(f"تحذير: تعذر استيراد محرك القاعدة server_db: {e}")
    server_db = None

def get_local_ip():
    """Detect local Wi-Fi / LAN IP for phone & tablet connection"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Multi-threaded server to handle simultaneous connections without blocking"""
    daemon_threads = True
    allow_reuse_address = True

class RobustRequestHandler(SimpleHTTPRequestHandler):
    """Enhanced HTTP Handler with SQLite telemetry, UTF-8 support, and real-time APIs"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        res_str = json.dumps(data, ensure_ascii=False)
        self.wfile.write(res_str.encode('utf-8'))

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        client_ip = self.client_address[0] if hasattr(self, 'client_address') else ''

        # 1. Dashboard UI Route
        if clean_path in ('/dashboard', '/admin', '/control', '/server-control'):
            dash_path = os.path.join(WORKSPACE_DIR, 'admin_control.html')
            if os.path.exists(dash_path):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(dash_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # 2. Health-check endpoint
        if clean_path in ('/health', '/ping', '/bot-status'):
            uptime_seconds = int(time.time() - START_TIME)
            hours, remainder = divmod(uptime_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            uptime_str = f"{hours}h {minutes}m {seconds}s"
            
            self.send_json_response({
                "status": "online",
                "bot": "active_24_7",
                "port": PORT,
                "uptime": uptime_str,
                "uptime_seconds": uptime_seconds,
                "timestamp": datetime.now().isoformat()
            })
            return

        # 3. Platform Statistics: /api/stats
        if clean_path == '/api/stats':
            if server_db:
                stats = server_db.get_platform_statistics()
            else:
                stats = {"status": "ok", "error": "db_not_loaded"}
            self.send_json_response(stats)
            return

        # 4. Accounts GET endpoint: /api/accounts
        if clean_path == '/api/accounts':
            if server_db:
                accounts = server_db.get_all_accounts()
            else:
                accounts = []
            self.send_json_response({"success": True, "accounts": accounts})
            return

        # 5. Activity Stream GET endpoint: /api/activity
        if clean_path == '/api/activity':
            query = parse_qs(urlparse(self.path).query)
            limit = int(query.get('limit', [150])[0])
            user_id = query.get('user_id', [''])[0].strip() or None
            action_type = query.get('action_type', [''])[0].strip() or None

            activities = server_db.get_activities(limit=limit, user_id=user_id, action_type=action_type) if server_db else []
            self.send_json_response({"success": True, "activities": activities})
            return

        # 6. Cloud Sync GET endpoint: /api/cloud_sync
        if clean_path == '/api/cloud_sync':
            query = parse_qs(urlparse(self.path).query)
            email = query.get('email', [''])[0].strip().lower()
            user_id = query.get('userId', [''])[0].strip().lower()
            username = query.get('username', [''])[0].strip().lower()

            candidate_keys = [email, user_id, username]
            saved_data = server_db.get_cloud_sync_data(candidate_keys) if server_db else None

            if saved_data:
                self.send_json_response({"success": True, "exists": True, "data": saved_data})
            else:
                self.send_json_response({"success": True, "exists": False, "data": None})
            return

        # 7. Active Session Check: /api/active_session
        if clean_path == '/api/active_session':
            query = parse_qs(urlparse(self.path).query)
            user_id = query.get('userId', [''])[0].strip().lower()
            session_data = server_db.get_active_session(user_id) if (server_db and user_id) else None

            if session_data:
                self.send_json_response({"success": True, "active": True, "session": session_data})
            else:
                self.send_json_response({"success": True, "active": False, "session": None})
            return

        # 8. Full Database Backup Export: /api/backup
        if clean_path == '/api/backup':
            if server_db:
                backup = server_db.export_full_backup_data()
                filename = f"moallem_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                self.end_headers()
                self.wfile.write(json.dumps(backup, ensure_ascii=False, indent=2).encode('utf-8'))
                return
            else:
                self.send_json_response({"error": "database_unavailable"}, status=500)
                return

        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        client_ip = self.client_address[0] if hasattr(self, 'client_address') else ''

        # Read JSON Body
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
            payload = json.loads(body) if body else {}
        except Exception as e:
            self.send_json_response({"success": False, "error": f"Invalid JSON: {e}"}, status=400)
            return

        # 1. Accounts POST endpoint: /api/accounts
        if clean_path == '/api/accounts':
            try:
                if 'account' in payload and isinstance(payload['account'], dict):
                    server_db.upsert_account(payload['account'])
                    server_db.log_activity(
                        payload['account'].get('id', ''),
                        payload['account'].get('username', ''),
                        'تحديث أو إضافة حساب',
                        f"تم حفظ بيانات الحساب {payload['account'].get('username')}",
                        action_type='ACCOUNT_SAVE',
                        ip_address=client_ip
                    )
                elif 'accounts' in payload and isinstance(payload['accounts'], list):
                    for a in payload['accounts']:
                        server_db.upsert_account(a, sync_json=False)
                    server_db.sync_accounts_to_json()
                
                accounts = server_db.get_all_accounts()
                self.send_json_response({
                    "success": True, 
                    "message": "تم حفظ وتحديث الحسابات في قاعدة بيانات السيرفر بنجاح", 
                    "accounts_count": len(accounts)
                })
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)}, status=500)
            return

        # 2. Authentication Login: /api/auth/login
        if clean_path == '/api/auth/login':
            identifier = (payload.get('identifier') or payload.get('username') or payload.get('email') or '').strip().lower()
            password = payload.get('password') or ''
            device_info = payload.get('deviceInfo') or ''

            accounts = server_db.get_all_accounts()
            matched = None
            for acc in accounts:
                aid = (acc.get('id') or '').lower()
                auser = (acc.get('username') or '').lower()
                aemail = (acc.get('email') or '').lower()
                if identifier in (aid, auser, aemail):
                    matched = acc
                    break

            if matched and (str(matched.get('password')) == str(password)):
                # Login Success!
                matched['lastLoginAt'] = datetime.now().isoformat()
                matched['deviceInfo'] = device_info
                server_db.upsert_account(matched)
                server_db.log_activity(
                    matched.get('id'),
                    matched.get('username'),
                    'تسجيل دخول ناجح',
                    f"تم تسجيل الدخول بنجاح عبر {device_info or 'المتصفح'}",
                    action_type='LOGIN_SUCCESS',
                    ip_address=client_ip,
                    device_info=device_info,
                    user_name=matched.get('name', '')
                )
                self.send_json_response({"success": True, "account": matched})
            else:
                server_db.log_activity(
                    'guest',
                    identifier,
                    'محاولة دخول فاشلة',
                    f"محاولة فاشلة لتسجيل الدخول باستخدام المعرف: {identifier}",
                    action_type='LOGIN_FAILED',
                    ip_address=client_ip,
                    device_info=device_info
                )
                self.send_json_response({"success": False, "message": "بيانات الدخول غير صحيحة"}, status=401)
            return

        # 3. Telemetry Event Logger: /api/activity
        if clean_path == '/api/activity':
            user_id = payload.get('userId') or payload.get('user_id') or 'guest'
            username = payload.get('username') or 'زائر'
            user_name = payload.get('userName') or payload.get('name') or ''
            action_type = payload.get('actionType') or payload.get('action_type') or 'GENERAL'
            action_title = payload.get('actionTitle') or payload.get('action_title') or action_type
            details = payload.get('details') or ''
            device_info = payload.get('deviceInfo') or ''

            logged = server_db.log_activity(
                user_id=user_id,
                username=username,
                action_title=action_title,
                details=details,
                action_type=action_type,
                ip_address=client_ip,
                device_info=device_info,
                user_name=user_name
            ) if server_db else False

            self.send_json_response({"success": logged})
            return

        # 4. Cloud Sync POST endpoint: /api/cloud_sync
        if clean_path == '/api/cloud_sync':
            try:
                res = server_db.save_cloud_sync_data(payload) if server_db else {"success": False}
                self.send_json_response(res)
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)}, status=500)
            return

        # 5. Active Session Registration: /api/active_session
        if clean_path == '/api/active_session':
            try:
                if server_db:
                    server_db.save_active_session(payload, ip_address=client_ip)
                self.send_json_response({"success": True, "message": "تم تسجيل الجلسة النشطة"})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)}, status=500)
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path == '/api/accounts':
            query = parse_qs(urlparse(self.path).query)
            aid = query.get('id', [''])[0].strip()
            if not aid:
                self.send_json_response({"success": False, "message": "Missing account id"}, status=400)
                return
            
            ok, msg = server_db.delete_account(aid) if server_db else (False, "DB offline")
            self.send_json_response({"success": ok, "message": msg}, status=200 if ok else 400)
            return
        
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        # Filter noisy access logs, keep errors and major calls
        try:
            status_code = str(args[1]) if len(args) > 1 else ''
            if status_code.startswith(('4', '5')):
                logging.warning(f"طلب غير ناجح: {args[0]} -> {status_code}")
        except Exception:
            pass

def print_banner(local_ip):
    banner = f"""
===============================================================================
    [BOT] سيرفر منصة مسار المعلم الذكية 4.0 - قاعدة البيانات والمراقبة المركزية
===============================================================================
  * حالة السيرفر: نشط وقاعدة البيانات المركزية متصلة [ONLINE 24/7]
  * رابط المنصة على جهازك:   http://localhost:{PORT}
  * لوحة تحكم السيرفر الحية: http://localhost:{PORT}/dashboard
  * رابط الفتح من الهاتف:    http://{local_ip}:{PORT}
  * فحص صحة السيرفر (Health):http://localhost:{PORT}/health
  * ملف السجل الحي (Logs):   {LOG_FILE}
===============================================================================
  * الحماية الذكية: السيرفر محمي ضد الإغلاق، وسيُعاد تشغيله تلقائياً عند أي طارئ.
  * لإيقاف السيرفر: اضغط Ctrl + C أو شغل ملف ايقاف_السيرفر.bat
===============================================================================
"""
    try:
        print(banner)
    except Exception:
        print(banner.encode('ascii', errors='replace').decode('ascii'))

def run_server():
    local_ip = get_local_ip()
    print_banner(local_ip)
    logging.info(f"تم إطلاق محرك قاعدة البيانات وسيرفر المراقبة على المنفذ {PORT}")

    restart_count = 0
    while True:
        try:
            server = ThreadedHTTPServer((HOST, PORT), RobustRequestHandler)
            logging.info(f"السيرفر يستقبل الاتصالات الآن بنجاح على http://localhost:{PORT}")
            server.serve_forever()
        except KeyboardInterrupt:
            logging.info("تم إيقاف السيرفر بواسطة المستخدم (Ctrl+C).")
            print("\nتم إيقاف السيرفر بنجاح.")
            break
        except OSError as e:
            if "address already in use" in str(e).lower() or getattr(e, 'winerror', 0) == 10048:
                logging.warning(f"المنفذ {PORT} قيد الاستخدام مسبقاً! جاري إعادة المحاولة خلال ثانيتين...")
            else:
                logging.error(f"خطأ في تشغيل السيرفر: {e}")
            time.sleep(2)
        except Exception as e:
            restart_count += 1
            logging.error(f"حدث خطأ غير متوقع: {e}")
            logging.info(f"جاري الإنعاش وإعادة التشغيل الذاتي الفوري (محاولة #{restart_count})...")
            time.sleep(1)

if __name__ == '__main__':
    run_server()
