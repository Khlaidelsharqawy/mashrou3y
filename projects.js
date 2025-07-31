import { supabase } from './supabase-config.js';
import { TransitionManager, NotificationManager } from './utils.js';
import { UXManager } from './ux.js';

// إنشاء بطاقة مشروع مع انتقالات
function createProjectCard(project, hasAccess, userName) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-lg';
  
  card.innerHTML = `
    <div class="relative">
      ${project.image_url ? 
        `<img src="${project.image_url}" alt="${project.title}" class="w-full h-48 object-cover">` : 
        `<div class="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
          <span class="text-4xl">💻</span>
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
      <h3 class="text-xl font-bold text-gray-800 mb-2">${project.title}</h3>
      <p class="text-gray-600 mb-2">💻 ${project.type || 'مشروع'}</p>
      <p class="text-blue-600 font-bold text-lg mb-4">💰 ${project.price} جنيه</p>
      
      <div class="flex gap-2">
        ${hasAccess ? 
          `<a href="${project.link}" target="_blank" class="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200">
            👁️ عرض
          </a>
           <a href="${project.link}" download class="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200">
            ⬇️ تحميل
          </a>` : 
          `<a href="https://wa.me/201007289679?text=مرحبًا، أريد شراء ${project.title} الخاص بـ ${userName}" 
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

// تحميل المشاريع مع إدارة الأخطاء
async function loadProjects() {
  const container = document.getElementById('projectsList');
  
  try {
    // التحقق من تسجيل الدخول
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    showLoading(container);

    // جلب بيانات المستخدم
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) throw userError;

    // جلب المشاريع
    const { data: projects, error: projectsError } = await supabase
      .from('materials')
      .select('*')
      .eq('type', 'مشروع')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    // جلب صلاحيات المستخدم
    const { data: access, error: accessError } = await supabase
      .from('access_by_phone')
      .select('material_id')
      .eq('phone_number', user.phone_number)
      .eq('granted', true);

    if (accessError) throw accessError;

    const allowedIds = access.map(a => a.material_id);

    // عرض المشاريع
    container.innerHTML = '';
    
    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">💻</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">لا توجد مشاريع متاحة</h3>
          <p class="text-gray-600">سيتم إضافة مشاريع جديدة قريباً</p>
        </div>
      `;
      return;
    }

    // إضافة عنوان القسم
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'mb-6 text-center';
    sectionHeader.innerHTML = `
      <h2 class="text-2xl font-bold text-gray-800 mb-2">المشاريع الجاهزة</h2>
      <p class="text-gray-600">${projects.length} مشروع جاهز</p>
    `;
    container.appendChild(sectionHeader);

    // إنشاء شبكة المشاريع
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    container.appendChild(grid);

    // إضافة المشاريع مع تأثيرات تدريجية
    projects.forEach((project, index) => {
      const hasAccess = allowedIds.includes(project.id);
      const card = createProjectCard(project, hasAccess, user.full_name);
      
      // تأخير ظهور البطاقات تدريجياً
      setTimeout(() => {
        grid.appendChild(card);
      }, index * 100);
    });

  } catch (error) {
    console.error('Error loading projects:', error);
    showError(container, 'حدث خطأ في تحميل المشاريع. يرجى المحاولة مرة أخرى.');
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
          <a href="materials.html" class="py-4 px-2 text-gray-600 hover:text-indigo-600 transition">
            📘 المواد الدراسية
          </a>
          <a href="projects.html" class="py-4 px-2 border-b-2 border-indigo-500 text-indigo-600 font-medium">
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
  loadProjects();
});
