// نظام حماية المصادقة - Auth Guard System

class AuthGuard {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.protectedRoutes = [
      'dashboard.html',
      'upload.html',
      'profile.html',
      'materials.html',
      'projects.html',
      'presentations.html',
      'store.html',
      'payment.html',
      'chat.html'
    ];
    this.adminRoutes = [
      '../admin-pages/admin-dashboard.html',
      '../admin-pages/admin.html', 
      '../admin-pages/admin-creators.html',
      '../admin-pages/admin-stores.html'
    ];
    this.init();
  }

  // تهيئة نظام الحماية
  async init() {
    try {
      // انتظار تحميل Supabase
      await this.waitForSupabase();
      
      // التحقق من الجلسة الحالية
      await this.checkCurrentSession();
      
      // الاستماع لتغييرات المصادقة
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 تغيير حالة المصادقة:', event);
        
        if (event === 'SIGNED_IN') {
          this.handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        } else if (event === 'TOKEN_REFRESHED') {
          this.handleTokenRefresh(session);
        }
      });

      // حماية الصفحات
      this.protectCurrentPage();
      
      this.isInitialized = true;
      console.log('✅ تم تهيئة نظام حماية المصادقة بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام حماية المصادقة:', error);
    }
  }

  // انتظار تحميل Supabase
  async waitForSupabase() {
    return new Promise((resolve) => {
      const checkSupabase = () => {
        if (window.supabaseClient) {
          this.supabase = window.supabaseClient;
          resolve();
        } else {
          setTimeout(checkSupabase, 100);
        }
      };
      checkSupabase();
    });
  }

  // التحقق من الجلسة الحالية
  async checkCurrentSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        this.currentUser = session.user;
        this.updateUIForAuthenticatedUser();
      } else {
        this.updateUIForGuestUser();
      }
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      this.updateUIForGuestUser();
    }
  }

  // معالجة تسجيل الدخول
  handleSignIn(session) {
    this.currentUser = session.user;
    this.updateUIForAuthenticatedUser();
    this.protectCurrentPage();
    
    // إظهار رسالة ترحيب
    this.showWelcomeMessage();
  }

  // معالجة تسجيل الخروج
  handleSignOut() {
    this.currentUser = null;
    this.updateUIForGuestUser();
    
    // إعادة التوجيه للصفحة الرئيسية إذا كان في صفحة محمية
    if (this.isProtectedPage()) {
      window.location.href = 'index.html';
    }
  }

  // معالجة تحديث التوكن
  handleTokenRefresh(session) {
    this.currentUser = session.user;
    console.log('🔄 تم تحديث توكن الجلسة');
  }

  // حماية الصفحة الحالية
  async protectCurrentPage() {
    const currentPage = this.getCurrentPage();
    
    // التحقق من الصفحات المحمية
    if (this.protectedRoutes.includes(currentPage)) {
      if (!this.currentUser) {
        this.redirectToLogin('محتاج تسجل دخول الأول يا نجم 😅');
        return;
      }
      
      // التحقق من الموافقة على الحساب
      const isApproved = await this.isUserApproved();
      if (!isApproved) {
        this.redirectToWaitingApproval();
        return;
      }
    }
    
    // التحقق من الصفحات الإدارية
    if (this.adminRoutes.includes(currentPage)) {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        this.showMessage('ليس لديك صلاحيات الأدمن', 'error');
        setTimeout(() => {
          window.location.href = '../pages/index.html';
        }, 2000);
        return;
      }
    }
    
    // إخفاء عناصر تسجيل الدخول إذا كان مسجل دخول
    if (this.currentUser) {
      this.hideLoginElements();
    }
  }

  // الحصول على الصفحة الحالية
  getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
  }

  // التحقق من كون الصفحة محمية
  isProtectedPage() {
    const currentPage = this.getCurrentPage();
    return this.protectedRoutes.includes(currentPage);
  }

  // التحقق من كون المستخدم مدير
  async isAdmin() {
    if (!this.currentUser) return false;
    
    try {
      const { data: userProfile, error } = await this.supabase
        .from('users')
        .select('user_type')
        .eq('email', this.currentUser.email)
        .single();
      
      if (error || !userProfile) return false;
      
      return ['admin', 'owner'].includes(userProfile.user_type);
    } catch (error) {
      console.error('خطأ في التحقق من صلاحيات الأدمن:', error);
      return false;
    }
  }

  // التحقق من موافقة المستخدم
  async isUserApproved() {
    if (!this.currentUser) return false;
    
    try {
      const { data: userProfile } = await this.supabase
        .from('users')
        .select('is_approved')
        .eq('id', this.currentUser.id)
        .single();
      
      return userProfile?.is_approved || false;
    } catch (error) {
      console.error('خطأ في التحقق من موافقة المستخدم:', error);
      return false;
    }
  }

  // تحديث واجهة المستخدم للمستخدم المسجل دخول
  updateUIForAuthenticatedUser() {
    // إظهار معلومات المستخدم
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
      element.style.display = 'block';
      element.innerHTML = `
        <div class="flex items-center space-x-3 space-x-reverse">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-white text-sm"></i>
          </div>
          <span class="text-sm font-medium">${this.currentUser?.user_metadata?.full_name || 'مستخدم'}</span>
        </div>
      `;
    });

    // إظهار أزرار تسجيل الخروج
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
      button.style.display = 'block';
      button.onclick = () => this.logout();
    });

    // إخفاء أزرار تسجيل الدخول
    this.hideLoginElements();
  }

  // تحديث واجهة المستخدم للزائر
  updateUIForGuestUser() {
    // إخفاء معلومات المستخدم
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
      element.style.display = 'none';
    });

    // إخفاء أزرار تسجيل الخروج
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
      button.style.display = 'none';
    });

    // إظهار أزرار تسجيل الدخول
    this.showLoginElements();
  }

  // إخفاء عناصر تسجيل الدخول
  hideLoginElements() {
    const loginElements = document.querySelectorAll('.login-only');
    loginElements.forEach(element => {
      element.style.display = 'none';
    });
  }

  // إظهار عناصر تسجيل الدخول
  showLoginElements() {
    const loginElements = document.querySelectorAll('.login-only');
    loginElements.forEach(element => {
      element.style.display = 'block';
    });
  }

  // إعادة التوجيه لصفحة تسجيل الدخول
  redirectToLogin(message = 'محتاج تسجل دخول') {
    this.showMessage(message, 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }

  // إعادة التوجيه للوحة التحكم
  redirectToDashboard(message = 'تم إعادة التوجيه للوحة التحكم') {
    this.showMessage(message, 'info');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  }

  // إعادة التوجيه لصفحة انتظار الموافقة
  redirectToWaitingApproval() {
    this.showMessage('حسابك لسه تحت المراجعة، استنى شوية 😊', 'info');
    setTimeout(() => {
      window.location.href = 'waiting-approval.html';
    }, 2000);
  }

  // تسجيل الخروج
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.showMessage('تم تسجيل الخروج بنجاح 👋', 'success');
      
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      this.showMessage('مش عارف أسجل خروج، جرب تاني 😅', 'error');
    }
  }

  // إظهار رسالة ترحيب
  showWelcomeMessage() {
    const userName = this.currentUser?.user_metadata?.full_name || 'يا نجم';
    this.showMessage(`أهلاً وسهلاً ${userName}! 🎉`, 'success');
  }

  // إظهار رسالة
  showMessage(message, type = 'info') {
    // إنشاء عنصر الرسالة
    const messageElement = document.createElement('div');
    messageElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // تحديد نوع الرسالة
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
    
    // إظهار الرسالة
    setTimeout(() => {
      messageElement.classList.remove('translate-x-full');
    }, 100);
    
    // إخفاء الرسالة تلقائياً
    setTimeout(() => {
      messageElement.classList.add('translate-x-full');
      setTimeout(() => {
        if (messageElement.parentElement) {
          messageElement.remove();
        }
      }, 300);
    }, 5000);
  }

  // الحصول على المستخدم الحالي
  getCurrentUser() {
    return this.currentUser;
  }

  // التحقق من تسجيل الدخول
  isAuthenticated() {
    return !!this.currentUser;
  }

  // التحقق من نوع المستخدم
  hasRole(role) {
    if (!this.currentUser) return false;
    return this.currentUser.user_metadata?.user_type === role || 
           this.currentUser.user_metadata?.role === role;
  }
}

// إنشاء مثيل نظام الحماية
const authGuard = new AuthGuard();

// تصدير للاستخدام في الملفات الأخرى
window.AuthGuard = authGuard;

// تصدير دوال مساعدة
export {
  authGuard,
  AuthGuard
};
