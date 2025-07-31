
// تكوين Supabase باستخدام CDN
const supabaseUrl = 'https://ycomaasvlmnuscmkooti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljb21hYXN2bG1udXNjbWtvb3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg3NjUsImV4cCI6MjA2OTM4NDc2NX0.8rm-tCGJtwWnMz2Z3TXm8WWAVruRvIgIOotsZKZ3zWA';

// تهيئة Supabase عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  initializeSupabase();
});

// التحقق من وجود Supabase في المتصفح
function checkSupabaseAvailability() {
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase CDN لم يتم تحميله بشكل صحيح');
    // إضافة CDN تلقائياً إذا لم يكن موجوداً
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      console.log('✅ تم تحميل Supabase CDN بنجاح');
      initializeSupabase();
    };
    document.head.appendChild(script);
    return false;
  }
  return true;
}

// دالة تهيئة Supabase
function initializeSupabase() {
  try {
    // التحقق من توفر Supabase
    if (!checkSupabaseAvailability()) {
      return;
    }
    
    // إنشاء عميل Supabase
    const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    
    // اختبار الاتصال
    testConnection(supabase);
    
    // تصدير العميل
    window.supabaseClient = supabase;
    
    console.log('✅ تم تهيئة Supabase بنجاح');
  } catch (error) {
    console.error('❌ خطأ في تهيئة Supabase:', error);
  }
}

// دالة اختبار الاتصال
async function testConnection(supabase) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('⚠️ تحذير: مش قادر أتواصل مع قاعدة البيانات:', error.message);
    } else {
      console.log('✅ الاتصال بقاعدة البيانات يعمل بشكل ممتاز');
    }
  } catch (error) {
    console.warn('⚠️ تحذير: مش قادر أختبر الاتصال:', error.message);
  }
}

// تصدير العميل للاستخدام في الملفات الأخرى
export { supabaseUrl, supabaseAnonKey };

// تصدير دالة للحصول على العميل
export function getSupabaseClient() {
  return window.supabaseClient;
}

// تصدير العميل مباشرة (للتوافق مع الكود القديم)
export const supabase = window.supabaseClient;
