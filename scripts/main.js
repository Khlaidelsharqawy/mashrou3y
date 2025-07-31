// التطبيق الرئيسي - Main Application
import { getSupabaseClient } from './supabase-config.js';

class MASHROU3YApp {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.currentPage = null;
    this.isInitialized = false;
    this.modules = {
      auth: null,
      store: null,
      dashboard: null,
      admin: null,
      chat: null,
      upload: null
    };
    this.init();
  }

  // تهيئة التطبيق
  async init() {
    try {
      console.log('🚀 بدء تشغيل MASHROU3Y...');
      
      // تهيئة Supabase
      await this.initSupabase();
      
      // تحميل المستخدم الحالي
      await this.loadCurrentUser();
      
      // تهيئة الواجهة
      this.initUI();
      
      // تهيئة التنقل
      this.initNavigation();
      
      // تهيئة الحماية
      this.initAuthGuard();
      
      // تهيئة الوحدات حسب الصفحة
      await this.initPageModules();
      
      // بدء التحديثات المباشرة
      this.startRealtimeUpdates();
      
      this.isInitialized = true;
      console.log('✅ تم تشغيل MASHROU3Y بنجاح');
      
      // إظهار رسالة الترحيب
      this.showWelcomeMessage();
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل التطبيق:', error);
      this.showErrorMessage('مش عارف أشغل التطبيق، جرب تاني 😅');
    }
  }

  // تهيئة Supabase
  async initSupabase() {
    try {
      // التحقق من اتصال Supabase
      const { data, error } = await this.supabase.from('users').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw new Error('فشل الاتصال بقاعدة البيانات');
      }
      
      console.log('✅ تم الاتصال بـ Supabase بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في الاتصال بـ Supabase:', error);
      throw error;
    }
  }

  // تحميل المستخدم الحالي
  async loadCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) throw error;
      
      this.currentUser = user;
      
      if (user) {
        console.log('👤 تم تحميل المستخدم:', user.email);
        
        // تحديث آخر تسجيل دخول
        await this.updateLastLogin();
        
        // تحميل بيانات الملف الشخصي
        await this.loadUserProfile();
      } else {
        console.log('👤 لا يوجد مستخدم مسجل دخول');
      }
      
    } catch (error) {
      console.error('خطأ في تحميل المستخدم:', error);
    }
  }

  // تحديث آخر تسجيل دخول
  async updateLastLogin() {
    try {
      await this.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', this.currentUser.id);
    } catch (error) {
      console.error('خطأ في تحديث آخر تسجيل دخول:', error);
    }
  }

  // تحميل بيانات الملف الشخصي
  async loadUserProfile() {
    try {
      const { data: profile, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;

      // حفظ البيانات في التخزين المحلي
      localStorage.setItem('userProfile', JSON.stringify(profile));
      
      // تحديث واجهة المستخدم
      this.updateUserInterface(profile);
      
    } catch (error) {
      console.error('خطأ في تحميل الملف الشخصي:', error);
    }
  }

  // تهيئة الواجهة
  initUI() {
    // إضافة مؤشر التحميل
    this.addLoadingIndicator();
    
    // إعداد الوضع المظلم
    this.initDarkMode();
    
    // إعداد الخطوط العربية
    this.initArabicFonts();
    
    // إعداد التمرير السلس
    this.initSmoothScrolling();
    
    // إعداد الأيقونات
    this.initIcons();
    
    console.log('✅ تم تهيئة الواجهة');
  }

  // إضافة مؤشر التحميل
  addLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'appLoader';
    loader.className = 'fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50';
    loader.innerHTML = `
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">MASHROU3Y</h2>
        <p class="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
      </div>
    `;
    
    document.body.appendChild(loader);
    
    // إخفاء المؤشر بعد التحميل
    setTimeout(() => {
      const loader = document.getElementById('appLoader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
      }
    }, 1000);
  }

  // تهيئة الوضع المظلم
  initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // زر تبديل الوضع المظلم
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('darkMode', isDark);
        
        // تحديث الأيقونة
        darkModeToggle.innerHTML = isDark ? 
          '<i class="fas fa-sun"></i>' : 
          '<i class="fas fa-moon"></i>';
      });
      
      // تعيين الأيقونة الصحيحة
      const isDark = document.documentElement.classList.contains('dark');
      darkModeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    }
  }

  // تهيئة الخطوط العربية
  initArabicFonts() {
    // إضافة خطوط Google Fonts العربية
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // تطبيق الخط على العناصر
    document.documentElement.style.fontFamily = 'Cairo, sans-serif';
  }

  // تهيئة التمرير السلس
  initSmoothScrolling() {
    // إضافة CSS للتمرير السلس
    const style = document.createElement('style');
    style.textContent = `
      html {
        scroll-behavior: smooth;
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  // تهيئة الأيقونات
  initIcons() {
    // إضافة Font Awesome إذا لم يكن موجوداً
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  // تهيئة التنقل
  initNavigation() {
    // تحديد الصفحة الحالية
    this.currentPage = this.getCurrentPage();
    
    // تحديث القائمة النشطة
    this.updateActiveNavigation();
    
    // إضافة مستمعي الأحداث للتنقل
    this.addNavigationListeners();
    
    console.log('✅ تم تهيئة التنقل');
  }

  // الحصول على الصفحة الحالية
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
  }

  // تحديث القائمة النشطة
  updateActiveNavigation() {
    const navLinks = document.querySelectorAll('[data-nav-link]');
    navLinks.forEach(link => {
      const linkPage = link.dataset.navLink;
      if (linkPage === this.currentPage) {
        link.classList.add('active', 'bg-blue-600', 'text-white');
        link.classList.remove('bg-gray-100', 'text-gray-700');
      } else {
        link.classList.remove('active', 'bg-blue-600', 'text-white');
        link.classList.add('bg-gray-100', 'text-gray-700');
      }
    });
  }

  // إضافة مستمعي الأحداث للتنقل
  addNavigationListeners() {
    // أزرار التنقل
    const navLinks = document.querySelectorAll('[data-nav-link]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.dataset.navLink;
        this.navigateTo(targetPage);
      });
    });

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // زر الملف الشخصي
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo('profile.html');
      });
    }
  }

  // التنقل لصفحة
  navigateTo(page) {
    if (page === this.currentPage) return;
    
    // إظهار مؤشر التحميل
    this.showPageLoader();
    
    // الانتقال للصفحة
    window.location.href = page;
  }

  // إظهار مؤشر تحميل الصفحة
  showPageLoader() {
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'fixed top-0 left-0 w-full h-1 bg-blue-500 z-50';
    loader.style.animation = 'loading 1s ease-in-out infinite';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loader);
  }

  // تهيئة حماية المصادقة
  initAuthGuard() {
    // الصفحات المحمية
    const protectedPages = [
      'dashboard.html',
      'admin.html',
      'upload.html',
      'profile.html',
      'materials.html',
      'projects.html',
      'presentations.html',
      'store.html',
      'payment.html',
      'chat.html'
    ];

    // التحقق من الحماية
    if (protectedPages.includes(this.currentPage)) {
      if (!this.currentUser) {
        this.redirectToLogin();
        return;
      }
    }

    // الصفحات المخصصة للمديرين
    const adminPages = ['admin.html', 'admin-creators.html'];
    if (adminPages.includes(this.currentPage)) {
      this.checkAdminAccess();
    }

    console.log('✅ تم تهيئة حماية المصادقة');
  }

  // التحقق من صلاحيات المدير
  async checkAdminAccess() {
    try {
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      if (profile.user_type !== 'admin' && !profile.is_admin) {
        this.showMessage('مش معاك صلاحيات الإدارة يا نجم 😅', 'error');
        this.navigateTo('dashboard.html');
        return;
      }
    } catch (error) {
      console.error('خطأ في التحقق من صلاحيات المدير:', error);
      this.navigateTo('dashboard.html');
    }
  }

  // إعادة التوجيه لصفحة تسجيل الدخول
  redirectToLogin() {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `login.html?redirect=${currentUrl}`;
  }

  // تهيئة وحدات الصفحة
  async initPageModules() {
    try {
      switch (this.currentPage) {
        case 'index.html':
          await this.initHomePage();
          break;
        case 'store.html':
          await this.initStorePage();
          break;
        case 'dashboard.html':
          await this.initDashboardPage();
          break;
        case 'admin.html':
          await this.initAdminPage();
          break;
        case 'chat.html':
          await this.initChatPage();
          break;
        case 'upload.html':
          await this.initUploadPage();
          break;
        case 'profile.html':
          await this.initProfilePage();
          break;
        case 'materials.html':
          await this.initMaterialsPage();
          break;
        case 'projects.html':
          await this.initProjectsPage();
          break;
        case 'presentations.html':
          await this.initPresentationsPage();
          break;
        case 'payment.html':
          await this.initPaymentPage();
          break;
        default:
          console.log('📄 صفحة عادية:', this.currentPage);
      }
    } catch (error) {
      console.error('خطأ في تهيئة وحدات الصفحة:', error);
    }
  }

  // تهيئة الصفحة الرئيسية
  async initHomePage() {
    console.log('🏠 تهيئة الصفحة الرئيسية');
    
    // تحميل الإحصائيات العامة
    await this.loadPublicStats();
    
    // تحميل المنتجات المميزة
    await this.loadFeaturedProducts();
    
    // إضافة مستمعي الأحداث
    this.addHomePageListeners();
  }

  // تحميل الإحصائيات العامة
  async loadPublicStats() {
    try {
      const statsContainer = document.getElementById('publicStats');
      if (!statsContainer) return;

      const { data: stats } = await this.supabase
        .from('materials')
        .select('count', { count: 'exact', head: true })
        .eq('status', 'approved');

      const totalItems = stats || 0;

      statsContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">${totalItems}</div>
            <div class="text-gray-600">مادة دراسية</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">1000+</div>
            <div class="text-gray-600">طالب</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">50+</div>
            <div class="text-gray-600">منشئ محتوى</div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات العامة:', error);
    }
  }

  // تحميل المنتجات المميزة
  async loadFeaturedProducts() {
    try {
      const container = document.getElementById('featuredProducts');
      if (!container) return;

      const { data: products } = await this.supabase
        .from('materials')
        .select(`
          *,
          users:user_id (full_name)
        `)
        .eq('status', 'approved')
        .order('downloads', { ascending: false })
        .limit(6);

      if (products && products.length > 0) {
        container.innerHTML = products.map(product => `
          <div class="bg-white rounded-lg shadow-sm border p-4">
            <h3 class="font-semibold text-gray-900 mb-2">${product.title}</h3>
            <p class="text-gray-600 text-sm mb-3">${product.description}</p>
            <div class="flex justify-between items-center">
              <span class="text-blue-600 font-bold">$${product.price || 0}</span>
              <span class="text-sm text-gray-500">${product.users?.full_name || 'مستخدم'}</span>
            </div>
          </div>
        `).join('');
      } else {
        container.innerHTML = `
          <div class="col-span-full text-center py-8">
            <p class="text-gray-500">لا توجد منتجات مميزة حالياً</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('خطأ في تحميل المنتجات المميزة:', error);
    }
  }

  // إضافة مستمعي الأحداث للصفحة الرئيسية
  addHomePageListeners() {
    // أزرار التسجيل
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        this.navigateTo('signup.html');
      });
    }

    // أزرار تسجيل الدخول
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.navigateTo('login.html');
      });
    }

    // أزرار استكشاف المتجر
    const exploreBtn = document.getElementById('exploreBtn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        this.navigateTo('store.html');
      });
    }
  }

  // تهيئة صفحة المتجر
  async initStorePage() {
    console.log('🛒 تهيئة صفحة المتجر');
    
    // تحميل وحدة المتجر
    const { storeManager } = await import('./store.js');
    this.modules.store = storeManager;
  }

  // تهيئة صفحة لوحة التحكم
  async initDashboardPage() {
    console.log('📊 تهيئة صفحة لوحة التحكم');
    
    // تحميل وحدة لوحة التحكم
    const { dashboardManager } = await import('./dashboard.js');
    this.modules.dashboard = dashboardManager;
  }

  // تهيئة صفحة الإدارة
  async initAdminPage() {
    console.log('⚙️ تهيئة صفحة الإدارة');
    
    // تحميل وحدة الإدارة
    const { adminManager } = await import('./admin.js');
    this.modules.admin = adminManager;
  }

  // تهيئة صفحة المحادثة
  async initChatPage() {
    console.log('💬 تهيئة صفحة المحادثة');
    
    // تحميل وحدة المحادثة
    const { chatManager } = await import('./chat.js');
    this.modules.chat = chatManager;
  }

  // تهيئة صفحة الرفع
  async initUploadPage() {
    console.log('📤 تهيئة صفحة الرفع');
    
    // تحميل وحدة الرفع
    const { uploadManager } = await import('./upload.js');
    this.modules.upload = uploadManager;
  }

  // تهيئة صفحة الملف الشخصي
  async initProfilePage() {
    console.log('👤 تهيئة صفحة الملف الشخصي');
    
    // تحميل وحدة الملف الشخصي
    const { profileManager } = await import('./profile.js');
    this.modules.profile = profileManager;
  }

  // تهيئة صفحة المواد
  async initMaterialsPage() {
    console.log('📚 تهيئة صفحة المواد');
    
    // تحميل وحدة المواد
    const { materialsManager } = await import('./materials.js');
    this.modules.materials = materialsManager;
  }

  // تهيئة صفحة المشاريع
  async initProjectsPage() {
    console.log('💻 تهيئة صفحة المشاريع');
    
    // تحميل وحدة المشاريع
    const { projectsManager } = await import('./projects.js');
    this.modules.projects = projectsManager;
  }

  // تهيئة صفحة العروض التقديمية
  async initPresentationsPage() {
    console.log('🖼️ تهيئة صفحة العروض التقديمية');
    
    // تحميل وحدة العروض التقديمية
    const { presentationsManager } = await import('./presentations.js');
    this.modules.presentations = presentationsManager;
  }

  // تهيئة صفحة الدفع
  async initPaymentPage() {
    console.log('💳 تهيئة صفحة الدفع');
    
    // تحميل وحدة الدفع
    const { paymentManager } = await import('./payment.js');
    this.modules.payment = paymentManager;
  }

  // بدء التحديثات المباشرة
  startRealtimeUpdates() {
    // مراقبة تغييرات المصادقة
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 تغيير حالة المصادقة:', event);
      
      if (event === 'SIGNED_IN') {
        this.currentUser = session?.user;
        this.loadUserProfile();
        this.updateUserInterface();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.clearUserData();
        this.updateUserInterface();
      }
    });

    console.log('✅ تم بدء التحديثات المباشرة');
  }

  // تحديث واجهة المستخدم
  updateUserInterface(profile = null) {
    const userProfile = profile || JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    // تحديث اسم المستخدم
    const userNameElements = document.querySelectorAll('[data-user-name]');
    userNameElements.forEach(element => {
      element.textContent = userProfile.full_name || 'مستخدم';
    });

    // تحديث صورة المستخدم
    const userAvatarElements = document.querySelectorAll('[data-user-avatar]');
    userAvatarElements.forEach(element => {
      if (userProfile.avatar_url) {
        element.src = userProfile.avatar_url;
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
        element.nextElementSibling.style.display = 'flex';
      }
    });

    // تحديث نوع المستخدم
    const userTypeElements = document.querySelectorAll('[data-user-type]');
    userTypeElements.forEach(element => {
      element.textContent = this.getUserTypeLabel(userProfile.user_type);
    });

    // إظهار/إخفاء عناصر حسب حالة تسجيل الدخول
    this.toggleAuthElements(!!this.currentUser);
  }

  // الحصول على تسمية نوع المستخدم
  getUserTypeLabel(userType) {
    switch (userType) {
      case 'admin':
        return 'مدير';
      case 'creator':
        return 'منشئ محتوى';
      case 'student':
        return 'طالب';
      default:
        return 'مستخدم';
    }
  }

  // تبديل عناصر المصادقة
  toggleAuthElements(isLoggedIn) {
    const authElements = document.querySelectorAll('[data-auth-required]');
    const guestElements = document.querySelectorAll('[data-guest-only]');
    
    authElements.forEach(element => {
      element.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    guestElements.forEach(element => {
      element.style.display = isLoggedIn ? 'none' : 'block';
    });
  }

  // مسح بيانات المستخدم
  clearUserData() {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('storeCart');
  }

  // تسجيل الخروج
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) throw error;
      
      this.showMessage('تم تسجيل الخروج بنجاح 👋', 'success');
      
      // إعادة التوجيه للصفحة الرئيسية
      setTimeout(() => {
        this.navigateTo('index.html');
      }, 1000);
      
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      this.showMessage('مش عارف أسجل خروج، جرب تاني 😅', 'error');
    }
  }

  // إظهار رسالة الترحيب
  showWelcomeMessage() {
    if (this.currentUser) {
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      this.showMessage(`أهلاً وسهلاً ${profile.full_name || 'يا نجم'}! 👋`, 'success');
    }
  }

  // إظهار رسالة خطأ
  showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'fixed inset-0 bg-red-500 text-white flex items-center justify-center z-50';
    errorContainer.innerHTML = `
      <div class="text-center p-8">
        <i class="fas fa-exclamation-triangle text-6xl mb-4"></i>
        <h2 class="text-2xl font-bold mb-4">خطأ في التطبيق</h2>
        <p class="mb-4">${message}</p>
        <button onclick="location.reload()" class="bg-white text-red-500 px-6 py-2 rounded-lg hover:bg-gray-100">
          إعادة تحميل الصفحة
        </button>
      </div>
    `;
    document.body.appendChild(errorContainer);
  }

  // إظهار رسالة
  showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    const typeClasses = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    };
    
    messageElement.classList.add(typeClasses[type] || typeClasses.info);
    
    messageElement.innerHTML = `
      <div class="flex items-center space-x-3 space-x-reverse">
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="mr-auto">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
      messageElement.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
      messageElement.classList.add('translate-x-full');
      setTimeout(() => {
        if (messageElement.parentElement) {
          messageElement.remove();
        }
      }, 300);
    }, 5000);
  }

  // الحصول على معلومات التطبيق
  getAppInfo() {
    return {
      name: 'MASHROU3Y',
      version: '1.0.0',
      description: 'منصة تعليمية متكاملة',
      currentUser: this.currentUser,
      currentPage: this.currentPage,
      isInitialized: this.isInitialized
    };
  }

  // تنظيف الموارد
  cleanup() {
    // إيقاف التحديثات المباشرة
    if (this.supabase) {
      this.supabase.removeAllChannels();
    }
    
    // تنظيف الوحدات
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.cleanup === 'function') {
        module.cleanup();
      }
    });
  }
}

// إنشاء التطبيق الرئيسي
const app = new MASHROU3YApp();

// تصدير للاستخدام في الملفات الأخرى
window.app = app;

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  app.cleanup();
});

// معالجة الأخطاء العامة
window.addEventListener('error', (event) => {
  console.error('خطأ عام في التطبيق:', event.error);
  app.showMessage('حدث خطأ غير متوقع 😅', 'error');
});

// معالجة الوعود المرفوضة
window.addEventListener('unhandledrejection', (event) => {
  console.error('وعد مرفوض:', event.reason);
  app.showMessage('حدث خطأ في العملية 😅', 'error');
});

export { app, MASHROU3YApp }; 