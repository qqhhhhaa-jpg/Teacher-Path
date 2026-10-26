#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Moallem Pro - Centralized Database & Telemetry Engine (SQLite + JSON Mirror)
محرك قاعدة البيانات المركزي الشامل لمنصة مسار المعلم الذكية
يحفظ جميع الحسابات، أسماء المستخدمين، سجلات الحركة، الاختبارات، بنك الأسئلة، والجلسات الحية.
"""

import os
import sys
import json
import sqlite3
import logging
from datetime import datetime
from threading import Lock

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'masar_system.db')
ACCOUNTS_JSON = os.path.join(DATA_DIR, 'accounts.json')

db_lock = Lock()

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

def get_connection():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_FILE, timeout=20.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """تهيئة جداول قاعدة البيانات وإنشاء الفهارس اللازمة"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. جدول الحسابات والمستخدمين (Accounts & Users)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT,
                password TEXT,
                name TEXT,
                role TEXT DEFAULT 'teacher',
                is_admin INTEGER DEFAULT 0,
                is_vip INTEGER DEFAULT 0,
                is_verified INTEGER DEFAULT 0,
                is_subscribed INTEGER DEFAULT 0,
                governorate TEXT,
                school TEXT,
                subject TEXT,
                rights TEXT,
                contact TEXT,
                device_info TEXT,
                last_login_at TEXT,
                created_at TEXT,
                raw_json TEXT
            )
        ''')

        # 2. جدول سجل الأنشطة الشامل وكل ما يدور في المنصة (Activity Logs & Audit Trail)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                username TEXT,
                user_name TEXT,
                action_type TEXT,
                action_title TEXT,
                details TEXT,
                ip_address TEXT,
                device_info TEXT,
                created_at TEXT
            )
        ''')

        # 3. جدول المزامنة السحابية والاختبارات وبنك الأسئلة لكل مستخدم (Cloud Sync)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sync (
                sync_key TEXT PRIMARY KEY,
                user_id TEXT,
                email TEXT,
                username TEXT,
                exams_count INTEGER DEFAULT 0,
                questions_count INTEGER DEFAULT 0,
                sync_data TEXT,
                updated_at TEXT
            )
        ''')

        # 4. جدول الجلسات الحية النشطة لمنع تعدد الأجهزة (Active Live Sessions)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS active_sessions (
                user_id TEXT PRIMARY KEY,
                session_id TEXT,
                device_name TEXT,
                ip_address TEXT,
                last_ping TEXT,
                login_time TEXT,
                raw_data TEXT
            )
        ''')

        # الفهارس لسرعة الاستعلام والبحث
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(action_type)')

        conn.commit()
        conn.close()

    # استيراد البيانات الموجودة مسبقاً في ملف accounts.json إن وجدت
    migrate_initial_data()

