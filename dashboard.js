// نظام لوحة التحكم - Dashboard System

class DashboardManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.stats = {
      totalItems: 0,
      totalSales: 0,
      totalEarnings: 0,
      totalDownloads: 0,
      pendingItems: 0,
      approvedItems: 0
    };
    this.recentActivity = [];
    this.charts = {};
    this.init();
  }

  // تهيئة لوحة التحكم
  async init() {
    try {
      // انتظار تحميل Supabase
      await this.waitForSupabase();
      
      await this.getCurrentUser();
      await this.loadDashboardData();
      this.initCharts();
      this.initEventListeners();
      this.startRealtimeUpdates();
      console.log('✅ تم تهيئة لوحة التحكم بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تهيئة لوحة التحكم:', error);
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

  // الحصول على المستخدم الحالي
  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
      
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
    } catch (error) {
      console.error('خطأ في الحصول على المستخدم:', error);
      window.location.href = 'login.html';
    }
  }

  // تحميل بيانات لوحة التحكم
  async loadDashboardData() {
    await Promise.all([
      this.loadUserStats(),
      this.loadRecentActivity(),
      this.loadUserItems(),
      this.loadEarnings()
    ]);
    
    this.updateDashboardUI();
  }

  // تحميل إحصائيات المستخدم
  async loadUserStats() {
    try {
      const { data: items, error: itemsError } = await this.supabase
        .from('store_items')
        .select('*')
        .eq('creator_id', this.currentUser.id);

      if (itemsError) throw itemsError;

      const { data: purchases, error: purchasesError } = await this.supabase
        .from('purchases')
        .select('*')
        .eq('buyer_id', this.currentUser.id);

      if (purchasesError) throw purchasesError;

      const { data: earnings, error: earningsError } = await this.supabase
        .from('earnings')
        .select('*')
        .eq('user_id', this.currentUser.id);

      if (earningsError) throw earningsError;

      this.stats = {
        totalItems: items?.length || 0,
        totalSales: purchases?.length || 0,
        totalEarnings: earnings?.reduce((sum, earning) => sum + parseFloat(earning.net_amount || 0), 0) || 0,
        totalDownloads: items?.reduce((sum, item) => sum + (item.download_count || 0), 0) || 0,
        pendingItems: items?.filter(item => !item.is_approved).length || 0,
        approvedItems: items?.filter(item => item.is_approved).length || 0
      };

    } catch (error) {
      console.error('خطأ في تحميل إحصائيات المستخدم:', error);
    }
  }

  // تحميل النشاط الأخير
  async loadRecentActivity() {
    try {
      // تحميل آخر المشتريات
      const { data: recentPurchases, error: purchasesError } = await this.supabase
        .from('purchases')
        .select(`
          *,
          store_items:item_id (title, category)
        `)
        .eq('buyer_id', this.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (purchasesError) throw purchasesError;

      // تحميل آخر الأرباح
      const { data: recentEarnings, error: earningsError } = await this.supabase
        .from('earnings')
        .select(`
          *,
          store_items:item_id (title)
        `)
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (earningsError) throw earningsError;

      this.recentActivity = [
        ...(recentPurchases || []).map(purchase => ({
          type: 'purchase',
          title: `شراء: ${purchase.store_items?.title || 'منتج'}`,
          amount: purchase.price,
          date: purchase.created_at,
          category: purchase.store_items?.category
        })),
        ...(recentEarnings || []).map(earning => ({
          type: 'earning',
          title: `ربح من: ${earning.store_items?.title || 'منتج'}`,
          amount: earning.net_amount,
          date: earning.created_at
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    } catch (error) {
      console.error('خطأ في تحميل النشاط الأخير:', error);
    }
  }

  // تحميل منتجات المستخدم
  async loadUserItems() {
    try {
      const { data: items, error } = await this.supabase
        .from('store_items')
        .select('*')
        .eq('creator_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.updateUserItemsList(items || []);

    } catch (error) {
      console.error('خطأ في تحميل منتجات المستخدم:', error);
    }
  }

  // تحميل الأرباح
  async loadEarnings() {
    try {
      const { data: earnings, error } = await this.supabase
        .from('earnings')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.updateEarningsList(earnings || []);

    } catch (error) {
      console.error('خطأ في تحميل الأرباح:', error);
    }
  }

  // تحديث واجهة لوحة التحكم
  updateDashboardUI() {
    // تحديث الإحصائيات
    this.updateStatsCards();
    
    // تحديث النشاط الأخير
    this.updateRecentActivity();
    
    // تحديث الرسوم البيانية
    this.updateCharts();
  }

  // تحديث بطاقات الإحصائيات
  updateStatsCards() {
    const statsElements = {
      totalItems: document.getElementById('totalItems'),
      totalSales: document.getElementById('totalSales'),
      totalEarnings: document.getElementById('totalEarnings'),
      totalDownloads: document.getElementById('totalDownloads'),
      pendingItems: document.getElementById('pendingItems'),
      approvedItems: document.getElementById('approvedItems')
    };

    Object.keys(statsElements).forEach(key => {
      const element = statsElements[key];
      if (element) {
        if (key === 'totalEarnings') {
          element.textContent = `${this.stats[key].toFixed(2)} جنيه`;
        } else {
          element.textContent = this.stats[key];
        }
      }
    });
  }

  // تحديث النشاط الأخير
  updateRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;

    activityContainer.innerHTML = this.recentActivity.map(activity => `
      <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 mb-3">
        <div class="flex items-center space-x-3 space-x-reverse">
          <div class="w-10 h-10 rounded-full flex items-center justify-center ${
            activity.type === 'purchase' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }">
            <i class="fas ${activity.type === 'purchase' ? 'fa-shopping-cart' : 'fa-money-bill-wave'}"></i>
          </div>
          <div>
            <div class="font-medium text-gray-800">${activity.title}</div>
            <div class="text-sm text-gray-500">${this.formatDate(activity.date)}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold ${activity.type === 'purchase' ? 'text-red-600' : 'text-green-600'}">
            ${activity.type === 'purchase' ? '-' : '+'}${activity.amount} جنيه
          </div>
          ${activity.category ? `<div class="text-xs text-gray-500">${this.getCategoryName(activity.category)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // تحديث قائمة منتجات المستخدم
  updateUserItemsList(items) {
    const itemsContainer = document.getElementById('userItems');
    if (!itemsContainer) return;

    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="text-4xl mb-4">📁</div>
          <h3 class="text-lg font-medium text-gray-800 mb-2">مش عندك منتجات لسه</h3>
          <p class="text-gray-600 mb-4">ابدأ برفع أول منتج لك!</p>
          <a href="upload.html" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all">
            رفع منتج جديد 🚀
          </a>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = items.map(item => `
      <div class="bg-white rounded-lg p-4 border border-gray-200 mb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 space-x-reverse">
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="fas ${this.getCategoryIcon(item.category)} text-gray-500"></i>
            </div>
            <div>
              <div class="font-medium text-gray-800">${item.title}</div>
              <div class="text-sm text-gray-500">${this.getCategoryName(item.category)}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-green-600">${item.price} جنيه</div>
            <div class="text-sm text-gray-500">${item.download_count || 0} تحميل</div>
            <span class="px-2 py-1 text-xs rounded-full ${
              item.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }">
              ${item.is_approved ? 'معتمد' : 'في الانتظار'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // تحديث قائمة الأرباح
  updateEarningsList(earnings) {
    const earningsContainer = document.getElementById('userEarnings');
    if (!earningsContainer) return;

    if (earnings.length === 0) {
      earningsContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="text-4xl mb-4">💰</div>
          <h3 class="text-lg font-medium text-gray-800 mb-2">مش عندك أرباح لسه</h3>
          <p class="text-gray-600">ابدأ ببيع منتجاتك!</p>
        </div>
      `;
      return;
    }

    earningsContainer.innerHTML = earnings.map(earning => `
      <div class="bg-white rounded-lg p-4 border border-gray-200 mb-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-gray-800">${earning.store_items?.title || 'منتج'}</div>
            <div class="text-sm text-gray-500">${this.formatDate(earning.created_at)}</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-green-600">+${earning.net_amount} جنيه</div>
            <div class="text-sm text-gray-500">${earning.status}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // تهيئة الرسوم البيانية
  initCharts() {
    // يمكن إضافة مكتبة رسوم بيانية مثل Chart.js هنا
    console.log('📊 تم تهيئة الرسوم البيانية');
  }

  // تحديث الرسوم البيانية
  updateCharts() {
    // تحديث الرسوم البيانية بالبيانات الجديدة
    console.log('📊 تحديث الرسوم البيانية');
  }

  // تهيئة مستمعي الأحداث
  initEventListeners() {
    // زر تحديث البيانات
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadDashboardData();
      });
    }

    // أزرار التصفية
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handleFilter(e.target.dataset.filter);
      });
    });

    // أزرار التنقل السريع
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
      action.addEventListener('click', (e) => {
        this.handleQuickAction(e.target.dataset.action);
      });
    });
  }

  // بدء التحديثات المباشرة
  startRealtimeUpdates() {
    // الاستماع لتغييرات في المنتجات
    this.supabase
      .channel('user_items')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'store_items',
          filter: `creator_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          console.log('🔄 تحديث مباشر للمنتجات:', payload);
          this.loadUserStats();
          this.loadUserItems();
        }
      )
      .subscribe();

    // الاستماع لتغييرات في المشتريات
    this.supabase
      .channel('user_purchases')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'purchases',
          filter: `buyer_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          console.log('🔄 تحديث مباشر للمشتريات:', payload);
          this.loadUserStats();
          this.loadRecentActivity();
        }
      )
      .subscribe();

    // الاستماع لتغييرات في الأرباح
    this.supabase
      .channel('user_earnings')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'earnings',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        (payload) => {
          console.log('🔄 تحديث مباشر للأرباح:', payload);
          this.loadUserStats();
          this.loadEarnings();
        }
      )
      .subscribe();
  }

  // معالجة التصفية
  handleFilter(filter) {
    // إزالة التفعيل من جميع الأزرار
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });

    // تفعيل الزر المحدد
    const activeButton = document.querySelector(`[data-filter="${filter}"]`);
    if (activeButton) {
      activeButton.classList.remove('bg-gray-100', 'text-gray-700');
      activeButton.classList.add('bg-blue-500', 'text-white');
    }

    // تطبيق التصفية
    this.applyFilter(filter);
  }

  // تطبيق التصفية
  applyFilter(filter) {
    const items = document.querySelectorAll('.user-item');
    items.forEach(item => {
      const itemCategory = item.dataset.category;
      const itemStatus = item.dataset.status;

      let shouldShow = true;

      switch (filter) {
        case 'all':
          shouldShow = true;
          break;
        case 'materials':
          shouldShow = itemCategory === 'materials';
          break;
        case 'projects':
          shouldShow = itemCategory === 'projects';
          break;
        case 'presentations':
          shouldShow = itemCategory === 'presentations';
          break;
        case 'approved':
          shouldShow = itemStatus === 'approved';
          break;
        case 'pending':
          shouldShow = itemStatus === 'pending';
          break;
      }

      item.style.display = shouldShow ? 'block' : 'none';
    });
  }

  // معالجة الإجراءات السريعة
  handleQuickAction(action) {
    switch (action) {
      case 'upload':
        window.location.href = 'upload.html';
        break;
      case 'store':
        window.location.href = 'store.html';
        break;
      case 'profile':
        window.location.href = 'profile.html';
        break;
      case 'settings':
        window.location.href = 'settings.html';
        break;
      default:
        console.log('إجراء غير معروف:', action);
    }
  }

  // تنسيق التاريخ
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'منذ يوم';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنوات`;
  }

  // الحصول على أيقونة الفئة
  getCategoryIcon(category) {
    const icons = {
      'materials': 'fa-book',
      'projects': 'fa-code',
      'presentations': 'fa-presentation',
      'store': 'fa-shopping-cart'
    };
    return icons[category] || 'fa-file';
  }

  // الحصول على اسم الفئة
  getCategoryName(category) {
    const names = {
      'materials': 'مواد دراسية',
      'projects': 'مشاريع',
      'presentations': 'عروض تقديمية',
      'store': 'متجر'
    };
    return names[category] || category;
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

  // تنظيف الموارد
  cleanup() {
    // إلغاء الاشتراكات المباشرة
    this.supabase.removeAllChannels();
  }
}

// إنشاء مدير لوحة التحكم
const dashboardManager = new DashboardManager();

// تصدير للاستخدام في الملفات الأخرى
window.dashboardManager = dashboardManager;

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  dashboardManager.cleanup();
});

export { dashboardManager, DashboardManager }; 