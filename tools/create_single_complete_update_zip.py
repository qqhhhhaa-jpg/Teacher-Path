#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
إنشاء ملف مضغوط واحد شامل لكامل المنصة والسيرفر وقاعدة البيانات
جاهز للرفع المباشر إلى Render / GitHub / الاستضافة السحابية
"""

import os
import zipfile
import shutil

WORKSPACE_DIR = r'c:\Users\pc\OneDrive\Desktop\hh1234'
DESKTOP_DIR = r'c:\Users\pc\OneDrive\Desktop'

TARGET_ZIP_NAME = 'تحديث_المنصة_الشامل_الكامل.zip'
TARGET_ZIP_PATH = os.path.join(DESKTOP_DIR, TARGET_ZIP_NAME)
WORKSPACE_ZIP_PATH = os.path.join(WORKSPACE_DIR, TARGET_ZIP_NAME)

EXCLUDE_DIRS = {'.git', 'node_modules', 'scratch', '__pycache__', '.system_generated'}
EXCLUDE_EXTS = {'.pyc', '.tmp', '.log'}

print(f"جاري حزم كامل المنصة في ملف واحد فقط...")

file_count = 0
total_size = 0

with zipfile.ZipFile(TARGET_ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zip_out:
    for root, dirs, files in os.walk(WORKSPACE_DIR):
        # تصفية المجلدات المستبعدة
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            # استبعاد ملفات الـ zip السابقة وملفات الكاش والسجلات
            if file.endswith('.zip') or file in ('server_bot.log',):
                continue
            _, ext = os.path.splitext(file)
            if ext in EXCLUDE_EXTS:
                continue

            full_file_path = os.path.join(root, file)
            rel_file_path = os.path.relpath(full_file_path, WORKSPACE_DIR)

            zip_out.write(full_file_path, rel_file_path)
            file_count += 1
            total_size += os.path.getsize(full_file_path)

# عمل نسخة داخل مجلد العمل أيضاً
shutil.copy2(TARGET_ZIP_PATH, WORKSPACE_ZIP_PATH)

zip_file_size_mb = os.path.getsize(TARGET_ZIP_PATH) / (1024 * 1024)
print(f"تم بنجاح إنشاء الملف الواحد الشامل!")
print(f"المسار: {TARGET_ZIP_PATH}")
print(f"عدد الملفات المضمنة: {file_count} ملف")
print(f"حجم الحزمة المضغوطة: {zip_file_size_mb:.2f} ميغابايت")
