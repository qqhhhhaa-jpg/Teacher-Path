#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Moallem Pro - 24/7 Server Watchdog Bot
بوت حارس ومراقب السيرفر الذكي - يعمل على مدار 24 ساعة بدون توقف
- تشغيل سيرفر محلي متقدم متعدد المهام (Multi-threaded) على المنفذ 8080
- إعادة تشغيل ذاتية فورية عند حدوث أي انقطاع أو انهيار (Self-Healing)
- إمكانية الفتح من أجهزة الهاتف والتابلت عبر شبكة الواي فاي المنزلية
- سجل عمليات وحالة تشغيل لحظي (server_bot.log)
"""

import sys
import os
import time
import socket
import logging
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

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

# Setup logging to both console and file
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

import json
import re
from urllib.parse import urlparse, parse_qs

ACCOUNTS_FILE = os.path.join(WORKSPACE_DIR, 'data', 'accounts.json')
DEFAULT_ADMIN_ACCOUNT = {
    'id': 'usr_admin',
    'name': 'الأستاذ حسين علي (المدير العام)',
    'username': 'admin',
    'email': 'admin@moallem.iq',
    'password': 'qq7878aassdd',
    'role': 'admin',
    'isAdmin': True,
    'isVip': True,
    'isVerified': True,
    'governorate': 'العراق - الإدارة العامة',
    'school': 'إدارة منصة مُعَلِّم بـرو',
    'subject': 'الإشراف العام والتطوير',
    'rights': 'إعداد وتنظيم الأستاذ حسين علي - الإدارة العامة لمنصة مُعَلِّم برو',
    'contact': '07700000000',
    'createdAt': '2026-01-01T00:00:00.000Z'
}

def load_server_accounts():
    data_dir = os.path.join(WORKSPACE_DIR, 'data')
    os.makedirs(data_dir, exist_ok=True)
    accounts = []
    if os.path.exists(ACCOUNTS_FILE):
        try:
            with open(ACCOUNTS_FILE, 'r', encoding='utf-8') as f:
                accounts = json.load(f)
        except Exception:
            accounts = []
    if not isinstance(accounts, list):
        accounts = []
    
    admin_idx = -1
    for i, a in enumerate(accounts):
        if a.get('id') == 'usr_admin' or a.get('username') == 'admin':
            admin_idx = i
            break
            
    if admin_idx == -1:
        accounts.insert(0, dict(DEFAULT_ADMIN_ACCOUNT))
    else:
        accounts[admin_idx] = { **DEFAULT_ADMIN_ACCOUNT, **accounts[admin_idx], 'password': 'qq7878aassdd' }
    return accounts

def save_server_accounts(accounts):
    data_dir = os.path.join(WORKSPACE_DIR, 'data')
    os.makedirs(data_dir, exist_ok=True)
    with open(ACCOUNTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(accounts, f, ensure_ascii=False, indent=2)

class RobustRequestHandler(SimpleHTTPRequestHandler):
    """Enhanced HTTP Handler with UTF-8 support, health-check, accounts DB, and cloud-sync API"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')

        # Health-check endpoint for bots and keep-alive monitors
        if clean_path in ('/health', '/ping', '/bot-status'):
            uptime_seconds = int(time.time() - START_TIME)
            hours, remainder = divmod(uptime_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            uptime_str = f"{hours}h {minutes}m {seconds}s"
            
            response = (
                f'{{"status":"online","bot":"active","port":{PORT},'
                f'"uptime":"{uptime_str}","uptime_seconds":{uptime_seconds},'
                f'"timestamp":"{datetime.now().isoformat()}"}}\n'
            )
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(response.encode('utf-8'))
            return

        # Accounts GET endpoint: /api/accounts
        if clean_path == '/api/accounts':
            accounts = load_server_accounts()
            res = json.dumps({"success": True, "accounts": accounts}, ensure_ascii=False)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(res.encode('utf-8'))
            return

        # Cloud Sync GET endpoint: /api/cloud_sync?email=...&userId=...
        if clean_path == '/api/cloud_sync':
            query = parse_qs(urlparse(self.path).query)
            email = query.get('email', [''])[0].strip().lower()
            user_id = query.get('userId', [''])[0].strip().lower()
            username = query.get('username', [''])[0].strip().lower()

            clean_email = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', email) if email else ''
            clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) if user_id else ''
            clean_u = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', username) if username else ''

            data_dir = os.path.join(WORKSPACE_DIR, 'data')
            candidate_files = []
            if clean_email: candidate_files.append(os.path.join(data_dir, f'cloud_sync_{clean_email}.json'))
            if clean_uid: candidate_files.append(os.path.join(data_dir, f'cloud_sync_{clean_uid}.json'))
            if clean_u: candidate_files.append(os.path.join(data_dir, f'cloud_sync_{clean_u}.json'))

            saved_data = None
            for fp in candidate_files:
                if os.path.exists(fp):
                    try:
                        with open(fp, 'r', encoding='utf-8') as f:
                            saved_data = json.load(f)
                            if saved_data:
                                break
                    except Exception:
                        pass

            if saved_data:
                res = json.dumps({"success": True, "exists": True, "data": saved_data}, ensure_ascii=False)
            else:
                res = json.dumps({"success": True, "exists": False, "data": None}, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(res.encode('utf-8'))
            return

        # Active Session Check GET endpoint: /api/active_session?userId=...
        if clean_path == '/api/active_session':
            query = parse_qs(urlparse(self.path).query)
            user_id = query.get('userId', [''])[0].strip().lower()
            clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) or 'default'
            data_dir = os.path.join(WORKSPACE_DIR, 'data')
            session_file = os.path.join(data_dir, f'session_{clean_uid}.json')
            if os.path.exists(session_file):
                try:
                    with open(session_file, 'r', encoding='utf-8') as f:
                        session_data = json.load(f)
                    res = json.dumps({"success": True, "active": True, "session": session_data}, ensure_ascii=False)
                except Exception as e:
                    res = json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
            else:
                res = json.dumps({"success": True, "active": False, "session": None}, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(res.encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')

        # Accounts POST endpoint: /api/accounts
        if clean_path == '/api/accounts':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length).decode('utf-8')
                payload = json.loads(body) if body else {}
                accounts = load_server_accounts()

                if 'account' in payload and isinstance(payload['account'], dict):
                    acc = payload['account']
                    aid = acc.get('id')
                    aemail = (acc.get('email') or '').lower().strip()
                    auser = (acc.get('username') or '').lower().strip()

                    found_idx = -1
                    for i, existing in enumerate(accounts):
                        if aid and existing.get('id') == aid:
                            found_idx = i
                            break
                        if aemail and (existing.get('email') or '').lower().strip() == aemail:
                            found_idx = i
                            break
                        if auser and (existing.get('username') or '').lower().strip() == auser:
                            found_idx = i
                            break

                    if found_idx >= 0:
                        accounts[found_idx] = { **accounts[found_idx], **acc }
                    else:
                        accounts.append(acc)

                elif 'accounts' in payload and isinstance(payload['accounts'], list):
                    acc_map = {}
                    for a in accounts:
                        k = a.get('id') or (a.get('email') or a.get('username') or '')
                        if k:
                            acc_map[k] = a
                    for acc in payload['accounts']:
                        k = acc.get('id') or (acc.get('email') or acc.get('username') or '')
                        if k:
                            if k in acc_map:
                                acc_map[k] = { **acc_map[k], **acc }
                            else:
                                acc_map[k] = acc
                    accounts = list(acc_map.values())

                save_server_accounts(accounts)
                res = json.dumps({
                    "success": True, 
                    "message": "تم حفظ وتحديث الحسابات على السيرفر بنجاح", 
                    "accounts_count": len(accounts)
                }, ensure_ascii=False)
                self.send_response(200)
            except Exception as e:
                res = json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
                self.send_response(500)

            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(res.encode('utf-8'))
            return

        # Cloud Sync POST endpoint: /api/cloud_sync
        if clean_path == '/api/cloud_sync':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length).decode('utf-8')
                payload = json.loads(body)
                email = payload.get('email', '').strip().lower()
                user_id = payload.get('userId', '').strip().lower()
                clean_email = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', email) if email else ''
                clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) if user_id else ''
                primary_key = clean_email or clean_uid or 'default'

                data_dir = os.path.join(WORKSPACE_DIR, 'data')
                os.makedirs(data_dir, exist_ok=True)
                file_path = os.path.join(data_dir, f'cloud_sync_{primary_key}.json')
                
                payload['server_saved_at'] = datetime.now().isoformat()
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                
                # Also save under userId if distinct so phone can find by userId
                if clean_uid and clean_uid != primary_key:
                    second_path = os.path.join(data_dir, f'cloud_sync_{clean_uid}.json')
                    with open(second_path, 'w', encoding='utf-8') as f:
                        json.dump(payload, f, ensure_ascii=False, indent=2)

                res = json.dumps({
                    "success": True, 
                    "message": "تمت المزامنة والحفظ السحابي بنجاح", 
                    "timestamp": payload['server_saved_at'],
                    "questions_count": len(payload.get('questionsBank', [])),
                    "exams_count": len(payload.get('examsArchive', []))
                }, ensure_ascii=False)
                self.send_response(200)
            except Exception as e:
                res = json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
                self.send_response(500)

            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(res.encode('utf-8'))
            return

        # Active Session Registration POST endpoint: /api/active_session
        if clean_path == '/api/active_session':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length).decode('utf-8')
                payload = json.loads(body)
                user_id = payload.get('userId', '').strip().lower()
                clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) or 'default'
                data_dir = os.path.join(WORKSPACE_DIR, 'data')
                os.makedirs(data_dir, exist_ok=True)
                session_file = os.path.join(data_dir, f'session_{clean_uid}.json')
                
                payload['registered_at'] = datetime.now().isoformat()
                with open(session_file, 'w', encoding='utf-8') as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)

                res = json.dumps({"success": True, "message": "Session registered successfully"}, ensure_ascii=False)
                self.send_response(200)
            except Exception as e:
                res = json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)
                self.send_response(500)

            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(res.encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def end_headers(self):
        # Add CORS, no-cache headers, and UTF-8 encoding headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Only log non-200 or important requests to keep log file clean
        try:
            status_code = str(args[1]) if len(args) > 1 else ''
            if status_code.startswith(('4', '5')):
                logging.warning(f"طلب غير ناجح: {args[0]} -> {status_code}")
        except Exception:
            pass

def print_banner(local_ip):
    banner = f"""
===============================================================================
    [BOT] بوت حارس ومراقب السيرفر - منصة معلم برو (Moallem Pro 24/7 Bot)
===============================================================================
  * حالة البوت: نشط ويعمل على مدار 24 ساعة متواصلة [ONLINE]
  * رابط المنصة على جهازك:   http://localhost:{PORT}
  * رابط الفتح من الهاتف:    http://{local_ip}:{PORT}
  * فحص صحة البوت (Health): http://localhost:{PORT}/health
  * ملف السجل الحي (Logs):   {LOG_FILE}
===============================================================================
  * الحماية الذكية: السيرفر محمي ضد الإغلاق، وسيُعاد تشغيله تلقائياً عند أي طارئ.
  * لإيقاف البوت: اضغط Ctrl + C أو شغل ملف ايقاف_السيرفر.bat
===============================================================================
"""
    try:
        print(banner)
    except Exception:
        print(banner.encode('ascii', errors='replace').decode('ascii'))

def run_server():
    local_ip = get_local_ip()
    print_banner(local_ip)
    logging.info(f"تم تشغيل بوت حراسة السيرفر على المنفذ {PORT} (العمل 24 ساعة)")

    restart_count = 0
    while True:
        try:
            server = ThreadedHTTPServer((HOST, PORT), RobustRequestHandler)
            logging.info(f"السيرفر يستقبل الاتصالات الآن بنجاح على http://localhost:{PORT}")
            server.serve_forever()
        except KeyboardInterrupt:
            logging.info("تم إيقاف البوت بواسطة المستخدم (Ctrl+C).")
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
