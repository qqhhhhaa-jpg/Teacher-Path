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
import random
import string
from threading import Lock

import hashlib
import hmac

def hash_password(password, salt=None):
    """تشفير وحماية كلمات المرور باستخدام PBKDF2-HMAC-SHA256 مع ملح عشوائي 100,000 دورة"""
    if not password:
        return ''
    pwd_str = str(password)
    if pwd_str.startswith('pbkdf2_sha256$'):
        return pwd_str
    if salt is None:
        salt = os.urandom(16).hex()
    pwd_bytes = pwd_str.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    key = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000)
    return f"pbkdf2_sha256${salt}${key.hex()}"

def verify_password(raw_password, stored_password):
    """التحقق المشفر من كلمة المرور بدون تسريب التجزئة (Constant-Time Verification)"""
    if not raw_password or not stored_password:
        return False
    raw_str = str(raw_password)
    stored = str(stored_password)
    if stored.startswith('pbkdf2_sha256$'):
        parts = stored.split('$')
        if len(parts) == 3:
            _, salt, key_hex = parts
            expected_key = hashlib.pbkdf2_hmac('sha256', raw_str.encode('utf-8'), salt.encode('utf-8'), 100000)
            return hmac.compare_digest(expected_key.hex(), key_hex)
    return raw_str == stored


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_FILE = os.path.join(DATA_DIR, 'masar_system.db')
ACCOUNTS_JSON = os.path.join(DATA_DIR, 'accounts.json')
CODES_JSON = os.path.join(DATA_DIR, 'activation_codes.json')

db_lock = Lock()

