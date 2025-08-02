// نظام الترجمة - Translation System
class Translations {
  constructor() {
    this.currentLanguage = 'ar';
    this.translations = {
      ar: {
        // الصفحة الرئيسية
        'hero_subtitle': '- منصتك التعليمية للمواد والمشاريع والعروض',
        'hero_description': 'منصة تعليمية متكاملة تجمع كل ما تحتاجه في مكان واحد',
        'start_now': 'ابدأ الآن',
        'view_content': 'شوف المحتوى',
        'categories_title': 'خد اللي محتاجه في ثواني يا نجم 💡',
        'categories_description': 'اكتشف مجموعة متنوعة من المحتويات التعليمية عالية الجودة المصممة خصيصاً لطلاب الجامعات',
        'materials': 'المواد الدراسية',
        'materials_description': 'ملخصات وشروحات شاملة لجميع المواد الدراسية',
        'projects': 'المشاريع الجاهزة',
        'projects_description': 'مشروعك الجاهز... في جيبك! 💻',
        'presentations': 'العروض التقديمية',
        'presentations_description': 'باوربوينت احترافي جاهز للاستخدام',
        
        // المصادقة
        'login': 'تسجيل الدخول',
        'signup': 'حسابي',
        'logout': 'تسجيل الخروج',
        'email': 'الإيميل',
        'password': 'الباسورد',
        'confirm_password': 'تأكيد الباسورد',
        'full_name': 'الاسم الكامل',
        'phone': 'رقم التليفون',
        'university': 'الجامعة',
        'faculty': 'الكلية',
        'specialization': 'التخصص',
        'user_type': 'نوع المستخدم',
        'student': 'طالب',
        'creator': 'منشئ محتوى',
        'admin': 'مدير',
        
        // لوحة التحكم
        'dashboard': 'لوحة التحكم',
        'profile': 'الملف الشخصي',
        'materials_count': 'المواد المتاحة',
        'access_count': 'الصلاحيات الممنوحة',
        'total_spent': 'إجمالي المشتريات',
        'recent_purchases': 'آخر المشتريات',
        'loading': 'جاري التحميل...',
        
        // المتجر
        'store': 'المتجر',
        'browse': 'تصفح',
        'buy': 'شراء',
        'price': 'السعر',
        'download': 'تحميل',
        'cart': 'السلة',
        'checkout': 'إتمام الشراء',
        
        // الرسائل
        'success': 'تم بنجاح',
        'error': 'حدث خطأ',
        'warning': 'تحذير',
        'info': 'معلومات',
        'login_required': 'محتاج تسجل دخول الأول يا نجم 😅',
        'access_denied': 'مش معاك صلاحية للوصول للصفحة دي يا نجم 🚫',
        'welcome': 'أهلاً وسهلاً',
        'goodbye': 'مع السلامة',
        
        // الأزرار
        'save': 'حفظ',
        'cancel': 'إلغاء',
        'edit': 'تعديل',
        'delete': 'حذف',
        'upload': 'رفع',
        'search': 'بحث',
        'filter': 'تصفية',
        'refresh': 'تحديث',
        
                 // الثيمات
         'light': 'فاتح',
         'dark': 'داكن',
         'arabic': 'العربية',
         'english': 'English',
         
         // إضافي
         'user': 'المستخدم',
         'google_login': 'دخول بجوجل'
      },
      en: {
        // Home Page
        'hero_subtitle': '- Your Educational Platform for Materials, Projects & Presentations',
        'hero_description': 'An integrated educational platform that brings everything you need in one place',
        'start_now': 'Start Now',
        'view_content': 'View Content',
        'categories_title': 'Get What You Need in Seconds! 💡',
        'categories_description': 'Discover a variety of high-quality educational content specifically designed for university students',
        'materials': 'Study Materials',
        'materials_description': 'Comprehensive summaries and explanations for all study materials',
        'projects': 'Ready Projects',
        'projects_description': 'Your ready project... in your pocket! 💻',
        'presentations': 'Presentations',
        'presentations_description': 'Professional PowerPoint ready to use',
        
        // Authentication
        'login': 'Login',
        'signup': 'Sign Up',
        'logout': 'Logout',
        'email': 'Email',
        'password': 'Password',
        'confirm_password': 'Confirm Password',
        'full_name': 'Full Name',
        'phone': 'Phone Number',
        'university': 'University',
        'faculty': 'Faculty',
        'specialization': 'Specialization',
        'user_type': 'User Type',
        'student': 'Student',
        'creator': 'Content Creator',
        'admin': 'Admin',
        
        // Dashboard
        'dashboard': 'Dashboard',
        'profile': 'Profile',
        'materials_count': 'Available Materials',
        'access_count': 'Granted Permissions',
        'total_spent': 'Total Purchases',
        'recent_purchases': 'Recent Purchases',
        'loading': 'Loading...',
        
        // Store
        'store': 'Store',
        'browse': 'Browse',
        'buy': 'Buy',
        'price': 'Price',
        'download': 'Download',
        'cart': 'Cart',
        'checkout': 'Checkout',
        
        // Messages
        'success': 'Success',
        'error': 'Error',
        'warning': 'Warning',
        'info': 'Information',
        'login_required': 'You need to login first! 😅',
        'access_denied': 'You don\'t have permission to access this page! 🚫',
        'welcome': 'Welcome',
        'goodbye': 'Goodbye',
        
        // Buttons
        'save': 'Save',
        'cancel': 'Cancel',
        'edit': 'Edit',
        'delete': 'Delete',
        'upload': 'Upload',
        'search': 'Search',
        'filter': 'Filter',
        'refresh': 'Refresh',
        
                 // Themes
         'light': 'Light',
         'dark': 'Dark',
         'arabic': 'العربية',
         'english': 'English',
         
         // Additional
         'user': 'User',
         'google_login': 'Login with Google'
      }
    };
    
    this.init();
  }

