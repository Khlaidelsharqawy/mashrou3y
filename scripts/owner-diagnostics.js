// OWNER DIAGNOSTICS SCRIPT - MASHROU3Y

// Supabase Client
let supabase;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for supabase to be initialized by supabase-config.js
  await waitForSupabase();

  if (window.supabaseClient) {
    supabase = window.supabaseClient;
    console.log('Supabase client loaded for diagnostics.');
    initializeTheme();
    initializeLanguage();
    await checkOwnerAccess();
    initializeDiagnostics();
  } else {
    showError('فشل تحميل Supabase. لا يمكن عرض الصفحة.');
  }
});

/**
 * Waits for the global supabaseClient to be available.
 */
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window.supabaseClient) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (window.supabaseClient) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
}


// --- ACTIONS & EXPORT ---

let diagnosticsData = {};

/**
 * Creates the panel with action buttons.
 * @param {HTMLElement} container The parent container for the card.
 */
function createActionPanel(container) {
  const { card, body } = createDiagnosticCard('الإجراءات والتصدير', 'fa-cogs');
  card.classList.add('lg:col-span-3'); // Make it wider on large screens
  body.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-4', 'gap-4');

  // Export Button
  const exportButton = document.createElement('button');
  exportButton.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition';
  exportButton.innerHTML = '<i class="fas fa-file-download mr-2"></i> تصدير JSON';
  exportButton.onclick = exportDiagnostics;
  body.appendChild(exportButton);

  // Copy Button
  const copyButton = document.createElement('button');
  copyButton.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition';
  copyButton.innerHTML = '<i class="fas fa-copy mr-2"></i> نسخ للوحافظة';
  copyButton.onclick = copyDiagnosticsToClipboard;
  body.appendChild(copyButton);

  // Role Simulation Buttons
  const roles = ['student', 'freelancer', 'doctor'];
  roles.forEach(role => {
    const roleButton = document.createElement('button');
    roleButton.className = 'bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition';
    roleButton.innerHTML = `<i class="fas fa-user-simulate mr-2"></i> محاكاة (${role})`;
    roleButton.onclick = () => simulateRole(role);
    body.appendChild(roleButton);
  });

  container.appendChild(card);
}

/**
 * Gathers all diagnostics data into a single object.
 */
function gatherAllDiagnostics() {
    // This is a simplified example. In a real app, you'd collect data from the cards.
    // For now, we'll just create a summary.
    diagnosticsData = {
        timestamp: new Date().toISOString(),
        system: {
            os: navigator.platform,
            browser: navigator.userAgent.match(/(firefox|msie|chrome|safari|trident)/i)[0],
            resolution: `${window.screen.width}x${window.screen.height}`,
        },
        network: {
            type: navigator.connection?.type,
        },
        supabase: {
            url: window.supabaseClient.supabaseUrl,
        }
    };
}

/**
 * Exports the diagnostics data as a JSON file.
 */
function exportDiagnostics() {
  gatherAllDiagnostics();
  const dataStr = JSON.stringify(diagnosticsData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `mashrou3y-diagnostics-${new Date().toISOString()}.json`;

  let linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * Copies the diagnostics data to the clipboard.
 */
function copyDiagnosticsToClipboard() {
  gatherAllDiagnostics();
  const dataStr = JSON.stringify(diagnosticsData, null, 2);
  navigator.clipboard.writeText(dataStr).then(() => {
    alert('تم نسخ بيانات التشخيص إلى الحافظة!');
  }, () => {
    alert('فشل نسخ البيانات.');
  });
}

/**
 * Simulates a user role by setting a value in localStorage and redirecting.
 * @param {string} role The role to simulate.
 */
function simulateRole(role) {
    alert(`سيتم محاكاة دور "${role}". سيتم إعادة توجيهك إلى الصفحة الرئيسية.`);
    localStorage.setItem('simulatedRole', role);
    window.location.href = 'index.html';
}

// --- ACCESS CONTROL ---
/**
 * Checks if the current user is the owner.
 * The "owner" is defined as the first user ever created in the `users` table.
 * If not the owner, redirects to index.html.
 */
async function checkOwnerAccess() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Access Denied: No user logged in.');
      redirectToHome('يجب تسجيل الدخول للوصول لهذه الصفحة.');
      return;
    }

    // Fetch the first user from the users table
    const { data: ownerUser, error: ownerError } = await supabase
      .from('users')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (ownerError) {
      throw new Error('Could not verify owner status. ' + ownerError.message);
    }

    // Check if the current user's ID matches the owner's ID
    if (!ownerUser || user.id !== ownerUser.id) {
      console.warn(`Access Denied: User ${user.email} is not the owner.`);
      redirectToHome('أنت غير مصرح لك بالدخول إلى هذه الصفحة.');
      return;
    }

    console.log(`Access Granted: Welcome, Owner (${user.email}).`);

  } catch (error) {
    console.error('Error during owner access check:', error);
    showError('حدث خطأ أثناء التحقق من صلاحيات الوصول.');
    redirectToHome('حدث خطأ فني. حاول مرة أخرى.');
  }
}

