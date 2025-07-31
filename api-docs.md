# Mataryalk API Docs (Supabase Integration)

## تسجيل مستخدم جديد
```js
const { data, error } = await supabase.auth.signUp({
  phone,
  password,
  options: { data: { full_name, role, email } }
});
```

## رفع محتوى جديد (store_items)
```js
const { error } = await supabase.from('store_items').insert([
  { creator_id, title, description, file_url, type, price }
]);
```

## شراء منتج
```js
const { error } = await supabase.from('purchases').insert([
  { user_id, item_id, amount }
]);
```

## إضافة تقييم/مراجعة
```js
const { error } = await supabase.from('reviews').insert([
  { user_id, item_id, rating, comment }
]);
```

## إرسال رسالة
```js
const { error } = await supabase.from('messages').insert([
  { sender_id, receiver_id, content }
]);
```

## تسجيل عملية دفع
```js
const { error } = await supabase.from('payments').insert([
  { user_id, amount, method, status: 'success' }
]);
```

## ملاحظات
- جميع العمليات تتطلب مصادقة المستخدم (Supabase Auth Session).
- استخدم supabase-config.js لضبط الاتصال.
- تحقق من الجداول في schema.sql لمزيد من التفاصيل. 