DEFAULT_ADMIN_ACCOUNT = {
    'id': 'usr_admin',
    'name': 'الأستاذ حسين علي (المدير العام)',
    'username': 'admin',
    'email': 'admin@moallem.iq',
    'password': hash_password('qq7878aassdd'),
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

        # 5. جدول أكواد تفعيل الاشتراكات VIP ذات الاستخدام لمرة واحدة (Single-Use Activation Codes)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activation_codes (
                code TEXT PRIMARY KEY,
                plan_code TEXT NOT NULL,
                plan_name TEXT NOT NULL,
                duration_days INTEGER NOT NULL,
                is_used INTEGER DEFAULT 0,
                used_by_id TEXT,
                used_by_name TEXT,
                used_by_username TEXT,
                used_at TEXT,
                created_at TEXT,
                note TEXT,
                raw_json TEXT
            )
        ''')

        # الفهارس لسرعة الاستعلام والبحث
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(action_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_codes_used ON activation_codes(is_used)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_codes_created ON activation_codes(created_at DESC)')

        conn.commit()
        conn.close()

    # استيراد البيانات الموجودة مسبقاً في ملف accounts.json إن وجدت
    migrate_initial_data()
    migrate_activation_codes()

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
                accounts[i] = { **DEFAULT_ADMIN_ACCOUNT, **a, 'password': hash_password('qq7878aassdd') }
                admin_found = True
                break
        if not admin_found:
            accounts.insert(0, dict(DEFAULT_ADMIN_ACCOUNT))

        return accounts


def get_sanitized_accounts(is_admin_request=False):
    """استرجاع الحسابات بعد إزالة وتشفير كافة البيانات الحساسة (تجريد كلمات السر وحجب أرقام الهواتف)"""
    accounts = get_all_accounts()
    sanitized = []
    for a in accounts:
        item = dict(a)
        # 1. منع تسريب كلمات المرور نهائياً وحذفها من أي رد API
        item.pop('password', None)
        # 2. حجب بيانات الاتصال الشخصية لغير المدير العام
        if not is_admin_request:
            contact = str(item.get('contact') or '').strip()
            if len(contact) > 4:
                item['contact'] = contact[:4] + '****' + contact[-2:]
            elif contact:
                item['contact'] = '****'
        sanitized.append(item)
    return sanitized

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
    if password and not str(password).startswith('pbkdf2_sha256$'):
        password = hash_password(password)
        acc['password'] = password
    role = acc.get('role') or ('admin' if aid == 'usr_admin' or username == 'admin' else 'teacher')
    is_admin = 1 if (acc.get('isAdmin') or role == 'admin' or username == 'admin') else 0
    is_vip = 1 if (acc.get('isVip') or is_admin or role == 'teacher_vip') else 0
    is_verified = 1 if (acc.get('isVerified') or is_admin) else 0
    is_subscribed = 1 if (acc.get('isSubscribed') or is_admin or is_vip) else 0

    # إذا كان الحساب يمتلك اشتراكاً VIP سارياً، يتم إلغاء الفترة التجريبية وتثبيت الاشتراك
    if is_vip or is_subscribed:
        acc['isSubscribed'] = True
        acc['isVip'] = True
        if acc.get('subscriptionDuration') in ('1_year', '6_months', '1_month', 'annual_vip_50k') or acc.get('role') == 'teacher_vip':
            acc['isTrial'] = False
            acc.pop('trialDurationHours', None)
            acc.pop('trialStartedAt', None)

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

# ==============================================================================
# نظام توليد وإدارة أكواد التفعيل VIP لمرة واحدة (Single-Use Activation Codes)
# ==============================================================================

ACTIVATION_PLANS = {
    '1_month': {
        'code': '1_month',
        'name': 'باقة شهر واحد (25,000 د.ع)',
        'days': 30,
        'prefix': 'VIP-1MO'
    },
    '6_months': {
        'code': '6_months',
        'name': 'باقة 6 أشهر - نصف سنة دراسية (75,000 د.ع)',
        'days': 180,
        'prefix': 'VIP-6MO'
    },
    '1_year': {
        'code': '1_year',
        'name': 'الباقة السنوية الأكاديمية الكاملة (200,000 د.ع)',
        'days': 365,
        'prefix': 'VIP-YEAR'
    },
    'lifetime': {
        'code': 'lifetime',
        'name': 'باقة VIP مدى الحياة (صلاحيات كاملة دائمة 👑)',
        'days': 3650,
        'prefix': 'VIP-LIFE'
    }
}

def migrate_activation_codes():
    """استيراد أكواد التفعيل من activation_codes.json إلى SQLite إذا وجدت"""
    try:
        if os.path.exists(CODES_JSON):
            with open(CODES_JSON, 'r', encoding='utf-8') as f:
                codes_list = json.load(f)
                if isinstance(codes_list, list):
                    with db_lock:
                        conn = get_connection()
                        cursor = conn.cursor()
                        for c in codes_list:
                            code_str = (c.get('code') or '').strip().upper()
                            if not code_str:
                                continue
                            cursor.execute('''
                                INSERT OR IGNORE INTO activation_codes (
                                    code, plan_code, plan_name, duration_days,
                                    is_used, used_by_id, used_by_name, used_by_username,
                                    used_at, created_at, note, raw_json
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ''', (
                                code_str,
                                c.get('plan_code') or c.get('plan') or '1_year',
                                c.get('plan_name') or 'الباقة السنوية',
                                int(c.get('duration_days') or 365),
                                1 if c.get('is_used') else 0,
                                c.get('used_by_id') or '',
                                c.get('used_by_name') or '',
                                c.get('used_by_username') or '',
                                c.get('used_at') or '',
                                c.get('created_at') or datetime.now().isoformat(),
                                c.get('note') or '',
                                json.dumps(c, ensure_ascii=False)
                            ))
                        conn.commit()
                        conn.close()
    except Exception as e:
        logging.error(f"خطأ أثناء استيراد أكواد التفعيل: {e}")

def sync_activation_codes_to_json():
    """مزامنة الأكواد إلى ملف JSON للنسخ الاحتياطي السريع"""
    try:
        codes = get_all_activation_codes()
        with open(CODES_JSON, 'w', encoding='utf-8') as f:
            json.dump(codes, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"خطأ في كتابة ملف activation_codes.json: {e}")

def get_all_activation_codes():
    """استرجاع كافة أكواد التفعيل المسجلة في السيرفر مع تفاصيلها"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM activation_codes ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()

        result = []
        for r in rows:
            result.append({
                'code': r['code'],
                'plan_code': r['plan_code'],
                'plan_name': r['plan_name'],
                'duration_days': r['duration_days'],
                'is_used': bool(r['is_used']),
                'used_by_id': r['used_by_id'] or '',
                'used_by_name': r['used_by_name'] or '',
                'used_by_username': r['used_by_username'] or '',
                'used_at': r['used_at'] or '',
                'created_at': r['created_at'] or '',
                'note': r['note'] or ''
            })
        return result

def _generate_random_coupon_chunk(length=4):
    """توليد مقطع كود عشوائي واضح بدون حروف ملتبسة"""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choice(chars) for _ in range(length))

def generate_activation_codes(plan_code='1_year', count=1, note='', custom_prefix=''):
    """توليد حزمة من أكواد التفعيل الجديدة لمرة واحدة وحفظها في SQLite"""
    plan_info = ACTIVATION_PLANS.get(plan_code, ACTIVATION_PLANS['1_year'])
    count = max(1, min(int(count), 100))  # أقصى حد 100 كود في الطلب الواحد
    prefix = (custom_prefix.strip().upper() if custom_prefix else plan_info['prefix'])

    now_iso = datetime.now().isoformat()
    generated_list = []

    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()

        for _ in range(count):
            # التأكد من فرادة الكود وعدم تكراره
            for attempt in range(10):
                chunk1 = _generate_random_coupon_chunk(4)
                chunk2 = _generate_random_coupon_chunk(4)
                candidate_code = f"{prefix}-{chunk1}-{chunk2}"
                cursor.execute('SELECT 1 FROM activation_codes WHERE code = ?', (candidate_code,))
                if not cursor.fetchone():
                    break

            code_item = {
                'code': candidate_code,
                'plan_code': plan_info['code'],
                'plan_name': plan_info['name'],
                'duration_days': plan_info['days'],
                'is_used': 0,
                'used_by_id': '',
                'used_by_name': '',
                'used_by_username': '',
                'used_at': '',
                'created_at': now_iso,
                'note': note.strip()
            }

            cursor.execute('''
                INSERT INTO activation_codes (
                    code, plan_code, plan_name, duration_days,
                    is_used, used_by_id, used_by_name, used_by_username,
                    used_at, created_at, note, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                candidate_code,
                code_item['plan_code'],
                code_item['plan_name'],
                code_item['duration_days'],
                0,
                '', '', '', '',
                now_iso,
                code_item['note'],
                json.dumps(code_item, ensure_ascii=False)
            ))
            generated_list.append(code_item)

        conn.commit()
        conn.close()

    sync_activation_codes_to_json()
    log_activity(
        'usr_admin', 'admin', 'توليد أكواد تفعيل VIP',
        f"تم توليد ({count}) كود تفعيل لباقة [{plan_info['name']}]",
        action_type='GENERATE_CODES'
    )
    return generated_list

