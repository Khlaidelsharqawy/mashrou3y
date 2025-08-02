// نظام الثيمات - Theme System
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = {
      light: {
        name: 'light',
        label: {
          ar: 'فاتح',
          en: 'Light'
        },
        icon: 'fas fa-sun',
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#1F2937',
          textSecondary: '#6B7280',
          border: '#E5E7EB',
          shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          hover: '#F3F4F6'
        }
      },
      dark: {
        name: 'dark',
        label: {
          ar: 'داكن',
          en: 'Dark'
        },
        icon: 'fas fa-moon',
        colors: {
          primary: '#60A5FA',
          secondary: '#A78BFA',
          background: '#111827',
          surface: '#1F2937',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB',
          border: '#374151',
          shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
          hover: '#374151'
        }
      }
    };
    
    this.init();
  }

  // تهيئة نظام الثيمات
  init() {
    // استعادة الثيم المحفوظ
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
    } else {
      // التحقق من تفضيل النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }
    
    // تطبيق الثيم الحالي
    this.applyTheme(this.currentTheme);
    
    // الاستماع لتغييرات تفضيل النظام
    this.listenForSystemPreference();
    
    console.log('✅ تم تهيئة نظام الثيمات');
  }

  // تطبيق الثيم
  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error('❌ الثيم غير موجود:', themeName);
      return;
    }
    
    this.currentTheme = themeName;
    localStorage.setItem('theme', themeName);
    
    const theme = this.themes[themeName];
    
    // إضافة/إزالة الكلاس من HTML
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(themeName);
    
    // تطبيق المتغيرات CSS
    this.applyCSSVariables(theme.colors);
    
    // تحديث الأيقونات
    this.updateThemeIcons(theme);
    
    // إرسال حدث تغيير الثيم
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeName }));
    
    console.log(`🎨 تم تطبيق الثيم: ${themeName}`);
  }

  // تطبيق متغيرات CSS
  applyCSSVariables(colors) {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }

  // تحديث أيقونات الثيم
  updateThemeIcons(theme) {
    const themeIcons = document.querySelectorAll('[data-theme-icon]');
    
    themeIcons.forEach(icon => {
      const iconElement = icon.querySelector('i');
      if (iconElement) {
        iconElement.className = theme.icon;
      }
    });
  }

  // تبديل الثيم
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  // الحصول على الثيم الحالي
  getCurrentTheme() {
    return this.currentTheme;
  }

  // الحصول على معلومات الثيم
  getThemeInfo(themeName = null) {
    const theme = themeName || this.currentTheme;
    return this.themes[theme];
  }

  // الحصول على لون
  getColor(colorName) {
    const theme = this.themes[this.currentTheme];
    return theme.colors[colorName];
  }

  // الاستماع لتفضيل النظام
  listenForSystemPreference() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        // تطبيق تفضيل النظام فقط إذا لم يكن المستخدم قد اختار ثيم يدوياً
        const newTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(newTheme);
      }
    });
  }

  // إضافة مستمعي الأحداث لأزرار تبديل الثيم
  addThemeToggleListeners() {
    const themeToggles = document.querySelectorAll('[data-theme-toggle]');
    
    themeToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    });
  }

  // إنشاء زر تبديل الثيم
  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.setAttribute('data-theme-toggle', '');
    toggle.className = 'theme-toggle bg-gray-200 dark:bg-gray-700 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-600';
    
    const icon = document.createElement('i');
    icon.setAttribute('data-theme-icon', '');
    icon.className = this.themes[this.currentTheme].icon;
    
    toggle.appendChild(icon);
    
    // إضافة مستمع الحدث
    toggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    return toggle;
  }

  // تطبيق الثيم على عنصر معين
  applyThemeToElement(element, themeName = null) {
    const theme = this.getThemeInfo(themeName);
    const colors = theme.colors;
    
    element.style.backgroundColor = colors.background;
    element.style.color = colors.text;
    element.style.borderColor = colors.border;
  }

  // إضافة أنماط CSS للثيم
  addThemeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --color-primary: #3B82F6;
        --color-secondary: #8B5CF6;
        --color-background: #FFFFFF;
        --color-surface: #F9FAFB;
        --color-text: #1F2937;
        --color-textSecondary: #6B7280;
        --color-border: #E5E7EB;
        --color-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        --color-hover: #F3F4F6;
      }
      
      .dark {
        --color-primary: #60A5FA;
        --color-secondary: #A78BFA;
        --color-background: #111827;
        --color-surface: #1F2937;
        --color-text: #F9FAFB;
        --color-textSecondary: #D1D5DB;
        --color-border: #374151;
        --color-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
        --color-hover: #374151;
      }
      
      /* تطبيق المتغيرات على العناصر */
      body {
        background-color: var(--color-background);
        color: var(--color-text);
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      
      .bg-theme-surface {
        background-color: var(--color-surface);
      }
      
      .text-theme-primary {
        color: var(--color-primary);
      }
      
      .text-theme-secondary {
        color: var(--color-secondary);
      }
      
      .text-theme-textSecondary {
        color: var(--color-textSecondary);
      }
      
      .border-theme-border {
        border-color: var(--color-border);
      }
      
      .shadow-theme {
        box-shadow: var(--color-shadow);
      }
      
      .hover-theme:hover {
        background-color: var(--color-hover);
      }
      
      /* تحسينات للوضع الداكن */
      .dark .card {
        background-color: var(--color-surface);
        border-color: var(--color-border);
      }
      
      .dark .btn-primary {
        background-color: var(--color-primary);
        color: white;
      }
      
      .dark .btn-secondary {
        background-color: var(--color-secondary);
        color: white;
      }
      
      .dark input, .dark textarea, .dark select {
        background-color: var(--color-surface);
        color: var(--color-text);
        border-color: var(--color-border);
      }
      
      .dark input:focus, .dark textarea:focus, .dark select:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
      }
      
      /* انتقالات سلسة */
      * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
      }
    `;
    
    document.head.appendChild(style);
  }

  // تهيئة الثيم عند تحميل الصفحة
  initializeOnLoad() {
    // إضافة الأنماط
    this.addThemeStyles();
    
    // تطبيق الثيم الحالي
    this.applyTheme(this.currentTheme);
    
    // إضافة مستمعي الأحداث
    this.addThemeToggleListeners();
    
    // الاستماع لتغييرات اللغة
    window.addEventListener('languageChanged', (event) => {
      this.updateThemeLabels(event.detail);
    });
  }

  // تحديث تسميات الثيم عند تغيير اللغة
  updateThemeLabels(language) {
    const themeLabels = document.querySelectorAll('[data-theme-label]');
    
    themeLabels.forEach(label => {
      const themeName = label.getAttribute('data-theme-label');
      const theme = this.themes[themeName];
      
      if (theme && theme.label[language]) {
        label.textContent = theme.label[language];
      }
    });
  }

  // الحصول على تسمية الثيم الحالي
  getCurrentThemeLabel(language = null) {
    const currentLang = language || (window.Translations ? window.Translations.getCurrentLanguage() : 'ar');
    const theme = this.themes[this.currentTheme];
    return theme.label[currentLang] || theme.label.ar;
  }
}

// إنشاء مدير الثيمات
const themeManager = new ThemeManager();

// تصدير للاستخدام في الملفات الأخرى
window.themeManager = themeManager;

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  themeManager.initializeOnLoad();
});

// تصدير الدوال المساعدة
export {
  themeManager,
  ThemeManager
}; 