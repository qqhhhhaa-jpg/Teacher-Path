' ===============================================================================
' 🤖 سكريبت تشغيل بوت السيرفر في الخلفية بشكل صامت وبدون نوافذ سوداء (24 ساعة)
' ===============================================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' تشغيل البوت في الخلفية (0 = مخفي تماماً)
WshShell.Run "python server_bot.py", 0, False

' انتظار ثانيتين وفتح المتصفح
WScript.Sleep 2000
WshShell.Run "cmd /c start http://localhost:8080", 0, False

Set WshShell = Nothing
