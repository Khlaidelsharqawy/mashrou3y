import { supabase } from './supabase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const productDetails = document.getElementById('productDetails');
const reviewsList = document.getElementById('reviewsList');
const addReviewSection = document.getElementById('addReviewSection');
const reviewForm = document.getElementById('reviewForm');
const reviewMsg = document.getElementById('reviewMsg');

window.addEventListener('DOMContentLoaded', async () => {
  if (!productId) {
    productDetails.innerHTML = '<p class="text-red-600">لم يتم تحديد المنتج.</p>';
    return;
  }
  await loadProduct();
  await loadReviews();
  await checkCanReview();
});

async function loadProduct() {
  const { data, error } = await supabase.from('store_items').select('*').eq('id', productId).single();
  if (error || !data) {
    productDetails.innerHTML = '<p class="text-red-600">حدث خطأ أثناء تحميل المنتج.</p>';
    return;
  }
  productDetails.innerHTML = `
    <div class="font-bold text-2xl mb-2">${data.title}</div>
    <div class="text-gray-600 mb-2">${data.description || ''}</div>
    <div class="mb-2">النوع: <span class="text-sm">${getTypeLabel(data.type)}</span></div>
    <div class="mb-2">السعر: <span class="text-green-700 font-bold">${data.price} جنيه</span></div>
    <div class="mb-2">تاريخ الإضافة: <span class="text-xs text-gray-400">${new Date(data.created_at).toLocaleString('ar-EG')}</span></div>
    <a href="${data.file_url}" target="_blank" class="text-blue-600 underline">تحميل/مشاهدة الملف</a>
  `;
}

function getTypeLabel(type) {
  switch(type) {
    case 'video': return 'فيديو تعليمي';
    case 'project': return 'مشروع';
    case 'presentation': return 'عرض تقديمي';
    default: return type;
  }
}

async function loadReviews() {
  reviewsList.innerHTML = '<p>جاري تحميل المراجعات...</p>';
  const { data, error } = await supabase.from('reviews').select('*').eq('item_id', productId).order('created_at', { ascending: false });
  if (error) {
    reviewsList.innerHTML = '<p class="text-red-600">حدث خطأ أثناء تحميل المراجعات.</p>';
    return;
  }
  if (!data || data.length === 0) {
    reviewsList.innerHTML = '<p class="text-gray-500">لا توجد مراجعات بعد.</p>';
    return;
  }
  reviewsList.innerHTML = '';
  data.forEach(r => {
    const div = document.createElement('div');
    div.className = 'border-b pb-2';
    div.innerHTML = `
      <div class="font-bold text-yellow-500">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <div class="text-gray-700">${r.comment || ''}</div>
      <div class="text-xs text-gray-400">${new Date(r.created_at).toLocaleString('ar-EG')}</div>
    `;
    reviewsList.appendChild(div);
  });
}

async function checkCanReview() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  // تحقق إذا كان المستخدم اشترى المنتج
  const { data: purchases } = await supabase.from('purchases').select('*').eq('user_id', user.id).eq('item_id', productId);
  if (purchases && purchases.length > 0) {
    addReviewSection.classList.remove('hidden');
  }
}

if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const rating = parseInt(document.getElementById('rating').value);
    const comment = document.getElementById('comment').value;
    if (!rating) return;
    const { error } = await supabase.from('reviews').insert([
      {
        user_id: user.id,
        item_id: productId,
        rating,
        comment,
        created_at: new Date().toISOString()
      }
    ]);
    if (error) {
      showMsg('فشل إرسال المراجعة', true);
      return;
    }
    showMsg('تم إرسال المراجعة بنجاح!');
    reviewForm.reset();
    await loadReviews();
  });
}

function showMsg(msg, isError = false) {
  reviewMsg.textContent = msg;
  reviewMsg.classList.remove('hidden');
  reviewMsg.classList.toggle('bg-green-100', !isError);
  reviewMsg.classList.toggle('bg-red-100', isError);
  reviewMsg.classList.toggle('border-green-400', !isError);
  reviewMsg.classList.toggle('border-red-400', isError);
  reviewMsg.classList.toggle('text-green-700', !isError);
  reviewMsg.classList.toggle('text-red-700', isError);
  setTimeout(() => reviewMsg.classList.add('hidden'), 3000);
} 