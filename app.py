#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مسار المعلم | WSGI Production Server for Cloud Hosting (Render, Railway, Heroku)
Serves static frontend, assets, API endpoints, accounts DB, and health check.
"""
import os
import re
import json
from datetime import datetime
from flask import Flask, send_from_directory, jsonify, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
ACCOUNTS_FILE = os.path.join(DATA_DIR, 'accounts.json')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')

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
    os.makedirs(DATA_DIR, exist_ok=True)
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
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(ACCOUNTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(accounts, f, ensure_ascii=False, indent=2)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Cache-Control'
    return response

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'masar_almoallem',
        'platform': 'Moallem Pro 4.0'
    }), 200

# Accounts API
@app.route('/api/accounts', methods=['GET', 'POST'])
def api_accounts():
    if request.method == 'GET':
        accounts = load_server_accounts()
        return jsonify({"success": True, "accounts": accounts}), 200
    
    try:
        payload = request.get_json(force=True, silent=True) or {}
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
        return jsonify({
            "success": True, 
            "message": "تم حفظ وتحديث الحسابات على السيرفر بنجاح", 
            "accounts_count": len(accounts)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Cloud Sync API
@app.route('/api/cloud_sync', methods=['GET', 'POST'])
def api_cloud_sync():
    if request.method == 'GET':
        email = request.args.get('email', '').strip().lower()
        user_id = request.args.get('userId', '').strip().lower()
        username = request.args.get('username', '').strip().lower()

        clean_email = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', email) if email else ''
        clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) if user_id else ''
        clean_u = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', username) if username else ''

        candidate_files = []
        if clean_email: candidate_files.append(os.path.join(DATA_DIR, f'cloud_sync_{clean_email}.json'))
        if clean_uid: candidate_files.append(os.path.join(DATA_DIR, f'cloud_sync_{clean_uid}.json'))
        if clean_u: candidate_files.append(os.path.join(DATA_DIR, f'cloud_sync_{clean_u}.json'))

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
            return jsonify({"success": True, "exists": True, "data": saved_data}), 200
        return jsonify({"success": True, "exists": False, "data": None}), 200

    # POST
    try:
        payload = request.get_json(force=True, silent=True) or {}
        email = payload.get('email', '').strip().lower()
        user_id = payload.get('userId', '').strip().lower()
        clean_email = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', email) if email else ''
        clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) if user_id else ''
        primary_key = clean_email or clean_uid or 'default'

        os.makedirs(DATA_DIR, exist_ok=True)
        file_path = os.path.join(DATA_DIR, f'cloud_sync_{primary_key}.json')
        
        payload['server_saved_at'] = datetime.now().isoformat()
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        
        if clean_uid and clean_uid != primary_key:
            second_path = os.path.join(DATA_DIR, f'cloud_sync_{clean_uid}.json')
            with open(second_path, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

        return jsonify({
            "success": True, 
            "message": "تمت المزامنة والحفظ السحابي بنجاح", 
            "timestamp": payload['server_saved_at'],
            "questions_count": len(payload.get('questionsBank', [])),
            "exams_count": len(payload.get('examsArchive', []))
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Active Session API
@app.route('/api/active_session', methods=['GET', 'POST'])
def api_active_session():
    if request.method == 'GET':
        user_id = request.args.get('userId', '').strip().lower()
        clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) or 'default'
        session_file = os.path.join(DATA_DIR, f'session_{clean_uid}.json')
        if os.path.exists(session_file):
            try:
                with open(session_file, 'r', encoding='utf-8') as f:
                    session_data = json.load(f)
                return jsonify({"success": True, "active": True, "session": session_data}), 200
            except Exception as e:
                return jsonify({"success": False, "error": str(e)}), 500
        return jsonify({"success": True, "active": False, "session": None}), 200

    # POST
    try:
        payload = request.get_json(force=True, silent=True) or {}
        user_id = payload.get('userId', '').strip().lower()
        clean_uid = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', user_id) or 'default'
        os.makedirs(DATA_DIR, exist_ok=True)
        session_file = os.path.join(DATA_DIR, f'session_{clean_uid}.json')
        
        payload['registered_at'] = datetime.now().isoformat()
        with open(session_file, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        return jsonify({"success": True, "message": "Session registered successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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
