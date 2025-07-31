// إدارة تجربة المستخدم والتفاعل

import { NotificationManager } from './utils.js';

// إدارة التحميل والانتقالات
export class UXManager {
  static loadingStates = new Map();
  static transitions = new Map();

  // إظهار حالة التحميل
  static showLoading(element, message = 'جاري التحميل...') {
    const loadingId = `loading-${Date.now()}-${Math.random()}`;
    
    const loadingElement = document.createElement('div');
    loadingElement.id = loadingId;
    loadingElement.className = 'loading-overlay';
    loadingElement.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">${message}</p>
      </div>
    `;

    element.style.position = 'relative';
    element.appendChild(loadingElement);
    
    this.loadingStates.set(element, loadingId);
    
    // إضافة CSS للتحميل
    this.addLoadingStyles();
  }

  // إخفاء حالة التحميل
  static hideLoading(element) {
    const loadingId = this.loadingStates.get(element);
    if (loadingId) {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
      this.loadingStates.delete(element);
    }
  }

  // إضافة أنماط التحميل
  static addLoadingStyles() {
    if (document.getElementById('loading-styles')) return;

    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }
      
      .loading-content {
        text-align: center;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      .loading-text {
        color: #6b7280;
        font-size: 0.875rem;
        margin: 0;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // إضافة انتقال سلس
  static addTransition(element, type = 'fade') {
    const transitionId = `transition-${Date.now()}-${Math.random()}`;
    
    element.id = transitionId;
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    this.transitions.set(transitionId, { element, type });
    
    requestAnimationFrame(() => {
      element.style.transition = 'all 0.5s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }

  // إضافة تأثير النقر
  static addClickEffect(element) {
    element.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      this.style.position = 'relative';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // إضافة تأثير التمرير
  static addScrollEffect(element, threshold = 0.1) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold });

    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'all 0.6s ease';
    
    observer.observe(element);
  }
}

// إدارة النماذج والتفاعل
export class FormUXManager {
  // تحسين تجربة النماذج
  static enhanceForm(form) {
    // إضافة تأثيرات للحقول
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      this.enhanceInput(input);
    });

    // إضافة تأثيرات للأزرار
    const buttons = form.querySelectorAll('button');
    buttons.forEach(button => {
      UXManager.addClickEffect(button);
    });

    // إضافة التحقق المباشر
    this.addRealTimeValidation(form);
  }

  // تحسين تجربة الحقول
  static enhanceInput(input) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    wrapper.style.position = 'relative';
    
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    
    // إضافة تأثير التركيز
    input.addEventListener('focus', () => {
      wrapper.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      wrapper.classList.remove('focused');
    });

    // إضافة تأثير التحميل
    input.addEventListener('input', () => {
      wrapper.classList.add('typing');
      clearTimeout(wrapper.timeout);
      wrapper.timeout = setTimeout(() => {
        wrapper.classList.remove('typing');
      }, 1000);
    });
  }

  // إضافة التحقق المباشر
  static addRealTimeValidation(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
      
      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
  }

  // التحقق من حقل
  static validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    
    if (required && !value) {
      this.showFieldError(field, 'هذا الحقل مطلوب');
      return false;
    }
    
    if (value) {
      switch (type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            this.showFieldError(field, 'البريد الإلكتروني غير صحيح');
            return false;
          }
          break;
        case 'tel':
          if (!/^\+20\d{10}$/.test(value)) {
            this.showFieldError(field, 'رقم الهاتف يجب أن يبدأ بـ +20 ويحتوي على 10 أرقام');
            return false;
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            this.showFieldError(field, 'الرابط غير صحيح');
            return false;
          }
          break;
      }
    }
    
    this.showFieldSuccess(field);
    return true;
  }

  // إظهار خطأ في الحقل
  static showFieldError(field, message) {
    this.clearFieldError(field);
    
    const error = document.createElement('div');
    error.className = 'field-error';
    error.textContent = message;
    error.style.cssText = `
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      animation: slideIn 0.3s ease;
    `;
    
    field.parentNode.appendChild(error);
    field.style.borderColor = '#ef4444';
  }

  // إظهار نجاح الحقل
  static showFieldSuccess(field) {
    this.clearFieldError(field);
    field.style.borderColor = '#10b981';
  }

  // مسح خطأ الحقل
  static clearFieldError(field) {
    const error = field.parentNode.querySelector('.field-error');
    if (error) {
      error.remove();
    }
    field.style.borderColor = '';
  }
}

// إدارة التنقل والتفاعل
export class NavigationUXManager {
  // إضافة تأثيرات التنقل
  static enhanceNavigation(nav) {
    const links = nav.querySelectorAll('a, button');
    
    links.forEach(link => {
      // إضافة تأثير النقر
      UXManager.addClickEffect(link);
      
      // إضافة تأثير التمرير
      link.addEventListener('mouseenter', () => {
        link.style.transform = 'translateY(-2px)';
      });
      
      link.addEventListener('mouseleave', () => {
        link.style.transform = 'translateY(0)';
      });
    });
  }

  // إضافة شريط التقدم
  static addProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
      z-index: 9999;
      transition: width 0.3s ease;
    `;
    
    document.body.appendChild(progressBar);
    
    // تحديث شريط التقدم عند التمرير
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      progressBar.style.width = scrollPercent + '%';
    });
  }

  // إضافة زر العودة للأعلى
  static addBackToTop() {
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '↑';
    backToTop.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 50px;
      height: 50px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    `;
    
    document.body.appendChild(backToTop);
    
    // إظهار/إخفاء الزر
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTop.style.opacity = '1';
        backToTop.style.visibility = 'visible';
      } else {
        backToTop.style.opacity = '0';
        backToTop.style.visibility = 'hidden';
      }
    });
    
    // التمرير للأعلى
    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    UXManager.addClickEffect(backToTop);
  }
}

// إدارة البطاقات والتفاعل
export class CardUXManager {
  // تحسين تجربة البطاقات
  static enhanceCards(container) {
    const cards = container.querySelectorAll('.card, [class*="card"]');
    
    cards.forEach((card, index) => {
      // إضافة تأثير التمرير
      UXManager.addScrollEffect(card, 0.1);
      
      // إضافة تأثير التحويم
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '';
      });
      
      // إضافة تأثير النقر
      UXManager.addClickEffect(card);
      
      // تأخير ظهور البطاقات
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // إضافة تأثير التحميل للبطاقات
  static addCardSkeleton(container, count = 6) {
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'card-skeleton';
      skeleton.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      `;
      skeleton.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: pulse 1.5s ease-in-out infinite;
      `;
      
      container.appendChild(skeleton);
    }
    
    // إضافة أنماط الهيكل العظمي
    this.addSkeletonStyles();
  }

  // إضافة أنماط الهيكل العظمي
  static addSkeletonStyles() {
    if (document.getElementById('skeleton-styles')) return;

    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
      .skeleton-image {
        width: 100%;
        height: 200px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: 8px;
        margin-bottom: 1rem;
        animation: shimmer 1.5s infinite;
      }
      
      .skeleton-title {
        width: 80%;
        height: 24px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        margin-bottom: 0.5rem;
        animation: shimmer 1.5s infinite;
      }
      
      .skeleton-text {
        width: 100%;
        height: 16px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        margin-bottom: 0.5rem;
        animation: shimmer 1.5s infinite;
      }
      
      .skeleton-text.short {
        width: 60%;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
}

// إدارة الإشعارات والتنبيهات
export class NotificationUXManager {
  // إضافة إشعار نجاح
  static showSuccess(message, duration = 3000) {
    NotificationManager.show(message, 'success', duration);
  }

  // إضافة إشعار خطأ
  static showError(message, duration = 5000) {
    NotificationManager.show(message, 'error', duration);
  }

  // إضافة إشعار تحذير
  static showWarning(message, duration = 4000) {
    NotificationManager.show(message, 'warning', duration);
  }

  // إضافة إشعار معلومات
  static showInfo(message, duration = 3000) {
    NotificationManager.show(message, 'info', duration);
  }

  // إضافة تأكيد
  static async showConfirm(message, title = 'تأكيد') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      modal.innerHTML = `
        <div class="confirm-content">
          <h3>${title}</h3>
          <p>${message}</p>
          <div class="confirm-buttons">
            <button class="btn-cancel">إلغاء</button>
            <button class="btn-confirm">تأكيد</button>
          </div>
        </div>
      `;
      
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      `;
      
      document.body.appendChild(modal);
      
      const confirmBtn = modal.querySelector('.btn-confirm');
      const cancelBtn = modal.querySelector('.btn-cancel');
      
      confirmBtn.addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });
      
      cancelBtn.addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });
      
      this.addModalStyles();
    });
  }

  // إضافة أنماط النافذة المنبثقة
  static addModalStyles() {
    if (document.getElementById('modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .confirm-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
      }
      
      .confirm-content h3 {
        margin: 0 0 1rem 0;
        color: #1f2937;
      }
      
      .confirm-content p {
        margin: 0 0 1.5rem 0;
        color: #6b7280;
      }
      
      .confirm-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
      
      .btn-cancel, .btn-confirm {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .btn-cancel {
        background: #f3f4f6;
        color: #6b7280;
      }
      
      .btn-confirm {
        background: #ef4444;
        color: white;
      }
      
      .btn-cancel:hover {
        background: #e5e7eb;
      }
      
      .btn-confirm:hover {
        background: #dc2626;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
}

// تهيئة مديري تجربة المستخدم
export function initUX() {
  // إضافة شريط التقدم
  NavigationUXManager.addProgressBar();
  
  // إضافة زر العودة للأعلى
  NavigationUXManager.addBackToTop();
  
  // تحسين النماذج
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    FormUXManager.enhanceForm(form);
  });
  
  // تحسين التنقل
  const navs = document.querySelectorAll('nav');
  navs.forEach(nav => {
    NavigationUXManager.enhanceNavigation(nav);
  });
  
  // تحسين البطاقات
  const cardContainers = document.querySelectorAll('.grid, [class*="grid"]');
  cardContainers.forEach(container => {
    CardUXManager.enhanceCards(container);
  });
}

export default {
  UXManager,
  FormUXManager,
  NavigationUXManager,
  CardUXManager,
  NotificationUXManager,
  initUX
}; 