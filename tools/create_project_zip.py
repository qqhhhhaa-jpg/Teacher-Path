#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_NAME = os.path.join(ROOT_DIR, 'مشروع_مسار_المعلم_الكامل.zip')

INCLUDE_DIRS = ['css', 'js', 'assets', 'server', 'tools']
INCLUDE_FILES = [
    'index.html', 'README.md', 'package.json', 'requirements.txt',
    'Procfile', 'vercel.json', 'netlify.toml',
    'رفع_المشروع_إلى_GitHub.bat', 'push_to_github.bat',
    'تشغيل_المنصة.bat', 'app.py'
]

print(f"[1/2] Creating ZIP: {ZIP_NAME}")

with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zf:
    # Add root files
    for fname in INCLUDE_FILES:
        fpath = os.path.join(ROOT_DIR, fname)
        if os.path.exists(fpath):
            zf.write(fpath, arcname=fname)
            print(f"  + file: {fname}")

    # Add 5 folders
    for folder in INCLUDE_DIRS:
        folder_path = os.path.join(ROOT_DIR, folder)
        if os.path.exists(folder_path):
            for dirpath, dirnames, filenames in os.walk(folder_path):
                if '__pycache__' in dirpath or 'scratch' in dirpath:
                    continue
                for filename in filenames:
                    if filename.endswith(('.pyc', '.log', '.tmp', '.zip')):
                        continue
                    full_path = os.path.join(dirpath, filename)
                    rel_path = os.path.relpath(full_path, ROOT_DIR)
                    zf.write(full_path, arcname=rel_path)
                    print(f"  + [{folder}]: {rel_path}")

print(f"\n[2/2] SUCCESS: {ZIP_NAME} created successfully!")
