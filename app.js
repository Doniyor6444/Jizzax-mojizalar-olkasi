
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// PDF fayllari va ularning tillari
const pdfFiles = {
    'uz': 'fayl/Uzbekcha.fayl.pdf',
    'ru': 'fayl/Ruscha.fayl.pdf',
    'en': 'fayl/English.fayl.pdf'
};

// Bosh sarlavhalar
const mainTitles = {
    'uz': "JIZZAX MO'JIZALAR O'LKASI",
    'ru': 'ДЖИЗЗАХ ЗЕМЛЯ ЧУДЕС',
    'en': 'DJIZZAKH LAND OF WONDERLAND'
};

// Qayta yuklash xabarlar
const reloadMessages = {
    'uz': 'Iltimos, sahifani qaytadan yuklang',
    'ru': 'Пожалуйста, перезагрузите страницу',
    'en': 'Please reload the page'
};

// DOM elementlarini olish
const languageSelector = document.getElementById('language');
const pdfViewer = document.getElementById('pdf-viewer');
const loadingIndicator = document.getElementById('loading');
const mainTitle = document.getElementById('main-title');
const reloadMessage = document.getElementById('reload-message');

let pdfDoc = null;
let currentPage = 1;
let isRendering = false;
let pageRenderingQueue = [];
let isScrolling = false;  // Lazy loadingni qo'llash

// Dynamic scaling based on viewport for better quality
function getScaleFactor() {
    const maxWidth = 800;  // Mobil qurilmalar uchun maksimal kenglikni kichraytirdik
    const scaleFactor = window.innerWidth / maxWidth;
    return Math.min(scaleFactor, 2);  // Kattalashtirishni 2x bilan cheklash
}

// Sahifani yuqori sifatda render qilish
async function renderPage(pageNum) {
    if (isRendering) {
        pageRenderingQueue.push(pageNum);
        return;
    }

    isRendering = true;
    try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        // Sahifani yuqori sifatda render qilish
        const scale = getScaleFactor() * window.devicePixelRatio; // Yaxshi sifat uchun scale ni to'g'ri hisoblash
        const viewport = page.getViewport({ scale: scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.imageSmoothingEnabled = true;  // Yaxshi sifat uchun smoothingni yoqish

        // Sahifani rendering qilish
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        pdfViewer.appendChild(canvas);
    } catch (error) {
        console.error('Sahifani render qilishda xatolik:', error);
    } finally {
        isRendering = false;

        // Keyingi sahifani render qilish
        if (pageRenderingQueue.length > 0) {
            requestAnimationFrame(() => renderPage(pageRenderingQueue.shift()));
        } else if (currentPage < pdfDoc.numPages) {
            currentPage++;
            requestAnimationFrame(() => renderPage(currentPage));
        }
    }
}

// PDF-ni yuklash va keshga olish
async function loadPDF(lang) {
    const url = `${pdfFiles[lang]}?t=${new Date().getTime()}`;  // Keshni tozalash uchun query param qo'shish
    loadingIndicator.style.display = 'flex';
    try {
        pdfDoc = await pdfjsLib.getDocument(url).promise;
        currentPage = 1;
        pdfViewer.innerHTML = '';  // Eski sahifalarni tozalash
        renderPage(currentPage);  // Birinchi sahifani render qilish
    } catch (error) {
        console.error('PDF yuklashda xatolik:', error);
    } finally {
        loadingIndicator.style.display = 'none';  // Yuklash indikatorini yashirish
    }
}

// Tilni tanlash va PDF-ni yuklash
languageSelector.addEventListener('change', function() {
    const lang = this.value;
    localStorage.setItem('pdfLanguage', lang);  // Tanlangan tilni saqlash
    reloadMessage.textContent = reloadMessages[lang];  // Qayta yuklash xabarini yangilash
    reloadMessage.style.display = 'block';  // Xabarni ko'rsatish
    loadPDF(lang);  // Tanlangan tilga mos PDF-ni yuklash
    mainTitle.textContent = mainTitles[lang];  // Bosh sarlavhani yangilash
});

// Dastlabki PDF yuklash
window.onload = function() {
    const savedLanguage = localStorage.getItem('pdfLanguage') || 'uz';  // Saqlangan tilni olish yoki standartini qo'llash
    languageSelector.value = savedLanguage;
    loadPDF(savedLanguage);  // Ilk PDF-ni yuklash
    mainTitle.textContent = mainTitles[savedLanguage];  // Bosh sarlavhani yangilash
    reloadMessage.style.display = 'none';  // Qayta yuklash xabarini yashirish
};

// Resizing va PDF yuklashni optimallashtirish
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (pdfDoc) {
            pdfViewer.innerHTML = '';  // Eski sahifalarni tozalash
            renderPage(currentPage);  // Sahifani qayta render qilish
        }
    }, 100);  // 100ms oraliqda qayta render qilish
});

// Lazy loading: Scrollda keyingi sahifalarni yuklash
pdfViewer.addEventListener('scroll', function() {
    if (!isScrolling && pdfViewer.scrollTop + pdfViewer.clientHeight >= pdfViewer.scrollHeight - 100) {
        isScrolling = true;
        setTimeout(() => {
            if (currentPage < pdfDoc.numPages) {
                currentPage++;
                renderPage(currentPage);  // Keyingi sahifani render qilish
            }
            isScrolling = false;
        }, 50);  // Scrollni kechiktirish
    }
});
