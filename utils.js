// ملف الأدوات المساعدة - Utilities File

// أدوات تحسين الأداء
class PerformanceUtils {
  // قياس وقت التنفيذ
  static measureTime(fn, name = 'Function') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    return result;
  }

  // تحميل كسول للصور
  static lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // تحسين التمرير
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // تحسين النقر
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // تحسين حجم الصور
  static optimizeImageSize(file, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}

// أدوات الأمان
class SecurityUtils {
  // تنظيف النصوص المدخلة
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // إزالة علامات HTML
      .replace(/javascript:/gi, '') // إزالة JavaScript
      .replace(/on\w+=/gi, '') // إزالة event handlers
      .trim();
  }

  // التحقق من صحة الإيميل
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // حساب قوة كلمة المرور
  static calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    if (score <= 2) return 'ضعيف';
    if (score <= 4) return 'متوسط';
    if (score <= 5) return 'قوي';
    return 'قوي جداً';
  }

  // تشفير بسيط للنصوص
  static encrypt(text, key = 'mashrou3y') {
    return btoa(text + key);
  }

  // فك التشفير
  static decrypt(encryptedText, key = 'mashrou3y') {
    try {
      const decoded = atob(encryptedText);
      return decoded.replace(key, '');
    } catch {
      return null;
    }
  }
}

// أدوات التنسيق
class FormatUtils {
  // تنسيق التاريخ
  static formatDate(date, locale = 'ar-EG') {
    const d = new Date(date);
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // تنسيق الوقت
  static formatTime(date, locale = 'ar-EG') {
    const d = new Date(date);
    return d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // تنسيق التاريخ والوقت
  static formatDateTime(date, locale = 'ar-EG') {
    return `${this.formatDate(date, locale)} ${this.formatTime(date, locale)}`;
  }

  // تنسيق الوقت النسبي
  static formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `منذ ${years} سنة`;
    if (months > 0) return `منذ ${months} شهر`;
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
  }

  // تنسيق الأرقام
  static formatNumber(number, locale = 'ar-EG') {
    return new Intl.NumberFormat(locale).format(number);
  }

  // تنسيق العملة
  static formatCurrency(amount, currency = 'EGP', locale = 'ar-EG') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // تنسيق حجم الملف
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // تنسيق النص المطول
  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // تنسيق رقم الهاتف
  static formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phone;
  }
}

// أدوات التخزين
class StorageUtils {
  // حفظ البيانات
  static set(key, value, expires = null) {
    const data = {
      value,
      timestamp: Date.now()
    };
    
    if (expires) {
      data.expires = expires;
    }
    
    localStorage.setItem(key, JSON.stringify(data));
  }

  // استرجاع البيانات
  static get(key) {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    try {
      const data = JSON.parse(item);
      
      if (data.expires && Date.now() > data.timestamp + data.expires) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data.value;
    } catch {
      return null;
    }
  }

  // حذف البيانات
  static remove(key) {
    localStorage.removeItem(key);
  }

  // مسح جميع البيانات
  static clear() {
    localStorage.clear();
  }

  // التحقق من وجود البيانات
  static has(key) {
    return this.get(key) !== null;
  }

  // الحصول على حجم التخزين المستخدم
  static getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }
}

// أدوات التحقق
class ValidationUtils {
  // التحقق من صحة النص
  static isValidText(text, minLength = 1, maxLength = 1000) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
  }

  // التحقق من صحة الرقم
  static isValidNumber(number, min = null, max = null) {
    const num = Number(number);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  }

  // التحقق من صحة الملف
  static isValidFile(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
    if (!file || !(file instanceof File)) return false;
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return false;
    }
    
    if (file.size > maxSize) {
      return false;
    }
    
    return true;
  }

  // التحقق من صحة الصورة
  static isValidImage(file, maxSize = 5 * 1024 * 1024) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return this.isValidFile(file, allowedTypes, maxSize);
  }

  // التحقق من صحة المستند
  static isValidDocument(file, maxSize = 10 * 1024 * 1024) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    return this.isValidFile(file, allowedTypes, maxSize);
  }
}

// أدوات الشبكة
class NetworkUtils {
  // التحقق من الاتصال بالإنترنت
  static isOnline() {
    return navigator.onLine;
  }

  // الاستماع لتغييرات الاتصال
  static onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // إعادة المحاولة مع تأخير
  static async retry(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // تحميل الملفات
  static async downloadFile(url, filename) {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// أدوات DOM
class DOMUtils {
  // إنشاء عنصر
  static createElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }

  // إضافة مستمع الأحداث
  static addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  }

  // إزالة عنصر
  static removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  // إخفاء عنصر
  static hideElement(element) {
    element.style.display = 'none';
  }

  // إظهار عنصر
  static showElement(element, display = 'block') {
    element.style.display = display;
  }

  // تبديل إظهار/إخفاء عنصر
  static toggleElement(element, display = 'block') {
    if (element.style.display === 'none') {
      this.showElement(element, display);
    } else {
      this.hideElement(element);
    }
  }

  // تمرير سلس
  static smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  // نسخ النص
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }
}

// تصدير جميع الأدوات
export {
  PerformanceUtils,
  SecurityUtils,
  FormatUtils,
  StorageUtils,
  ValidationUtils,
  NetworkUtils,
  DOMUtils
};

// إضافة للكائن العالمي للاستخدام المباشر
window.PerformanceUtils = PerformanceUtils;
window.SecurityUtils = SecurityUtils;
window.FormatUtils = FormatUtils;
window.StorageUtils = StorageUtils;
window.ValidationUtils = ValidationUtils;
window.NetworkUtils = NetworkUtils;
window.DOMUtils = DOMUtils; 