// --- LANGUAGE SWITCHER ---
const translations = {
  ar: {
    'لوحة تشخيص المالك': 'لوحة تشخيص المالك',
    'أدوات ومعلومات للمطورين': 'أدوات ومعلومات للمطورين',
    'تسجيل الخروج': 'تسجيل الخروج',
    'معلومات النظام والمتصفح': 'معلومات النظام والمتصفح',
    'فحص ملفات الموقع': 'فحص ملفات الموقع',
    'تشخيص Supabase': 'تشخيص Supabase',
    'تشخيص الشبكة': 'تشخيص الشبكة',
    'تشخيص الأداء': 'تشخيص الأداء',
  },
  en: {
    'لوحة تشخيص المالك': 'Owner Diagnostics',
    'أدوات ومعلومات للمطورين': 'Developer tools and information',
    'تسجيل الخروج': 'Logout',
    'معلومات النظام والمتصفح': 'System & Browser Info',
    'فحص ملفات الموقع': 'Site File Check',
    'تشخيص Supabase': 'Supabase Diagnostics',
    'تشخيص الشبكة': 'Network Diagnostics',
    'تشخيص الأداء': 'Performance Diagnostics',
  }
};

let currentLang = 'ar';

function initializeLanguage() {
  const langToggleBtn = document.getElementById('language-toggle-btn');
  currentLang = localStorage.getItem('language') || 'ar';

  setLanguage(currentLang);

  langToggleBtn.addEventListener('click', () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
  });
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-translate-key]').forEach(el => {
    const key = el.dataset.translateKey;
    el.textContent = translations[lang][key] || key;
  });

  // Manually update card titles as they don't have a key
  const titles = document.querySelectorAll('.font-bold.text-gray-800');
  titles.forEach(title => {
    const originalText = Object.keys(translations.en).find(key => translations.en[key] === title.textContent || translations.ar[key] === title.textContent);
    if (originalText) {
      title.textContent = translations[lang][originalText];
    }
  });
}

// --- THEME SWITCHER ---
/**
 * Initializes the theme based on localStorage or system preference.
 */
function initializeTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  updateThemeIcon(currentTheme);

  themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

/**
 * Updates the theme toggle button icon.
 * @param {string} theme The current theme ('light' or 'dark').
 */
function updateThemeIcon(theme) {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (theme === 'dark') {
        themeToggleBtn.innerHTML = '<i class="fas fa-moon text-lg"></i>';
    } else {
        themeToggleBtn.innerHTML = '<i class="fas fa-sun text-lg"></i>';
    }
}

/**
 * Runs performance-related diagnostic checks.
 * @param {HTMLElement} container The parent container for the card.
 */
async function runPerformanceDiagnostics(container) {
  const { card, body } = createDiagnosticCard('تشخيص الأداء', 'fa-tachometer-alt');
  container.appendChild(card);

  // Page Load Time
  const loadTime = performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd;
  addInfoRow(body, 'زمن تحميل الصفحة (ms)', loadTime.toFixed(2), 'info');

  // JS Heap Size
  const memory = performance.memory;
  if (memory) {
    const heapSize = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    addInfoRow(body, 'ذاكرة JS المستخدمة (MB)', heapSize, 'info');
  }

  // Content Counts
  const tables = ['materials', 'projects', 'presentations'];
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      addInfoRow(body, `عدد ${table}`, count, 'info');
    } catch (e) {
      addInfoRow(body, `عدد ${table}`, 'فشل العد', 'warning');
    }
  }
}

