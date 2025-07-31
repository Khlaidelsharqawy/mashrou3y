// مدير الثيمات - Theme Manager
// يدعم الوضع الفاتح والداكن

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.themes = {
      light: {
        name: 'light',
        label: 'فاتح',
        icon: 'fas fa-sun',
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#1F2937',
          textSecondary: '#6B7280',
          border: '#E5E7EB',
          shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          cardBackground: '#FFFFFF',
          cardBorder: '#E5E7EB',
          inputBackground: '#FFFFFF',
          inputBorder: '#D1D5DB',
          buttonPrimary: '#3B82F6',
          buttonSecondary: '#6B7280',
          buttonText: '#FFFFFF',
          link: '#3B82F6',
          linkHover: '#2563EB'
        }
      },
      dark: {
        name: 'dark',
        label: 'داكن',
        icon: 'fas fa-moon',
        colors: {
          primary: '#60A5FA',
          secondary: '#A78BFA',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          background: '#111827',
          surface: '#1F2937',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB',
          border: '#374151',
          shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
          cardBackground: '#1F2937',
          cardBorder: '#374151',
          inputBackground: '#374151',
          inputBorder: '#4B5563',
          buttonPrimary: '#60A5FA',
          buttonSecondary: '#6B7280',
          buttonText: '#FFFFFF',
          link: '#60A5FA',
          linkHover: '#93C5FD'
        }
      }
    };
    
    this.init();
  }

  // تهيئة مدير الثيمات
  init() {
    // استرجاع الثيم المحفوظ
    this.currentTheme = localStorage.getItem('theme') || 'light';
    
    // تطبيق الثيم
    this.applyTheme(this.currentTheme);
    
    // إضافة مستمع لتغيير الثيم
    this.addThemeToggleListener();
    
    // إضافة مستمع لتغيير النظام
    this.addSystemThemeListener();
    
    console.log('✅ تم تهيئة مدير الثيمات بنجاح');
  }

  // تطبيق الثيم
  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    this.currentTheme = themeName;
    localStorage.setItem('theme', themeName);

    // تطبيق الألوان على CSS Variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // إضافة/إزالة الكلاس
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${themeName}`);

    // تحديث واجهة المستخدم
    this.updateThemeUI(themeName);
    
    // إرسال حدث تغيير الثيم
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
  }

  // تحديث واجهة المستخدم للثيم
  updateThemeUI(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    // تحديث أزرار تبديل الثيم
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
      const icon = toggle.querySelector('i');
      const label = toggle.querySelector('.theme-label');
      
      if (icon) {
        icon.className = theme.icon;
      }
      
      if (label) {
        label.textContent = theme.label;
      }
      
      // تحديث النص البديل
      toggle.setAttribute('title', `تغيير إلى الوضع ${themeName === 'light' ? 'الداكن' : 'الفاتح'}`);
    });

    // تحديث شعار الموقع
    this.updateLogo(themeName);
  }

  // تحديث الشعار حسب الثيم
  updateLogo(themeName) {
    const logos = document.querySelectorAll('.logo-img');
    logos.forEach(logo => {
      const currentSrc = logo.src;
      const basePath = currentSrc.replace(/logo\d+\.jpg/, '');
      
      // استخدام شعار مختلف حسب الثيم
      const logoNumber = themeName === 'dark' ? '1' : '2';
      logo.src = `${basePath}logo${logoNumber}.jpg`;
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
    const theme = themeName ? this.themes[themeName] : this.themes[this.currentTheme];
    return theme;
  }

  // إضافة مستمع لزر تبديل الثيم
  addThemeToggleListener() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle')) {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  // إضافة مستمع لتغيير ثيم النظام
  addSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        // تطبيق ثيم النظام فقط إذا لم يكن المستخدم قد اختار ثيم محدد
        if (!localStorage.getItem('theme')) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(systemTheme);
        }
      });
    }
  }

  // إنشاء زر تبديل الثيم
  createThemeToggle() {
    const theme = this.themes[this.currentTheme];
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
    toggle.innerHTML = `
      <i class="${theme.icon} text-lg"></i>
      <span class="theme-label text-sm font-medium">${theme.label}</span>
    `;
    toggle.setAttribute('title', `تغيير إلى الوضع ${this.currentTheme === 'light' ? 'الداكن' : 'الفاتح'}`);
    
    return toggle;
  }

  // إضافة زر تبديل الثيم للصفحة
  addThemeToggleToPage(container) {
    const toggle = this.createThemeToggle();
    container.appendChild(toggle);
  }

  // تطبيق الثيم على عنصر محدد
  applyThemeToElement(element, themeName = null) {
    const theme = themeName ? this.themes[themeName] : this.themes[this.currentTheme];
    if (!theme || !element) return;

    Object.entries(theme.colors).forEach(([key, value]) => {
      element.style.setProperty(`--color-${key}`, value);
    });
  }

  // الحصول على لون من الثيم الحالي
  getColor(colorName) {
    const theme = this.themes[this.currentTheme];
    return theme?.colors[colorName] || null;
  }

  // التحقق من دعم الثيم الداكن
  isDarkModeSupported() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // الحصول على ثيم النظام
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // إعادة تعيين الثيم إلى ثيم النظام
  resetToSystemTheme() {
    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
  }

  // حفظ تفضيلات الثيم
  saveThemePreference(themeName) {
    localStorage.setItem('theme', themeName);
    this.applyTheme(themeName);
  }

  // مسح تفضيلات الثيم
  clearThemePreference() {
    localStorage.removeItem('theme');
    this.resetToSystemTheme();
  }

  // الحصول على جميع الثيمات المتاحة
  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  // إضافة ثيم جديد
  addTheme(themeName, themeConfig) {
    this.themes[themeName] = themeConfig;
  }

  // إزالة ثيم
  removeTheme(themeName) {
    if (themeName !== 'light' && themeName !== 'dark') {
      delete this.themes[themeName];
    }
  }

  // تحديث ثيم موجود
  updateTheme(themeName, updates) {
    if (this.themes[themeName]) {
      this.themes[themeName] = { ...this.themes[themeName], ...updates };
    }
  }

  // الحصول على معلومات الثيمات
  getThemesInfo() {
    return Object.entries(this.themes).map(([name, config]) => ({
      name,
      label: config.label,
      icon: config.icon,
      isCurrent: name === this.currentTheme
    }));
  }

  // تطبيق الثيم على الصفحة بالكامل
  applyThemeToPage() {
    const theme = this.themes[this.currentTheme];
    if (!theme) return;

    // تطبيق الألوان على CSS Variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // إضافة الكلاس للجسم
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${this.currentTheme}`);

    // تحديث جميع العناصر التي تحتاج تحديث
    this.updateAllThemeElements();
  }

  // تحديث جميع عناصر الثيم
  updateAllThemeElements() {
    // تحديث الأيقونات
    this.updateIcons();
    
    // تحديث الصور
    this.updateImages();
    
    // تحديث الألوان
    this.updateColors();
  }

  // تحديث الأيقونات
  updateIcons() {
    const iconElements = document.querySelectorAll('[data-theme-icon]');
    iconElements.forEach(element => {
      const iconName = element.getAttribute('data-theme-icon');
      const theme = this.themes[this.currentTheme];
      
      if (theme && theme.icons && theme.icons[iconName]) {
        element.className = theme.icons[iconName];
      }
    });
  }

  // تحديث الصور
  updateImages() {
    const imageElements = document.querySelectorAll('[data-theme-image]');
    imageElements.forEach(element => {
      const imageName = element.getAttribute('data-theme-image');
      const theme = this.themes[this.currentTheme];
      
      if (theme && theme.images && theme.images[imageName]) {
        element.src = theme.images[imageName];
      }
    });
  }

  // تحديث الألوان
  updateColors() {
    const colorElements = document.querySelectorAll('[data-theme-color]');
    colorElements.forEach(element => {
      const colorName = element.getAttribute('data-theme-color');
      const theme = this.themes[this.currentTheme];
      
      if (theme && theme.colors && theme.colors[colorName]) {
        element.style.color = theme.colors[colorName];
      }
    });
  }
}

// إنشاء مثيل مدير الثيمات
const themeManager = new ThemeManager();

// تصدير للاستخدام في الملفات الأخرى
export {
  ThemeManager,
  themeManager
};

// تصدير للاستخدام العام
window.ThemeManager = themeManager;

// تصدير دوال مساعدة
window.themeManager = {
  toggle: () => themeManager.toggleTheme(),
  getCurrent: () => themeManager.getCurrentTheme(),
  apply: (theme) => themeManager.applyTheme(theme),
  getColor: (color) => themeManager.getColor(color),
  createToggle: () => themeManager.createThemeToggle()
}; 