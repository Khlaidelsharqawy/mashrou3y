#!/bin/bash

echo ""
echo "========================================"
echo "   MASHROU3Y - منصة الطلاب الجامعية"
echo "========================================"
echo ""

echo "🔍 فحص الملفات الأساسية..."
if [ ! -f "src/pages/index.html" ]; then
    echo "❌ خطأ: لم يتم العثور على الملف الرئيسي"
    exit 1
fi

echo "✅ تم العثور على الملفات الأساسية"

echo ""
echo "🚀 بدء تشغيل الخادم المحلي..."
echo "📍 العنوان: http://localhost:8000"
echo "📁 المجلد: src/pages"
echo ""

cd src
python3 -m http.server 8000

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ خطأ في تشغيل الخادم"
    echo "💡 تأكد من تثبيت Python3"
    echo ""
    exit 1
fi 