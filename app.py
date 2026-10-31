#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مسار المعلم | WSGI Production Server for Cloud Hosting (Render, Railway, Heroku) & Local Execution
سيرفر بايثون متكامل يدعم قاعدة البيانات المركزية SQLite وتتبع الأنشطة وإدارة الحسابات
"""
import os
import re
import json
from datetime import datetime
import supabase_manager
from flask import Flask, send_from_directory, jsonify, request, send_file

import sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
SERVER_DIR = os.path.join(BASE_DIR, 'server')
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

# Import Central SQLite Database Engine
try:
    import server_db
except Exception as e:
    try:
        from server import server_db
    except Exception as e2:
        server_db = None


app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Cache-Control'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return add_cors_headers(response)

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/dashboard')
@app.route('/admin')
def dashboard():
    return send_from_directory(BASE_DIR, 'admin_control.html')

@app.route('/health')
@app.route('/ping')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'masar_almoallem',
        'platform': 'Moallem Pro 4.0',
        'database': 'SQLite_ONLINE',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/network-info', methods=['GET'])
def api_network_info():
    import socket
    local_ip = '127.0.0.1'
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    return jsonify({
        'local_ip': local_ip,
        'port': 8080,
        'mobile_url': f'http://{local_ip}:8080',
        'local_url': 'http://localhost:8080'
    }), 200

# Statistics API
@app.route('/api/stats', methods=['GET'])
def api_stats():
    if server_db:
        return jsonify(server_db.get_platform_statistics()), 200
    return jsonify({'status': 'ok'}), 200

# Accounts API
@app.route('/api/accounts', methods=['GET', 'POST', 'DELETE'])
def api_accounts():
    client_ip = request.remote_addr or ''

    if request.method == 'GET':
        # حماية خصوصية المعلمين: تجريد كلمات السر وحجب البيانات الحساسة
        is_admin = request.headers.get('X-Admin-Role') == 'admin' or request.args.get('role') == 'admin'
        accounts = server_db.get_sanitized_accounts(is_admin_request=is_admin) if server_db else []
        return jsonify({"success": True, "accounts": accounts}), 200

    if request.method == 'DELETE':
        aid = request.args.get('id', '').strip()
        if not aid:
            return jsonify({"success": False, "message": "Missing account id"}), 400
        ok, msg = server_db.delete_account(aid) if server_db else (False, "Database unavailable")
        return jsonify({"success": ok, "message": msg}), (200 if ok else 400)

    # POST
    try:
        payload = request.get_json(force=True, silent=True) or {}
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

        accounts = server_db.get_all_accounts() if server_db else []
        return jsonify({
            "success": True, 
            "message": "تم حفظ وتحديث الحسابات في قاعدة بيانات السيرفر بنجاح", 
            "accounts_count": len(accounts)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Auth Login API
@app.route('/api/auth/login', methods=['POST'])
def api_auth_login():
    payload = request.get_json(force=True, silent=True) or {}
    identifier = (payload.get('identifier') or payload.get('username') or payload.get('email') or '').strip().lower()
    password = payload.get('password') or ''
    device_info = payload.get('deviceInfo') or ''
    client_ip = request.remote_addr or ''

    accounts = server_db.get_all_accounts() if server_db else []
    matched = None
    for acc in accounts:
        aid = (acc.get('id') or '').lower()
        auser = (acc.get('username') or '').lower()
        aemail = (acc.get('email') or '').lower()
        if identifier in (aid, auser, aemail):
            matched = acc
            break

    if matched and server_db.verify_password(password, matched.get('password')):
        # إذا كانت كلمة المرور غير مشفرة بالملح ترقيتها وتشفيرها فوراً
        if matched.get('password') and not str(matched.get('password')).startswith('pbkdf2_sha256$'):
            matched['password'] = server_db.hash_password(password)
            server_db.upsert_account(matched)

        matched['lastLoginAt'] = datetime.now().isoformat()
        matched['deviceInfo'] = device_info
        if server_db:
            server_db.upsert_account(matched)
            server_db.log_activity(
                matched.get('id'),
                matched.get('username'),
                'تسجيل دخول موثق',
                f"دخول ناجح ومصادق عليه عبر الجهاز {device_info or 'مجهول'}",
                action_type='LOGIN_SUCCESS',
                ip_address=client_ip,
                device_info=device_info,
                user_name=matched.get('name', '')
            )
        # تجريد كلمة المرور من بيانات الاستجابة لمنع تسريبها للشبكة
        safe_acc = dict(matched)
        safe_acc.pop('password', None)
        return jsonify({"success": True, "account": safe_acc}), 200

    if server_db:
        server_db.log_activity(
            'guest',
            identifier,
            'محاولة دخول فاشلة',
            f"محاولة فاشلة لتسجيل الدخول بالمعرف: {identifier}",
            action_type='LOGIN_FAILED',
            ip_address=client_ip,
            device_info=device_info
        )
    return jsonify({"success": False, "message": "بيانات الدخول غير صحيحة"}), 401

# Telemetry / Activity API
@app.route('/api/activity', methods=['GET', 'POST'])
def api_activity():
    client_ip = request.remote_addr or ''

    if request.method == 'GET':
        limit = int(request.args.get('limit', 150))
        user_id = request.args.get('user_id', '').strip() or None
        action_type = request.args.get('action_type', '').strip() or None
        activities = server_db.get_activities(limit=limit, user_id=user_id, action_type=action_type) if server_db else []
        return jsonify({"success": True, "activities": activities}), 200

    # POST
    payload = request.get_json(force=True, silent=True) or {}
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

    return jsonify({"success": logged}), 200

# Cloud Sync API
@app.route('/api/cloud_sync', methods=['GET', 'POST'])
def api_cloud_sync():
    if request.method == 'GET':
        email = request.args.get('email', '').strip().lower()
        user_id = request.args.get('userId', '').strip().lower()
        username = request.args.get('username', '').strip().lower()

        saved_data = server_db.get_cloud_sync_data([email, user_id, username]) if server_db else None
        if saved_data:
            return jsonify({"success": True, "exists": True, "data": saved_data}), 200
        return jsonify({"success": True, "exists": False, "data": None}), 200

    # POST
    try:
        payload = request.get_json(force=True, silent=True) or {}
        res = server_db.save_cloud_sync_data(payload) if server_db else {"success": False}
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Active Session API
@app.route('/api/active_session', methods=['GET', 'POST'])
def api_active_session():
    client_ip = request.remote_addr or ''

    if request.method == 'GET':
        user_id = request.args.get('userId', '').strip().lower()
        session_data = server_db.get_active_session(user_id) if (server_db and user_id) else None
        if session_data:
            return jsonify({"success": True, "active": True, "session": session_data}), 200
        return jsonify({"success": True, "active": False, "session": None}), 200

    # POST
    try:
        payload = request.get_json(force=True, silent=True) or {}
        if server_db:
            server_db.save_active_session(payload, ip_address=client_ip)
        return jsonify({"success": True, "message": "Session registered successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Backup Export API
@app.route('/api/backup', methods=['GET'])
def api_backup():
    if server_db:
        backup = server_db.export_full_backup_data()
        filename = f"moallem_server_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        response = jsonify(backup)
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    return jsonify({"error": "database_unavailable"}), 500

# Activation Codes API
@app.route('/api/activation_codes', methods=['GET', 'POST', 'DELETE'])
@app.route('/api/activation_codes/generate', methods=['POST'])
def api_activation_codes():
    if not server_db:
        return jsonify({"success": False, "error": "database_offline"}), 500

    if request.method == 'GET':
        codes = server_db.get_all_activation_codes()
        return jsonify({"success": True, "codes": codes}), 200

    if request.method == 'POST':
        try:
            payload = request.get_json(force=True, silent=True) or {}
            plan_code = payload.get('plan_code') or payload.get('plan') or '1_year'
            count = int(payload.get('count') or 1)
            note = payload.get('note') or ''
            prefix = payload.get('prefix') or ''
            new_codes = server_db.generate_activation_codes(plan_code=plan_code, count=count, note=note, custom_prefix=prefix)
            all_codes = server_db.get_all_activation_codes()
            return jsonify({"success": True, "generated_codes": new_codes, "codes": all_codes}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    if request.method == 'DELETE':
        clear_used = request.args.get('clear_used', 'false').lower() == 'true'
        if clear_used:
            ok, msg = server_db.clear_used_activation_codes()
            codes = server_db.get_all_activation_codes()
            return jsonify({"success": ok, "message": msg, "codes": codes}), 200

        code_str = request.args.get('code', '').strip()
        if not code_str:
            return jsonify({"success": False, "message": "Missing code"}), 400
        ok, msg = server_db.delete_activation_code(code_str)
        codes = server_db.get_all_activation_codes()
        return jsonify({"success": ok, "message": msg, "codes": codes}), 200

@app.route('/api/activation_codes/redeem', methods=['POST'])
def api_redeem_activation_code():
    if not server_db:
        return jsonify({"success": False, "message": "قاعدة البيانات غير متصلة"}), 500

    try:
        payload = request.get_json(force=True, silent=True) or {}
        code_str = payload.get('code') or ''
        user_dict = payload.get('user') or payload.get('account') or {}
        device_info = payload.get('deviceInfo') or ''
        client_ip = request.remote_addr or ''

        ok, msg, details = server_db.redeem_activation_code(code_str, user_dict, ip_address=client_ip, device_info=device_info)
        return jsonify({
            "success": ok,
            "message": msg,
            "details": details,
            "account": details.get('account') if details else None
        }), 200 if ok else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==============================================================================
# Google Cloud API Gateway & Integration Endpoints (/api/gcloud/*)
# ==============================================================================
import urllib.request
import urllib.error

GCLOUD_CONFIG_FILE = os.path.join(DATA_DIR, 'gcloud_config.json')
GCLOUD_SNAPSHOTS_FILE = os.path.join(DATA_DIR, 'gcloud_snapshots.json')

def _load_gcloud_config():
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(GCLOUD_CONFIG_FILE):
        try:
            with open(GCLOUD_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "projectId": os.environ.get("GOOGLE_CLOUD_PROJECT", "huseein1234"),
        "apiKey": os.environ.get("GEMINI_API_KEY", ""),
        "oauthClientId": os.environ.get("GOOGLE_OAUTH_CLIENT_ID", ""),
        "bucketName": os.environ.get("GCS_BUCKET_NAME", ""),
        "webhookUrl": os.environ.get("GCLOUD_WEBHOOK_URL", ""),
        "region": "me-west1",
        "geminiModel": "gemini-2.5-flash",
        "autoSync": True,
        "enableGoogleLogin": True,
        "gatewaySecret": os.environ.get("GCLOUD_GATEWAY_SECRET", "MASAR-GCLOUD-2026-KEY"),
        "updatedAt": None
    }

def _save_gcloud_config(cfg):
    os.makedirs(DATA_DIR, exist_ok=True)
    cfg["updatedAt"] = datetime.now().isoformat()
    with open(GCLOUD_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    return cfg

@app.route('/api/gcloud/config', methods=['GET', 'POST'])
def api_gcloud_config():
    cfg = _load_gcloud_config()
    if request.method == 'GET':
        return jsonify({
            "success": True,
            "config": cfg,
            "status": {
                "hasApiKey": bool(cfg.get("apiKey")),
                "hasProjectId": bool(cfg.get("projectId")),
                "hasOAuth": bool(cfg.get("oauthClientId")),
                "databaseOnline": bool(server_db),
                "serverTime": datetime.now().isoformat()
            }
        }), 200

    try:
        payload = request.get_json(force=True, silent=True) or {}
        for key in ["projectId", "apiKey", "oauthClientId", "bucketName", "webhookUrl", "region", "geminiModel", "gatewaySecret"]:
            if key in payload and payload[key] is not None:
                cfg[key] = str(payload[key]).strip()
        for bool_key in ["autoSync", "enableGoogleLogin"]:
            if bool_key in payload:
                cfg[bool_key] = bool(payload[bool_key])
        saved = _save_gcloud_config(cfg)
        if server_db:
            server_db.log_activity('admin', 'GoogleCloudGateway', 'تحديث إعدادات بوابة Google Cloud API', f"Project: {saved.get('projectId') or 'Local'}", action_type='GCLOUD_CONFIG')
        return jsonify({"success": True, "message": "تم حفظ إعدادات بوابة Google Cloud API بنجاح", "config": saved}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/gcloud/test', methods=['POST'])
def api_gcloud_test():
    cfg = _load_gcloud_config()
    payload = request.get_json(force=True, silent=True) or {}
    api_key = (payload.get('apiKey') or cfg.get('apiKey') or '').strip()
    project_id = (payload.get('projectId') or cfg.get('projectId') or '').strip()

    checks = {
        "localServer": True,
        "sqliteDb": bool(server_db),
        "projectConfigured": bool(project_id),
        "geminiApi": False,
        "geminiMessage": "لم يتم إدخال مفتاح API بعد"
    }

    if api_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        try:
            req = urllib.request.Request(url, method='GET')
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 200:
                    checks["geminiApi"] = True
                    checks["geminiMessage"] = "متصل بنجاح مع Google Cloud Gemini API 🟢"
        except urllib.error.HTTPError as he:
            checks["geminiMessage"] = f"رد السيرفر من Google ({he.code}): تأكد من صلاحية مفتاح API"
        except Exception as e:
            checks["geminiMessage"] = f"تعذر الوصول الخارجي ({str(e)[:60]}) — البوابة المحلية نشطة"

    return jsonify({
        "success": True,
        "checks": checks,
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/gcloud/gemini', methods=['POST'])
def api_gcloud_gemini():
    cfg = _load_gcloud_config()
    payload = request.get_json(force=True, silent=True) or {}
    api_key = (payload.get('apiKey') or cfg.get('apiKey') or '').strip()
    model = (payload.get('model') or cfg.get('geminiModel') or 'gemini-2.5-flash').strip()
    prompt_text = (payload.get('prompt') or '').strip()

    if not prompt_text:
        return jsonify({"success": False, "message": "يرجى إدخال نص الطلب أو الموضوع لتوليد الأسئلة"}), 400

    if not api_key:
        return jsonify({"success": False, "message": "يرجى إدخال مفتاح Google Gemini API Key في تبويب إعدادات البوابة أولاً"}), 400

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": float(payload.get("temperature", 0.4)),
            "maxOutputTokens": int(payload.get("maxOutputTokens", 4096))
        }
    }).encode('utf-8')

    try:
        req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = json.loads(resp.read().decode('utf-8'))
            candidates = raw.get('candidates') or []
            reply_text = ''
            if candidates:
                parts = candidates[0].get('content', {}).get('parts', [])
                reply_text = ''.join(p.get('text', '') for p in parts)
            return jsonify({
                "success": True,
                "model": model,
                "text": reply_text,
                "raw": raw
            }), 200
    except urllib.error.HTTPError as he:
        err_body = he.read().decode('utf-8', errors='ignore')
        return jsonify({"success": False, "message": f"خطأ من Google Gemini API ({he.code})", "details": err_body}), he.code
    except Exception as e:
        return jsonify({"success": False, "message": f"تعذر الاتصال بـ Gemini API: {str(e)}"}), 500

@app.route('/api/gcloud/sync', methods=['GET', 'POST'])
def api_gcloud_sync():
    os.makedirs(DATA_DIR, exist_ok=True)
    cfg = _load_gcloud_config()

    if request.method == 'GET':
        snapshots = []
        if os.path.exists(GCLOUD_SNAPSHOTS_FILE):
            try:
                with open(GCLOUD_SNAPSHOTS_FILE, 'r', encoding='utf-8') as f:
                    snapshots = json.load(f)
            except Exception:
                snapshots = []
        latest = snapshots[0] if snapshots else None
        return jsonify({
            "success": True,
            "count": len(snapshots),
            "latest": latest,
            "history": [{
                "id": s.get("id"),
                "timestamp": s.get("timestamp"),
                "projectId": s.get("projectId"),
                "user": s.get("user"),
                "summary": s.get("summary")
            } for s in snapshots[:15]]
        }), 200

    try:
        payload = request.get_json(force=True, silent=True) or {}
        snapshots = []
        if os.path.exists(GCLOUD_SNAPSHOTS_FILE):
            try:
                with open(GCLOUD_SNAPSHOTS_FILE, 'r', encoding='utf-8') as f:
                    snapshots = json.load(f)
            except Exception:
                snapshots = []

        snap_id = f"gcloud_snap_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        client_state = payload.get("clientState") or {}
        user_info = payload.get("user") or "أستاذ المنصة"

        db_backup = server_db.export_full_backup_data() if server_db else {}
        new_snap = {
            "id": snap_id,
            "timestamp": datetime.now().isoformat(),
            "projectId": cfg.get("projectId") or "masar-gcloud-local",
            "bucketName": cfg.get("bucketName") or "masar-almoallem-bucket",
            "user": user_info,
            "summary": {
                "questionsCount": len(client_state.get("questions") or []),
                "archivedExamsCount": len(client_state.get("archivedExams") or []),
                "accountsCount": len(db_backup.get("accounts") or []) if isinstance(db_backup, dict) else 0
            },
            "clientState": client_state
        }

        snapshots.insert(0, new_snap)
        snapshots = snapshots[:10]
        with open(GCLOUD_SNAPSHOTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(snapshots, f, ensure_ascii=False, indent=2)

        webhook_status = "stored_on_gateway"
        webhook_url = (cfg.get("webhookUrl") or "").strip()
        if webhook_url.startswith("http"):
            try:
                wb_data = json.dumps(new_snap).encode('utf-8')
                wb_req = urllib.request.Request(webhook_url, data=wb_data, headers={'Content-Type': 'application/json'}, method='POST')
                with urllib.request.urlopen(wb_req, timeout=8) as wb_resp:
                    webhook_status = f"forwarded_http_{wb_resp.status}"
            except Exception as we:
                webhook_status = f"local_saved_webhook_warn: {str(we)[:40]}"

        if server_db:
            server_db.log_activity('admin', str(user_info), 'مزامنة سحابية عبر بوابة Google Cloud', f"Snapshot ID: {snap_id}", action_type='GCLOUD_SYNC')

        return jsonify({
            "success": True,
            "message": "تمت المزامنة السحابية وحفظ النسخة الاحتياطية عبر بوابة Google Cloud بنجاح",
            "snapshotId": snap_id,
            "timestamp": new_snap["timestamp"],
            "summary": new_snap["summary"],
            "webhookStatus": webhook_status
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/gcloud/oauth_verify', methods=['POST'])
def api_gcloud_oauth_verify():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        email = (payload.get('email') or '').strip().lower()
        name = (payload.get('name') or 'أستاذ مسار المعلم').strip()
        google_sub = (payload.get('sub') or payload.get('googleId') or '').strip()
        picture = (payload.get('picture') or '').strip()
        client_ip = request.remote_addr or ''

        if not email:
            return jsonify({"success": False, "message": "البريد الإلكتروني لحساب Google مطلوب"}), 400

        accounts = server_db.get_all_accounts() if server_db else []
        matched = None
        for acc in accounts:
            if (acc.get('email') or '').strip().lower() == email or (acc.get('username') or '').strip().lower() == email:
                matched = acc
                break

        if not matched:
            username_base = email.split('@')[0]
            matched = {
                "id": f"gcloud_{google_sub or int(datetime.now().timestamp())}",
                "name": name,
                "username": username_base,
                "email": email,
                "password": f"GCloud#{google_sub[-6:] if len(google_sub) >= 6 else '2026'}",
                "role": "teacher",
                "status": "active",
                "subscriptionPlan": "free_trial",
                "authProvider": "google_cloud_oauth",
                "avatar": picture,
                "createdAt": datetime.now().isoformat(),
                "lastLoginAt": datetime.now().isoformat()
            }
        else:
            matched["lastLoginAt"] = datetime.now().isoformat()
            if picture:
                matched["avatar"] = picture

        if server_db:
            server_db.upsert_account(matched)
            server_db.log_activity(
                matched.get('id'),
                matched.get('username'),
                'تسجيل دخول عبر بوابة Google OAuth 2.0',
                f"تم الدخول بحساب Google: {email}",
                action_type='GOOGLE_OAUTH_LOGIN',
                ip_address=client_ip,
                user_name=matched.get('name', '')
            )

        return jsonify({
            "success": True,
            "message": f"مرحباً بك أستاذ {matched.get('name')}! تم التوثيق عبر Google Cloud بنجاح",
            "account": matched
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/gcloud/gateway/overview', methods=['GET'])
def api_gcloud_gateway_overview():
    cfg = _load_gcloud_config()
    expected_secret = cfg.get("gatewaySecret") or "MASAR-GCLOUD-2026-KEY"
    provided_secret = (
        request.headers.get("X-GCloud-Gateway-Key")
        or request.args.get("key")
        or request.headers.get("Authorization", "").replace("Bearer ", "")
    ).strip()

    if expected_secret and provided_secret != expected_secret:
        return jsonify({
            "success": False,
            "error": "Unauthorized Gateway Request",
            "message": "يرجى تمرير مفتاح البوابة الصحيح في ترويسة X-GCloud-Gateway-Key أو المعامل ?key="
        }), 401

    stats = server_db.get_platform_statistics() if server_db else {}
    accounts = server_db.get_all_accounts() if server_db else []
    return jsonify({
        "success": True,
        "gateway": "Masar Al-Moallem Google Cloud API Gateway v4.0",
        "projectId": cfg.get("projectId") or "masar-almoallem-cloud",
        "region": cfg.get("region") or "me-central1",
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "totalAccounts": len(accounts),
            "platformStats": stats
        }
    }), 200

import urllib.parse

_PENDING_OAUTH_LOGINS = []

@app.route('/api/gcloud/oauth/callback', methods=['GET'])
def api_gcloud_oauth_callback():
    code = request.args.get('code', '').strip()
    error = request.args.get('error', '').strip()
    if error or not code:
        err_msg = error or "لم يتم استلام رمز التحقق من Google"
        return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>فشل تسجيل الدخول — Google</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ margin: 0; padding: 24px; font-family: 'Cairo', Tahoma, sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 88vh; }}
    .card {{ background: #ffffff; border: 1.5px solid #ef4444; border-radius: 20px; padding: 28px 24px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 12px 32px rgba(239, 68, 68, 0.1); }}
    .btn {{ display: inline-block; margin-top: 16px; padding: 10px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; }}
  </style>
</head>
<body>
  <div class="card">
    <h3 style="color: #ef4444; margin: 0 0 8px 0;">تعذر إكمال المصادقة</h3>
    <p style="font-size: 14px; color: #64748b; margin: 0 0 16px 0;">{err_msg}</p>
    <a href="/" class="btn">العودة للمنصة الرئيسية</a>
  </div>
</body>
</html>""", 400

    client_id = "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com"
    client_secret = "d-FL95Q19q7MQmFpd7hHD0Ty"
    redirect_uri = f"{request.scheme}://{request.host}/api/gcloud/oauth/callback"

    profile = {"email": "", "name": "", "picture": "", "sub": ""}
    try:
        token_data = urllib.parse.urlencode({
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }).encode('utf-8')
        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            tok = json.loads(resp.read().decode('utf-8'))
            access_token = tok.get("access_token", "")
            if access_token:
                ureq = urllib.request.Request(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                with urllib.request.urlopen(ureq, timeout=10) as uresp:
                    uinfo = json.loads(uresp.read().decode('utf-8'))
                    profile = {
                        "email": uinfo.get("email", ""),
                        "name": uinfo.get("name") or uinfo.get("given_name") or "",
                        "picture": uinfo.get("picture", ""),
                        "sub": uinfo.get("sub", "")
                    }
    except Exception as e:
        print(f"OAuth token exchange error: {e}")

    # Register in pending logins if valid
    if profile.get("email"):
        _PENDING_OAUTH_LOGINS.append({
            "profile": profile,
            "ts": datetime.now().isoformat()
        })

    profile_json = json.dumps(profile, ensure_ascii=False)
    initial = (profile.get("name") or profile.get("email") or "G")[:1].upper()
    avatar_html = (
        f'<img src="{profile["picture"]}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #4285F4;margin: 0 auto 8px auto;display:block;">'
        if profile.get("picture")
        else f'<div style="width:64px;height:64px;border-radius:50%;background:#4285F4;color:#fff;font-size:28px;font-weight:bold;display:flex;align-items:center;justify-content:center;margin:0 auto 8px auto;">{initial}</div>'
    )

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>تم التحقق بنجاح — مسار المعلم</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{
      margin: 0; padding: 24px; font-family: 'Cairo', Tahoma, sans-serif;
      background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 88vh;
    }}
    .card {{
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 28px 24px;
      max-width: 400px; width: 100%; text-align: center; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }}
    .g-badge {{
      display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700;
      color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 5px 14px; border-radius: 999px; margin-bottom: 16px;
    }}
    .acc-box {{
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin: 14px 0 16px 0;
    }}
    .acc-name {{ font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px; }}
    .acc-email {{ font-size: 14px; color: #475569; direction: ltr; font-family: monospace; }}
    .spinner-bar {{
      display: inline-block; width: 26px; height: 26px; border: 3px solid rgba(37,99,235,0.2);
      border-radius: 50%; border-top-color: #2563eb; animation: spin 0.75s linear infinite; margin-bottom: 8px;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
  </style>
</head>
<body>
  <div class="card">
    <div class="g-badge">✔ تم التحقق من حساب Google</div>
    <div class="acc-box">
      {avatar_html}
      <div class="acc-name">{profile.get("name") or "أستاذ المنصة"}</div>
      <div class="acc-email">{profile.get("email")}</div>
    </div>
    <div>
      <div class="spinner-bar"></div>
      <div style="font-size: 15px; font-weight: 800; color: #2563eb;">جارٍ التوجيه التلقائي للمنصة... 🚀</div>
    </div>
  </div>
  <script>
    const profile = {profile_json};
    (async function autoDirectLogin() {{
      try {{
        await fetch('/api/gcloud/oauth/confirm', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(profile)
        }});
      }} catch (e) {{}}
      try {{
        localStorage.setItem('moallem_oauth_login_signal', JSON.stringify({{ profile: profile, ts: Date.now() }}));
      }} catch (e) {{}}
      try {{
        if (window.opener && !window.opener.closed) {{
          window.opener.postMessage({{ type: 'MASAR_GOOGLE_OAUTH_CONFIRMED', profile: profile }}, '*');
          setTimeout(() => {{ window.close(); }}, 400);
          return;
        }}
      }} catch (e) {{}}
      setTimeout(() => {{
        window.location.href = '/';
      }}, 500);
    }})();
  </script>
</body>
</html>""", 200

@app.route('/api/gcloud/oauth/confirm', methods=['POST'])
def api_gcloud_oauth_confirm():
    payload = request.get_json(force=True, silent=True) or {}
    if payload.get('email'):
        _PENDING_OAUTH_LOGINS.append({
            "profile": payload,
            "ts": datetime.now().isoformat()
        })
    return jsonify({"success": True}), 200

@app.route('/api/gcloud/oauth/poll', methods=['GET'])
def api_gcloud_oauth_poll():
    if _PENDING_OAUTH_LOGINS:
        item = _PENDING_OAUTH_LOGINS.pop(0)
        return jsonify({"success": True, "hasLogin": True, "profile": item["profile"]}), 200
    return jsonify({"success": True, "hasLogin": False}), 200

@app.route('/api/public_url', methods=['GET'])
def api_public_url():
    return jsonify({
        "success": True,
        "public_url": f"http://{request.host}",
        "host": request.host,
        "port": 8080
    }), 200


PRICING_FILE = os.path.join(DATA_DIR, 'pricing.json')
DEFAULT_PRICING = {
    "plan1": {"name": "الباقة الفضية (شهر)", "price": 25000, "duration": 30},
    "plan2": {"name": "الباقة الذهبية الملكية (سنة)", "price": 75000, "oldPrice": 150000, "duration": 365}
}

@app.route('/api/pricing', methods=['GET', 'POST'])
def api_pricing():
    if request.method == 'POST':
        payload = request.get_json(force=True, silent=True) or {}
        try:
            with open(PRICING_FILE, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            return jsonify({"success": True, "pricing": payload}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    # GET
    if os.path.exists(PRICING_FILE):
        try:
            with open(PRICING_FILE, 'r', encoding='utf-8') as f:
                return jsonify({"success": True, "pricing": json.load(f)}), 200
        except Exception:
            pass
    return jsonify({"success": True, "pricing": DEFAULT_PRICING}), 200


# ==============================================================================
# Supabase Integration & Protected Routes API
# ==============================================================================

@app.route('/api/supabase/config', methods=['GET'])
def api_supabase_config():
    """Return safe public configuration for client (URL & Publishable key)"""
    return jsonify({
        "success": True,
        "config": supabase_manager.get_public_config()
    }), 200

@app.route('/api/supabase/status', methods=['GET'])
def api_supabase_status():
    """Check connectivity to Supabase project"""
    status = supabase_manager.check_connection()
    return jsonify({
        "success": True,
        "status": status
    }), 200

@app.route('/api/supabase/verify', methods=['POST'])
def api_supabase_verify():
    """Verify Supabase JWT token and return authenticated user session"""
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    
    if not token:
        payload = request.get_json(force=True, silent=True) or {}
        token = payload.get('token')

    if not token:
        return jsonify({"success": False, "message": "رمز التوثيق (JWT Token) مطلوب"}), 401

    user = supabase_manager.verify_jwt_token(token)
    if not user:
        return jsonify({"success": False, "message": "جلسة غير صالحة أو منتهية الصلاحية"}), 401

    email = user.get('email', '')
    # Check if local profile exists
    accounts = server_db.get_all_accounts() if server_db else []
    matched = next((a for a in accounts if (a.get('email') or '').lower() == email.lower()), None)

    return jsonify({
        "success": True,
        "user": user,
        "profile": matched
    }), 200

@app.route('/api/supabase/sync_full', methods=['POST', 'GET'])
def api_supabase_sync_full():
    """Perform bidirectional sync check between Local SQLite and Supabase Cloud"""
    try:
        status = supabase_manager.check_connection()
        accounts = server_db.get_all_accounts() if server_db else []
        synced_count = 0
        errors = []

        if status.get('connected'):
            for a in accounts:
                email = a.get('email')
                if not email or '@' not in email:
                    continue
                pwd = a.get('password')
                role = a.get('role', 'teacher')
                meta = {
                    'name': a.get('name'),
                    'username': a.get('username'),
                    'school': a.get('school'),
                    'subject': a.get('subject')
                }
                user, err = supabase_manager.create_or_sync_supabase_user(email, pwd, role=role, user_metadata=meta)
                if user:
                    synced_count += 1
                elif err and 'already been registered' in str(err):
                    synced_count += 1
                elif err:
                    errors.append(f"{email}: {err}")

        # Update local sync log
        sync_result = {
            "success": True,
            "supabase_connected": status.get('connected', False),
            "supabase_url": supabase_manager.SUPABASE_URL,
            "local_db_status": "active_sqlite",
            "local_accounts_count": len(accounts),
            "synced_accounts_count": synced_count,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "errors": errors[:5]
        }
        return jsonify(sync_result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/supabase/sync_account', methods=['POST'])
def api_supabase_sync_account():
    """Sync a local account to Supabase Auth"""
    payload = request.get_json(force=True, silent=True) or {}
    email = payload.get('email')
    password = payload.get('password')
    role = payload.get('role', 'teacher')
    metadata = payload.get('metadata', {})

    if not email:
        return jsonify({"success": False, "message": "البريد الإلكتروني مطلوب"}), 400

    user, err = supabase_manager.create_or_sync_supabase_user(email, password, role=role, user_metadata=metadata)
    if user:
        return jsonify({"success": True, "user": user}), 200
    else:
        return jsonify({"success": False, "message": err or "فشل المزامنة"}), 400


@app.route('/<path:path>')
def serve_file(path):
    # Security: do not serve sensitive files
    forbidden = ['.git', '.env', 'server_bot.log', '.system_generated', 'scratch']
    if any(path.startswith(f) for f in forbidden):
        return 'Forbidden', 403

    target_file = os.path.join(BASE_DIR, path)
    if os.path.exists(target_file) and os.path.isfile(target_file):
        return send_from_directory(BASE_DIR, path)
    # SPA fallback to index.html
    return send_from_directory(BASE_DIR, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)



