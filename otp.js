// إدارة رموز التحقق OTP

// تخزين مؤقت للرموز (في التطوير فقط - في الإنتاج يجب استخدام خدمة SMS حقيقية)
const otpStore = new Map();

// إرسال رمز التحقق
export async function sendOTP(phoneNumber) {
  try {
    // في التطوير، نستخدم رمز ثابت
    const otp = '123456';
    
    // حفظ الرمز في التخزين المؤقت
    otpStore.set(phoneNumber, {
      code: otp,
      timestamp: Date.now(),
      attempts: 0
    });

    // في الإنتاج، هنا سيتم إرسال SMS حقيقي
    console.log(`OTP sent to ${phoneNumber}: ${otp}`);
    
    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

// التحقق من رمز التحقق
export async function verifyOTP(phoneNumber, otp) {
  try {
    const storedData = otpStore.get(phoneNumber);
    
    if (!storedData) {
      return false;
    }

    // التحقق من عدد المحاولات
    if (storedData.attempts >= 3) {
      otpStore.delete(phoneNumber);
      return false;
    }

    // التحقق من انتهاء صلاحية الرمز (5 دقائق)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - storedData.timestamp > fiveMinutes) {
      otpStore.delete(phoneNumber);
      return false;
    }

    // زيادة عدد المحاولات
    storedData.attempts++;

    // التحقق من صحة الرمز
    if (storedData.code === otp) {
      // حذف الرمز بعد التحقق الناجح
      otpStore.delete(phoneNumber);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

// تنظيف الرموز منتهية الصلاحية
export function cleanupExpiredOTPs() {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [phone, data] of otpStore.entries()) {
    if (now - data.timestamp > fiveMinutes) {
      otpStore.delete(phone);
    }
  }
}

// تنظيف دوري كل دقيقة
setInterval(cleanupExpiredOTPs, 60000);

// تصدير للاستخدام في الملفات الأخرى
export default {
  sendOTP,
  verifyOTP,
  cleanupExpiredOTPs
};