// نظام إدارة المتاجر للزوار
// Stores Management for Visitors

class StoresManager {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.stores = [];
    this.filteredStores = [];
    this.filters = {
      search: '',
      category: 'all',
      type: 'all'
    };
    this.isInitialized = false;
    this.init();
  }

  // تهيئة النظام
  async init() {
    try {
      console.log('🚀 بدء تشغيل نظام إدارة المتاجر للزوار...');
      
      // التحقق من تسجيل الدخول
      await this.checkAuth();
      
      // تحميل المتاجر
      await this.loadStores();
      
      // تهيئة واجهة المستخدم
      this.initUI();
      
      this.isInitialized = true;
      console.log('✅ تم تشغيل نظام إدارة المتاجر للزوار بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل نظام إدارة المتاجر للزوار:', error);
      this.showErrorMessage('مش عارف أشغل نظام المتاجر، جرب تاني 😅');
    }
  }

  // التحقق من تسجيل الدخول
  async checkAuth() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
        return;
      }

      this.currentUser = session.user;

      // التحقق من وجود ملف المستخدم
      const { data: userProfile, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error || !userProfile) {
        // إنشاء ملف مستخدم جديد إذا لم يكن موجوداً
        await this.createUserProfile(session.user);
      }

    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      this.showErrorMessage('مش عارف أتحقق من تسجيل دخولك 😅');
      window.location.href = 'login.html';
    }
  }

  // إنشاء ملف مستخدم جديد
  async createUserProfile(user) {
    try {
      const { error } = await this.supabase
        .from('users')
        .insert({
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          user_type: 'student',
          is_approved: false,
          profile_completed: false
        });

      if (error) throw error;

    } catch (error) {
      console.error('خطأ في إنشاء ملف المستخدم:', error);
    }
  }

  // تحميل المتاجر
  async loadStores() {
    try {
      this.showLoading();

      const { data: stores, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.stores = stores || [];
      this.filteredStores = [...this.stores];
      this.renderStores();
      this.hideLoading();
      
    } catch (error) {
      console.error('خطأ في تحميل المتاجر:', error);
      this.showErrorMessage('مش عارف أحمل المتاجر 😅');
      this.showError();
    }
  }

  // تهيئة واجهة المستخدم
  initUI() {
    this.updateUserInfo();
    this.updateVisitorModeIndicator();
  }

  // تحديث معلومات المستخدم
  updateUserInfo() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) {
      if (window.adminRoleSwitcher && window.adminRoleSwitcher.isVisitorMode()) {
        const role = window.adminRoleSwitcher.getVisitorRole();
        userName.textContent = `${window.adminRoleSwitcher.getRoleLabel(role)} (وضع تجريبي)`;
      } else {
        userName.textContent = this.currentUser?.user_metadata?.full_name || this.currentUser?.email || 'زائر';
      }
    }

    if (userAvatar) {
      userAvatar.src = this.currentUser?.user_metadata?.avatar_url || '../images/default-avatar.png';
    }
  }

  // تحديث مؤشر وضع الزائر
  updateVisitorModeIndicator() {
    const visitorModeIndicator = document.getElementById('visitorModeIndicator');
    const visitorRoleText = document.getElementById('visitorRoleText');

    if (window.adminRoleSwitcher && window.adminRoleSwitcher.isVisitorMode()) {
      if (visitorModeIndicator) {
        visitorModeIndicator.classList.remove('hidden');
      }
      if (visitorRoleText) {
        const role = window.adminRoleSwitcher.getVisitorRole();
        visitorRoleText.textContent = window.adminRoleSwitcher.getRoleLabel(role);
      }
    } else {
      if (visitorModeIndicator) {
        visitorModeIndicator.classList.add('hidden');
      }
    }
  }

  // عرض المتاجر
  renderStores() {
    const storesGrid = document.getElementById('storesGrid');
    const emptyState = document.getElementById('emptyState');

    if (!storesGrid) return;

    if (this.filteredStores.length === 0) {
      storesGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    storesGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    storesGrid.innerHTML = this.filteredStores.map(store => `
      <div class="store-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer" onclick="storesManager.openStore('${store.id}')">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3 space-x-reverse">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-store text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">${store.name}</h3>
                <p class="text-sm text-gray-500">${store.category}</p>
              </div>
            </div>
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              ${this.getStoreTypeLabel(store.type)}
            </span>
          </div>
          
          <p class="text-gray-600 text-sm mb-4 line-clamp-2">
            ${store.description || 'لا يوجد وصف متاح'}
          </p>
          
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div class="flex items-center space-x-2 space-x-reverse">
              <i class="fas fa-calendar"></i>
              <span>${this.formatDate(store.created_at)}</span>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
              <i class="fas fa-eye"></i>
              <span>تصفح المتجر</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // فتح متجر
  openStore(storeId) {
    try {
      // إذا كان الأدمن في وضع الزائر، قم بتعيين المتجر
      if (window.adminRoleSwitcher && window.adminRoleSwitcher.isVisitorMode()) {
        window.adminRoleSwitcher.setVisitorStore(storeId);
      }

      // الانتقال لصفحة المتجر
      window.location.href = `store-details.html?id=${storeId}`;
      
    } catch (error) {
      console.error('خطأ في فتح المتجر:', error);
      this.showErrorMessage('مش عارف أفتح المتجر 😅');
    }
  }

  // فلترة المتاجر حسب البحث
  filterStores(searchTerm) {
    this.filters.search = searchTerm.toLowerCase();
    this.applyFilters();
  }

  // فلترة حسب التخصص
  filterByCategory(category) {
    this.filters.category = category;
    this.applyFilters();
  }

  // فلترة حسب النوع
  filterByType(type) {
    this.filters.type = type;
    this.applyFilters();
  }

  // تطبيق الفلاتر
  applyFilters() {
    this.filteredStores = this.stores.filter(store => {
      // فلترة حسب البحث
      if (this.filters.search && this.filters.search !== '') {
        const searchMatch = store.name.toLowerCase().includes(this.filters.search) ||
                           store.description?.toLowerCase().includes(this.filters.search) ||
                           store.category.toLowerCase().includes(this.filters.search);
        if (!searchMatch) return false;
      }

      // فلترة حسب التخصص
      if (this.filters.category && this.filters.category !== 'all') {
        if (store.category !== this.filters.category) return false;
      }

      // فلترة حسب النوع
      if (this.filters.type && this.filters.type !== 'all') {
        if (store.type !== this.filters.type) return false;
      }

      return true;
    });

    this.renderStores();
  }

  // الحصول على إحصائيات المتجر
  async getStoreStats(storeId) {
    try {
      // إحصائيات المواد الدراسية
      const { data: materials } = await this.supabase
        .from('materials')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_approved', true)
        .eq('is_active', true);

      // إحصائيات المشاريع
      const { data: projects } = await this.supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_approved', true)
        .eq('is_active', true);

      // إحصائيات العروض التقديمية
      const { data: presentations } = await this.supabase
        .from('presentations')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_approved', true)
        .eq('is_active', true);

      return {
        materials: materials?.length || 0,
        projects: projects?.length || 0,
        presentations: presentations?.length || 0,
        total: (materials?.length || 0) + (projects?.length || 0) + (presentations?.length || 0)
      };

    } catch (error) {
      console.error('خطأ في الحصول على إحصائيات المتجر:', error);
      return { materials: 0, projects: 0, presentations: 0, total: 0 };
    }
  }

  // دوال مساعدة
  getStoreTypeLabel(type) {
    const labels = {
      'materials': 'مواد دراسية',
      'projects': 'مشاريع',
      'presentations': 'عروض تقديمية'
    };
    return labels[type] || type;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }

  showLoading() {
    const loadingState = document.getElementById('loadingState');
    const storesGrid = document.getElementById('storesGrid');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');

    if (loadingState) loadingState.classList.remove('hidden');
    if (storesGrid) storesGrid.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
  }

  hideLoading() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.classList.add('hidden');
  }

  showError() {
    const errorState = document.getElementById('errorState');
    const loadingState = document.getElementById('loadingState');
    const storesGrid = document.getElementById('storesGrid');
    const emptyState = document.getElementById('emptyState');

    if (errorState) errorState.classList.remove('hidden');
    if (loadingState) loadingState.classList.add('hidden');
    if (storesGrid) storesGrid.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
  }

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
}

// تهيئة نظام إدارة المتاجر
let storesManager;

document.addEventListener('DOMContentLoaded', () => {
  storesManager = new StoresManager();
});

// تصدير للاستخدام في الملفات الأخرى
window.StoresManager = StoresManager; 