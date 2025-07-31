// Logic for index.html - MASHROU3Y
import { getSupabaseClient } from './supabase-config.js';

let supabase;

/**
 * Waits for a global object to be available.
 * @param {string} name The name of the global object (e.g., 'supabaseClient', 'app').
 */
function waitForGlobal(name) {
  return new Promise((resolve) => {
    if (window[name]) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (window[name]) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    }
  });
}


// --- ACCESS CONTROL & UI LOGIC ---

// This function is specific to the index page to control card appearance
async function checkIndexPageAccess() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      document.querySelectorAll('.card').forEach(card => {
        card.style.filter = 'blur(2px)';
        card.style.pointerEvents = 'none';
        if (!card.querySelector('.locked-msg')) {
          const msg = document.createElement('div');
          msg.className = 'locked-msg text-center text-red-600 font-bold mt-4';
          msg.innerHTML = 'سجل دخولك الأول عشان تشوف التفاصيل';
          card.appendChild(msg);
        }
      });
    } else {
      document.querySelectorAll('.card').forEach(card => {
        card.style.filter = '';
        card.style.pointerEvents = '';
        const msg = card.querySelector('.locked-msg');
        if (msg) msg.remove();
      });
    }
  } catch (error) {
    console.error('خطأ في فحص حالة تسجيل الدخول:', error);
  }
}

// This function handles the navigation logic when a category card is clicked
window.handleCardClick = async function(category) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.app.showMessage('محتاج تسجل دخول الأول يا نجم 😅', 'warning');
      setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      return;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id) // Use ID for a more reliable check
      .single();

    if (profileError || !userProfile) {
      window.app.showMessage('محتاج تكمل ملفك الشخصي الأول 😅', 'warning');
      setTimeout(() => { window.location.href = 'signup.html'; }, 2000);
      return;
    }

    if (!userProfile.is_approved) {
      window.app.showMessage('حسابك قيد المراجعة، استنى الأدمن يوافق عليه 😅', 'info');
      setTimeout(() => { window.location.href = 'waiting-approval.html'; }, 2000);
      return;
    }

    const pageMap = {
      materials: 'materials.html',
      projects: 'projects.html',
      presentations: 'presentations.html',
      store: 'stores.html',
    };

    if (pageMap[category]) {
      window.location.href = pageMap[category];
    } else {
      console.log('فئة غير معروفة:', category);
    }

  } catch (error) {
    console.error('خطأ في معالجة النقر:', error);
    window.app.showMessage('في مشكلة، جرب تاني 😅', 'error');
  }
};


// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
  await waitForGlobal('supabaseClient');
  await waitForGlobal('app');

  supabase = getSupabaseClient();

  if (!supabase) {
    console.error("Supabase client not found. Index page logic cannot run.");
    return;
  }

  // Initial check
  checkIndexPageAccess();

  // Listen for auth changes to update the UI
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed on index page:', event);
    checkIndexPageAccess();
  });

  // The global theme and language toggles are already handled by main.js,
  // so we don't need to add duplicate listeners here. We just ensure the UI
  // is updated on load.
});
