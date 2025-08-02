// نظام إدارة تفاصيل المتجر
// Store Details Management System

class StoreDetailsManager {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.storeId = null;
    this.store = null;
    this.products = {
      materials: [],
      projects: [],
      presentations: []
    };
    this.filteredProducts = {
      materials: [],
      projects: [],
      presentations: []
    };
    this.currentTab = 'materials';
    this.searchTerm = '';
    this.isInitialized = false;
    this.init();
  }

  // تهيئة النظام
  async init() {
    try {
      console.log('🚀 بدء تشغيل نظام تفاصيل المتجر...');
      
      // الحصول على معرف المتجر من URL
      this.storeId = this.getStoreIdFromUrl();
      if (!this.storeId) {
        this.showErrorMessage('معرف المتجر غير صحيح');
        return;
      }
      
      // التحقق من تسجيل الدخول
      await this.checkAuth();
      
      // تحميل تفاصيل المتجر
      await this.loadStoreDetails();
      
      // تحميل المنتجات
      await this.loadProducts(this.currentTab);
      
      // تهيئة واجهة المستخدم
      this.initUI();
      
      this.isInitialized = true;
      console.log('✅ تم تشغيل نظام تفاصيل المتجر بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل نظام تفاصيل المتجر:', error);
      this.showErrorMessage('مش عارف أشغل نظام تفاصيل المتجر، جرب تاني 😅');
    }
  }

  // الحصول على معرف المتجر من URL
  getStoreIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
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

    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      this.showErrorMessage('مش عارف أتحقق من تسجيل دخولك 😅');
      window.location.href = 'login.html';
    }
  }

  // تحميل تفاصيل المتجر
  async loadStoreDetails() {
    try {
      this.showLoading();

      const { data: store, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('id', this.storeId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      this.store = store;
      this.updateStoreInfo();
      this.loadStoreStats();

    } catch (error) {
      console.error('خطأ في تحميل تفاصيل المتجر:', error);
      this.showErrorMessage('مش عارف أحمل تفاصيل المتجر 😅');
      this.showError();
    }
  }

  // تحديث معلومات المتجر
  updateStoreInfo() {
    if (!this.store) return;

    const storeName = document.getElementById('storeName');
    const storeTitle = document.getElementById('storeTitle');
    const storeCategory = document.getElementById('storeCategory');
    const storeDescription = document.getElementById('storeDescription');
    const storeCreatedAt = document.getElementById('storeCreatedAt');

    if (storeName) storeName.textContent = this.store.name;
    if (storeTitle) storeTitle.textContent = this.store.name;
    if (storeCategory) storeCategory.textContent = this.store.category;
    if (storeDescription) storeDescription.textContent = this.store.description || 'لا يوجد وصف متاح';
    if (storeCreatedAt) storeCreatedAt.textContent = this.formatDate(this.store.created_at);
  }

  // تحميل إحصائيات المتجر
  async loadStoreStats() {
    try {
      const stats = await this.getStoreStats(this.storeId);
      
      const materialsCount = document.getElementById('materialsCount');
      const projectsCount = document.getElementById('projectsCount');
      const presentationsCount = document.getElementById('presentationsCount');
      const totalProducts = document.getElementById('totalProducts');

      if (materialsCount) materialsCount.textContent = stats.materials;
      if (projectsCount) projectsCount.textContent = stats.projects;
      if (presentationsCount) presentationsCount.textContent = stats.presentations;
      if (totalProducts) totalProducts.textContent = stats.total;

    } catch (error) {
      console.error('خطأ في تحميل إحصائيات المتجر:', error);
    }
  }

  // تحميل المنتجات
  async loadProducts(productType) {
    try {
      this.showLoading();

      let query;
      let tableName;

      switch (productType) {
        case 'materials':
          tableName = 'materials';
          break;
        case 'projects':
          tableName = 'projects';
          break;
        case 'presentations':
          tableName = 'presentations';
          break;
        default:
          throw new Error('نوع المنتج غير صحيح');
      }

      const { data: products, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('store_id', this.storeId)
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.products[productType] = products || [];
      this.filteredProducts[productType] = [...this.products[productType]];
      this.renderProducts(productType);
      this.hideLoading();

    } catch (error) {
      console.error(`خطأ في تحميل ${productType}:`, error);
      this.showErrorMessage(`مش عارف أحمل ${this.getProductTypeLabel(productType)} 😅`);
      this.showError();
    }
  }

  // عرض المنتجات
  renderProducts(productType) {
    const gridElement = document.getElementById(`${productType}Grid`);
    const emptyState = document.getElementById('emptyState');

    if (!gridElement) return;

    if (this.filteredProducts[productType].length === 0) {
      gridElement.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    gridElement.classList.remove('hidden');
    emptyState.classList.add('hidden');

    gridElement.innerHTML = this.filteredProducts[productType].map(product => `
      <div class="product-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer" onclick="storeDetailsManager.openProduct('${productType}', '${product.id}')">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3 space-x-reverse">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="${this.getProductIcon(productType)} text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">${product.title || product.name}</h3>
                <p class="text-sm text-gray-500">${product.subject || product.category}</p>
              </div>
            </div>
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              ${this.getProductTypeLabel(productType)}
            </span>
          </div>
          
          <p class="text-gray-600 text-sm mb-4 line-clamp-2">
            ${product.description || 'لا يوجد وصف متاح'}
          </p>
          
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div class="flex items-center space-x-2 space-x-reverse">
              <i class="fas fa-calendar"></i>
              <span>${this.formatDate(product.created_at)}</span>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
              <i class="fas fa-eye"></i>
              <span>عرض التفاصيل</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // فتح منتج
  openProduct(productType, productId) {
    try {
      // الانتقال لصفحة تفاصيل المنتج
      window.location.href = `product-details.html?type=${productType}&id=${productId}`;
      
    } catch (error) {
      console.error('خطأ في فتح المنتج:', error);
      this.showErrorMessage('مش عارف أفتح المنتج 😅');
    }
  }

  // فلترة المنتجات
  filterProducts(searchTerm) {
    this.searchTerm = searchTerm.toLowerCase();
    
    Object.keys(this.products).forEach(productType => {
      this.filteredProducts[productType] = this.products[productType].filter(product => {
        const title = (product.title || product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const subject = (product.subject || product.category || '').toLowerCase();
        
        return title.includes(this.searchTerm) || 
               description.includes(this.searchTerm) || 
               subject.includes(this.searchTerm);
      });
      
      this.renderProducts(productType);
    });
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
      userAvatar.src = this.currentUser?.user_metadata?.avatar_url || 'default-avatar.png';
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

  // دوال مساعدة
  getProductTypeLabel(type) {
    const labels = {
      'materials': 'مادة دراسية',
      'projects': 'مشروع',
      'presentations': 'عرض تقديمي'
    };
    return labels[type] || type;
  }

  getProductIcon(type) {
    const icons = {
      'materials': 'fas fa-book',
      'projects': 'fas fa-code',
      'presentations': 'fas fa-presentation'
    };
    return icons[type] || 'fas fa-file';
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }

  showLoading() {
    const loadingState = document.getElementById('loadingState');
    const storeInfo = document.getElementById('storeInfo');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');

    if (loadingState) loadingState.classList.remove('hidden');
    if (storeInfo) storeInfo.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
  }

  hideLoading() {
    const loadingState = document.getElementById('loadingState');
    const storeInfo = document.getElementById('storeInfo');

    if (loadingState) loadingState.classList.add('hidden');
    if (storeInfo) storeInfo.classList.remove('hidden');
  }

  showError() {
    const errorState = document.getElementById('errorState');
    const loadingState = document.getElementById('loadingState');
    const storeInfo = document.getElementById('storeInfo');
    const emptyState = document.getElementById('emptyState');

    if (errorState) errorState.classList.remove('hidden');
    if (loadingState) loadingState.classList.add('hidden');
    if (storeInfo) storeInfo.classList.add('hidden');
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

// تهيئة نظام تفاصيل المتجر
let storeDetailsManager;

document.addEventListener('DOMContentLoaded', () => {
  storeDetailsManager = new StoreDetailsManager();
});

// تصدير للاستخدام في الملفات الأخرى
window.StoreDetailsManager = StoreDetailsManager; 