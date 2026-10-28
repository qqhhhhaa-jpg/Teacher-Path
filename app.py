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
from flask import Flask, send_from_directory, jsonify, request, send_file

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Import Central SQLite Database Engine
try:
    import server_db
except Exception as e:
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
        accounts = server_db.get_all_accounts() if server_db else []
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

    if matched and (str(matched.get('password')) == str(password)):
        matched['lastLoginAt'] = datetime.now().isoformat()
        matched['deviceInfo'] = device_info
        if server_db:
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
        return jsonify({"success": True, "account": matched}), 200

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
