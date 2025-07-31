// نظام تبديل الأدوار للأدمن
// Admin Role Switcher System

class AdminRoleSwitcher {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.currentSession = null;
    this.isInVisitorMode = false;
    this.visitorRole = null;
    this.visitorStoreId = null;
    this.init();
  }

  // تهيئة النظام
  async init() {
    try {
      console.log('🚀 بدء تشغيل نظام تبديل الأدوار...');
      
      // التحقق من تسجيل الدخول
      await this.checkAuth();
      
      // تحميل الجلسة الحالية
      await this.loadCurrentSession();
      
      // تهيئة واجهة المستخدم
      this.initUI();
      
      // تهيئة الأحداث
      this.initEventListeners();
      
      console.log('✅ تم تشغيل نظام تبديل الأدوار بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل نظام تبديل الأدوار:', error);
    }
  }

  // التحقق من تسجيل الدخول
  async checkAuth() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        window.location.href = 'pages/login.html';
        return;
      }

      this.currentUser = session.user;

      // التحقق من صلاحيات الأدمن
      const { data: userProfile, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error || !userProfile) {
        throw new Error('لم يتم العثور على ملف المستخدم');
      }

      if (!['admin', 'owner'].includes(userProfile.user_type)) {
        throw new Error('ليس لديك صلاحيات الأدمن');
      }

    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      this.showErrorMessage('مش عارف أتحقق من صلاحياتك 😅');
      window.location.href = 'pages/login.html';
    }
  }

  // تحميل الجلسة الحالية
  async loadCurrentSession() {
    try {
      const { data: sessions, error } = await this.supabase
        .from('admin_sessions')
        .select('*')
        .eq('admin_id', this.currentUser.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        this.currentSession = sessions[0];
        this.isInVisitorMode = true;
        this.visitorRole = this.currentSession.visitor_role;
        this.visitorStoreId = this.currentSession.store_id;
        console.log('تم العثور على جلسة زائر نشطة');
      }

    } catch (error) {
      console.error('خطأ في تحميل الجلسة الحالية:', error);
    }
  }

  // تهيئة واجهة المستخدم
  initUI() {
    this.updateModeIndicator();
    this.updateUserInfo();
  }

  // تحديث مؤشر الوضع
  updateModeIndicator() {
    const adminModeIndicator = document.getElementById('adminModeIndicator');
    const visitorModeIndicator = document.getElementById('visitorModeIndicator');
    const visitorRoleSelect = document.getElementById('visitorRoleSelect');

    if (!adminModeIndicator || !visitorModeIndicator) return;

    if (this.isInVisitorMode) {
      adminModeIndicator.classList.add('hidden');
      visitorModeIndicator.classList.remove('hidden');
      
      if (visitorRoleSelect) {
        visitorRoleSelect.value = this.visitorRole || 'student';
      }
      
      // تحديث نص الوضع
      const visitorModeText = visitorModeIndicator.querySelector('p');
      if (visitorModeText) {
        visitorModeText.textContent = `أنت تتصفح الموقع كـ ${this.getRoleLabel(this.visitorRole)}`;
      }
      
    } else {
      adminModeIndicator.classList.remove('hidden');
      visitorModeIndicator.classList.add('hidden');
    }
  }

  // تحديث معلومات المستخدم
  updateUserInfo() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) {
      if (this.isInVisitorMode) {
        userName.textContent = `${this.getRoleLabel(this.visitorRole)} (وضع تجريبي)`;
      } else {
        userName.textContent = 'الأدمن';
      }
    }

    if (userAvatar) {
      userAvatar.src = this.currentUser?.user_metadata?.avatar_url || 'images/default-avatar.png';
    }
  }

  // تهيئة الأحداث
  initEventListeners() {
    // زر التبديل لوضع الزائر
    const switchToVisitorBtn = document.getElementById('switchToVisitorBtn');
    if (switchToVisitorBtn) {
      switchToVisitorBtn.addEventListener('click', () => this.switchToVisitorMode());
    }

    // زر العودة لوضع الأدمن
    const switchToAdminBtn = document.getElementById('switchToAdminBtn');
    if (switchToAdminBtn) {
      switchToAdminBtn.addEventListener('click', () => this.switchToAdminMode());
    }

    // تغيير دور الزائر
    const visitorRoleSelect = document.getElementById('visitorRoleSelect');
    if (visitorRoleSelect) {
      visitorRoleSelect.addEventListener('change', (e) => {
        this.visitorRole = e.target.value;
        this.updateModeIndicator();
      });
    }
  }

  // التبديل لوضع الزائر
  async switchToVisitorMode() {
    try {
      const visitorRole = document.getElementById('visitorRoleSelect')?.value || 'student';
      
      // إنشاء جلسة زائر جديدة
      const { data: session, error } = await this.supabase
        .from('admin_sessions')
        .insert({
          admin_id: this.currentUser.id,
          visitor_role: visitorRole,
          store_id: null, // يمكن تحديد متجر معين لاحقاً
          session_data: {
            original_user_type: 'admin',
            switched_at: new Date().toISOString(),
            browser_info: navigator.userAgent
          },
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      this.currentSession = session;
      this.isInVisitorMode = true;
      this.visitorRole = visitorRole;

      this.updateModeIndicator();
      this.updateUserInfo();
      this.logAdminActivity('switch_to_visitor', 'session', session.id, { role: visitorRole });

      this.showSuccessMessage(`تم التبديل لوضع ${this.getRoleLabel(visitorRole)} بنجاح`);

      // إعادة تحميل الصفحة لتطبيق الوضع الجديد
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('خطأ في التبديل لوضع الزائر:', error);
      this.showErrorMessage('مش عارف أبدل لوضع الزائر 😅');
    }
  }

  // العودة لوضع الأدمن
  async switchToAdminMode() {
    try {
      if (!this.currentSession) {
        this.isInVisitorMode = false;
        this.visitorRole = null;
        this.visitorStoreId = null;
        this.updateModeIndicator();
        this.updateUserInfo();
        return;
      }

      // إنهاء الجلسة الحالية
      const { error } = await this.supabase
        .from('admin_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', this.currentSession.id);

      if (error) throw error;

      this.logAdminActivity('switch_to_admin', 'session', this.currentSession.id, {
        visitor_role: this.visitorRole,
        session_duration: this.getSessionDuration()
      });

      this.currentSession = null;
      this.isInVisitorMode = false;
      this.visitorRole = null;
      this.visitorStoreId = null;

      this.updateModeIndicator();
      this.updateUserInfo();
      this.showSuccessMessage('تم العودة لوضع الأدمن بنجاح');

      // إعادة تحميل الصفحة لتطبيق الوضع الجديد
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('خطأ في العودة لوضع الأدمن:', error);
      this.showErrorMessage('مش عارف أرجع لوضع الأدمن 😅');
    }
  }

  // الحصول على مدة الجلسة
  getSessionDuration() {
    if (!this.currentSession?.started_at) return 0;
    
    const startTime = new Date(this.currentSession.started_at);
    const endTime = new Date();
    return Math.round((endTime - startTime) / 1000); // بالثواني
  }

  // الحصول على نص الدور
  getRoleLabel(role) {
    const labels = {
      'student': 'طالب',
      'doctor': 'دكتور',
      'freelancer': 'فريلانسر',
      'admin': 'أدمن',
      'owner': 'مالك'
    };
    return labels[role] || role;
  }

  // التحقق من الوضع الحالي
  isVisitorMode() {
    return this.isInVisitorMode;
  }

  // الحصول على دور الزائر
  getVisitorRole() {
    return this.visitorRole;
  }

  // الحصول على معرف المتجر
  getVisitorStoreId() {
    return this.visitorStoreId;
  }

  // تعيين متجر للزائر
  async setVisitorStore(storeId) {
    try {
      if (!this.currentSession) return;

      const { error } = await this.supabase
        .from('admin_sessions')
        .update({
          store_id: storeId
        })
        .eq('id', this.currentSession.id);

      if (error) throw error;

      this.visitorStoreId = storeId;
      this.currentSession.store_id = storeId;

      this.logAdminActivity('set_visitor_store', 'session', this.currentSession.id, { store_id: storeId });

    } catch (error) {
      console.error('خطأ في تعيين متجر للزائر:', error);
    }
  }

  // تسجيل نشاط الأدمن
  async logAdminActivity(action, targetType, targetId, details = {}) {
    try {
      await this.supabase
        .from('admin_activity')
        .insert({
          admin_id: this.currentUser.id,
          action,
          target_type: targetType,
          target_id: targetId,
          details: {
            ...details,
            visitor_mode: this.isInVisitorMode,
            visitor_role: this.visitorRole,
            visitor_store_id: this.visitorStoreId
          },
          ip_address: null,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('خطأ في تسجيل نشاط الأدمن:', error);
    }
  }

  // الحصول على بيانات المستخدم الحالي
  getCurrentUserData() {
    if (this.isInVisitorMode) {
      return {
        id: this.currentUser.id,
        email: this.currentUser.email,
        user_type: this.visitorRole,
        is_visitor_mode: true,
        original_user_type: 'admin',
        store_id: this.visitorStoreId
      };
    } else {
      return {
        id: this.currentUser.id,
        email: this.currentUser.email,
        user_type: 'admin',
        is_visitor_mode: false
      };
    }
  }

  // تطبيق قيود الزائر على الواجهة
  applyVisitorRestrictions() {
    if (!this.isInVisitorMode) return;

    // إخفاء أزرار الأدمن
    const adminButtons = document.querySelectorAll('[data-admin-only]');
    adminButtons.forEach(btn => {
      btn.style.display = 'none';
    });

    // إضافة مؤشر وضع الزائر
    this.addVisitorModeIndicator();
  }

  // إضافة مؤشر وضع الزائر
  addVisitorModeIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'fixed top-4 left-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg';
    indicator.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-user text-sm ml-2"></i>
        <span class="text-sm">وضع ${this.getRoleLabel(this.visitorRole)}</span>
      </div>
    `;
    document.body.appendChild(indicator);

    // إزالة المؤشر بعد 5 ثواني
    setTimeout(() => {
      if (indicator.parentElement) {
        indicator.remove();
      }
    }, 5000);
  }

  // دوال مساعدة للرسائل
  showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 3000);
  }

  showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentElement) {
        messageDiv.remove();
      }
    }, 3000);
  }

  // تنظيف الموارد
  cleanup() {
    // تنظيف أي موارد مطلوبة
  }
}

// تهيئة نظام تبديل الأدوار
let adminRoleSwitcher;

document.addEventListener('DOMContentLoaded', () => {
  adminRoleSwitcher = new AdminRoleSwitcher();
});

// تصدير للاستخدام في الملفات الأخرى
window.AdminRoleSwitcher = AdminRoleSwitcher; 