// نظام المتجر المحسن - Enhanced Store System
import { getSupabaseClient } from './supabase-config.js';

class EnhancedStoreManager {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.stores = [];
    this.storeItems = [];
    this.filteredItems = [];
    this.cart = [];
    this.categories = ['materials', 'projects', 'presentations', 'other'];
    this.searchQuery = '';
    this.currentFilters = {
      category: '',
      store: '',
      location: '',
      priceRange: '',
      sortBy: 'newest'
    };
    this.isLoading = false;
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.viewMode = 'items'; // 'items' or 'stores'
    this.init();
  }

  // تهيئة نظام المتجر
  async init() {
    try {
      await this.getCurrentUser();
      await this.loadStores();
      await this.loadStoreItems();
      this.loadCartFromStorage();
      this.initEventListeners();
      this.renderStore();
      console.log('✅ تم تهيئة نظام المتجر المحسن بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام المتجر:', error);
      this.showMessage('مش عارف أشغل المتجر، جرب تاني 😅', 'error');
    }
  }

  // الحصول على المستخدم الحالي
  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
    } catch (error) {
      console.error('خطأ في الحصول على المستخدم:', error);
    }
  }

  // تحميل المتاجر
  async loadStores() {
    try {
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select(`
          *,
          owner:users!stores_owner_id_fkey(
            id,
            full_name,
            email,
            user_type
          )
        `)
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      this.stores = stores || [];
      this.renderStoreFilters();

    } catch (error) {
      console.error('خطأ في تحميل المتاجر:', error);
    }
  }

  // تحميل عناصر المتجر
  async loadStoreItems() {
    try {
      this.isLoading = true;
      this.updateLoadingState();

      let query = this.supabase
        .from('store_items')
        .select(`
          *,
          creator:users!store_items_creator_id_fkey(
            id,
            full_name,
            user_type,
            avatar_url
          ),
          store:stores!store_items_store_id_fkey(
            id,
            name,
            location,
            logo_url
          )
        `)
        .eq('is_approved', true)
        .eq('is_active', true);

      // تطبيق الفلاتر
      query = this.applyFilters(query);

      const { data: items, error } = await query;

      if (error) throw error;

      this.storeItems = items || [];
      this.filteredItems = [...this.storeItems];
      this.applySearch();
      this.renderItems();

    } catch (error) {
      console.error('خطأ في تحميل عناصر المتجر:', error);
      this.showMessage('مش عارف أحمل المنتجات، جرب تاني 😅', 'error');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  // تطبيق الفلاتر
  applyFilters(query) {
    // فلتر الفئة
    if (this.currentFilters.category) {
      query = query.eq('category', this.currentFilters.category);
    }

    // فلتر المتجر
    if (this.currentFilters.store) {
      query = query.eq('store_id', this.currentFilters.store);
    }

    // فلتر نطاق السعر
    if (this.currentFilters.priceRange) {
      const [min, max] = this.getPriceRange(this.currentFilters.priceRange);
      if (min !== null) {
        query = query.gte('price', min);
      }
      if (max !== null) {
        query = query.lte('price', max);
      }
    }

    // ترتيب النتائج
    switch (this.currentFilters.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('download_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
    }

    return query;
  }

  // الحصول على نطاق السعر
  getPriceRange(range) {
    switch (range) {
      case 'free':
        return [0, 0];
      case 'low':
        return [0, 50];
      case 'medium':
        return [50, 200];
      case 'high':
        return [200, null];
      default:
        return [null, null];
    }
  }

  // تطبيق البحث
  applySearch() {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.storeItems];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredItems = this.storeItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.creator?.full_name.toLowerCase().includes(query) ||
      item.store?.name.toLowerCase().includes(query) ||
      item.store?.location.toLowerCase().includes(query)
    );
  }

  // تهيئة مستمعي الأحداث
  initEventListeners() {
    // البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.applySearch();
        this.renderItems();
      });
    }

    // الفلاتر
    const filterSelects = document.querySelectorAll('[data-store-filter]');
    filterSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        this.currentFilters[e.target.dataset.storeFilter] = e.target.value;
        this.loadStoreItems();
      });
    });

    // الترتيب
    const sortSelect = document.getElementById('typeFilter');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentFilters.sortBy = e.target.value;
        this.loadStoreItems();
      });
    }

    // تبديل العرض
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', () => {
        this.toggleViewMode();
      });
    }

    // أزرار السلة
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-add-to-cart]')) {
        const itemId = e.target.dataset.addToCart;
        this.addToCart(itemId);
      }
      
      if (e.target.matches('[data-remove-from-cart]')) {
        const itemId = e.target.dataset.removeFromCart;
        this.removeFromCart(itemId);
      }
      
      if (e.target.matches('[data-view-item]')) {
        const itemId = e.target.dataset.viewItem;
        this.viewItem(itemId);
      }
      
      if (e.target.matches('[data-buy-now]')) {
        const itemId = e.target.dataset.buyNow;
        this.buyNow(itemId);
      }

      if (e.target.matches('[data-view-store]')) {
        const storeId = e.target.dataset.viewStore;
        this.viewStore(storeId);
      }
    });

    // أزرار التنقل
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.previousPage();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextPage();
      });
    }

    // زر تفريغ السلة
    const clearCartBtn = document.getElementById('clearCart');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        this.clearCart();
      });
    }

    // زر إتمام الشراء
    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.checkout();
      });
    }
  }

  // تبديل وضع العرض
  toggleViewMode() {
    this.viewMode = this.viewMode === 'items' ? 'stores' : 'items';
    this.currentPage = 1;
    this.renderStore();
  }

  // إضافة للسلة
  addToCart(itemId) {
    const item = this.storeItems.find(i => i.id === itemId);
    if (!item) return;

    const existingItem = this.cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        ...item,
        quantity: 1
      });
    }

    this.saveCartToStorage();
    this.renderCart();
    this.showMessage(`تم إضافة "${item.title}" للسلة 🛒`, 'success');
  }

  // إزالة من السلة
  removeFromCart(itemId) {
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.saveCartToStorage();
    this.renderCart();
    this.showMessage('تم إزالة العنصر من السلة 🗑️', 'success');
  }

  // تحديث كمية العنصر
  updateCartQuantity(itemId, quantity) {
    const item = this.cart.find(item => item.id === itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.saveCartToStorage();
        this.renderCart();
      }
    }
  }

  // تفريغ السلة
  clearCart() {
    if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
      this.cart = [];
      this.saveCartToStorage();
      this.renderCart();
      this.showMessage('تم تفريغ السلة 🗑️', 'success');
    }
  }

  // حفظ السلة في التخزين المحلي
  saveCartToStorage() {
    localStorage.setItem('storeCart', JSON.stringify(this.cart));
  }

  // تحميل السلة من التخزين المحلي
  loadCartFromStorage() {
    try {
      const savedCart = localStorage.getItem('storeCart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('خطأ في تحميل السلة:', error);
      this.cart = [];
    }
  }

  // عرض العنصر
  viewItem(itemId) {
    const item = this.storeItems.find(i => i.id === itemId);
    if (!item) return;

    // إنشاء نافذة منبثقة لعرض تفاصيل العنصر
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-900">${item.title}</h2>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              ${item.thumbnail_url ? `
                <img src="${item.thumbnail_url}" alt="${item.title}" class="w-full rounded-lg shadow-lg">
              ` : `
                <div class="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-4xl">
                  <i class="fas fa-file-alt"></i>
                </div>
              `}
            </div>
            
            <div>
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">الوصف</h3>
                <p class="text-gray-600">${item.description || 'لا يوجد وصف'}</p>
              </div>
              
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">التفاصيل</h3>
                <div class="space-y-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>المنشئ:</span>
                    <span>${item.creator?.full_name || 'غير معروف'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>المتجر:</span>
                    <span>${item.store?.name || 'متجر عام'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>الموقع:</span>
                    <span>${item.store?.location || 'غير محدد'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>الفئة:</span>
                    <span>${this.getCategoryLabel(item.category)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>التقييم:</span>
                    <span>${item.rating || 0}/5 ⭐</span>
                  </div>
                  <div class="flex justify-between">
                    <span>التحميلات:</span>
                    <span>${item.download_count || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>التاريخ:</span>
                    <span>${this.formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div class="mb-4">
                <div class="text-3xl font-bold text-blue-600 mb-2">
                  ${item.price === 0 ? 'مجاني' : `${item.price} ج.م`}
                </div>
              </div>
              
              <div class="flex space-x-3 space-x-reverse">
                <button onclick="storeManager.addToCart('${item.id}')" class="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                  <i class="fas fa-cart-plus ml-2"></i>إضافة للسلة
                </button>
                <button onclick="storeManager.buyNow('${item.id}')" class="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors">
                  <i class="fas fa-shopping-cart ml-2"></i>شراء الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // عرض المتجر
  viewStore(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return;

    // إنشاء نافذة منبثقة لعرض تفاصيل المتجر
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-900">${store.name}</h2>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              ${store.banner_url ? `
                <img src="${store.banner_url}" alt="${store.name}" class="w-full rounded-lg shadow-lg">
              ` : `
                <div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-4xl">
                  <i class="fas fa-store"></i>
                </div>
              `}
            </div>
            
            <div>
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">معلومات المتجر</h3>
                <p class="text-gray-600">${store.description || 'لا يوجد وصف'}</p>
              </div>
              
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">التفاصيل</h3>
                <div class="space-y-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>المالك:</span>
                    <span>${store.owner?.full_name || 'غير معروف'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>الموقع:</span>
                    <span>${store.location}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>التقييم:</span>
                    <span>${store.rating || 0}/5 ⭐</span>
                  </div>
                  <div class="flex justify-between">
                    <span>عدد التقييمات:</span>
                    <span>${store.review_count || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>إجمالي المبيعات:</span>
                    <span>${store.total_sales || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>تاريخ التسجيل:</span>
                    <span>${this.formatDate(store.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex space-x-3 space-x-reverse">
                <button onclick="storeManager.filterByStore('${store.id}')" class="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                  <i class="fas fa-eye ml-2"></i>عرض المنتجات
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // فلترة حسب المتجر
  filterByStore(storeId) {
    this.currentFilters.store = storeId;
    this.loadStoreItems();
    // إغلاق النافذة المنبثقة
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) modal.remove();
  }

  // شراء الآن
  async buyNow(itemId) {
    if (!this.currentUser) {
      this.showMessage('محتاج تسجل دخول الأول يا نجم 😅', 'warning');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    const item = this.storeItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      // إنشاء عملية شراء
      const { data: purchase, error } = await this.supabase
        .from('purchases')
        .insert({
          buyer_id: this.currentUser.id,
          item_id: itemId,
          price: item.price,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // توجيه لصفحة الدفع
      window.location.href = `payment.html?purchase_id=${purchase.id}`;

    } catch (error) {
      console.error('خطأ في إنشاء عملية الشراء:', error);
      this.showMessage('مش عارف أشتري المنتج، جرب تاني 😅', 'error');
    }
  }

  // إتمام الشراء
  async checkout() {
    if (!this.currentUser) {
      this.showMessage('محتاج تسجل دخول الأول يا نجم 😅', 'warning');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    if (this.cart.length === 0) {
      this.showMessage('السلة فاضية يا نجم 😅', 'warning');
      return;
    }

    try {
      const totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // إنشاء عملية شراء للسلعة
      const { data: purchase, error } = await this.supabase
        .from('purchases')
        .insert({
          buyer_id: this.currentUser.id,
          price: totalAmount,
          payment_status: 'pending',
          items: this.cart.map(item => ({
            item_id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        })
        .select()
        .single();

      if (error) throw error;

      // توجيه لصفحة الدفع
      window.location.href = `payment.html?purchase_id=${purchase.id}`;

    } catch (error) {
      console.error('خطأ في إتمام الشراء:', error);
      this.showMessage('مش عارف أكمل الشراء، جرب تاني 😅', 'error');
    }
  }

  // الصفحة السابقة
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderItems();
    }
  }

  // الصفحة التالية
  nextPage() {
    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderItems();
    }
  }

  // تحديث حالة التحميل
  updateLoadingState() {
    const loadingElement = document.getElementById('storeLoading');
    if (loadingElement) {
      loadingElement.classList.toggle('hidden', !this.isLoading);
    }
  }

  // عرض المتجر
  renderStore() {
    this.renderStoreFilters();
    if (this.viewMode === 'stores') {
      this.renderStores();
    } else {
      this.renderItems();
    }
    this.renderCart();
  }

  // عرض فلاتر المتجر
  renderStoreFilters() {
    const container = document.getElementById('storeFilters');
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-wrap gap-4 items-center">
        <button id="viewToggle" class="px-4 py-2 rounded-lg ${this.viewMode === 'items' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}">
          <i class="fas fa-${this.viewMode === 'items' ? 'list' : 'store'} ml-2"></i>
          ${this.viewMode === 'items' ? 'عرض المنتجات' : 'عرض المتاجر'}
        </button>
        
        ${this.viewMode === 'items' ? `
          <select data-store-filter="category" class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">جميع الفئات</option>
            <option value="materials">المواد الدراسية</option>
            <option value="projects">المشاريع</option>
            <option value="presentations">العروض التقديمية</option>
            <option value="other">أخرى</option>
          </select>
          
          <select data-store-filter="store" class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">جميع المتاجر</option>
            ${this.stores.map(store => `
              <option value="${store.id}">${store.name} - ${store.location}</option>
            `).join('')}
          </select>
          
          <select data-store-filter="priceRange" class="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">جميع الأسعار</option>
            <option value="free">مجاني</option>
            <option value="low">منخفض (0-50 ج.م)</option>
            <option value="medium">متوسط (50-200 ج.م)</option>
            <option value="high">عالي (200+ ج.م)</option>
          </select>
        ` : ''}
      </div>
    `;
  }

  // عرض المتاجر
  renderStores() {
    const container = document.getElementById('storeList');
    if (!container) return;

    if (this.stores.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-store text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">لا توجد متاجر متاحة 😅</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.stores.map(store => `
      <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer" onclick="storeManager.viewStore('${store.id}')">
        <div class="relative">
          ${store.banner_url ? `
            <img src="${store.banner_url}" alt="${store.name}" class="w-full h-48 object-cover rounded-t-lg">
          ` : `
            <div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center text-white text-4xl">
              <i class="fas fa-store"></i>
            </div>
          `}
          
          <div class="absolute top-2 right-2">
            <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              ${store.location}
            </span>
          </div>
        </div>
        
        <div class="p-4">
          <div class="flex items-center space-x-3 space-x-reverse mb-3">
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              ${store.logo_url ? 
                `<img src="${store.logo_url}" class="w-full h-full object-cover rounded-lg">` : 
                `<i class="fas fa-store text-gray-400 text-xl"></i>`
              }
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">${store.name}</h3>
              <p class="text-sm text-gray-500">${store.owner?.full_name || 'غير معروف'}</p>
            </div>
          </div>
          
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">${store.description || 'لا يوجد وصف'}</p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 space-x-reverse">
              <div class="flex items-center">
                ${this.createStarRating(store.rating)}
              </div>
              <span class="text-sm text-gray-500">(${store.review_count || 0})</span>
            </div>
            <button data-view-store="${store.id}" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              <i class="fas fa-eye ml-1"></i>عرض
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // عرض العناصر
  renderItems() {
    const container = document.getElementById('storeList');
    if (!container) return;

    if (this.isLoading) {
      container.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      `;
      return;
    }

    if (this.filteredItems.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">لا توجد منتجات متاحة 😅</p>
        </div>
      `;
      return;
    }

    // حساب العناصر للصفحة الحالية
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentItems = this.filteredItems.slice(startIndex, endIndex);

    container.innerHTML = currentItems.map(item => `
      <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div class="relative">
          ${item.thumbnail_url ? `
            <img src="${item.thumbnail_url}" alt="${item.title}" class="w-full h-48 object-cover rounded-t-lg">
          ` : `
            <div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center text-white text-4xl">
              <i class="fas fa-file-alt"></i>
            </div>
          `}
          
          <div class="absolute top-2 right-2">
            <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              ${this.getCategoryLabel(item.category)}
            </span>
          </div>
          
          ${item.price === 0 ? `
            <div class="absolute top-2 left-2">
              <span class="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                مجاني
              </span>
            </div>
          ` : ''}
        </div>
        
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${item.title}</h3>
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">${item.description || 'لا يوجد وصف'}</p>
          
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2 space-x-reverse">
              <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                ${item.creator?.full_name?.charAt(0) || 'U'}
              </div>
              <span class="text-sm text-gray-600">${item.creator?.full_name || 'مستخدم'}</span>
            </div>
            <div class="flex items-center space-x-1 space-x-reverse">
              <span class="text-sm text-gray-600">${item.rating || 0}</span>
              <i class="fas fa-star text-yellow-400 text-sm"></i>
            </div>
          </div>
          
          ${item.store ? `
            <div class="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <i class="fas fa-store ml-1"></i>
              ${item.store.name} - ${item.store.location}
            </div>
          ` : ''}
          
          <div class="flex items-center justify-between">
            <div class="text-lg font-bold text-blue-600">
              ${item.price === 0 ? 'مجاني' : `${item.price} ج.م`}
            </div>
            <div class="flex space-x-2 space-x-reverse">
              <button data-view-item="${item.id}" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                <i class="fas fa-eye"></i>
              </button>
              <button data-add-to-cart="${item.id}" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                <i class="fas fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // عرض التنقل بين الصفحات
    this.renderPagination();
  }

  // عرض التنقل بين الصفحات
  renderPagination() {
    const container = document.getElementById('storePagination');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="flex items-center justify-center space-x-2 space-x-reverse">
        <button id="prevPage" class="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <span class="px-3 py-2 text-gray-700">
          الصفحة ${this.currentPage} من ${totalPages}
        </span>
        
        <button id="nextPage" class="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
    `;
  }

  // عرض السلة
  renderCart() {
    const container = document.getElementById('storeCart');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-shopping-cart text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">السلة فاضية 😅</p>
        </div>
      `;
      return;
    }

    const totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold text-gray-900">السلة (${this.cart.length})</h3>
          <button id="clearCart" class="text-red-500 hover:text-red-700 text-sm">
            <i class="fas fa-trash ml-1"></i>تفريغ
          </button>
        </div>
        
        <div class="space-y-3 max-h-64 overflow-y-auto">
          ${this.cart.map(item => `
            <div class="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 text-sm">${item.title}</h4>
                <p class="text-gray-600 text-xs">${item.creator?.full_name || 'مستخدم'}</p>
                <div class="text-blue-600 font-semibold">${item.price === 0 ? 'مجاني' : `${item.price} ج.م`}</div>
              </div>
              
              <div class="flex items-center space-x-2 space-x-reverse">
                <button onclick="storeManager.updateCartQuantity('${item.id}', ${item.quantity - 1})" class="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                  <i class="fas fa-minus text-xs"></i>
                </button>
                <span class="w-8 text-center text-sm">${item.quantity}</span>
                <button onclick="storeManager.updateCartQuantity('${item.id}', ${item.quantity + 1})" class="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                  <i class="fas fa-plus text-xs"></i>
                </button>
              </div>
              
              <button data-remove-from-cart="${item.id}" class="text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>
        
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-4">
            <span class="font-semibold text-gray-900">الإجمالي:</span>
            <span class="font-bold text-blue-600">${totalAmount} ج.م</span>
          </div>
          
          <button id="checkout" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors">
            <i class="fas fa-shopping-cart ml-2"></i>إتمام الشراء
          </button>
        </div>
      </div>
    `;
  }

  // إنشاء تقييم النجوم
  createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star text-yellow-400"></i>';
    }
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star text-yellow-400"></i>';
    }
    return stars;
  }

  // الحصول على تسمية الفئة
  getCategoryLabel(category) {
    switch (category) {
      case 'materials':
        return 'مادة دراسية';
      case 'projects':
        return 'مشروع';
      case 'presentations':
        return 'عرض تقديمي';
      case 'other':
        return 'أخرى';
      default:
        return 'عنصر';
    }
  }

  // تنسيق التاريخ
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
}

// إنشاء مدير المتجر المحسن
const storeManager = new EnhancedStoreManager();

// تصدير للاستخدام في الملفات الأخرى
window.storeManager = storeManager;

export { storeManager, EnhancedStoreManager }; 