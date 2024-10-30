// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const pdfFiles = {
    'uz': 'fayl/Uzbekcha.fayl.pdf',
    'ru': 'fayl/Ruscha.fayl.pdf',
    'en': 'fayl/English.fayl.pdf'
};

const mainTitles = {
    'uz': 'JIZZAX MO\'JIZALAR O\'LKASI',
    'ru': 'ДЖИЗЗАХ  ЗЕМЛЯ ЧУДЕС',
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
const reloadMessage = document.getElementById('reload-message'); // Yozuv uchun element

let pdfDoc = null;

// Function to render a page
async function renderPage(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Adjust the viewport scale for high quality on mobile and desktop
    const scale = window.innerWidth < 768 ? 1.5 : 2; // 768px dan kichik bo'lsa, 1.5; katta bo'lsa 2
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the page to the canvas
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    // Append the canvas to the viewer
    pdfViewer.appendChild(canvas);
}

// Function to load the entire PDF and render pages
async function loadPDF(lang) {
    const url = `${pdfFiles[lang]}?t=${new Date().getTime()}`;
    loadingIndicator.style.display = 'flex'; // Show loading indicator

    try {
        pdfDoc = await pdfjsLib.getDocument(url).promise;
        const numPages = pdfDoc.numPages;

        // Render all pages for high-quality viewing
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            await renderPage(pageNum);
        }
    } catch (error) {
        console.error('Error loading PDF:', error);
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
}

// Load saved language from local storage
const savedLanguage = localStorage.getItem('pdfLanguage') || 'uz';
languageSelector.value = savedLanguage;

// Initial PDF loading and text on window load
window.onload = function() {
    loadPDF(languageSelector.value); // Load PDF based on saved language
    mainTitle.textContent = mainTitles[languageSelector.value];
    reloadMessage.style.display = 'none'; // Yozuvni yashir
};

// Language change event
languageSelector.addEventListener('change', function() {
    pdfViewer.innerHTML = ''; // Clear the viewer for the new language
    localStorage.setItem('pdfLanguage', this.value); // Save the selected language
    reloadMessage.textContent = reloadMessages[this.value]; // Yozuvni tanlangan tilga mos qilib o'rnat
    reloadMessage.style.display = 'block'; // Yozuvni ko'rsat
    loadPDF(this.value); // Load the new PDF
    mainTitle.textContent = mainTitles[this.value];
});
