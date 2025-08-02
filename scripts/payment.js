import { showMsg } from './utils.js';

const method = document.getElementById('method');
const instapayFields = document.getElementById('instapayFields');
const visaFields = document.getElementById('visaFields');
const vodafoneFields = document.getElementById('vodafoneFields');
const paymentForm = document.getElementById('paymentForm');
const payBtn = document.getElementById('payBtn');
const paySpinnerIcon = document.getElementById('paySpinnerIcon');
const payBtnText = document.getElementById('payBtnText');
const paymentMsg = document.getElementById('paymentMsg');
const paymentErrorMsg = document.getElementById('paymentErrorMsg');

// إظهار الحقول حسب طريقة الدفع
method.addEventListener('change', () => {
  instapayFields.classList.add('hidden');
  visaFields.classList.add('hidden');
  vodafoneFields.classList.add('hidden');
  if (method.value === 'instapay') instapayFields.classList.remove('hidden');
  if (method.value === 'visa') visaFields.classList.remove('hidden');
  if (method.value === 'vodafone') vodafoneFields.classList.remove('hidden');
});

paymentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  // إظهار مؤشر التحميل
  paySpinnerIcon.classList.remove('hidden');
  payBtnText.classList.add('hidden');
  payBtn.setAttribute('disabled', 'disabled');
  paymentMsg.classList.add('hidden');
  paymentErrorMsg.classList.add('hidden');
  // محاكاة الدفع (نجاح دائمًا)
  setTimeout(() => {
    paySpinnerIcon.classList.add('hidden');
    payBtnText.classList.remove('hidden');
    payBtn.removeAttribute('disabled');
    showMsg(paymentMsg, 'تمت عملية الدفع بنجاح!');
  }, 1500);
}); 