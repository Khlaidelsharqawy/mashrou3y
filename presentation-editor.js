import jsPDF from 'jspdf';
import { showMsg } from './utils.js';

let slides = [createEmptySlide()];
let currentSlide = 0;

const slidesList = document.getElementById('slidesList');
const slideTitle = document.getElementById('slideTitle');
const slideContent = document.getElementById('slideContent');
const slideImage = document.getElementById('slideImage');
const slideImagePreview = document.getElementById('slideImagePreview');
const addSlideBtn = document.getElementById('addSlideBtn');
const deleteSlideBtn = document.getElementById('deleteSlideBtn');
const exportBtn = document.getElementById('exportBtn');
const editorMsg = document.getElementById('editorMsg');
const exportSpinnerIcon = document.getElementById('exportSpinnerIcon');
const exportBtnText = document.getElementById('exportBtnText');
const editorMsgText = document.getElementById('editorMsgText');
const editorErrorMsg = document.getElementById('editorErrorMsg');
const editorErrorMsgText = document.getElementById('editorErrorMsgText');

function createEmptySlide() {
  return { title: '', content: '', image: '' };
}

function renderSlidesList() {
  slidesList.innerHTML = '';
  slides.forEach((slide, idx) => {
    const div = document.createElement('div');
    div.className = 'slide-preview p-2 cursor-pointer' + (idx === currentSlide ? ' slide-active' : '');
    div.innerHTML = `
      <div class="font-bold">${slide.title || 'بدون عنوان'}</div>
      <div class="text-xs text-gray-500">${slide.content.slice(0, 30) || 'بدون محتوى'}</div>
      ${slide.image ? `<img src="${slide.image}" class="h-10 mt-1 rounded">` : ''}
    `;
    div.addEventListener('click', () => selectSlide(idx));
    slidesList.appendChild(div);
  });
}

function selectSlide(idx) {
  saveCurrentSlide();
  currentSlide = idx;
  loadCurrentSlide();
  renderSlidesList();
}

function loadCurrentSlide() {
  const slide = slides[currentSlide];
  slideTitle.value = slide.title;
  slideContent.value = slide.content;
  if (slide.image) {
    slideImagePreview.src = slide.image;
    slideImagePreview.classList.remove('hidden');
  } else {
    slideImagePreview.src = '';
    slideImagePreview.classList.add('hidden');
  }
  slideImage.value = '';
}

function saveCurrentSlide() {
  slides[currentSlide].title = slideTitle.value;
  slides[currentSlide].content = slideContent.value;
}

slideTitle.addEventListener('input', saveCurrentSlide);
slideContent.addEventListener('input', saveCurrentSlide);
slideImage.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      slides[currentSlide].image = ev.target.result;
      slideImagePreview.src = ev.target.result;
      slideImagePreview.classList.remove('hidden');
      saveCurrentSlide();
      renderSlidesList();
    };
    reader.readAsDataURL(file);
  }
});

addSlideBtn.addEventListener('click', () => {
  saveCurrentSlide();
  slides.push(createEmptySlide());
  currentSlide = slides.length - 1;
  loadCurrentSlide();
  renderSlidesList();
});

deleteSlideBtn.addEventListener('click', () => {
  if (slides.length === 1) {
    showMsg(editorMsg, 'لا يمكن حذف كل الشرائح', true);
    return;
  }
  slides.splice(currentSlide, 1);
  currentSlide = Math.max(0, currentSlide - 1);
  loadCurrentSlide();
  renderSlidesList();
});

exportBtn.addEventListener('click', () => {
  saveCurrentSlide();
  // إظهار مؤشر التحميل
  exportSpinnerIcon.classList.remove('hidden');
  exportBtnText.classList.add('hidden');
  editorMsg.classList.add('hidden');
  editorErrorMsg.classList.add('hidden');
  try {
    const doc = new jsPDF();
    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage();
      doc.setFont('Tajawal', 'bold');
      doc.setFontSize(18);
      doc.text(slide.title || '', 20, 30, { align: 'right' });
      doc.setFontSize(12);
      doc.text(slide.content || '', 20, 50, { align: 'right', maxWidth: 170 });
      if (slide.image) {
        doc.addImage(slide.image, 'JPEG', 20, 70, 60, 40);
      }
    });
    doc.save('presentation.pdf');
    showMsg(editorMsg, 'تم تصدير العرض كملف PDF!');
  } catch (err) {
    showMsg(editorErrorMsg, 'حدث خطأ أثناء التصدير.', true);
  } finally {
    exportSpinnerIcon.classList.add('hidden');
    exportBtnText.classList.remove('hidden');
  }
});

// تحميل أول شريحة عند البدء
loadCurrentSlide();
renderSlidesList();

if (typeof jsPDF === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = () => window.jsPDF = window.jspdf.jsPDF;
  document.head.appendChild(script);
} 