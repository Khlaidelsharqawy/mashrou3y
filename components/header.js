// مكون الهيدر الموحد - Unified Header Component
class UnifiedHeader {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.translations = null;
    this.theme = null;
    this.init();
  }

  // تهيئة الهيدر
  async init() {
    try {
      await this.loadDependencies();
      this.createHeader();
      this.bindEvents();
      this.updateAuthState();
      console.log('✅ تم تهيئة الهيدر الموحد');
    } catch (error) {
      console.error('❌ خطأ في تهيئة الهيدر:', error);
    }
  }

  // تحميل التبعيات
  async loadDependencies() {
    // انتظار تحميل النظم الأساسية
    while (!window.supabaseClient || !window.Translations || !window.ThemeManager) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.supabase = window.supabaseClient;
    this.translations = window.translationsInstance;
    this.theme = window.themeManager;
  }

  // إنشاء هيكل الهيدر
  createHeader() {
    const headerHTML = `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700 transition-all duration-300">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <div class="flex items-center space-x-3 space-x-reverse">
              <img src="../images/logo2.jpg" alt="شعار MASHROU3Y" class="w-12 h-12 rounded-lg shadow-lg">
              <span class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MASHROU3Y</span>
            </div>
            
            <!-- Navigation Menu -->
            <div class="hidden md:flex items-center space-x-6 space-x-reverse">
              <a href="../index.html" class="nav-link" data-translate="home">الرئيسية</a>
              <a href="../materials.html" class="nav-link" data-translate="materials">المواد</a>
              <a href="../projects.html" class="nav-link" data-translate="projects">المشاريع</a>
              <a href="../presentations.html" class="nav-link" data-translate="presentations">العروض</a>
              <a href="../stores.html" class="nav-link" data-translate="store">المتجر</a>
            </div>
            
            <!-- User Actions -->
            <div class="flex items-center space-x-3 space-x-reverse">
              <!-- Language Toggle -->
              <button id="language-toggle" class="header-btn" title="تغيير اللغة">
                <i class="fas fa-globe"></i>
                <span class="hidden sm:inline" data-translate="arabic">العربية</span>
              </button>
              
              <!-- Theme Toggle -->
              <button id="theme-toggle" class="header-btn" title="تغيير الثيم">
                <i class="fas fa-sun" id="theme-icon"></i>
                <span class="hidden sm:inline" data-translate="light">فاتح</span>
              </button>
              
              <!-- Contact Button -->
              <button id="contact-btn" class="header-btn" title="تواصل معنا">
                <i class="fas fa-envelope"></i>
                <span class="hidden sm:inline" data-translate="contact">تواصل</span>
              </button>
              
              <!-- Auth Buttons (when not logged in) -->
              <div id="guest-actions" class="flex items-center space-x-2 space-x-reverse">
                <a href="../login.html" class="btn-outline">
                  <i class="fas fa-sign-in-alt"></i>
                  <span data-translate="login">دخول</span>
                </a>
                <a href="../signup.html" class="btn-primary">
                  <i class="fas fa-user-plus"></i>
                  <span data-translate="signup">تسجيل</span>
                </a>
              </div>
              
              <!-- User Menu (when logged in) -->
              <div id="user-menu" class="relative hidden">
                <button id="user-menu-btn" class="flex items-center space-x-2 space-x-reverse p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <img id="user-avatar" src="../images/logo2.jpg" alt="صورة المستخدم" class="w-8 h-8 rounded-full">
                  <span id="user-name" class="text-sm font-medium">المستخدم</span>
                  <i class="fas fa-chevron-down text-xs"></i>
                </button>
                
                <div id="user-dropdown" class="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden">
                  <a href="../dashboard.html" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i>
                    <span data-translate="dashboard">لوحة التحكم</span>
                  </a>
                  <a href="../profile.html" class="dropdown-item">
                    <i class="fas fa-user"></i>
                    <span data-translate="profile">الملف الشخصي</span>
                  </a>
                  <hr class="my-1 border-gray-200 dark:border-gray-700">
                  <button id="logout-btn" class="dropdown-item w-full text-left text-red-600 dark:text-red-400">
                    <i class="fas fa-sign-out-alt"></i>
                    <span data-translate="logout">تسجيل الخروج</span>
                  </button>
                </div>
              </div>
              
              <!-- Mobile Menu Toggle -->
              <button id="mobile-menu-btn" class="md:hidden header-btn">
                <i class="fas fa-bars"></i>
              </button>
            </div>
          </div>
          
          <!-- Mobile Menu -->
          <div id="mobile-menu" class="md:hidden border-t border-gray-200 dark:border-gray-700 hidden">
            <div class="py-4 space-y-2">
              <a href="../index.html" class="mobile-nav-link" data-translate="home">الرئيسية</a>
              <a href="../materials.html" class="mobile-nav-link" data-translate="materials">المواد</a>
              <a href="../projects.html" class="mobile-nav-link" data-translate="projects">المشاريع</a>
              <a href="../presentations.html" class="mobile-nav-link" data-translate="presentations">العروض</a>
              <a href="../stores.html" class="mobile-nav-link" data-translate="store">المتجر</a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Contact Modal -->
      <div id="contact-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 transform transition-all duration-300">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white" data-translate="contact_us">تواصل معنا</h3>
            <button id="close-contact-modal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="contact-form" class="space-y-4">
            <div>
              <label for="contact-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" data-translate="full_name">الاسم الكامل</label>
              <input type="text" id="contact-name" required class="form-input w-full">
            </div>
            
            <div>
              <label for="contact-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" data-translate="phone">رقم التليفون</label>
              <input type="tel" id="contact-phone" required class="form-input w-full">
            </div>
            
            <div>
              <label for="contact-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" data-translate="email">البريد الإلكتروني</label>
              <input type="email" id="contact-email" required class="form-input w-full">
            </div>
            
            <div>
              <label for="contact-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" data-translate="message">الرسالة</label>
              <textarea id="contact-message" rows="4" required class="form-input w-full resize-none"></textarea>
            </div>
            
            <div class="flex space-x-3 space-x-reverse pt-4">
              <button type="submit" class="btn-primary flex-1">
                <i class="fas fa-paper-plane mr-2"></i>
                <span data-translate="send">إرسال</span>
              </button>
              <button type="button" id="cancel-contact" class="btn-outline">
                <span data-translate="cancel">إلغاء</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Notification Toast -->
      <div id="notification-toast" class="fixed top-20 right-4 transform translate-x-full transition-transform duration-300 z-50">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
          <div class="flex items-center space-x-3 space-x-reverse">
            <div id="toast-icon" class="text-2xl"></div>
            <div class="flex-1">
              <div id="toast-title" class="font-semibold text-gray-900 dark:text-white"></div>
              <div id="toast-message" class="text-sm text-gray-600 dark:text-gray-400"></div>
            </div>
            <button id="close-toast" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // إدراج الهيدر في بداية الـ body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    // إضافة padding للمحتوى لتجنب التداخل مع الهيدر الثابت
    document.body.style.paddingTop = '4rem';
  }

  // ربط الأحداث
  bindEvents() {
    // تبديل اللغة
    document.getElementById('language-toggle')?.addEventListener('click', () => {
      this.translations?.toggleLanguage();
    });

    // تبديل الثيم
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.theme?.toggleTheme();
    });

    // فتح نموذج التواصل
    document.getElementById('contact-btn')?.addEventListener('click', () => {
      this.openContactModal();
    });

    // إغلاق نموذج التواصل
    document.getElementById('close-contact-modal')?.addEventListener('click', () => {
      this.closeContactModal();
    });

    document.getElementById('cancel-contact')?.addEventListener('click', () => {
      this.closeContactModal();
    });

    // إرسال نموذج التواصل
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      this.handleContactSubmit(e);
    });

    // قائمة المستخدم
    document.getElementById('user-menu-btn')?.addEventListener('click', () => {
      this.toggleUserDropdown();
    });

    // تسجيل الخروج
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    // القائمة المحمولة
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // إغلاق القوائم عند النقر خارجها
    document.addEventListener('click', (e) => {
      this.handleOutsideClick(e);
    });

    // إغلاق التنبيه
    document.getElementById('close-toast')?.addEventListener('click', () => {
      this.hideNotification();
    });

    // مراقبة تغييرات المصادقة
    this.supabase?.auth.onAuthStateChange((event, session) => {
      this.updateAuthState(session?.user);
    });
  }

  // تحديث حالة المصادقة
  async updateAuthState(user = null) {
    try {
      if (!user) {
        const { data: { user: currentUser } } = await this.supabase.auth.getUser();
        user = currentUser;
      }

      this.currentUser = user;
      this.isAuthenticated = !!user;

      const guestActions = document.getElementById('guest-actions');
      const userMenu = document.getElementById('user-menu');

      if (this.isAuthenticated && user) {
        // إخفاء أزرار الضيف وإظهار قائمة المستخدم
        guestActions?.classList.add('hidden');
        userMenu?.classList.remove('hidden');

        // تحديث معلومات المستخدم
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (userName) {
          userName.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'المستخدم';
        }

        if (userAvatar && user.user_metadata?.avatar_url) {
          userAvatar.src = user.user_metadata.avatar_url;
        }
      } else {
        // إظهار أزرار الضيف وإخفاء قائمة المستخدم
        guestActions?.classList.remove('hidden');
        userMenu?.classList.add('hidden');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المصادقة:', error);
    }
  }

  // فتح نموذج التواصل
  openContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  // إغلاق نموذج التواصل
  closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      
      // مسح النموذج
      document.getElementById('contact-form')?.reset();
    }
  }

  // معالجة إرسال نموذج التواصل
  async handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name')?.value;
    const phone = document.getElementById('contact-phone')?.value;
    const email = document.getElementById('contact-email')?.value;
    const message = document.getElementById('contact-message')?.value;

    try {
      // إرسال الرسالة لقاعدة البيانات
      const { error } = await this.supabase
        .from('contact_messages')
        .insert([{
          name,
          phone,
          email,
          message,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      this.showNotification('success', 'تم الإرسال بنجاح', 'سنتواصل معك قريباً');
      this.closeContactModal();
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      this.showNotification('error', 'خطأ في الإرسال', 'جرب مرة أخرى');
    }
  }

  // تبديل قائمة المستخدم
  toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  // تبديل القائمة المحمولة
  toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.toggle('hidden');
    }
  }

  // معالجة النقر خارج القوائم
  handleOutsideClick(e) {
    const userMenu = document.getElementById('user-menu');
    const userDropdown = document.getElementById('user-dropdown');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    // إغلاق قائمة المستخدم
    if (userMenu && !userMenu.contains(e.target)) {
      userDropdown?.classList.add('hidden');
    }

    // إغلاق القائمة المحمولة
    if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
      mobileMenu.classList.add('hidden');
    }
  }

  // تسجيل الخروج
  async handleLogout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.showNotification('success', 'تم تسجيل الخروج', 'مع السلامة');
      
      // التوجه للصفحة الرئيسية بعد ثانيتين
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 2000);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      this.showNotification('error', 'خطأ في تسجيل الخروج', 'جرب مرة أخرى');
    }
  }

  // إظهار التنبيه
  showNotification(type, title, message) {
    const toast = document.getElementById('notification-toast');
    const icon = document.getElementById('toast-icon');
    const titleEl = document.getElementById('toast-title');
    const messageEl = document.getElementById('toast-message');

    if (!toast || !icon || !titleEl || !messageEl) return;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    icon.textContent = icons[type] || icons.info;
    titleEl.textContent = title;
    messageEl.textContent = message;

    // إظهار التنبيه
    toast.classList.remove('translate-x-full');
    toast.classList.add('translate-x-0');

    // إخفاء التنبيه تلقائياً بعد 5 ثوان
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  // إخفاء التنبيه
  hideNotification() {
    const toast = document.getElementById('notification-toast');
    if (toast) {
      toast.classList.remove('translate-x-0');
      toast.classList.add('translate-x-full');
    }
  }
}

// تصدير الكلاس
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedHeader;
} else {
  window.UnifiedHeader = UnifiedHeader;
}

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  window.unifiedHeader = new UnifiedHeader();
});