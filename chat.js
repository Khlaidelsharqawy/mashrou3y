// نظام المحادثة المباشرة - Real-time Chat System
import { getSupabaseClient } from './supabase-config.js';

class ChatManager {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.messages = [];
    this.isConnected = false;
    this.realtimeSubscription = null;
    this.messageQueue = [];
    this.isTyping = false;
    this.typingUsers = new Set();
    this.init();
  }

  // تهيئة نظام المحادثة
  async init() {
    try {
      await this.getCurrentUser();
      await this.loadMessageHistory();
      this.initEventListeners();
      this.initRealtimeConnection();
      this.initTypingIndicator();
      console.log('✅ تم تهيئة نظام المحادثة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام المحادثة:', error);
    }
  }

  // الحصول على المستخدم الحالي
  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
      
      if (!user) {
        this.showMessage('محتاج تسجل دخول الأول يا نجم 😅', 'warning');
        return;
      }
    } catch (error) {
      console.error('خطأ في الحصول على المستخدم:', error);
    }
  }

  // تحميل سجل الرسائل
  async loadMessageHistory() {
    try {
      const { data: messages, error } = await this.supabase
        .from('chat_messages')
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            user_type,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.messages = (messages || []).reverse();
      this.renderMessages();
      this.scrollToBottom();

    } catch (error) {
      console.error('خطأ في تحميل سجل الرسائل:', error);
      this.showMessage('مش عارف أحمل الرسائل، جرب تاني 😅', 'error');
    }
  }

  // تهيئة مستمعي الأحداث
  initEventListeners() {
    // زر إرسال الرسالة
    const sendBtn = document.getElementById('sendMessageBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // حقل إدخال الرسالة
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      // إرسال بالضغط على Enter
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // مؤشر الكتابة
      messageInput.addEventListener('input', () => {
        this.handleTyping();
      });

      // إيقاف مؤشر الكتابة عند ترك الحقل
      messageInput.addEventListener('blur', () => {
        this.stopTyping();
      });
    }

    // زر رفع الملف
    const fileBtn = document.getElementById('fileUploadBtn');
    if (fileBtn) {
      fileBtn.addEventListener('click', () => {
        this.openFileUpload();
      });
    }

    // زر إرسال الصورة
    const imageBtn = document.getElementById('imageUploadBtn');
    if (imageBtn) {
      imageBtn.addEventListener('click', () => {
        this.openImageUpload();
      });
    }

    // زر تنظيف المحادثة
    const clearBtn = document.getElementById('clearChatBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearChat();
      });
    }
  }

  // تهيئة الاتصال المباشر
  initRealtimeConnection() {
    try {
      this.realtimeSubscription = this.supabase
        .channel('chat_messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'chat_messages' },
          (payload) => {
            this.handleRealtimeMessage(payload);
          }
        )
        .on('presence', { event: 'sync' }, () => {
          console.log('🔄 مزامنة الحضور');
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 انضم مستخدم:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 غادر مستخدم:', leftPresences);
        })
        .subscribe((status) => {
          this.isConnected = status === 'SUBSCRIBED';
          this.updateConnectionStatus();
        });

    } catch (error) {
      console.error('خطأ في الاتصال المباشر:', error);
    }
  }

  // تهيئة مؤشر الكتابة
  initTypingIndicator() {
    // إضافة مؤشر الكتابة للصفحة
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typingIndicator';
    typingIndicator.className = 'hidden p-2 text-sm text-gray-500 italic';
    typingIndicator.innerHTML = '<i class="fas fa-pencil-alt ml-1"></i>شخص بيكتب...';
    
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
      chatContainer.appendChild(typingIndicator);
    }
  }

  // معالجة الرسائل المباشرة
  handleRealtimeMessage(payload) {
    switch (payload.eventType) {
      case 'INSERT':
        this.addNewMessage(payload.new);
        break;
      case 'UPDATE':
        this.updateMessage(payload.new);
        break;
      case 'DELETE':
        this.removeMessage(payload.old.id);
        break;
    }
  }

  // إضافة رسالة جديدة
  async addNewMessage(messageData) {
    try {
      // الحصول على بيانات المستخدم إذا لم تكن موجودة
      if (!messageData.users) {
        const { data: user } = await this.supabase
          .from('users')
          .select('id, full_name, user_type, avatar_url')
          .eq('id', messageData.user_id)
          .single();
        
        messageData.users = user;
      }

      // إضافة الرسالة للمصفوفة
      this.messages.push(messageData);
      
      // عرض الرسالة
      this.renderMessage(messageData);
      this.scrollToBottom();

      // إظهار إشعار إذا كانت الرسالة من مستخدم آخر
      if (messageData.user_id !== this.currentUser?.id) {
        this.showMessageNotification(messageData);
      }

    } catch (error) {
      console.error('خطأ في إضافة الرسالة الجديدة:', error);
    }
  }

  // تحديث رسالة
  updateMessage(updatedMessage) {
    const index = this.messages.findIndex(msg => msg.id === updatedMessage.id);
    if (index !== -1) {
      this.messages[index] = updatedMessage;
      this.updateMessageElement(updatedMessage);
    }
  }

  // إزالة رسالة
  removeMessage(messageId) {
    this.messages = this.messages.filter(msg => msg.id !== messageId);
    this.removeMessageElement(messageId);
  }

  // إرسال رسالة
  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !this.currentUser) return;

    const content = messageInput.value.trim();
    if (!content) return;

    try {
      // إيقاف مؤشر الكتابة
      this.stopTyping();

      // إضافة الرسالة للقائمة المحلية أولاً (للسرعة)
      const tempMessage = {
        id: 'temp_' + Date.now(),
        content: content,
        user_id: this.currentUser.id,
        message_type: 'text',
        created_at: new Date().toISOString(),
        users: {
          id: this.currentUser.id,
          full_name: this.currentUser.user_metadata?.full_name || 'مستخدم',
          user_type: this.currentUser.user_metadata?.user_type || 'طالب',
          avatar_url: this.currentUser.user_metadata?.avatar_url
        }
      };

      this.messages.push(tempMessage);
      this.renderMessage(tempMessage);
      this.scrollToBottom();

      // مسح حقل الإدخال
      messageInput.value = '';

      // إرسال الرسالة للخادم
      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          content: content,
          user_id: this.currentUser.id,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

      // استبدال الرسالة المؤقتة بالرسالة الحقيقية
      const realMessageIndex = this.messages.findIndex(msg => msg.id === tempMessage.id);
      if (realMessageIndex !== -1) {
        this.messages[realMessageIndex] = data;
        this.updateMessageElement(data);
      }

    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      this.showMessage('مش عارف أرسل الرسالة، جرب تاني 😅', 'error');
      
      // إزالة الرسالة المؤقتة في حالة الفشل
      this.messages = this.messages.filter(msg => !msg.id.startsWith('temp_'));
      this.renderMessages();
    }
  }

  // إرسال ملف
  async sendFile(file) {
    if (!this.currentUser) return;

    try {
      // التحقق من نوع وحجم الملف
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        this.showMessage(validation.error, 'error');
        return;
      }

      // رفع الملف
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `chat_files/${fileName}`;

      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // الحصول على رابط التحميل
      const { data: urlData } = this.supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // إرسال رسالة الملف
      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          content: `ملف: ${file.name}`,
          user_id: this.currentUser.id,
          message_type: 'file',
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size
        })
        .select()
        .single();

      if (error) throw error;

      // إضافة الرسالة للمصفوفة
      this.messages.push(data);
      this.renderMessage(data);
      this.scrollToBottom();

    } catch (error) {
      console.error('خطأ في إرسال الملف:', error);
      this.showMessage('مش عارف أرسل الملف، جرب تاني 😅', 'error');
    }
  }

  // التحقق من صحة الملف
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'الملف كبير جداً، الحد الأقصى 10MB'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'نوع الملف غير مدعوم'
      };
    }

    return { isValid: true };
  }

  // فتح نافذة رفع الملف
  openFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.sendFile(file);
      }
    };
    input.click();
  }

  // فتح نافذة رفع الصورة
  openImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.sendFile(file);
      }
    };
    input.click();
  }

  // معالجة مؤشر الكتابة
  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.broadcastTyping();
    }

    // إعادة تعيين مؤقت الكتابة
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  // إيقاف مؤشر الكتابة
  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.broadcastStopTyping();
    }
  }

  // بث مؤشر الكتابة
  broadcastTyping() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: this.currentUser?.id,
          user_name: this.currentUser?.user_metadata?.full_name
        }
      });
    }
  }

  // بث إيقاف الكتابة
  broadcastStopTyping() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: {
          user_id: this.currentUser?.id
        }
      });
    }
  }

  // عرض الرسائل
  renderMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = this.messages.map(message => 
      this.getMessageHTML(message)
    ).join('');
  }

  // عرض رسالة واحدة
  renderMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.innerHTML = this.getMessageHTML(message);
    messageElement.firstElementChild.dataset.messageId = message.id;
    
    messagesContainer.appendChild(messageElement.firstElementChild);
  }

  // تحديث عنصر الرسالة
  updateMessageElement(message) {
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      messageElement.outerHTML = this.getMessageHTML(message);
    }
  }

  // إزالة عنصر الرسالة
  removeMessageElement(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  }

  // HTML الرسالة
  getMessageHTML(message) {
    const isOwnMessage = message.user_id === this.currentUser?.id;
    const user = message.users;
    
    return `
      <div class="message ${isOwnMessage ? 'own-message' : 'other-message'} mb-4" data-message-id="${message.id}">
        <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'}">
          <div class="max-w-xs lg:max-w-md">
            ${!isOwnMessage ? `
              <div class="flex items-center mb-1">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold ml-2">
                  ${user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-800">${user?.full_name || 'مستخدم'}</div>
                  <div class="text-xs text-gray-500">${this.formatTime(message.created_at)}</div>
                </div>
              </div>
            ` : ''}
            
            <div class="message-bubble ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-3 shadow-sm">
              ${this.getMessageContent(message)}
            </div>
            
            ${isOwnMessage ? `
              <div class="text-xs text-gray-500 mt-1 text-right">${this.formatTime(message.created_at)}</div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // محتوى الرسالة
  getMessageContent(message) {
    switch (message.message_type) {
      case 'text':
        return this.sanitizeHTML(message.content);
      case 'image':
        return `
          <img src="${message.file_url}" alt="صورة" class="max-w-full rounded-lg cursor-pointer" onclick="chatManager.openImage('${message.file_url}')">
        `;
      case 'file':
        return `
          <div class="flex items-center space-x-2 space-x-reverse">
            <i class="fas fa-file text-lg"></i>
            <div class="flex-1">
              <div class="font-medium">${message.file_name}</div>
              <div class="text-sm opacity-75">${this.formatFileSize(message.file_size)}</div>
            </div>
            <a href="${message.file_url}" download class="text-blue-500 hover:text-blue-700">
              <i class="fas fa-download"></i>
            </a>
          </div>
        `;
      default:
        return this.sanitizeHTML(message.content);
    }
  }

  // فتح الصورة في نافذة منبثقة
  openImage(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="max-w-4xl max-h-full p-4">
        <img src="${imageUrl}" alt="صورة" class="max-w-full max-h-full rounded-lg">
        <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // تنظيف HTML
  sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // تنسيق الوقت
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    return date.toLocaleDateString('ar-EG');
  }

  // تنسيق حجم الملف
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // التمرير للأسفل
  scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // تحديث حالة الاتصال
  updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      statusElement.className = `w-3 h-3 rounded-full ${this.isConnected ? 'bg-green-500' : 'bg-red-500'}`;
      statusElement.title = this.isConnected ? 'متصل' : 'غير متصل';
    }
  }

  // إظهار إشعار الرسالة
  showMessageNotification(message) {
    // التحقق من إذن الإشعارات
    if (Notification.permission === 'granted') {
      const notification = new Notification('رسالة جديدة من MASHROU3Y', {
        body: `${message.users?.full_name || 'مستخدم'}: ${message.content}`,
        icon: '/images/logo2.jpg'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // تنظيف المحادثة
  async clearChat() {
    if (!confirm('هل أنت متأكد من حذف جميع الرسائل؟')) return;

    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // حذف جميع الرسائل

      if (error) throw error;

      this.messages = [];
      this.renderMessages();
      this.showMessage('تم تنظيف المحادثة بنجاح 🧹', 'success');

    } catch (error) {
      console.error('خطأ في تنظيف المحادثة:', error);
      this.showMessage('مش عارف أنظف المحادثة، جرب تاني 😅', 'error');
    }
  }

  // إظهار رسالة
  showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
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

  // تنظيف الموارد
  cleanup() {
    if (this.realtimeSubscription) {
      this.supabase.removeChannel(this.realtimeSubscription);
    }
    this.stopTyping();
  }
}

// إنشاء مدير المحادثة
const chatManager = new ChatManager();

// تصدير للاستخدام في الملفات الأخرى
window.chatManager = chatManager;

// طلب إذن الإشعارات
if ('Notification' in window) {
  Notification.requestPermission();
}

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  chatManager.cleanup();
});

export { chatManager, ChatManager }; 