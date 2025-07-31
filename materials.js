import { supabase } from './supabase-config.js';
import { TransitionManager, NotificationManager } from './utils.js';
import { UXManager } from './ux.js';

// إنشاء بطاقة مادة مع انتقالات
function createMaterialCard(material, hasAccess, userName) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-lg';
  
  card.innerHTML = `
    <div class="relative">
      ${material.image_url ? 
        `<img src="${material.image_url}" alt="${material.title}" class="w-full h-48 object-cover">` : 
        `<div class="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <span class="text-4xl">📘</span>
        </div>`
      }
      ${hasAccess ? 
        `<div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          ✓ متاح
        </div>` : 
        `<div class="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          🔒 للشراء
        </div>`
      }
    </div>
    
    <div class="p-6">
      <h3 class="text-xl font-bold text-gray-800 mb-2">${material.title}</h3>
      <p class="text-gray-600 mb-2">📚 ${material.subject_name || 'مادة دراسية'}</p>
      <p class="text-blue-600 font-bold text-lg mb-4">💰 ${material.price} جنيه</p>
      
      <div class="flex gap-2">
        ${hasAccess ? 
          `<a href="${material.link}" target="_blank" class="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200">
            📖 عرض
          </a>
           <a href="${material.link}" download class="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200">
            ⬇️ تحميل
          </a>` : 
          `<a href="https://wa.me/201007289679?text=مرحبًا، أريد شراء ${material.title} الخاص بـ ${userName}" 
              target="_blank" 
              class="flex-1 bg-orange-500 text-white text-center py-2 px-4 rounded-lg hover:bg-orange-600 transition duration-200">
            💬 تواصل للشراء
          </a>`
        }
      </div>
    </div>
  `;
  
  // إضافة تأثير ظهور تدريجي
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    card.style.transition = 'all 0.5s ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 100);
  
  return card;
}

// تحميل المواد مع إدارة الأخطاء
async function loadMaterials() {
  const container = document.getElementById('materialsList');
  
  try {
    // التحقق من تسجيل الدخول
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    // إظهار حالة التحميل
    UXManager.showLoading(container, 'جاري تحميل المواد الدراسية...');

    // جلب بيانات المستخدم
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) throw userError;

    // جلب المواد
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('type', 'ماتريال')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (materialsError) throw materialsError;

    // جلب صلاحيات المستخدم
    const { data: access, error: accessError } = await supabase
      .from('access_by_phone')
      .select('material_id')
      .eq('phone_number', user.phone_number)
      .eq('granted', true);

    if (accessError) throw accessError;

    const allowedIds = access.map(a => a.material_id);

    // إخفاء حالة التحميل
    UXManager.hideLoading(container);

    // عرض المواد
    container.innerHTML = '';
    
    if (!materials || materials.length === 0) {
      TransitionManager.showEmpty(container, '📚', 'لا توجد مواد متاحة', 'سيتم إضافة مواد جديدة قريباً');
      return;
    }

    // إضافة عنوان القسم
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'mb-6 text-center';
    sectionHeader.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-800 mb-2">المواد الدراسية المتاحة</h2>
      <p class="text-gray-600">${materials.length} مادة دراسية</p>
    `;
    container.appendChild(sectionHeader);

    // إنشاء شبكة المواد
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    container.appendChild(grid);

    // إضافة المواد مع تأثيرات تدريجية
    const cards = [];
    materials.forEach((material, index) => {
      const hasAccess = allowedIds.includes(material.id);
      const card = createMaterialCard(material, hasAccess, user.full_name);
      cards.push(card);
      
      // تأخير ظهور البطاقات تدريجياً
      setTimeout(() => {
        grid.appendChild(card);
        UXManager.addTransition(card);
      }, index * 100);
    });

    // إضافة تأثيرات النقر للبطاقات
    cards.forEach(card => {
      UXManager.addClickEffect(card);
    });

  } catch (error) {
    console.error('Error loading materials:', error);
    UXManager.hideLoading(container);
    TransitionManager.showError(container, 'حدث خطأ في تحميل المواد. يرجى المحاولة مرة أخرى.');
    NotificationManager.show('حدث خطأ في تحميل المواد', 'error');
  }
}

// إضافة شريط التنقل
function addNavigation() {
  const header = document.querySelector('header');
  if (header) {
    const nav = document.createElement('nav');
    nav.className = 'bg-white shadow-sm border-b mt-4';
    nav.innerHTML = `
      <div class="container mx-auto px-4">
        <div class="flex space-x-8 space-x-reverse">
          <a href="dashboard.html" class="py-4 px-2 text-gray-600 hover:text-indigo-600 transition">
            🏠 الرئيسية
          </a>
          <a href="materials.html" class="py-4 px-2 border-b-2 border-indigo-500 text-indigo-600 font-medium">
            📘 المواد الدراسية
          </a>
          <a href="projects.html" class="py-4 px-2 text-gray-600 hover:text-indigo-600 transition">
            💻 المشاريع الجاهزة
          </a>
          <a href="presentations.html" class="py-4 px-2 text-gray-600 hover:text-indigo-600 transition">
            🖼️ العروض التقديمية
          </a>
        </div>
      </div>
    `;
    header.parentNode.insertBefore(nav, header.nextSibling);
  }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
  addNavigation();
  loadMaterials();
});