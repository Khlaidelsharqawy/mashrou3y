// استيراد تكوين Supabase
import { getSupabaseClient } from './supabase-config.js';

// الحصول على عميل Supabase
const supabase = getSupabaseClient();

// إعدادات الأمان
const AUTH_CONFIG = {
  sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 دقيقة
  passwordMinLength: 6,
  requireEmailConfirmation: true
};

// إدارة المصادقة
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.loginAttempts = 0;
    this.lockoutUntil = null;
    this.protectedRoutes = [
      'dashboard.html',
      'upload.html',
      'profile.html',
      'materials.html',
      'projects.html',
      'presentations.html',
      'store.html',
      'payment.html',
      'chat.html',
      'owner-diagnostics.html'
    ];
    this.init();
  }

  // تهيئة المدير
  async init() {
    try {
      // التحقق من الجلسة الحالية
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.session = session;
        this.currentUser = session.user;
        this.startSessionMonitoring();
      }

      // الاستماع لتغييرات المصادقة
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN') {
          await this.handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        } else if (event === 'TOKEN_REFRESHED') {
          this.handleTokenRefresh(session);
        }
      });

      // Protect the current page on load
      this.protectCurrentPage();

    } catch (error) {
      console.error('Auth manager init error:', error);
    }
  }

  // معالجة تسجيل الدخول
  async handleSignIn(session) {
    this.session = session;
    this.currentUser = session.user;
    this.loginAttempts = 0;
    this.lockoutUntil = null;
    this.startSessionMonitoring();
    
    localStorage.setItem('user', JSON.stringify(session.user));
    localStorage.setItem('session', JSON.stringify(session));
    
    await this.handleRedirect();

    window.dispatchEvent(new CustomEvent('userSignedIn', { detail: session.user }));
  }

  getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  async protectCurrentPage() {
    const currentPage = this.getCurrentPage();
    if (this.protectedRoutes.includes(currentPage)) {
      if (!this.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
      }
      const userProfile = await this.getUserProfile();
      if (userProfile && !userProfile.is_approved) {
        this.redirectToWaitingApproval();
        return;
      }
    }
  }

  async handleRedirect() {
    const userProfile = await this.getUserProfile();
    if (userProfile && !userProfile.is_approved) {
        this.redirectToWaitingApproval();
    } else {
        // Redirect to dashboard only if not already there or on a non-protected page
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'dashboard.html' && !this.protectedRoutes.includes(currentPage)) {
             this.redirectToDashboard();
        }
    }
  }

  redirectToDashboard() {
    window.location.href = 'dashboard.html';
  }

  redirectToWaitingApproval() {
    window.location.href = 'waiting-approval.html';
  }

  // معالجة تسجيل الخروج
  handleSignOut() {
    this.session = null;
    this.currentUser = null;
    this.stopSessionMonitoring();
    
    // مسح البيانات من localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    
    // إرسال حدث تسجيل الخروج
    window.dispatchEvent(new CustomEvent('userSignedOut'));
  }

  // معالجة تحديث التوكن
  handleTokenRefresh(session) {
    this.session = session;
    localStorage.setItem('session', JSON.stringify(session));
  }

  // بدء مراقبة الجلسة
  startSessionMonitoring() {
    this.sessionTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000); // فحص كل دقيقة
  }

  // إيقاف مراقبة الجلسة
  stopSessionMonitoring() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  // فحص انتهاء صلاحية الجلسة
  checkSessionTimeout() {
    if (!this.session) return;

    const now = Date.now();
    const sessionStart = this.session.created_at;
    const sessionAge = now - new Date(sessionStart).getTime();

    if (sessionAge > AUTH_CONFIG.sessionTimeout) {
      this.logout('انتهت صلاحية الجلسة');
    }
  }

  // تسجيل الدخول
  async signIn(email, password, rememberMe = false) {
    try {
      // التحقق من الحظر
      if (this.isLockedOut()) {
        throw new Error('حسابك محظور مؤقتاً، جرب تاني بعد شوية');
      }

      // التحقق من عدد المحاولات
      if (this.loginAttempts >= AUTH_CONFIG.maxLoginAttempts) {
        this.lockoutAccount();
        throw new Error('كترت المحاولات، حسابك محظور مؤقتاً');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.loginAttempts++;
        throw error;
      }

      // إعداد استمرارية الجلسة
      if (rememberMe) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      return { success: true, user: data.user };

    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // تسجيل الدخول بجوجل
  async signInWithGoogle(redirectTo = null) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || window.location.origin + '/dashboard.html'
        }
      });

      if (error) throw error;
      return { success: true, data };

    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // إنشاء حساب جديد
  async signUp(userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            user_type: userData.userType,
            phone: userData.phone || null,
            university: userData.university || null,
            faculty: userData.faculty || null,
            specialization: userData.specialization || null
          }
        }
      });

      if (error) throw error;

      // إنشاء ملف المستخدم في قاعدة البيانات
      if (data.user) {
        await this.createUserProfile(data.user, userData);
      }

      return { success: true, user: data.user };

    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  // إنشاء ملف المستخدم
  async createUserProfile(user, userData) {
    try {
      const { error } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        full_name: userData.fullName,
        user_type: userData.userType,
        phone: userData.phone || null,
        university: userData.university || null,
        faculty: userData.faculty || null,
        specialization: userData.specialization || null,
        is_approved: userData.userType === 'طالب' ? true : false,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Create user profile error:', error);
      }
    } catch (error) {
      console.error('Create user profile error:', error);
    }
  }

  // تسجيل الخروج
  async logout(reason = 'تم تسجيل الخروج') {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.handleSignOut();
      
      // إظهار رسالة السبب
      if (reason) {
        this.showMessage(reason, 'info');
      }

      return { success: true };

    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // إعادة تعيين كلمة المرور
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      });

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  }

  // تحديث كلمة المرور
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, user: data.user };

    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  }

  // تحديث بيانات المستخدم
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      // تحديث البيانات في قاعدة البيانات
      if (data.user) {
        await this.updateUserProfile(data.user.id, updates);
      }

      return { success: true, user: data.user };

    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // تحديث ملف المستخدم في قاعدة البيانات
  async updateUserProfile(userId, updates) {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Update user profile error:', error);
      }
    } catch (error) {
      console.error('Update user profile error:', error);
    }
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
    return this.currentUser.user_metadata?.user_type === role;
  }

  // التحقق من الحظر
  isLockedOut() {
    if (!this.lockoutUntil) return false;
    return Date.now() < this.lockoutUntil;
  }

  // حظر الحساب
  lockoutAccount() {
    this.lockoutUntil = Date.now() + AUTH_CONFIG.lockoutDuration;
    localStorage.setItem('lockoutUntil', this.lockoutUntil.toString());
  }

  // التحقق من صحة كلمة المرور
  validatePassword(password) {
    const errors = [];

    if (password.length < AUTH_CONFIG.passwordMinLength) {
      errors.push(`كلمة المرور قصيرة، لازم تكون ${AUTH_CONFIG.passwordMinLength} أحرف على الأقل`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('كلمة المرور محتاجة حروف صغيرة');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('كلمة المرور محتاجة حروف كبيرة');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('كلمة المرور محتاجة أرقام');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // التحقق من صحة الإيميل
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // إظهار رسالة
  showMessage(message, type = 'info') {
    // إرسال حدث لعرض الرسالة
    window.dispatchEvent(new CustomEvent('showMessage', {
      detail: { message, type }
    }));
  }

  // الحصول على بيانات المستخدم من قاعدة البيانات
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // تحديث حالة الموافقة
  async updateApprovalStatus(userId, isApproved) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_approved: isApproved,
          approved_at: isApproved ? new Date().toISOString() : null
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Update approval status error:', error);
      return { success: false, error: error.message };
    }
  }

  // حذف الحساب
  async deleteAccount() {
    try {
      const { error } = await supabase.auth.admin.deleteUser(this.currentUser.id);
      if (error) throw error;

      this.handleSignOut();
      return { success: true };

    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message };
    }
  }
}

// إنشاء مدير المصادقة
const authManager = new AuthManager();

// تصدير الدوال للاستخدام في الملفات الأخرى
window.AuthManager = {
  signIn: (email, password, rememberMe) => authManager.signIn(email, password, rememberMe),
  signInWithGoogle: (redirectTo) => authManager.signInWithGoogle(redirectTo),
  signUp: (userData) => authManager.signUp(userData),
  logout: (reason) => authManager.logout(reason),
  resetPassword: (email) => authManager.resetPassword(email),
  updatePassword: (newPassword) => authManager.updatePassword(newPassword),
  updateProfile: (updates) => authManager.updateProfile(updates),
  getCurrentUser: () => authManager.getCurrentUser(),
  isAuthenticated: () => authManager.isAuthenticated(),
  hasRole: (role) => authManager.hasRole(role),
  validatePassword: (password) => authManager.validatePassword(password),
  validateEmail: (email) => authManager.validateEmail(email),
  getUserProfile: (userId) => authManager.getUserProfile(userId),
  updateApprovalStatus: (userId, isApproved) => authManager.updateApprovalStatus(userId, isApproved),
  deleteAccount: () => authManager.deleteAccount()
};

// تصدير المدير نفسه للاستخدام المتقدم
window.authManager = authManager;
