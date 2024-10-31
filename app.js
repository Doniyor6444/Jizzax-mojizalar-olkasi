pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const pdfFiles = {
    'uz': 'fayl/Uzbekcha.fayl.pdf',
    'ru': 'fayl/Ruscha.fayl.pdf',
    'en': 'fayl/English.fayl.pdf'
};

const mainTitles = {
    'uz': "JIZZAX MO'JIZALAR O'LKASI",
    'ru': 'ДЖИЗЗАХ ЗЕМЛЯ ЧУДЕС',
    'en': 'DJIZZAKH LAND OF WONDERLAND'
};

const reloadMessages = {
    'uz': 'Iltimos, sahifani qaytadan yuklang',
    'ru': 'Пожалуйста, перезагрузите страницу',
    'en': 'Please reload the page'
};

const languageSelector = document.getElementById('language');
const pdfViewer = document.getElementById('pdf-viewer');
const loadingIndicator = document.getElementById('loading');
const mainTitle = document.getElementById('main-title');
const reloadMessage = document.getElementById('reload-message');

let pdfDoc = null;
let currentPage = 1;
let isRendering = false;
let pageRenderingQueue = null;

// Sahifa o'lchamini avtomatik moslash uchun viewport scale ni dinamik sozlash
function getScaleFactor() {
    const maxWidth = 600; // Mobil ekranlarda maksimal kenglikni 600px bilan cheklash
    return Math.min(window.innerWidth / maxWidth, 2); // Maksimal 2 marta kattalashtirish
}

// Sahifani yuklash va keshlash
async function renderPage(pageNum) {
    if (isRendering) {
        pageRenderingQueue = pageNum;
        return;
    }

    isRendering = true;
    const page = await pdfDoc.getPage(pageNum);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const scale = getScaleFactor();
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    pdfViewer.appendChild(canvas);
    isRendering = false;

    if (pageRenderingQueue) {
        renderPage(pageRenderingQueue);
        pageRenderingQueue = null;
    }
}

// Har bir sahifani sekretsiya qilish orqali yuklash
async function queueRenderPage(pageNum) {
    if (pageNum <= pdfDoc.numPages) {
        await renderPage(pageNum);
        currentPage = pageNum + 1;
        queueRenderPage(currentPage);
    }
}

// PDF yuklash va keshlash
async function loadPDF(lang) {
    const url = `${pdfFiles[lang]}?t=${new Date().getTime()}`;
    loadingIndicator.style.display = 'flex';
    try {
        pdfDoc = await pdfjsLib.getDocument(url).promise;
        currentPage = 1;
        queueRenderPage(currentPage);
    } catch (error) {
        console.error('Error loading PDF:', error);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Yangi tilni tanlaganda keshni tozalash va PDF-ni qayta yuklash
languageSelector.addEventListener('change', function() {
    pdfViewer.innerHTML = '';
    localStorage.setItem('pdfLanguage', this.value);
    reloadMessage.textContent = reloadMessages[this.value];
    reloadMessage.style.display = 'block';
    loadPDF(this.value);
    mainTitle.textContent = mainTitles[this.value];
});

// Ilk yuklash
window.onload = function() {
    const savedLanguage = localStorage.getItem('pdfLanguage') || 'uz';
    languageSelector.value = savedLanguage;
    loadPDF(languageSelector.value);
    mainTitle.textContent = mainTitles[savedLanguage];
    reloadMessage.style.display = 'none';
};
