#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import json
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
import server_db

def sync_teachers():
    existing_accounts = { (a.get('email') or '').lower(): a for a in server_db.get_all_accounts() }
    existing_unames = { (a.get('username') or '').lower(): a for a in server_db.get_all_accounts() }
    
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
    added = 0
    for f in os.listdir(data_dir):
        if f.startswith('cloud_sync_') and f.endswith('.json'):
            try:
                with open(os.path.join(data_dir, f), 'r', encoding='utf-8') as fp:
                    p = json.load(fp)
                    email = (p.get('email') or '').strip().lower()
                    teacher_name = p.get('teacherName') or p.get('name') or ''
                    uname = (p.get('username') or (email.split('@')[0] if '@' in email else '')).strip().lower()
                    
                    if (email and email not in existing_accounts) or (uname and uname not in existing_unames):
                        new_acc = {
                            'id': f'usr_{uname or added}',
                            'name': teacher_name or f'أستاذ {uname}',
                            'username': uname or f'user_{added}',
                            'email': email or f'{uname}@moallem.iq',
                            'password': '123',
                            'role': 'teacher',
                            'isAdmin': False,
                            'isVip': True,
                            'isVerified': True,
                            'isSubscribed': True,
                            'governorate': 'العراق',
                            'school': 'وزارة التربية العراقية',
                            'createdAt': '2026-01-01T00:00:00.000Z'
                        }
                        server_db.upsert_account(new_acc, sync_json=True)
                        if email: existing_accounts[email] = new_acc
                        if uname: existing_unames[uname] = new_acc
                        added += 1
            except Exception as e:
                print(f"Error reading {f}: {e}")

    print(f"Added {added} accounts from cloud data files.")
    accounts = server_db.get_all_accounts()
    print(f"Total Accounts in DB: {len(accounts)}")
    for a in accounts:
        print(f" - {a.get('name')} | username: {a.get('username')} | email: {a.get('email')} | role: {a.get('role')}")

if __name__ == '__main__':
    sync_teachers()
