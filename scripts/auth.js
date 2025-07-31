// استيراد تكوين Supabase
import { getSupabaseClient } from './supabase-config.js';

// الحصول على عميل Supabase
const supabase = getSupabaseClient();

// إعدادات الأمان
const AUTH_CONFIG = {
  sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 دقيقة
  passwordMinLength: 8,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.session = session;
        this.currentUser = session.user;
        this.startSessionMonitoring();
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') {
          await this.handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        } else if (event === 'TOKEN_REFRESHED') {
          this.handleTokenRefresh(session);
        }
      });

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
    if (!userProfile) {
        // This can happen for a new user, redirect to profile to create the entry.
        window.location.href = 'profile.html';
        return;
    }
    if (!userProfile.profile_completed) {
        window.location.href = 'profile.html';
        return;
    }
    if (!userProfile.is_approved) {
        this.redirectToWaitingApproval();
        return;
    }

    const currentPage = this.getCurrentPage();
    if (currentPage !== 'dashboard.html' && !this.protectedRoutes.includes(currentPage)) {
         this.redirectToDashboard();
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
    localStorage.removeItem('session');
    window.dispatchEvent(new CustomEvent('userSignedOut'));
  }

  handleTokenRefresh(session) {
    this.session = session;
    localStorage.setItem('session', JSON.stringify(session));
  }

  startSessionMonitoring() {
    // Session monitoring logic...
  }

  stopSessionMonitoring() {
    // Session monitoring logic...
  }

  // تسجيل الدخول
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // تسجيل الدخول بجوجل
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect to a blank page that closes itself,
          // allowing the original tab's onAuthStateChange to handle the redirect logic.
          redirectTo: window.location.origin + '/auth-callback.html'
        }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // إنشاء حساب جديد (العملية الموحدة)
  async signUp(userData) {
    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            user_type: userData.userType,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
          throw new Error("User was not created in Auth.");
      }

      // 2. Create the corresponding profile in the public 'users' table
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: authData.user.email,
        name: userData.fullName,
        user_type: userData.userType,
        is_approved: false, // Admin must approve all new users
        profile_completed: false, // User must complete their profile
        avatar_url: authData.user.user_metadata.avatar_url || null
      });

      if (dbError) {
        // If creating the DB profile fails, we should ideally delete the auth user
        // to avoid orphaned auth users. This is an advanced topic (transactions/cleanup).
        // For now, we'll just log the error.
        console.error('Failed to create user profile in DB:', dbError);
        throw new Error(`User created in Auth, but failed to create profile in DB. Please contact support. ${dbError.message}`);
      }

      return { success: true, user: authData.user };

    } catch (error) {
      console.error('Unified SignUp Error:', error);
      return { success: false, error: error.message };
    }
  }

  // ... (rest of the methods like logout, resetPassword, etc.)

  // إظهار رسالة
  showMessage(message, type = 'info') {
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

      if (error) {
          if (error.code === 'PGRST116') { // "Not a single row" error
              console.warn("User profile not found in DB for id:", targetUserId);
              return null;
          }
          throw error;
      };
      return data;

    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }
}

// إنشاء مدير المصادقة
const authManager = new AuthManager();
window.authManager = authManager;

// تصدير المدير نفسه (إذا كانت هناك وحدات أخرى تستورده)
export { authManager };