def migrate_initial_data():
    """استيراد الحسابات من accounts.json إلى SQLite إذا لم تكن موجودة"""
    try:
        existing_accounts = []
        if os.path.exists(ACCOUNTS_JSON):
            with open(ACCOUNTS_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    existing_accounts = data
        
        # التأكد من وجود حساب المدير العام دائماً
        has_admin = any((a.get('id') == 'usr_admin' or a.get('username') == 'admin') for a in existing_accounts)
        if not has_admin:
            existing_accounts.insert(0, DEFAULT_ADMIN_ACCOUNT)

        for acc in existing_accounts:
            upsert_account(acc, sync_json=False)
            
        # مزامنة ملف accounts.json ليكون مطابقاً دائماً
        sync_accounts_to_json()
    except Exception as e:
        logging.error(f"خطأ أثناء استيراد البيانات الأولية: {e}")

def sync_accounts_to_json():
    """حفظ نسخة احتياطية فورية من الحسابات بصيغة JSON لضمان التوافق المطلق"""
    try:
        accounts = get_all_accounts()
        with open(ACCOUNTS_JSON, 'w', encoding='utf-8') as f:
            json.dump(accounts, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"خطأ في كتابة ملف accounts.json: {e}")

def get_all_accounts():
    """استرجاع جميع الحسابات المسجلة في السيرفر"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT raw_json FROM accounts ORDER BY created_at ASC')
        rows = cursor.fetchall()
        conn.close()

        accounts = []
        for r in rows:
            try:
                acc = json.loads(r['raw_json'])
                accounts.append(acc)
            except Exception:
                continue

        # التأكد من وجود المدير
        admin_found = False
        for i, a in enumerate(accounts):
            if a.get('id') == 'usr_admin' or a.get('username') == 'admin':
                accounts[i] = { **DEFAULT_ADMIN_ACCOUNT, **a, 'password': 'qq7878aassdd' }
                admin_found = True
                break
        if not admin_found:
            accounts.insert(0, dict(DEFAULT_ADMIN_ACCOUNT))

        return accounts

def upsert_account(acc, sync_json=True):
    """إضافة أو تحديث حساب مستخدم في قاعدة البيانات"""
    if not isinstance(acc, dict):
        return False
    
    aid = acc.get('id') or f"usr_{int(datetime.now().timestamp()*1000)}"
    acc['id'] = aid
    username = (acc.get('username') or '').strip().lower()
    email = (acc.get('email') or '').strip().lower()
    name = acc.get('name') or username or 'معلم'
    password = acc.get('password') or ''
    role = acc.get('role') or ('admin' if aid == 'usr_admin' or username == 'admin' else 'teacher')
    is_admin = 1 if (acc.get('isAdmin') or role == 'admin' or username == 'admin') else 0
    is_vip = 1 if (acc.get('isVip') or is_admin) else 0
    is_verified = 1 if (acc.get('isVerified') or is_admin) else 0
    is_subscribed = 1 if (acc.get('isSubscribed') or is_admin) else 0
    governorate = acc.get('governorate') or ''
    school = acc.get('school') or ''
    subject = acc.get('subject') or ''
    rights = acc.get('rights') or ''
    contact = acc.get('contact') or ''
    device_info = acc.get('deviceInfo') or acc.get('device_info') or ''
    last_login_at = acc.get('lastLoginAt') or acc.get('last_login_at') or ''
    created_at = acc.get('createdAt') or acc.get('created_at') or datetime.now().isoformat()
    acc['createdAt'] = created_at

    raw_json = json.dumps(acc, ensure_ascii=False)

    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO accounts (
                id, username, email, password, name, role,
                is_admin, is_vip, is_verified, is_subscribed,
                governorate, school, subject, rights, contact,
                device_info, last_login_at, created_at, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                username=excluded.username,
                email=excluded.email,
                password=excluded.password,
                name=excluded.name,
                role=excluded.role,
                is_admin=excluded.is_admin,
                is_vip=excluded.is_vip,
                is_verified=excluded.is_verified,
                is_subscribed=excluded.is_subscribed,
                governorate=excluded.governorate,
                school=excluded.school,
                subject=excluded.subject,
                rights=excluded.rights,
                contact=excluded.contact,
                device_info=excluded.device_info,
                last_login_at=excluded.last_login_at,
                raw_json=excluded.raw_json
        ''', (
            aid, username, email, password, name, role,
            is_admin, is_vip, is_verified, is_subscribed,
            governorate, school, subject, rights, contact,
            device_info, last_login_at, created_at, raw_json
        ))
        conn.commit()
        conn.close()

    if sync_json:
        sync_accounts_to_json()
    return True

def delete_account(aid):
    """حذف حساب من قاعدة البيانات (مع حظر حذف حساب المدير الأساسي)"""
    if aid in ('usr_admin', 'admin'):
        return False, "لا يمكن حذف حساب المدير العام الأساسي"
    
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM accounts WHERE id = ? OR username = ?', (aid, aid))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()

    if deleted:
        sync_accounts_to_json()
        log_activity('usr_admin', 'admin', 'حذف حساب', f"تم حذف المستخدم ذو المعرف {aid}", 'DELETE_USER')
        return True, "تم حذف الحساب بنجاح"
    return False, "الحساب غير موجود"

def log_activity(user_id, username, action_title, details='', action_type='GENERAL', ip_address='', device_info='', user_name=''):
    """تسجيل أي نشاط أو حدث يدور بالمنصة كاملاً لحظة بلحظة"""
    created_at = datetime.now().isoformat()
    if isinstance(details, (dict, list)):
        details_str = json.dumps(details, ensure_ascii=False)
    else:
        details_str = str(details or '')

    with db_lock:
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO activity_logs (
                    user_id, username, user_name, action_type, action_title,
                    details, ip_address, device_info, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id or 'guest',
                username or 'زائر',
                user_name or '',
                action_type,
                action_title,
                details_str,
                ip_address or '',
                device_info or '',
                created_at
            ))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logging.error(f"خطأ في تسجيل النشاط: {e}")
            return False

def get_activities(limit=150, user_id=None, action_type=None):
    """جلب سجل الأنشطة الشامل"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        query = 'SELECT * FROM activity_logs WHERE 1=1'
        params = []
        if user_id:
            query += ' AND (user_id = ? OR username = ?)'
            params.extend([user_id, user_id])
        if action_type:
            query += ' AND action_type = ?'
            params.append(action_type)
        
        query += ' ORDER BY id DESC LIMIT ?'
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        logs = []
        for r in rows:
            logs.append({
                'id': r['id'],
                'user_id': r['user_id'],
                'username': r['username'],
                'user_name': r['user_name'],
                'action_type': r['action_type'],
                'action_title': r['action_title'],
                'details': r['details'],
                'ip_address': r['ip_address'],
                'device_info': r['device_info'],
                'created_at': r['created_at']
            })
        return logs

def save_cloud_sync_data(payload):
    """حفظ المزامنة السحابية للمستخدم (أسئلة + اختبارات + درجات + سلوك + خطط دراسية + إعدادات) في قاعدة البيانات والملفات"""
    email = (payload.get('email') or '').strip().lower()
    user_id = (payload.get('userId') or '').strip().lower()
    username = (payload.get('username') or '').strip().lower()
    primary_key = email or user_id or username or 'default'

    questions_count = len(payload.get('questionsBank', []) or [])
    exams_count = len(payload.get('examsArchive', []) or [])
    grades_rosters = payload.get('studentGradesRosters', []) or []
    grades_count = len(grades_rosters) if isinstance(grades_rosters, list) else 0
    plans_archive = payload.get('lessonPlanArchive', []) or []
    plans_count = len(plans_archive) if isinstance(plans_archive, list) else 0
    behavior_records = payload.get('studentBehaviorRecords', {}) or {}
    behavior_count = len(behavior_records) if isinstance(behavior_records, dict) else 0

    updated_at = datetime.now().isoformat()
    payload['server_saved_at'] = updated_at

    sync_json_str = json.dumps(payload, ensure_ascii=False)

    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_sync (
                sync_key, user_id, email, username,
                exams_count, questions_count, sync_data, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(sync_key) DO UPDATE SET
                user_id=excluded.user_id,
                email=excluded.email,
                username=excluded.username,
                exams_count=excluded.exams_count,
                questions_count=excluded.questions_count,
                sync_data=excluded.sync_data,
                updated_at=excluded.updated_at
        ''', (
            primary_key, user_id, email, username,
            exams_count, questions_count, sync_json_str, updated_at
        ))
        conn.commit()
        conn.close()

    # كتابة ملف النسخة الاحتياطية المتطابق في data/
    try:
        clean_key = "".join(c if c.isalnum() or c in ('_', '-', '.') else '_' for c in primary_key)
        backup_file = os.path.join(DATA_DIR, f'cloud_sync_{clean_key}.json')
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(sync_json_str)
    except Exception as e:
        logging.error(f"خطأ حفظ ملف النسخ الاحتياطي السحابي: {e}")

    # تسجيل الحدث الشامل
    summary_parts = []
    if questions_count: summary_parts.append(f"{questions_count} سؤال")
    if exams_count: summary_parts.append(f"{exams_count} اختبار")
    if grades_count: summary_parts.append(f"{grades_count} سجل درجات")
    if plans_count: summary_parts.append(f"{plans_count} خطة درس")
    if behavior_count: summary_parts.append(f"{behavior_count} جلسة متابعة سلوك")
    if not summary_parts: summary_parts.append("إعدادات المنصة")

    log_activity(
        user_id or primary_key, 
        username or email or 'مستخدم', 
        'مزامنة سحابية وحفظ بيانات المنصة كاملة', 
        f"تم حفظ ومزامنة المنصة بالكامل: {', '.join(summary_parts)} في السيرفر", 
        action_type='CLOUD_SYNC',
        user_name=payload.get('teacherName') or payload.get('name', '')
    )

    return {
        'success': True,
        'timestamp': updated_at,
        'questions_count': questions_count,
        'exams_count': exams_count,
        'grades_count': grades_count,
        'plans_count': plans_count,
        'behavior_count': behavior_count
    }

def get_cloud_sync_data(keys):
    """جلب المزامنة السحابية للمستخدم من قاعدة البيانات أو الملفات"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        for k in keys:
            if not k:
                continue
            cursor.execute('SELECT sync_data FROM user_sync WHERE sync_key = ? OR user_id = ? OR email = ? OR username = ?', (k, k, k, k))
            row = cursor.fetchone()
            if row and row['sync_data']:
                try:
                    conn.close()
                    return json.loads(row['sync_data'])
                except Exception:
                    pass
        conn.close()

    # إذا لم توجد في SQLite، فحص ملفات JSON
    for k in keys:
        if not k:
            continue
        clean_k = "".join(c if c.isalnum() or c in ('_', '-', '.') else '_' for c in k)
        fp = os.path.join(DATA_DIR, f'cloud_sync_{clean_k}.json')
        if os.path.exists(fp):
            try:
                with open(fp, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
    return None

def save_active_session(payload, ip_address=''):
    """تسجيل وحفظ جلسة المستخدم النشطة الحالية لمنع تعدد الأجهزة ومراقبة المتواجدين"""
    user_id = (payload.get('userId') or '').strip().lower()
    if not user_id:
        return False
    session_id = payload.get('sessionId') or ''
    device_name = payload.get('deviceName') or ''
    last_ping = datetime.now().isoformat()
    raw_str = json.dumps(payload, ensure_ascii=False)

    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO active_sessions (
                user_id, session_id, device_name, ip_address, last_ping, login_time, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                session_id=excluded.session_id,
                device_name=excluded.device_name,
                ip_address=excluded.ip_address,
                last_ping=excluded.last_ping,
                raw_data=excluded.raw_data
        ''', (
            user_id, session_id, device_name, ip_address, last_ping, last_ping, raw_str
        ))
        conn.commit()
        conn.close()

    # حفظ نسخة في data/session_<uid>.json
    try:
        clean_uid = "".join(c if c.isalnum() or c in ('_', '-', '.') else '_' for c in user_id)
        s_file = os.path.join(DATA_DIR, f'session_{clean_uid}.json')
        with open(s_file, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    return True

def get_active_session(user_id):
    """التحقق من جلسة المستخدم الحالية"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT raw_data FROM active_sessions WHERE user_id = ?', (user_id.strip().lower(),))
        row = cursor.fetchone()
        conn.close()
        if row and row['raw_data']:
            try:
                return json.loads(row['raw_data'])
            except Exception:
                pass
    return None

def get_platform_statistics():
    """إحصائيات فورية شاملة لكل ما يدور بالمنصة كاملاً"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()

        # عدد الحسابات
        cursor.execute('SELECT COUNT(*) as count FROM accounts')
        total_accounts = cursor.fetchone()['count']

        # عدد الأنشطة المسجلة
        cursor.execute('SELECT COUNT(*) as count FROM activity_logs')
        total_activities = cursor.fetchone()['count']

        # عدد الاختبارات المحفوظة
        cursor.execute('SELECT SUM(exams_count) as total_exams, SUM(questions_count) as total_questions FROM user_sync')
        sync_stats = cursor.fetchone()
        total_exams = sync_stats['total_exams'] or 0
        total_questions = sync_stats['total_questions'] or 0

        # الجلسات النشطة في آخر 15 دقيقة
        cursor.execute('SELECT COUNT(*) as count FROM active_sessions')
        active_sessions_count = cursor.fetchone()['count']

        # آخر 10 أحداث حية
        cursor.execute('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 10')
        recent_events = [dict(r) for r in cursor.fetchall()]

        conn.close()

    return {
        'total_accounts': total_accounts,
        'total_activities': total_activities,
        'total_exams': total_exams,
        'total_questions': total_questions,
        'active_sessions_count': active_sessions_count,
        'recent_events': recent_events,
        'server_time': datetime.now().isoformat(),
        'database_status': 'ONLINE_HEALTHY',
        'database_path': DB_FILE
    }

def export_full_backup_data():
    """تصدير شامل لجميع بيانات السيرفر (الحسابات، الأنشطة، المزامنة، الجلسات) بصيغة JSON متكاملة"""
    return {
        'exported_at': datetime.now().isoformat(),
        'platform': 'Masar Al-Moallem Pro 4.0',
        'stats': get_platform_statistics(),
        'accounts': get_all_accounts(),
        'activities': get_activities(limit=500),
    }

# تهيئة القاعدة تلقائياً عند استيراد الملف
init_database()
