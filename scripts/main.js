// التطبيق الرئيسي - Main Application
import { getSupabaseClient } from './supabase-config.js';
import './auth.js'; // Ensure AuthManager is loaded and initialized

class MASHROU3YApp {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentPage = null;
    this.isInitialized = false;
    this.modules = {
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

      // The AuthManager is now the single source of truth and initializes itself.
      // We just need to wait for it to be ready.
      await this.waitForAuthManager();

      // تهيئة الواجهة
      this.initUI();

      // تهيئة التنقل
      this.initNavigation();

      // تهيئة الوحدات حسب الصفحة
      await this.initPageModules();

      // بدء التحديثات المباشرة
      this.startRealtimeUpdates();

      this.isInitialized = true;
      console.log('✅ تم تشغيل MASHROU3Y بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تشغيل التطبيق:', error);
      this.showErrorMessage('مش عارف أشغل التطبيق، جرب تاني 😅');
    }
  }

  async waitForAuthManager() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (window.authManager && window.authManager.currentUser) {
                clearInterval(interval);
                resolve();
            } else if (window.authManager) {
                // If authManager is there but user is null (not logged in)
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });
  }

  // تهيئة الواجهة
  initUI() {
    this.addLoadingIndicator();
    this.initDarkMode();
    this.initArabicFonts();
    this.initSmoothScrolling();
    this.initIcons();
    console.log('✅ تم تهيئة الواجهة');
  }

  addLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'appLoader';
    loader.className = 'fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50';
    loader.innerHTML = `<div class="text-center"><div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div><h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">MASHROU3Y</h2><p class="text-gray-600 dark:text-gray-400">جاري التحميل...</p></div>`;
    document.body.appendChild(loader);
    setTimeout(() => {
      const loader = document.getElementById('appLoader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
      }
    }, 1000);
  }

  initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        const isDarkNow = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDarkNow);
      });
    }
  }

  initArabicFonts() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    document.documentElement.style.fontFamily = 'Cairo, sans-serif';
  }

  initSmoothScrolling() {
    const style = document.createElement('style');
    style.textContent = `html { scroll-behavior: smooth; }`;
    document.head.appendChild(style);
  }

  initIcons() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  initNavigation() {
    this.currentPage = this.getCurrentPage();
    this.addNavigationListeners();
    console.log('✅ تم تهيئة التنقل');
  }

  getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  addNavigationListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.authManager.logout();
      });
    }
  }

  navigateTo(page) {
    if (page === this.currentPage) return;
    window.location.href = page;
  }

  async initPageModules() {
    // Page-specific module loading can still happen here if needed
  }

  startRealtimeUpdates() {
    // The main onAuthStateChange is now in auth.js, which is the single source of truth.
    // We can listen for the custom events it dispatches.
    window.addEventListener('userSignedIn', (e) => {
        console.log('Main app caught userSignedIn event', e.detail);
        this.updateUserInterface(e.detail);
    });
    window.addEventListener('userSignedOut', () => {
        console.log('Main app caught userSignedOut event');
        this.updateUserInterface(null);
    });
  }

  updateUserInterface(user) {
    const isLoggedIn = !!user;
    const authElements = document.querySelectorAll('[data-auth-required]');
    const guestElements = document.querySelectorAll('[data-guest-only]');

    authElements.forEach(element => {
      element.style.display = isLoggedIn ? 'block' : 'none';
    });

    guestElements.forEach(element => {
      element.style.display = isLoggedIn ? 'none' : 'block';
    });

    if (isLoggedIn) {
        // Update user-specific elements like name, avatar etc.
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(element => {
          element.textContent = user.user_metadata.full_name || 'مستخدم';
        });
    }
  }

  showMessage(message, type = 'info') {
    // This can be centralized further, but for now, we assume this is the main message handler
    const messageElement = document.createElement('div');
    messageElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    const typeClasses = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    };
    messageElement.classList.add(typeClasses[type] || typeClasses.info);
    messageElement.innerHTML = `<div class="flex items-center space-x-3 space-x-reverse"><i class="fas fa-${type === 'success' ? 'check' : 'times'}"></i><span>${message}</span><button onclick="this.parentElement.parentElement.remove()" class="mr-auto"><i class="fas fa-times"></i></button></div>`;
    document.body.appendChild(messageElement);
    setTimeout(() => messageElement.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      messageElement.classList.add('translate-x-full');
      setTimeout(() => { if (messageElement.parentElement) messageElement.remove(); }, 300);
    }, 5000);
  }

  showErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'fixed inset-0 bg-red-500 text-white flex items-center justify-center z-50';
    errorContainer.innerHTML = `<div class="text-center p-8"><i class="fas fa-exclamation-triangle text-6xl mb-4"></i><h2 class="text-2xl font-bold mb-4">خطأ في التطبيق</h2><p class="mb-4">${message}</p><button onclick="location.reload()" class="bg-white text-red-500 px-6 py-2 rounded-lg hover:bg-gray-100">إعادة تحميل الصفحة</button></div>`;
    document.body.appendChild(errorContainer);
  }
}

// Initialize the main app
const app = new MASHROU3YApp();
window.app = app;
