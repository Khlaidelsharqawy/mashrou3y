// إدارة الأمان والتحقق من الصلاحيات

import { supabase } from './supabase-config.js';

// التحقق من صلاحيات المستخدم
export class SecurityManager {
  // التحقق من تسجيل الدخول
  static async checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error checking auth:', error);
      return null;
    }
  }

  // التحقق من صلاحيات المدير
  static async checkAdminAuth() {
    try {
      const session = await this.checkAuth();
      if (!session) {
        return { isAdmin: false, user: null, session: null };
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !user) {
        return { isAdmin: false, user: null, session };
      }

      return {
        isAdmin: user.is_admin === true,
        user,
        session
      };
    } catch (error) {
      console.error('Error checking admin auth:', error);
      return { isAdmin: false, user: null, session: null };
    }
  }

  // التحقق من صلاحيات الوصول لمادة معينة
  static async checkMaterialAccess(materialId) {
    try {
      const session = await this.checkAuth();
      if (!session) {
        return { hasAccess: false, user: null };
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!user) {
        return { hasAccess: false, user: null };
      }

      const { data: access } = await supabase
        .from('access_by_phone')
        .select('*')
        .eq('phone_number', user.phone_number)
        .eq('material_id', materialId)
        .eq('granted', true)
        .single();

      return {
        hasAccess: !!access,
        user
      };
    } catch (error) {
      console.error('Error checking material access:', error);
      return { hasAccess: false, user: null };
    }
  }

  // التحقق من صحة البيانات المدخلة
  static validateInput(input, type = 'text') {
    const validators = {
      text: (value) => {
        if (!value || typeof value !== 'string') return false;
        if (value.length < 1 || value.length > 500) return false;
        // منع XSS
        const dangerousPatterns = /<script|javascript:|on\w+\s*=|data:text\/html/i;
        return !dangerousPatterns.test(value);
      },
      phone: (value) => {
        if (!value || typeof value !== 'string') return false;
        const phoneRegex = /^\+20\d{10}$/;
        return phoneRegex.test(value);
      },
      email: (value) => {
        if (!value || typeof value !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      url: (value) => {
        if (!value || typeof value !== 'string') return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      number: (value) => {
        if (value === null || value === undefined) return false;
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      },
      price: (value) => {
        if (value === null || value === undefined) return false;
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 && num <= 10000;
      }
    };

    return validators[type] ? validators[type](input) : true;
  }

  // تنظيف البيانات المدخلة
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // إزالة علامات HTML
      .replace(/javascript:/gi, '') // إزالة javascript:
      .replace(/on\w+\s*=/gi, '') // إزالة event handlers
      .trim();
  }

  // تشفير البيانات الحساسة (بسيط)
  static encryptData(data) {
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      console.error('Error encrypting data:', error);
      return null;
    }
  }

  // فك تشفير البيانات
  static decryptData(encryptedData) {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }

  // إنشاء token عشوائي
  static generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // التحقق من صحة CSRF token
  static validateCSRFToken(token) {
    const storedToken = localStorage.getItem('csrf_token');
    return token === storedToken;
  }

  // إنشاء CSRF token
  static generateCSRFToken() {
    const token = this.generateToken();
    localStorage.setItem('csrf_token', token);
    return token;
  }

  // التحقق من صحة reCAPTCHA (إذا كان مستخدماً)
  static async validateRecaptcha(token) {
    // يمكن إضافة التحقق من reCAPTCHA هنا
    return true;
  }

  // منع تكرار الطلبات
  static rateLimit = new Map();

  static checkRateLimit(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const userRequests = this.rateLimit.get(key) || [];

    // إزالة الطلبات القديمة
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false; // تجاوز الحد المسموح
    }

    // إضافة الطلب الحالي
    recentRequests.push(now);
    this.rateLimit.set(key, recentRequests);

    return true; // ضمن الحد المسموح
  }

  // تنظيف rate limit cache
  static cleanRateLimit() {
    const now = Date.now();
    for (const [key, requests] of this.rateLimit.entries()) {
      const recentRequests = requests.filter(time => now - time < 60000);
      if (recentRequests.length === 0) {
        this.rateLimit.delete(key);
      } else {
        this.rateLimit.set(key, recentRequests);
      }
    }
  }

  // التحقق من صحة الملف المرفوع
  static validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) {
    if (!file) return { valid: false, error: 'لا يوجد ملف' };
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'نوع الملف غير مسموح به' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'حجم الملف كبير جداً' };
    }
    
    return { valid: true, error: null };
  }

  // التحقق من صحة الصورة
  static validateImage(file) {
    return this.validateFile(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 10 * 1024 * 1024);
  }

  // التحقق من صحة المستند
  static validateDocument(file) {
    return this.validateFile(file, [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ], 50 * 1024 * 1024);
  }

  // تشفير كلمة المرور (بسيط - للعرض فقط)
  static hashPassword(password) {
    // في التطبيق الحقيقي، استخدم bcrypt أو argon2
    return btoa(password + 'salt');
  }

  // التحقق من قوة كلمة المرور
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`كلمة المرور يجب أن تكون ${minLength} أحرف على الأقل`);
    }
    if (!hasUpperCase) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير');
    }
    if (!hasLowerCase) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير');
    }
    if (!hasNumbers) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم');
    }
    if (!hasSpecialChar) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // منع SQL Injection (بسيط)
  static sanitizeSQL(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/'/g, "''")
      .replace(/--/g, '')
      .replace(/;/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  // التحقق من صحة UUID
  static validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // تنظيف URL
  static sanitizeURL(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      return null;
    }
  }

  // التحقق من صحة التاريخ
  static validateDate(date) {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }

  // تنظيف HTML
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
}

// تشغيل تنظيف rate limit كل دقيقة
setInterval(() => {
  SecurityManager.cleanRateLimit();
}, 60000);

export default SecurityManager; 