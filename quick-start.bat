@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    MASHROU3Y - منصة الطلاب الجامعية
echo ========================================
echo.

echo 🔍 فحص الملفات الأساسية...
if not exist "src\pages\index.html" (
    echo ❌ خطأ: لم يتم العثور على الملف الرئيسي
    pause
    exit /b 1
)

echo ✅ تم العثور على الملفات الأساسية

echo.
echo 🚀 بدء تشغيل الخادم المحلي...
echo 📍 العنوان: http://localhost:8000
echo 📁 المجلد: src\pages
echo.

cd src
python -m http.server 8000

if errorlevel 1 (
    echo.
    echo ❌ خطأ في تشغيل الخادم
    echo 💡 تأكد من تثبيت Python
    echo.
    pause
    exit /b 1
) 