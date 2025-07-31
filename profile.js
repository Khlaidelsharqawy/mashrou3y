import { supabase } from './supabase-config.js';
import { showMsg } from './utils.js';

// تحميل بيانات الملف الشخصي عند فتح الصفحة
window.addEventListener('DOMContentLoaded', async () => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // جلب بيانات الملف الشخصي من جدول profiles
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return;

  document.getElementById('fullName').value = user.user_metadata?.full_name || '';
  document.getElementById('bio').value = profile?.bio || '';
  document.getElementById('avatarPreview').src = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'User')}`;

  // إظهار البورتفوليو إذا كان Creator
  if (user.user_metadata?.role === 'creator') {
    document.getElementById('portfolioSection').style.display = '';
    document.getElementById('portfolio').value = profile?.portfolio || '';
  }
});

// تغيير الصورة
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatarPreview');
if (changeAvatarBtn && avatarInput && avatarPreview) {
  changeAvatarBtn.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        avatarPreview.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// حفظ التعديلات
const profileForm = document.getElementById('profileForm');
const profileSaveBtn = document.getElementById('profileSaveBtn');
const profileSpinnerIcon = document.getElementById('profileSpinnerIcon');
const profileBtnText = document.getElementById('profileBtnText');
const profileMsgText = document.getElementById('profileMsgText');
const profileErrorMsg = document.getElementById('profileErrorMsg');
const profileErrorMsgText = document.getElementById('profileErrorMsgText');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const fullName = document.getElementById('fullName').value;
    const bio = document.getElementById('bio').value;
    const portfolio = document.getElementById('portfolio')?.value || null;
    let avatar_url = null;
    const avatarFile = document.getElementById('avatar').files[0];

    // إظهار مؤشر التحميل
    profileSpinnerIcon.classList.remove('hidden');
    profileBtnText.classList.add('hidden');
    profileSaveBtn.setAttribute('disabled', 'disabled');
    profileMsgText.textContent = ''; // Clear previous messages
    profileErrorMsgText.textContent = '';
    profileMsg.classList.add('hidden');
    profileErrorMsg.classList.add('hidden');

    // رفع الصورة إذا تم اختيارها
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { data, error } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
      if (!error) {
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = publicUrl.publicUrl;
      }
    }

    // تحديث البيانات في جدول profiles
    const updateObj = { bio };
    if (avatar_url) updateObj.avatar_url = avatar_url;
    if (user.user_metadata?.role === 'creator') updateObj.portfolio = portfolio;
    if (user.user_metadata?.role === 'creator') updateObj.is_verified = false;
    if (user.user_metadata?.role === 'creator') updateObj.email = user.email;

    try {
      await supabase.from('profiles').update(updateObj).eq('user_id', user.id);
      await supabase.auth.updateUser({ data: { full_name: fullName } });
      showMsg(profileMsg, 'تم حفظ التعديلات بنجاح');
    } catch (err) {
      showMsg(profileErrorMsg, 'حدث خطأ أثناء الحفظ.', true);
    } finally {
      profileSpinnerIcon.classList.add('hidden');
      profileBtnText.classList.remove('hidden');
      profileSaveBtn.removeAttribute('disabled');
    }
  });
} 