/**
 * Runs network-related diagnostic checks.
 * @param {HTMLElement} container The parent container for the card.
 */
async function runNetworkDiagnostics(container) {
  const { card, body } = createDiagnosticCard('تشخيص الشبكة', 'fa-wifi');
  container.appendChild(card);

  // Connection Type
  const connectionType = navigator.connection?.type || 'غير معروف';
  addInfoRow(body, 'نوع الإتصال', connectionType, 'info');

  // Latency (Ping)
  const startTime = performance.now();
  try {
    await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    const latency = performance.now() - startTime;
    addInfoRow(body, 'زمن الإستجابة (ms)', `${latency.toFixed(2)}`, 'success');
  } catch (e) {
    addInfoRow(body, 'زمن الإستجابة (ms)', 'فشل القياس', 'error');
  }

  // Download Speed
  const imageUrl = 'images/logo1.jpg'; // Use one of the existing images
  const imageSize = 130 * 1024; // Approx size of logo1.jpg in bytes (130 KB)
  const downloadStartTime = performance.now();
  try {
    const response = await fetch(imageUrl, { cache: 'no-store' });
    const blob = await response.blob();
    const downloadTime = performance.now() - downloadStartTime;
    const speedBps = (imageSize * 8) / (downloadTime / 1000);
    const speedMbps = (speedBps / 1000 / 1000).toFixed(2);
    addInfoRow(body, 'سرعة التحميل (Mbps)', speedMbps, 'success');
  } catch (e) {
    addInfoRow(body, 'سرعة التحميل (Mbps)', 'فشل القياس', 'error');
  }
}

/**
 * Checks the status of the Supabase connection and displays info.
 * @param {HTMLElement} container The parent container for the card.
 */
async function runSupabaseDiagnostics(container) {
  const { card, body } = createDiagnosticCard('تشخيص Supabase', 'fa-database');
  container.appendChild(card);

  // Check Project URL and Anon Key
  const urlOk = window.supabaseClient.supabaseUrl && window.supabaseClient.supabaseUrl.includes('supabase.co');
  addInfoRow(body, 'Project URL', urlOk ? 'صحيح' : 'خطأ', urlOk ? 'success' : 'error');

  const keyOk = window.supabaseClient.supabaseKey && window.supabaseClient.supabaseKey.startsWith('ey');
  addInfoRow(body, 'Anon Key', keyOk ? 'صحيح' : 'خطأ', keyOk ? 'success' : 'error');

  // Ping API (by fetching user count)
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    addInfoRow(body, 'حالة الإتصال', 'متصل', 'success');
    addInfoRow(body, 'عدد المستخدمين', count, 'info');

  } catch (error) {
    addInfoRow(body, 'حالة الإتصال', 'فشل الإتصال', 'error');
    const errorRow = addInfoRow(body, 'الخطأ', error.message);
  }
}

/**
 * Creates a standard card for displaying diagnostic information.
 * @param {string} title The title of the card.
 * @param {string} iconClass The Font Awesome icon class (e.g., 'fa-info-circle').
 * @returns {object} { card, body } The created card element and its body for content.
 */
function createDiagnosticCard(title, iconClass) {
  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col';

  const header = document.createElement('div');
  header.className = 'flex items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4';
  header.innerHTML = `
    <i class="fas ${iconClass} text-indigo-500 dark:text-indigo-400 text-2xl mr-4"></i>
    <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200">${title}</h2>
  `;

  const body = document.createElement('div');
  body.className = 'space-y-2 text-sm';

  card.appendChild(header);
  card.appendChild(body);

  return { card, body };
}

/**
 * Adds a key-value pair to a diagnostic card body.
 * @param {HTMLElement} body The body element of the card.
 * @param {string} key The label for the data.
 * @param {string} value The value to display.
 * @param {string} status Optional status ('success', 'warning', 'error') for color-coding.
 */
function addInfoRow(body, key, value, status = '') {
  const row = document.createElement('div');
  row.className = 'flex justify-between items-center';

  let statusClass = '';
  if (status === 'success') statusClass = 'text-green-500 dark:text-green-400';
  if (status === 'warning') statusClass = 'text-yellow-500 dark:text-yellow-400';
  if (status === 'error') statusClass = 'text-red-500 dark:text-red-400';

  row.innerHTML = `
    <span class="font-semibold text-gray-700 dark:text-gray-300">${key}:</span>
    <span class="font-mono text-gray-800 dark:text-gray-200 ${statusClass} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">${value}</span>
  `;
  body.appendChild(row);
}


