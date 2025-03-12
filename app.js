pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js?t=${new Date().getTime()}`;

// PDF fayllari va ularning tillari
const pdfFiles = {
    'uz': 'fayl/Uzbekcha.fayl.pdf',
    'ru': 'fayl/Ruscha.fayl.pdf',
    'en': 'fayl/English.fayl.pdf'
};

// DOM elementlari
const languageSelector = document.getElementById('language');
const pdfViewer = document.getElementById('pdf-viewer');
const loadingIndicator = document.getElementById('loading');

let pdfDoc = null;
let totalPages = 0;
const preloadedPages = 30;  // Dastlab yuklanadigan sahifalar soni
const loadedPages = new Set();  // Yuklangan sahifalar ro‘yxati

// Dynamic scaling
function getScaleFactor() {
    const maxWidth = 800;
    return Math.min(window.innerWidth / maxWidth, 2);
}

// PDF sahifasini yuklash
async function renderPage(pageNum) {
    if (loadedPages.has(pageNum)) return;
    
    try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        const scale = getScaleFactor() * window.devicePixelRatio;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        pdfViewer.appendChild(canvas);
        loadedPages.add(pageNum);
    } catch (error) {
        console.error(`Sahifa yuklashda xatolik (${pageNum}):`, error);
    }
}

// PDF-ni yuklash
async function loadPDF(lang) {
    const url = `${pdfFiles[lang]}?t=${new Date().getTime()}`;
    loadingIndicator.style.display = 'flex';

    try {
        pdfDoc = await pdfjsLib.getDocument(url).promise;
        totalPages = pdfDoc.numPages;
        pdfViewer.innerHTML = '';
        loadedPages.clear();

        for (let i = 1; i <= Math.min(preloadedPages, totalPages); i++) {
            renderPage(i);
        }

        observeLazyLoading();
    } catch (error) {
        console.error('PDF yuklashda xatolik:', error);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Scroll bo‘lganda sahifalarni yuklash
function observeLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.dataset.page, 10);
                if (pageNum <= totalPages) {
                    renderPage(pageNum);
                    observer.unobserve(entry.target);
                    entry.target.remove();
                }
            }
        });
    }, { rootMargin: '100px' });

    for (let i = preloadedPages + 1; i <= totalPages; i++) {
        const sentinel = document.createElement('div');
        sentinel.dataset.page = i;
        sentinel.style.height = '50px';
        pdfViewer.appendChild(sentinel);
        observer.observe(sentinel);
    }
}

// select language
languageSelector.addEventListener('change', function () {
    const lang = this.value;
    localStorage.setItem('pdfLanguage', lang);
    loadPDF(lang);
});

// Dastlabki yuklash
window.onload = function () {
    const savedLanguage = localStorage.getItem('pdfLanguage') || 'uz';
    languageSelector.value = savedLanguage;
    loadPDF(savedLanguage);
};