def redeem_activation_code(code_str, user_dict, ip_address='', device_info=''):
    """التحقق من كود التفعيل واستعماله لحساب مستخدم (استعمال مرة واحدة حصراً)"""
    clean_code = (code_str or '').strip().upper()
    if not clean_code:
        return False, "يرجى إدخال رمز كود التفعيل أولاً ⚠️", None

    if not isinstance(user_dict, dict) or not user_dict.get('id'):
        return False, "بيانات حساب المعلم غير صالحة ⚠️", None

    uid = user_dict.get('id')
    user_name = user_dict.get('name') or user_dict.get('username') or 'المعلم'
    username = user_dict.get('username') or ''
    now = datetime.now()
    now_iso = now.isoformat()

    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM activation_codes WHERE code = ?', (clean_code,))
        code_row = cursor.fetchone()

        if not code_row:
            conn.close()
            return False, f"كود التفعيل ({clean_code}) غير صحيح أو غير مسجل في المنظومة ❌", None

        if code_row['is_used']:
            used_name = code_row['used_by_name'] or code_row['used_by_username'] or 'مستخدم آخر'
            used_date = (code_row['used_at'] or '')[:10]
            conn.close()
            return False, f"عذراً! تم استهلاك هذا الكود مسبقاً بواسطة ({used_name}) في ({used_date})، لا يمكن إعادة استخدامه 🔒", None

        # حساب مدة وتاريخ انتهاء الاشتراك
        duration_days = int(code_row['duration_days'] or 365)
        from datetime import timedelta
        expiry_date = now + timedelta(days=duration_days)
        expiry_iso = expiry_date.isoformat()
        expiry_str = expiry_date.strftime('%Y-%m-%d')
        start_str = now.strftime('%Y-%m-%d')
        plan_name = code_row['plan_name']
        plan_code = code_row['plan_code']

        # 1. وسم الكود بأنه تم استخدامه واستهلاكه نهائياً
        cursor.execute('''
            UPDATE activation_codes SET
                is_used = 1,
                used_by_id = ?,
                used_by_name = ?,
                used_by_username = ?,
                used_at = ?
            WHERE code = ?
        ''', (uid, user_name, username, now_iso, clean_code))

        conn.commit()
        conn.close()

    # 2. تحديث الحساب وترقيته إلى VIP وإلغاء الفترة التجريبية نهائياً
    user_dict['isVip'] = True
    user_dict['isSubscribed'] = True
    user_dict['isTrial'] = False
    user_dict['role'] = 'teacher_vip'
    user_dict['subscriptionType'] = plan_code
    user_dict['subscriptionDuration'] = plan_code
    user_dict['subscriptionPlanName'] = plan_name
    user_dict['subscriptionStartDate'] = now_iso
    user_dict['subscriptionExpiresAt'] = expiry_iso
    user_dict['subscriptionExpiryFormatted'] = expiry_str
    user_dict.pop('trialDurationHours', None)
    user_dict.pop('trialStartedAt', None)

    upsert_account(user_dict, sync_json=True)
    sync_activation_codes_to_json()

    # 3. تسجيل الحدث في سجل الأنشطة الشامل
    log_activity(
        uid, username, 'تفعيل اشتراك عبر كود VIP',
        f"قام الأستاذ [{user_name}] بتفعيل [{plan_name}] بنجاح عبر كود التفعيل ({clean_code}) حتى ({expiry_str})",
        action_type='CODE_REDEEMED',
        ip_address=ip_address,
        device_info=device_info,
        user_name=user_name
    )

    msg = f"🎉 مبارك يا أستاذ {user_name}! تم تفعيل [{plan_name}] لحسابك بنجاح حتى ({expiry_str}) 👑"
    return True, msg, {
        'account': user_dict,
        'code': clean_code,
        'plan_name': plan_name,
        'plan_code': plan_code,
        'duration_days': duration_days,
        'expiry_formatted': expiry_str,
        'expiry_iso': expiry_iso
    }

