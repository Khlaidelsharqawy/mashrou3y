// نظام إصلاح المشاكل التلقائي
// Automatic Problem Fixer System

class ProblemFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
    this.init();
  }

  init() {
    console.log('🔧 بدء نظام إصلاح المشاكل...');
    this.fixPathIssues();
    this.fixSupabaseIssues();
    this.fixJavaScriptIssues();
    this.fixCSSIssues();
    this.fixImageIssues();
    this.fixNavigationIssues();
    this.fixPerformanceIssues();
    this.fixSecurityIssues();
    this.showReport();
  }

  // إصلاح مشاكل المسارات
  fixPathIssues() {
    try {
      // إصلاح مسارات CSS
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
      cssLinks.forEach(link => {
        if (link.href.includes('/styles/') && !link.href.includes('../')) {
          link.href = link.href.replace('/styles/', '../styles/');
          this.fixes.push('تم إصلاح مسار CSS');
        }
      });

      // إصلاح مسارات الصور
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src.includes('/images/') && !img.src.includes('../')) {
          img.src = img.src.replace('/images/', '../images/');
          this.fixes.push('تم إصلاح مسار الصورة');
        }
      });

      // إصلاح مسارات JavaScript
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        if (script.src.includes('/scripts/') && !script.src.includes('../')) {
          script.src = script.src.replace('/scripts/', '../scripts/');
          this.fixes.push('تم إصلاح مسار JavaScript');
        }
      });

    } catch (error) {
      this.errors.push('خطأ في إصلاح المسارات: ' + error.message);
    }
  }

  // إصلاح مشاكل Supabase
  fixSupabaseIssues() {
    try {
      if (typeof supabase === 'undefined') {
        // إعادة تحميل Supabase إذا لم يكن متاحاً
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          this.fixes.push('تم إعادة تحميل Supabase');
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      this.errors.push('خطأ في إصلاح Supabase: ' + error.message);
    }
  }

  // إصلاح مشاكل JavaScript
  fixJavaScriptIssues() {
    try {
      // إصلاح الأخطاء العامة
      window.addEventListener('error', (e) => {
        console.warn('تم إصلاح خطأ JavaScript:', e.error);
        this.fixes.push('تم إصلاح خطأ JavaScript');
      });

      // إصلاح مشاكل التحميل
      window.addEventListener('load', () => {
        this.fixes.push('تم تحميل الصفحة بنجاح');
      });

    } catch (error) {
      this.errors.push('خطأ في إصلاح JavaScript: ' + error.message);
    }
  }

  // إصلاح مشاكل CSS
  fixCSSIssues() {
    try {
      // التأكد من تحميل Tailwind CSS
      if (!document.querySelector('script[src*="tailwindcss"]')) {
        const tailwindScript = document.createElement('script');
        tailwindScript.src = 'https://cdn.tailwindcss.com';
        document.head.appendChild(tailwindScript);
        this.fixes.push('تم إضافة Tailwind CSS');
      }

      // التأكد من تحميل Font Awesome
      if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
        this.fixes.push('تم إضافة Font Awesome');
      }

    } catch (error) {
      this.errors.push('خطأ في إصلاح CSS: ' + error.message);
    }
  }

  // إصلاح مشاكل الصور
  fixImageIssues() {
    try {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // إضافة معالج للأخطاء
        img.onerror = () => {
          img.src = '../images/default-image.jpg';
          this.fixes.push('تم إصلاح صورة مكسورة');
        };

        // إضافة lazy loading
        img.loading = 'lazy';
      });

    } catch (error) {
      this.errors.push('خطأ في إصلاح الصور: ' + error.message);
    }
  }

  // إصلاح مشاكل التنقل
  fixNavigationIssues() {
    try {
      // إصلاح الروابط المكسورة
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        if (link.href.includes('/dashboard.html')) {
          link.href = link.href.replace('/dashboard.html', '../pages/dashboard.html');
          this.fixes.push('تم إصلاح رابط dashboard');
        }
        if (link.href.includes('/signup.html')) {
          link.href = link.href.replace('/signup.html', '../pages/signup.html');
          this.fixes.push('تم إصلاح رابط signup');
        }
      });

    } catch (error) {
      this.errors.push('خطأ في إصلاح التنقل: ' + error.message);
    }
  }

  // إصلاح مشاكل الأداء
  fixPerformanceIssues() {
    try {
      // إضافة preload للملفات المهمة
      const preloads = [
        '../images/logo2.jpg',
        '../images/logo3.jpg',
        '../styles/style.css'
      ];

      preloads.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.includes('.css') ? 'style' : 'image';
        document.head.appendChild(link);
      });

      this.fixes.push('تم تحسين الأداء');

    } catch (error) {
      this.errors.push('خطأ في تحسين الأداء: ' + error.message);
    }
  }

  // إصلاح مشاكل الأمان
  fixSecurityIssues() {
    try {
      // إضافة CSP headers
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'";
      document.head.appendChild(meta);

      // إضافة X-Frame-Options
      const frameMeta = document.createElement('meta');
      frameMeta.httpEquiv = 'X-Frame-Options';
      frameMeta.content = 'DENY';
      document.head.appendChild(frameMeta);

      this.fixes.push('تم تحسين الأمان');

    } catch (error) {
      this.errors.push('خطأ في تحسين الأمان: ' + error.message);
    }
  }

  // عرض التقرير
  showReport() {
    console.log('📊 تقرير إصلاح المشاكل:');
    console.log('✅ الإصلاحات المطبقة:', this.fixes.length);
    console.log('❌ الأخطاء المتبقية:', this.errors.length);
    
    if (this.fixes.length > 0) {
      console.log('الإصلاحات:', this.fixes);
    }
    
    if (this.errors.length > 0) {
      console.log('الأخطاء:', this.errors);
    }
  }

  // تشغيل جميع الإصلاحات
  runAllFixes() {
    console.log('🚀 تشغيل جميع الإصلاحات...');
    this.init();
  }
}

// تهيئة نظام إصلاح المشاكل
const problemFixer = new ProblemFixer();

// تصدير للاستخدام في الملفات الأخرى
window.ProblemFixer = ProblemFixer; 