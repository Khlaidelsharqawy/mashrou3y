# دليل حل المشاكل السريع - MASHROU3Y

## 🚨 مشاكل شائعة وحلولها

### 1. مشكلة "npm is not recognized"

**المشكلة**: 
```
npm : The term 'npm' is not recognized as the name of a cmdlet
```

**الحل**:
```bash
# استخدم Python بدلاً من npm
python -m http.server 8000

# أو في PowerShell
python -m http.server 8000
```

### 2. مشكلة "&& is not a valid statement separator"

**المشكلة**:
```
The token '&&' is not a valid statement separator in this version.
```

**الحل**:
```bash
# استخدم ; بدلاً من &&
cd src; python -m http.server 8000

# أو استخدم الملفات الجاهزة
quick-start.bat  # للويندوز
./quick-start.sh # للينكس/ماك
```

### 3. مشكلة الصفحة الحمراء

**المشكلة**: صفحة فارغة أو خطأ في التحميل

**الحل**:
1. افتح Developer Tools (F12)
2. اذهب لتبويب Console
3. اكتب:
```javascript
const fixer = new ProblemFixer();
fixer.runAllFixes();
```

### 4. مشكلة المسارات المكسورة

**المشكلة**: صور أو ملفات لا تظهر

**الحل**:
```javascript
// في console المتصفح
fixPathIssues();
```

### 5. مشكلة Supabase

**المشكلة**: خطأ في الاتصال بقاعدة البيانات

**الحل**:
1. تأكد من إعدادات Supabase في `src/scripts/supabase-config.js`
2. تأكد من تفعيل RLS في Supabase
3. افحص Console للأخطاء

## 🔧 أدوات التشخيص

### صفحة التشخيص
افتح: `http://localhost:8000/debug.html`

### فحص الحالة
```javascript
// في console المتصفح
console.log('Supabase Status:', typeof supabase);
console.log('Auth Status:', supabase.auth.getSession());
```

### إصلاح تلقائي
```javascript
// تشغيل جميع الإصلاحات
if (window.ProblemFixer) {
    const fixer = new ProblemFixer();
    fixer.runAllFixes();
}
```

## 📁 فحص الملفات

### الملفات المطلوبة
```
src/
├── pages/
│   └── index.html ✅
├── scripts/
│   ├── main.js ✅
│   └── supabase-config.js ✅
├── styles/
│   └── style.css ✅
└── images/
    ├── logo2.jpg ✅
    └── logo3.jpg ✅
```

### فحص سريع
```bash
# للويندوز
dir src\pages\index.html
dir src\scripts\main.js
dir src\styles\style.css

# للينكس/ماك
ls src/pages/index.html
ls src/scripts/main.js
ls src/styles/style.css
```

## 🚀 تشغيل سريع

### الطريقة الأولى
```bash
# للويندوز
quick-start.bat

# للينكس/ماك
chmod +x quick-start.sh
./quick-start.sh
```

### الطريقة الثانية
```bash
cd src
python -m http.server 8000
```

### الطريقة الثالثة
```bash
npm start
```

## 🔍 فحص الأخطاء

### في المتصفح
1. اضغط F12
2. اذهب لتبويب Console
3. ابحث عن الأخطاء الحمراء
4. انسخ الخطأ وابحث عنه

### في Terminal
```bash
# فحص Python
python --version

# فحص Node.js
node --version

# فحص npm
npm --version
```

## 📞 الدعم

### معلومات الاتصال
- **واتساب**: +201007289679
- **البريد**: support@mashrou3y.com
- **الموقع**: https://mashrou3y.com

### معلومات النظام
```javascript
// في console المتصفح
console.log('User Agent:', navigator.userAgent);
console.log('Language:', navigator.language);
console.log('Platform:', navigator.platform);
```

## 🎯 حلول سريعة

### مشكلة التحميل البطيء
1. امسح cache المتصفح
2. اضغط Ctrl+F5
3. جرب متصفح آخر

### مشكلة الأيقونات
1. تأكد من تحميل Font Awesome
2. افحص اتصال الإنترنت
3. جرب إعادة تحميل الصفحة

### مشكلة التصميم
1. تأكد من تحميل Tailwind CSS
2. افحص ملف style.css
3. جرب إعادة تحميل الصفحة

## ✅ قائمة التحقق

- [ ] Python مثبت ويعمل
- [ ] الملفات الأساسية موجودة
- [ ] الخادم يعمل على المنفذ 8000
- [ ] الصفحة الرئيسية تفتح
- [ ] لا توجد أخطاء في Console
- [ ] الصور والأيقونات تظهر
- [ ] الروابط تعمل
- [ ] Supabase متصل

## 🆘 طوارئ

إذا لم تعمل أي من الحلول:

1. **أعد تشغيل الكمبيوتر**
2. **امسح cache المتصفح**
3. **جرب متصفح آخر**
4. **تواصل مع الدعم الفني**

---

**آخر تحديث**: 31 يوليو 2025 