def delete_activation_code(code_str):
    """حذف كود تفعيل محدد من قاعدة البيانات"""
    clean_code = (code_str or '').strip().upper()
    if not clean_code:
        return False, "رمز الكود مفقود"

    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM activation_codes WHERE code = ?', (clean_code,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()

    if deleted:
        sync_activation_codes_to_json()
        log_activity('usr_admin', 'admin', 'حذف كود تفعيل', f"تم حذف كود التفعيل ({clean_code})", 'DELETE_CODE')
        return True, "تم حذف الكود بنجاح"
    return False, "الكود غير موجود"

def clear_used_activation_codes():
    """تنظيف وحذف كافة الأكواد المستهلكة مسبقاً دفعة واحدة"""
    with db_lock:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM activation_codes WHERE is_used = 1')
        count = cursor.rowcount
        conn.commit()
        conn.close()

    if count > 0:
        sync_activation_codes_to_json()
        log_activity('usr_admin', 'admin', 'تنظيف الأكواد المستهلكة', f"تم تنظيف وحذف ({count}) كود مستهلك", 'CLEAR_CODES')
        return True, f"تم حذف ({count}) كود مستهلك بنجاح"
    return True, "لا توجد أي أكواد مستهلكة للحذف"

def export_full_backup_data():
    """تصدير شامل لجميع بيانات السيرفر (الحسابات، الأنشطة، الأكواد، المزامنة، الجلسات) بصيغة JSON متكاملة"""
    return {
        'exported_at': datetime.now().isoformat(),
        'platform': 'Masar Al-Moallem Pro 4.0',
        'stats': get_platform_statistics(),
        'accounts': get_all_accounts(),
        'activation_codes': get_all_activation_codes(),
        'activities': get_activities(limit=500),
    }

# تهيئة القاعدة تلقائياً عند استيراد الملف
init_database()
