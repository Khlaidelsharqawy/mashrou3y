// نظام رفع الملفات المحسن - Enhanced File Upload System
import { getSupabaseClient } from './supabase-config.js';

class EnhancedUploadManager {
  constructor() {
    this.supabase = getSupabaseClient();
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv'
    ];
    this.uploadQueue = [];
    this.isUploading = false;
    this.currentUser = null;
    this.userStores = [];
    this.init();
  }

  // تهيئة نظام الرفع
  async init() {
    await this.checkUserAuth();
    this.initEventListeners();
    this.initDragAndDrop();
    this.initFormValidation();
    console.log('✅ تم تهيئة نظام رفع الملفات المحسن بنجاح');
  }

  // فحص مصادقة المستخدم
  async checkUserAuth() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        this.currentUser = user;
        await this.loadUserStores();
        this.showStoreSelection();
      } else {
        console.warn('⚠️ المستخدم غير مسجل دخول');
      }
    } catch (error) {
      console.error('❌ خطأ في فحص المصادقة:', error);
    }
  }

  // تحميل متاجر المستخدم
  async loadUserStores() {
    try {
      const { data: stores, error } = await this.supabase
        .from('stores')
        .select('*')
        .eq('owner_id', this.currentUser.id)
        .eq('is_active', true);

      if (error) throw error;
      
      this.userStores = stores || [];
      this.populateStoreDropdown();
    } catch (error) {
      console.error('❌ خطأ في تحميل المتاجر:', error);
    }
  }

  // ملء قائمة المتاجر
  populateStoreDropdown() {
    const storeSelect = document.getElementById('storeId');
    if (!storeSelect) return;

    // إزالة الخيارات الموجودة
    storeSelect.innerHTML = '<option value="">اختر المتجر...</option>';

    // إضافة متاجر المستخدم
    this.userStores.forEach(store => {
      const option = document.createElement('option');
      option.value = store.id;
      option.textContent = `${store.name} - ${store.location}`;
      storeSelect.appendChild(option);
    });

    // إذا كان المستخدم admin، إضافة خيار لرفع بدون متجر
    if (this.isAdmin()) {
      const option = document.createElement('option');
      option.value = 'no_store';
      option.textContent = 'رفع بدون متجر (للمواد العامة)';
      storeSelect.appendChild(option);
    }
  }

  // فحص إذا كان المستخدم admin
  isAdmin() {
    return this.currentUser?.user_metadata?.user_type === 'admin' || 
           this.currentUser?.user_metadata?.role === 'admin';
  }

  // إظهار اختيار المتجر
  showStoreSelection() {
    const storeSelection = document.getElementById('storeSelection');
    if (storeSelection && (this.userStores.length > 0 || this.isAdmin())) {
      storeSelection.classList.remove('hidden');
    }
  }

  // تهيئة مستمعي الأحداث
  initEventListeners() {
    // زر اختيار الملفات
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileSelection(e.target.files);
      });
    }

    // زر الرفع
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.startUpload();
      });
    }

    // زر إلغاء الرفع
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelUpload();
      });
    }

    // التحقق من صحة النموذج
    const form = document.getElementById('uploadForm');
    if (form) {
      form.addEventListener('input', () => {
        this.validateForm();
      });
    }
  }

  // تهيئة السحب والإفلات
  initDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    // منع السلوك الافتراضي للمتصفح
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // إضافة تأثيرات بصرية
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
      });
    });

    // معالجة إفلات الملفات
    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.handleFileSelection(files);
    });
  }

  // تهيئة التحقق من صحة النموذج
  initFormValidation() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    // التحقق من صحة النموذج عند التغيير
    form.addEventListener('input', () => {
      this.validateForm();
    });
  }

  // التحقق من صحة النموذج
  validateForm() {
    const title = document.getElementById('title')?.value?.trim();
    const type = document.getElementById('type')?.value;
    const price = document.getElementById('price')?.value;
    const storeId = document.getElementById('storeId')?.value;
    const uploadBtn = document.getElementById('uploadBtn');

    let isValid = true;
    let errorMessage = '';

    // التحقق من العنوان
    if (!title || title.length < 3) {
      isValid = false;
      errorMessage = 'العنوان مطلوب ويجب أن يكون 3 أحرف على الأقل';
    }

    // التحقق من النوع
    if (!type) {
      isValid = false;
      errorMessage = 'نوع المحتوى مطلوب';
    }

    // التحقق من السعر
    if (!price || parseFloat(price) < 0) {
      isValid = false;
      errorMessage = 'السعر مطلوب ويجب أن يكون 0 أو أكثر';
    }

    // التحقق من المتجر (إذا كان مطلوباً)
    if (document.getElementById('storeSelection') && !document.getElementById('storeSelection').classList.contains('hidden')) {
      if (!storeId) {
        isValid = false;
        errorMessage = 'اختيار المتجر مطلوب';
      }
    }

    // التحقق من وجود ملفات
    if (this.uploadQueue.length === 0) {
      isValid = false;
      errorMessage = 'يجب اختيار ملف واحد على الأقل';
    }

    // تحديث حالة الزر
    if (uploadBtn) {
      uploadBtn.disabled = !isValid;
      if (!isValid) {
        uploadBtn.title = errorMessage;
      } else {
        uploadBtn.title = 'رفع المحتوى';
      }
    }

    return isValid;
  }

  // معالجة اختيار الملفات
  handleFileSelection(files) {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // إظهار الأخطاء
    if (errors.length > 0) {
      this.showErrors(errors);
    }

    // إضافة الملفات الصحيحة للقائمة
    if (validFiles.length > 0) {
      this.addFilesToQueue(validFiles);
    }

    // التحقق من صحة النموذج
    this.validateForm();
  }

  // التحقق من صحة الملف
  validateFile(file) {
    // التحقق من حجم الملف
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `الملف كبير جداً (${this.formatFileSize(file.size)}). الحد الأقصى ${this.formatFileSize(this.maxFileSize)}`
      };
    }

    // التحقق من نوع الملف
    if (!this.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `نوع الملف غير مدعوم: ${file.type}`
      };
    }

    // التحقق من اسم الملف
    if (file.name.length > 100) {
      return {
        isValid: false,
        error: 'اسم الملف طويل جداً (الحد الأقصى 100 حرف)'
      };
    }

    // التحقق من عدم تكرار الملف
    const existingFile = this.uploadQueue.find(f => f.name === file.name);
    if (existingFile) {
      return {
        isValid: false,
        error: 'الملف موجود بالفعل في القائمة'
      };
    }

    return { isValid: true };
  }

  // إضافة الملفات للقائمة
  addFilesToQueue(files) {
    files.forEach(file => {
      const fileInfo = {
        id: this.generateFileId(),
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        error: null
      };

      this.uploadQueue.push(fileInfo);
    });

    this.updateFileList();
  }

  // تحديث قائمة الملفات
  updateFileList() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    if (this.uploadQueue.length === 0) {
      fileList.innerHTML = '<p class="text-gray-500 text-center py-8">لا توجد ملفات مختارة</p>';
      return;
    }

    fileList.innerHTML = this.uploadQueue.map(fileInfo => `
      <div class="file-item bg-white rounded-lg p-4 border ${this.getFileItemClass(fileInfo)}">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 space-x-reverse">
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="fas ${this.getFileIcon(fileInfo.type)} text-gray-500 text-lg"></i>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-800 truncate">${fileInfo.name}</div>
              <div class="text-sm text-gray-500">${this.formatFileSize(fileInfo.size)} • ${this.getFileTypeName(fileInfo.type)}</div>
            </div>
          </div>
          <div class="flex items-center space-x-2 space-x-reverse">
            ${this.getFileStatus(fileInfo)}
            <button onclick="uploadManager.removeFile('${fileInfo.id}')" 
                    class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        ${fileInfo.status === 'uploading' ? `
          <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${fileInfo.progress}%"></div>
            </div>
            <div class="text-sm text-gray-600 mt-1">${fileInfo.progress}%</div>
          </div>
        ` : ''}
        ${fileInfo.error ? `
          <div class="mt-2 text-sm text-red-600">
            <i class="fas fa-exclamation-triangle ml-1"></i>
            ${fileInfo.error}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // الحصول على فئة عنصر الملف
  getFileItemClass(fileInfo) {
    switch (fileInfo.status) {
      case 'uploading': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
      default: return 'border-gray-200';
    }
  }

  // الحصول على أيقونة الملف
  getFileIcon(type) {
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('word')) return 'fa-file-word';
    if (type.includes('powerpoint')) return 'fa-file-powerpoint';
    if (type.includes('excel')) return 'fa-file-excel';
    if (type.includes('image')) return 'fa-file-image';
    if (type.includes('video')) return 'fa-file-video';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'fa-file-archive';
    return 'fa-file';
  }

  // الحصول على اسم نوع الملف
  getFileTypeName(type) {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word')) return 'Word';
    if (type.includes('powerpoint')) return 'PowerPoint';
    if (type.includes('excel')) return 'Excel';
    if (type.includes('image')) return 'صورة';
    if (type.includes('video')) return 'فيديو';
    if (type.includes('zip')) return 'ZIP';
    if (type.includes('rar')) return 'RAR';
    if (type.includes('7z')) return '7Z';
    return 'ملف';
  }

  // الحصول على حالة الملف
  getFileStatus(fileInfo) {
    switch (fileInfo.status) {
      case 'pending':
        return '<span class="text-yellow-600"><i class="fas fa-clock"></i></span>';
      case 'uploading':
        return '<span class="text-blue-600"><i class="fas fa-spinner fa-spin"></i></span>';
      case 'completed':
        return '<span class="text-green-600"><i class="fas fa-check"></i></span>';
      case 'error':
        return '<span class="text-red-600"><i class="fas fa-exclamation-triangle"></i></span>';
      default:
        return '';
    }
  }

  // إزالة ملف من القائمة
  removeFile(fileId) {
    this.uploadQueue = this.uploadQueue.filter(file => file.id !== fileId);
    this.updateFileList();
    this.validateForm();
  }

  // بدء عملية الرفع
  async startUpload() {
    if (this.isUploading || this.uploadQueue.length === 0) return;

    // التحقق من صحة النموذج
    if (!this.validateForm()) {
      this.showMessage('يرجى إكمال جميع الحقول المطلوبة', 'error');
      return;
    }

    this.isUploading = true;
    this.showLoadingOverlay();
    this.showProgressBar();

    const pendingFiles = this.uploadQueue.filter(file => file.status === 'pending');
    let completedCount = 0;
    let uploadedFiles = [];

    try {
      for (const fileInfo of pendingFiles) {
        try {
          fileInfo.status = 'uploading';
          this.updateFileList();

          const result = await this.uploadFile(fileInfo);
          
          if (result.success) {
            fileInfo.status = 'completed';
            fileInfo.url = result.url;
            uploadedFiles.push(result);
            completedCount++;
          } else {
            fileInfo.status = 'error';
            fileInfo.error = result.error;
          }

          this.updateFileList();
          this.updateProgress((completedCount / pendingFiles.length) * 100);

        } catch (error) {
          console.error('خطأ في رفع الملف:', error);
          fileInfo.status = 'error';
          fileInfo.error = error.message;
          this.updateFileList();
        }
      }

      // حفظ معلومات المحتوى في قاعدة البيانات
      if (uploadedFiles.length > 0) {
        await this.saveContentMetadata(uploadedFiles);
      }

    } catch (error) {
      console.error('خطأ في عملية الرفع:', error);
      this.showMessage('حدث خطأ أثناء رفع المحتوى', 'error');
    }

    this.isUploading = false;
    this.hideLoadingOverlay();
    this.hideProgressBar();
    this.showUploadComplete(completedCount, pendingFiles.length);
  }

  // رفع ملف واحد
  async uploadFile(fileInfo) {
    try {
      // إنشاء اسم فريد للملف
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileName = `${timestamp}_${randomId}_${fileInfo.name}`;
      
      // تحديد مسار الملف بناءً على المتجر
      const storeId = document.getElementById('storeId')?.value;
      const filePath = storeId && storeId !== 'no_store' 
        ? `stores/${storeId}/${fileName}`
        : `uploads/${fileName}`;

      // رفع الملف إلى Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('files')
        .upload(filePath, fileInfo.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // الحصول على رابط التحميل
      const { data: urlData } = this.supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: fileName,
        filePath: filePath,
        fileInfo: fileInfo
      };

    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // حفظ معلومات المحتوى في قاعدة البيانات
  async saveContentMetadata(uploadedFiles) {
    try {
      const title = document.getElementById('title').value.trim();
      const description = document.getElementById('description').value.trim();
      const type = document.getElementById('type').value;
      const price = parseFloat(document.getElementById('price').value);
      const tags = document.getElementById('tags').value.trim();
      const storeId = document.getElementById('storeId')?.value;

      // تحويل الكلمات المفتاحية إلى مصفوفة
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      // إنشاء سجل المحتوى
      const contentData = {
        title: title,
        description: description,
        price: price,
        category: type,
        file_url: uploadedFiles[0].url, // الملف الرئيسي
        file_size: uploadedFiles[0].fileInfo.size,
        file_type: uploadedFiles[0].fileInfo.type,
        creator_id: this.currentUser.id,
        store_id: storeId && storeId !== 'no_store' ? storeId : null,
        is_approved: false,
        tags: tagsArray
      };

      const { data, error } = await this.supabase
        .from('store_items')
        .insert(contentData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ تم حفظ معلومات المحتوى بنجاح:', data);
      return data;

    } catch (error) {
      console.error('❌ خطأ في حفظ معلومات المحتوى:', error);
      throw error;
    }
  }

  // إلغاء عملية الرفع
  cancelUpload() {
    this.isUploading = false;
    this.hideLoadingOverlay();
    this.hideProgressBar();
    
    // إعادة تعيين حالة الملفات المرفوعة
    this.uploadQueue.forEach(file => {
      if (file.status === 'uploading') {
        file.status = 'pending';
        file.progress = 0;
      }
    });
    
    this.updateFileList();
    this.showMessage('تم إلغاء عملية الرفع', 'info');
  }

  // إظهار شريط التقدم
  showProgressBar() {
    const progressBar = document.getElementById('uploadProgress');
    if (progressBar) {
      progressBar.classList.remove('hidden');
    }
  }

  // إخفاء شريط التقدم
  hideProgressBar() {
    const progressBar = document.getElementById('uploadProgress');
    if (progressBar) {
      progressBar.classList.add('hidden');
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

  // تحديث التقدم
  updateProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${Math.round(percentage)}%`;
    }
  }

  // إظهار رسالة اكتمال الرفع
  showUploadComplete(completed, total) {
    if (completed === total) {
      this.showMessage(`تم رفع جميع الملفات بنجاح! 🎉 (${completed}/${total})`, 'success');
      // إعادة توجيه بعد ثانيتين
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    } else {
      this.showMessage(`تم رفع ${completed} من ${total} ملفات. بعض الملفات فشلت في الرفع.`, 'warning');
    }
  }

  // إظهار الأخطاء
  showErrors(errors) {
    const errorMessage = errors.join('\n');
    this.showMessage(`أخطاء في الملفات:\n${errorMessage}`, 'error');
  }

  // إظهار رسالة
  showMessage(message, type = 'info') {
    // إزالة الرسائل السابقة
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => msg.remove());

    const messageElement = document.createElement('div');
    messageElement.className = `message-toast fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    const typeClasses = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    };
    
    messageElement.classList.add(typeClasses[type] || typeClasses.info);
    
    messageElement.innerHTML = `
      <div class="flex items-center space-x-3 space-x-reverse">
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="mr-auto">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
      messageElement.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
      messageElement.classList.add('translate-x-full');
      setTimeout(() => {
        if (messageElement.parentElement) {
          messageElement.remove();
        }
      }, 300);
    }, 5000);
  }

  // تنسيق حجم الملف
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // إنشاء معرف فريد للملف
  generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // تنظيف الموارد
  cleanup() {
    this.uploadQueue = [];
    this.isUploading = false;
  }
}

// إنشاء مدير الرفع المحسن
const uploadManager = new EnhancedUploadManager();

// تصدير للاستخدام في الملفات الأخرى
window.uploadManager = uploadManager;

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  uploadManager.cleanup();
});

export { uploadManager, EnhancedUploadManager }; 