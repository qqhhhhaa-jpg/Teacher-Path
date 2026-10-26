import os
import zipfile
import shutil

WORKSPACE_DIR = r'c:\Users\pc\OneDrive\Desktop\hh1234'
DESKTOP_DIR = r'c:\Users\pc\OneDrive\Desktop'

TARGET_NAME = 'ملف_التحديثات_الأخيرة_للمنصة.zip'
DESKTOP_TARGET = os.path.join(DESKTOP_DIR, TARGET_NAME)
WORKSPACE_TARGET = os.path.join(WORKSPACE_DIR, TARGET_NAME)

# Key updated files and directories
FILES_TO_INCLUDE = [
    'index.html',
    'admin_control.html',
    'css/style.css',
    'css/print.css',
    'package.json',
    'server_pdf.mjs',
    'تشغيل_سيرفر_الشهادات_PDF.bat',
    'js/app.js',
    'js/certificates-studio.js',
    'js/schedule-studio.js',
    'js/html2pdf.bundle.min.js',
    'js/pdf-export.js',
    'js/masar-pdf.js',
    'utils/pdf-export.js',
    'js/student-grades.js',
    'js/student-behavior.js',
    'js/lesson-plan.js',
    'js/smart-generator.js',
    'js/ai-curriculum-engine.js',
    'js/question-types.js',
    'js/exporter.js',
    'js/firebase-sync.js',
    'js/physics-studio.js',
    'js/islamic-studio.js',
    'js/mathlive-studio.js',
    'js/mathlive.min.js',
    'js/xlsx.full.min.js',
    'js/qrcode-generator.js',
    'app.py',
    'server_bot.py',
    'server_db.py',
    'server/app.py',
    'server/server_bot.py',
    'server/server_db.py',
    'requirements.txt',
    'runtime.txt',
    'render.yaml',
    'data/accounts.json',
    'data/activation_codes.json',
    'data/masar_system.db',
    'data/cloud_sync_admin_moallem.iq.json',
    'data/cloud_sync_test2026_gmail.com.json',
    'data/public_server_url.txt',
    'ايقاف_السيرفر.bat',
    'دليل_تشغيل_السيرفر_24_ساعة.md',
    'ملف_تحديث_المنصة_الشامل.txt'
]

print("جاري إنشاء ملف التحديثات الأخيرة...")
with zipfile.ZipFile(DESKTOP_TARGET, 'w', zipfile.ZIP_DEFLATED) as z:
    for rel_path in FILES_TO_INCLUDE:
        full_path = os.path.join(WORKSPACE_DIR, rel_path)
        if os.path.exists(full_path):
            z.write(full_path, rel_path)
            print(f"  + {rel_path}")

shutil.copy2(DESKTOP_TARGET, WORKSPACE_TARGET)
size_mb = os.path.getsize(DESKTOP_TARGET) / (1024 * 1024)
print(f"تم إنشاء ملف التحديثات الأخيرة بنجاح: {size_mb:.2f} MB")