/**
 * Initializes all diagnostic checks.
 */
function initializeDiagnostics() {
  const container = document.getElementById('diagnostics-container');
  container.innerHTML = ''; // Clear loading spinner

  // Run all diagnostics
  runSystemInfoDiagnostics(container);
  runFileCheckDiagnostics(container);
  runSupabaseDiagnostics(container);
  runNetworkDiagnostics(container);
  runPerformanceDiagnostics(container);
  createActionPanel(container);
}

/**
 * Gathers and displays system and browser information.
 * @param {HTMLElement} container The parent container for the card.
 */
function runSystemInfoDiagnostics(container) {
  const { card, body } = createDiagnosticCard('معلومات النظام والمتصفح', 'fa-desktop');

  // OS
  const os = navigator.platform || 'غير معروف';
  addInfoRow(body, 'نظام التشغيل', os);

  // Browser
  const browser = navigator.userAgent.match(/(firefox|msie|chrome|safari|trident)/i);
  const browserName = browser ? browser[0] : 'غير معروف';
  addInfoRow(body, 'المتصفح', browserName);

  // Resolution
  const resolution = `${window.screen.width}x${window.screen.height}`;
  addInfoRow(body, 'دقة الشاشة', resolution);

  // JavaScript Enabled
  addInfoRow(body, 'JavaScript', 'مُفعل', 'success');

  // Service Worker Support
  const swSupport = 'serviceWorker' in navigator;
  addInfoRow(body, 'Service Workers', swSupport ? 'مدعوم' : 'غير مدعوم', swSupport ? 'success' : 'warning');

  // WebGL Support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const webglSupport = gl && gl instanceof WebGLRenderingContext;
  addInfoRow(body, 'WebGL', webglSupport ? 'مدعوم' : 'غير مدعوم', webglSupport ? 'success' : 'error');

  // Memory (if available)
  if (navigator.deviceMemory) {
    addInfoRow(body, 'ذاكرة الجهاز (GB)', navigator.deviceMemory, 'info');
  }

  // Cores (if available)
  if (navigator.hardwareConcurrency) {
    addInfoRow(body, 'أنوية المعالج', navigator.hardwareConcurrency, 'info');
  }

  container.appendChild(card);
}

/**
 * Checks for the existence and accessibility of critical files.
 * @param {HTMLElement} container The parent container for the card.
 */
async function runFileCheckDiagnostics(container) {
  const { card, body } = createDiagnosticCard('فحص ملفات الموقع', 'fa-file-alt');
  container.appendChild(card);

  const files_to_check = [
    'index.html',
    'scripts/main.js',
    'styles/style.css',
    'scripts/supabase-config.js',
    'images/logo1.jpg',
    'images/logo2.jpg',
    'images/logo3.jpg',
    'images/logo4.jpg',
  ];

  for (const file of files_to_check) {
    try {
      const response = await fetch(file, { method: 'HEAD', cache: 'no-store' });
      if (response.ok) {
        addInfoRow(body, file, 'موجود', 'success');
      } else {
        addInfoRow(body, file, `خطأ: ${response.status}`, 'error');
      }
    } catch (error) {
      addInfoRow(body, file, 'فشل التحميل', 'error');
    }
  }
}


// --- UTILITY FUNCTIONS ---

/**
 * Redirects to the homepage with an alert message.
 * @param {string} message The message to show in the alert.
 */
function redirectToHome(message) {
  alert(`[MASHROU3Y] ${message}`);
  window.location.href = 'index.html';
}

/**
 * Displays a full-page error message.
 * @param {string} message The error message to display.
 */
function showError(message) {
  document.body.innerHTML = `
    <div class="w-full h-screen flex items-center justify-center bg-red-100 dark:bg-red-900">
      <div class="text-center p-8">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-red-700 dark:text-red-300 mb-4">خطأ حرج</h2>
        <p class="text-red-600 dark:text-red-400">${message}</p>
        <a href="index.html" class="mt-6 inline-block bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
          العودة للصفحة الرئيسية
        </a>
      </div>
    </div>
  `;
}
