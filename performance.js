// إدارة الأداء والتحسينات

// إدارة التخزين المؤقت
export class CacheManager {
  static cache = new Map();
  static maxSize = 100; // الحد الأقصى لعدد العناصر في التخزين المؤقت

  // إضافة عنصر للتخزين المؤقت
  static set(key, value, ttl = 300000) { // TTL افتراضي 5 دقائق
    if (this.cache.size >= this.maxSize) {
      // إزالة أقدم عنصر
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  // الحصول على عنصر من التخزين المؤقت
  static get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      // انتهت صلاحية العنصر
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // إزالة عنصر من التخزين المؤقت
  static delete(key) {
    return this.cache.delete(key);
  }

  // مسح التخزين المؤقت بالكامل
  static clear() {
    this.cache.clear();
  }

  // الحصول على حجم التخزين المؤقت
  static size() {
    return this.cache.size;
  }

  // تنظيف العناصر منتهية الصلاحية
  static cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// إدارة تحميل الصور
export class ImageLoader {
  static loadedImages = new Set();
  static loadingImages = new Map();

  // تحميل صورة مع التخزين المؤقت
  static async loadImage(src, options = {}) {
    const {
      cache = true,
      placeholder = null,
      onLoad = null,
      onError = null
    } = options;

    // التحقق من التخزين المؤقت
    if (cache && this.loadedImages.has(src)) {
      if (onLoad) onLoad(src);
      return src;
    }

    // التحقق من الصور قيد التحميل
    if (this.loadingImages.has(src)) {
      return this.loadingImages.get(src);
    }

    // إنشاء وعد جديد للتحميل
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(src);
        this.loadingImages.delete(src);
        if (onLoad) onLoad(src);
        resolve(src);
      };

      img.onerror = () => {
        this.loadingImages.delete(src);
        if (onError) onError(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });

    this.loadingImages.set(src, loadPromise);
    return loadPromise;
  }

  // تحميل مجموعة من الصور
  static async loadImages(sources, options = {}) {
    const promises = sources.map(src => this.loadImage(src, options));
    return Promise.allSettled(promises);
  }

  // تحميل الصور بشكل تدريجي
  static async loadImagesLazy(sources, options = {}) {
    const results = [];
    for (const src of sources) {
      try {
        const result = await this.loadImage(src, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to load image: ${src}`, error);
      }
    }
    return results;
  }

  // تنظيف الصور المحملة
  static cleanup() {
    this.loadedImages.clear();
    this.loadingImages.clear();
  }
}

// إدارة تحميل البيانات
export class DataLoader {
  static pendingRequests = new Map();

  // تحميل البيانات مع التخزين المؤقت
  static async loadData(key, loader, options = {}) {
    const {
      cache = true,
      ttl = 300000, // 5 دقائق
      forceRefresh = false
    } = options;

    // التحقق من التخزين المؤقت
    if (cache && !forceRefresh) {
      const cached = CacheManager.get(key);
      if (cached) return cached;
    }

    // التحقق من الطلبات المعلقة
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // إنشاء طلب جديد
    const requestPromise = loader().then(data => {
      if (cache) {
        CacheManager.set(key, data, ttl);
      }
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  // تحميل البيانات بشكل متوازي
  static async loadDataParallel(requests) {
    const promises = requests.map(({ key, loader, options }) => 
      this.loadData(key, loader, options)
    );
    return Promise.allSettled(promises);
  }

  // تحميل البيانات بشكل متسلسل
  static async loadDataSequential(requests) {
    const results = [];
    for (const { key, loader, options } of requests) {
      try {
        const result = await this.loadData(key, loader, options);
        results.push({ key, data: result, success: true });
      } catch (error) {
        results.push({ key, error, success: false });
      }
    }
    return results;
  }

  // إلغاء الطلبات المعلقة
  static cancelRequest(key) {
    if (this.pendingRequests.has(key)) {
      this.pendingRequests.delete(key);
    }
  }

  // تنظيف الطلبات المعلقة
  static cleanup() {
    this.pendingRequests.clear();
  }
}

// إدارة الأداء
export class PerformanceManager {
  static metrics = {
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0
  };

  // بدء قياس الأداء
  static startPerformanceMonitoring() {
    // قياس وقت تحميل الصفحة
    window.addEventListener('load', () => {
      this.metrics.pageLoadTime = performance.now();
      this.logMetric('Page Load Time', this.metrics.pageLoadTime);
    });

    // قياس DOM Content Loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.metrics.domContentLoaded = performance.now();
      this.logMetric('DOM Content Loaded', this.metrics.domContentLoaded);
    });

    // قياس First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
            this.logMetric('First Contentful Paint', this.metrics.firstContentfulPaint);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }

    // قياس Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.largestContentfulPaint = entry.startTime;
          this.logMetric('Largest Contentful Paint', this.metrics.largestContentfulPaint);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  // تسجيل المقاييس
  static logMetric(name, value) {
    console.log(`Performance Metric - ${name}: ${value.toFixed(2)}ms`);
    
    // يمكن إرسال المقاييس إلى خدمة تحليلات
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value
      });
    }
  }

  // قياس أداء دالة
  static measureFunction(name, fn) {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        this.logMetric(`Function: ${name}`, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.logMetric(`Function: ${name} (Error)`, duration);
        throw error;
      }
    };
  }

  // قياس أداء دالة متزامنة
  static measureSyncFunction(name, fn) {
    return (...args) => {
      const start = performance.now();
      try {
        const result = fn(...args);
        const duration = performance.now() - start;
        this.logMetric(`Sync Function: ${name}`, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.logMetric(`Sync Function: ${name} (Error)`, duration);
        throw error;
      }
    };
  }

  // الحصول على معلومات الذاكرة
  static getMemoryInfo() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // تنظيف الذاكرة
  static cleanupMemory() {
    // تنظيف التخزين المؤقت
    CacheManager.cleanup();
    
    // تنظيف الصور
    ImageLoader.cleanup();
    
    // تنظيف الطلبات
    DataLoader.cleanup();
    
    // إجبار جمع القمامة (إذا كان متاحاً)
    if (window.gc) {
      window.gc();
    }
  }
}

// إدارة التحميل التدريجي
export class LazyLoader {
  static observer = null;
  static elements = new Map();

  // تهيئة المراقب
  static init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const callback = this.elements.get(element);
            if (callback) {
              callback();
              this.elements.delete(element);
              this.observer.unobserve(element);
            }
          }
        });
      }, {
        rootMargin: '50px'
      });
    }
  }

  // إضافة عنصر للتحميل التدريجي
  static add(element, callback) {
    if (this.observer) {
      this.elements.set(element, callback);
      this.observer.observe(element);
    } else {
      // Fallback للمتصفحات القديمة
      callback();
    }
  }

  // إزالة عنصر من المراقب
  static remove(element) {
    if (this.observer) {
      this.elements.delete(element);
      this.observer.unobserve(element);
    }
  }

  // تنظيف المراقب
  static cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elements.clear();
  }
}

// إدارة التحميل المسبق
export class Preloader {
  static preloaded = new Set();

  // تحميل مسبق لصورة
  static preloadImage(src) {
    if (this.preloaded.has(src)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    this.preloaded.add(src);
  }

  // تحميل مسبق لصفحة
  static preloadPage(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  // تحميل مسبق لملف CSS
  static preloadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  }

  // تحميل مسبق لملف JavaScript
  static preloadJS(src) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  }
}

// تهيئة مديري الأداء
export function initPerformance() {
  // بدء مراقبة الأداء
  PerformanceManager.startPerformanceMonitoring();
  
  // تهيئة التحميل التدريجي
  LazyLoader.init();
  
  // تنظيف دوري للذاكرة
  setInterval(() => {
    PerformanceManager.cleanupMemory();
  }, 300000); // كل 5 دقائق
  
  // تنظيف التخزين المؤقت
  setInterval(() => {
    CacheManager.cleanup();
  }, 60000); // كل دقيقة
}

export default {
  CacheManager,
  ImageLoader,
  DataLoader,
  PerformanceManager,
  LazyLoader,
  Preloader,
  initPerformance
}; 