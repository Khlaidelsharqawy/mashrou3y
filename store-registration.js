// نظام تسجيل المتاجر - Store Registration System
import { getSupabaseClient } from './supabase-config.js';

class StoreRegistrationManager {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.init();
  }

  // تهيئة نظام تسجيل المتاجر
  async init() {
    await this.checkUserAuth();
    this.initEventListeners();
    this.initFormValidation();
    console.log('✅ تم تهيئة نظام تسجيل المتاجر بنجاح');
  }

  // فحص مصادقة المستخدم
  async checkUserAuth() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        this.currentUser = user;
        // التحقق من نوع المستخدم
        if (!this.canRegisterStore()) {
          this.showMessage('عذراً، لا يمكنك تسجيل متجر. يجب أن تكون بائع أو مدير.', 'error');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 3000);
        }
      } else {
        console.warn('⚠️ المستخدم غير مسجل دخول');
        window.location.href = 'login.html';
      }
    } catch (error) {
      console.error('❌ خطأ في فحص المصادقة:', error);
    }
  }

  // التحقق من إمكانية تسجيل متجر
  canRegisterStore() {
    const userType = this.currentUser?.user_metadata?.user_type;
    return userType === 'vendor' || userType === 'admin' || userType === 'فريلانسر';
  }

  // تهيئة مستمعي الأحداث
  initEventListeners() {
    const form = document.getElementById('storeForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // التحقق من صحة النموذج عند التغيير
    const inputs = form?.querySelectorAll('input, textarea, select');
    inputs?.forEach(input => {
      input.addEventListener('input', () => {
        this.validateForm();
      });
    });
  }

  // تهيئة التحقق من صحة النموذج
  initFormValidation() {
    const form = document.getElementById('storeForm');
    if (!form) return;

    // التحقق من صحة النموذج عند التغيير
    form.addEventListener('input', () => {
      this.validateForm();
    });
  }

  // التحقق من صحة النموذج
  validateForm() {
    const storeName = document.getElementById('storeName')?.value?.trim();
    const storeDescription = document.getElementById('storeDescription')?.value?.trim();
    const storeLocation = document.getElementById('storeLocation')?.value;
    const contactEmail = document.getElementById('contactEmail')?.value?.trim();
    const agreeTerms = document.getElementById('agreeTerms')?.checked;
    const submitBtn = document.getElementById('submitBtn');

    let isValid = true;
    let errorMessage = '';

    // التحقق من اسم المتجر
    if (!storeName || storeName.length < 3) {
      isValid = false;
      errorMessage = 'اسم المتجر مطلوب ويجب أن يكون 3 أحرف على الأقل';
    }

    // التحقق من وصف المتجر
    if (!storeDescription || storeDescription.length < 10) {
      isValid = false;
      errorMessage = 'وصف المتجر مطلوب ويجب أن يكون 10 أحرف على الأقل';
    }

    // التحقق من الموقع
    if (!storeLocation) {
      isValid = false;
      errorMessage = 'موقع المتجر مطلوب';
    }

    // التحقق من البريد الإلكتروني (إذا تم إدخاله)
    if (contactEmail && !this.isValidEmail(contactEmail)) {
      isValid = false;
      errorMessage = 'البريد الإلكتروني غير صحيح';
    }

    // التحقق من الموافقة على الشروط
    if (!agreeTerms) {
      isValid = false;
      errorMessage = 'يجب الموافقة على الشروط والأحكام';
    }

    // تحديث حالة الزر
    if (submitBtn) {
      submitBtn.disabled = !isValid;
      if (!isValid) {
        submitBtn.title = errorMessage;
      } else {
        submitBtn.title = 'تسجيل المتجر';
      }
    }

    return isValid;
  }

  // التحقق من صحة البريد الإلكتروني
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // معالجة إرسال النموذج
  async handleFormSubmit() {
    if (!this.validateForm()) {
      this.showMessage('يرجى إكمال جميع الحقول المطلوبة', 'error');
      return;
    }

    this.showLoadingOverlay();
    this.disableForm();

    try {
      // رفع الصور أولاً
      const logoUrl = await this.uploadImage('storeLogo', 'store-logos');
      const bannerUrl = await this.uploadImage('storeBanner', 'store-banners');

      // جمع بيانات المتجر
      const storeData = this.collectStoreData(logoUrl, bannerUrl);

      // حفظ المتجر في قاعدة البيانات
      const result = await this.saveStore(storeData);

      if (result.success) {
        this.showSuccessMessage('تم تسجيل المتجر بنجاح! سيتم مراجعته من قبل الإدارة قريباً.');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 3000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ خطأ في تسجيل المتجر:', error);
      this.showMessage(`حدث خطأ أثناء تسجيل المتجر: ${error.message}`, 'error');
    } finally {
      this.hideLoadingOverlay();
      this.enableForm();
    }
  }

  // رفع صورة
  async uploadImage(inputId, folder) {
    const input = document.getElementById(inputId);
    if (!input || !input.files[0]) return null;

    try {
      const file = input.files[0];
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileName = `${timestamp}_${randomId}_${file.name}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = this.supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;

    } catch (error) {
      console.error(`❌ خطأ في رفع الصورة ${inputId}:`, error);
      return null;
    }
  }

  // جمع بيانات المتجر
  collectStoreData(logoUrl, bannerUrl) {
    const storeName = document.getElementById('storeName').value.trim();
    const storeDescription = document.getElementById('storeDescription').value.trim();
    const storeLocation = document.getElementById('storeLocation').value;
    const contactEmail = document.getElementById('contactEmail').value.trim();
    const contactPhone = document.getElementById('contactPhone').value.trim();
    const websiteUrl = document.getElementById('websiteUrl').value.trim();

    // جمع روابط وسائل التواصل الاجتماعي
    const socialMedia = {};
    const socialFields = ['facebookUrl', 'twitterUrl', 'instagramUrl', 'linkedinUrl'];
    socialFields.forEach(field => {
      const value = document.getElementById(field)?.value?.trim();
      if (value) {
        socialMedia[field.replace('Url', '')] = value;
      }
    });

    return {
      name: storeName,
      description: storeDescription,
      location: storeLocation,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      owner_id: this.currentUser.id,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      website_url: websiteUrl || null,
      social_media: Object.keys(socialMedia).length > 0 ? socialMedia : null,
      is_approved: false,
      is_active: true
    };
  }

  // حفظ المتجر في قاعدة البيانات
  async saveStore(storeData) {
    try {
      const { data, error } = await this.supabase
        .from('stores')
        .insert(storeData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ تم حفظ المتجر بنجاح:', data);

      // تحديث نوع المستخدم إلى vendor إذا لم يكن كذلك
      if (this.currentUser.user_metadata?.user_type !== 'vendor') {
        await this.updateUserType('vendor');
      }

      return { success: true, data };

    } catch (error) {
      console.error('❌ خطأ في حفظ المتجر:', error);
      return { success: false, error: error.message };
    }
  }

  // تحديث نوع المستخدم
  async updateUserType(userType) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        data: { user_type: userType }
      });

      if (error) throw error;
      console.log('✅ تم تحديث نوع المستخدم بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تحديث نوع المستخدم:', error);
    }
  }

  // إظهار رسالة نجاح
  showSuccessMessage(message) {
    const successMsg = document.getElementById('successMsg');
    const successMsgText = document.getElementById('successMsgText');
    
    if (successMsg && successMsgText) {
      successMsgText.textContent = message;
      successMsg.classList.remove('hidden');
    }
  }

  // إظهار رسالة خطأ
  showMessage(message, type = 'error') {
    const errorMsg = document.getElementById('errorMsg');
    const errorMsgText = document.getElementById('errorMsgText');
    
    if (errorMsg && errorMsgText) {
      errorMsgText.textContent = message;
      errorMsg.classList.remove('hidden');
      
      // إخفاء الرسالة بعد 5 ثواني
      setTimeout(() => {
        errorMsg.classList.add('hidden');
      }, 5000);
    }
  }

  // إظهار شاشة التحميل
  showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  // إخفاء شاشة التحميل
  hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // تعطيل النموذج
  disableForm() {
    const form = document.getElementById('storeForm');
    const inputs = form?.querySelectorAll('input, textarea, select, button');
    inputs?.forEach(input => {
      input.disabled = true;
    });
  }

  // تفعيل النموذج
  enableForm() {
    const form = document.getElementById('storeForm');
    const inputs = form?.querySelectorAll('input, textarea, select');
    const submitBtn = document.getElementById('submitBtn');
    
    inputs?.forEach(input => {
      input.disabled = false;
    });
    
    if (submitBtn) {
      submitBtn.disabled = !this.validateForm();
    }
  }

  // تنظيف الموارد
  cleanup() {
    // تنظيف أي موارد مطلوبة
  }
}

// إنشاء مدير تسجيل المتاجر
const storeRegistrationManager = new StoreRegistrationManager();

// تصدير للاستخدام في الملفات الأخرى
window.storeRegistrationManager = storeRegistrationManager;

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  storeRegistrationManager.cleanup();
});

export { storeRegistrationManager, StoreRegistrationManager }; 