  // تهيئة نظام الترجمة
  init() {
    // استعادة اللغة المحفوظة
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    }
    
    // تطبيق اللغة الحالية
    this.applyLanguage(this.currentLanguage);
    
    console.log('✅ تم تهيئة نظام الترجمة');
  }

  // تغيير اللغة
  change(language) {
    if (!this.translations[language]) {
      console.error('❌ اللغة غير مدعومة:', language);
      return;
    }
    
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    this.applyLanguage(language);
    
    // إرسال حدث تغيير اللغة
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
    
    console.log(`🌐 تم تغيير اللغة إلى: ${language}`);
  }

  // تطبيق اللغة
  applyLanguage(language) {
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = this.translations[language][key];
      
      if (translation) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
    
    // تحديث اتجاه الصفحة
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }

  // الحصول على ترجمة
  get(key, language = null) {
    const lang = language || this.currentLanguage;
    return this.translations[lang][key] || key;
  }

  // الحصول على اللغة الحالية
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // التحقق من اللغة الحالية
  isArabic() {
    return this.currentLanguage === 'ar';
  }

  // التحقق من اللغة الإنجليزية
  isEnglish() {
    return this.currentLanguage === 'en';
  }

  // إضافة ترجمة جديدة
  addTranslation(key, arText, enText) {
    if (!this.translations.ar) this.translations.ar = {};
    if (!this.translations.en) this.translations.en = {};
    
    this.translations.ar[key] = arText;
    this.translations.en[key] = enText;
  }

  // تحديث ترجمة موجودة
  updateTranslation(key, arText, enText) {
    this.addTranslation(key, arText, enText);
  }

  // ترجمة عنصر معين
  translateElement(element, key) {
    const translation = this.get(key);
    if (translation && translation !== key) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    }
  }

  // ترجمة جميع العناصر في الصفحة
  translatePage() {
    this.applyLanguage(this.currentLanguage);
  }

  // إضافة مستمعي الأحداث لأزرار تغيير اللغة
  addLanguageToggleListeners() {
    const languageToggles = document.querySelectorAll('[data-language-toggle]');
    
    languageToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const newLanguage = this.currentLanguage === 'ar' ? 'en' : 'ar';
        this.change(newLanguage);
      });
    });
  }
}

// إنشاء مثيل نظام الترجمة
const translations = new Translations();

// تصدير للاستخدام في الملفات الأخرى
window.Translations = translations;

// تصدير الدوال المساعدة
export {
  translations,
  Translations
}; 