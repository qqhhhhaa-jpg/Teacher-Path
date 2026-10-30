' ===============================================================================
' 🤖 سكريبت تشغيل سيرفر مُعَلِّم برو وحارس السيرفر 24 ساعة في الخلفية بشكل صامت
' ===============================================================================
Set WshShell = CreateObject("WScript.Shell")
projectDir = "C:\Users\pc\OneDrive\Desktop\hh1234"
pythonwExe = "C:\Users\pc\AppData\Local\Programs\Python\Python314\pythonw.exe"
WshShell.CurrentDirectory = projectDir

' تشغيل حارس السيرفر الذكي في الخلفية (0 = مخفي تماماً وبدون نوافذ)
WshShell.Run """" & pythonwExe & """ """ & projectDir & "\server_watchdog.py""", 0, False

Set WshShell = Nothing
