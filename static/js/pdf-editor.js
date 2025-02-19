class PDFEditor {
    constructor() {
        this.currentTool = null;
        this.currentFile = null;
        this.zoom = 100;
        this.annotations = [];
        this.selectedAnnotation = null;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // Araç butonları
        this.tools = {
            select: document.getElementById('selectTool'),
            pan: document.getElementById('panTool'),
            text: document.getElementById('textTool'),
            highlight: document.getElementById('highlightTool'),
            underline: document.getElementById('underlineTool'),
            strikethrough: document.getElementById('strikethroughTool'),
            squiggle: document.getElementById('squiggleTool'),
            draw: document.getElementById('drawTool'),
            shape: document.getElementById('shapeTool'),
            redact: document.getElementById('redactTool')
        };
        
        // Biçimlendirme kontrolleri
        this.formatControls = {
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            bold: document.getElementById('boldBtn'),
            italic: document.getElementById('italicBtn'),
            underline: document.getElementById('underlineBtn'),
            alignLeft: document.getElementById('alignLeftBtn'),
            alignCenter: document.getElementById('alignCenterBtn'),
            alignRight: document.getElementById('alignRightBtn')
        };
        
        // Şekil butonları
        this.shapeButtons = document.querySelectorAll('[data-shape]');
        
        // Diğer UI elemanları
        this.uploadBtn = document.getElementById('uploadBtn');
        this.saveDropdown = document.getElementById('saveDropdown');
        this.fileInput = document.getElementById('fileInput');
        this.pdfContainer = document.getElementById('pdfContainer');
        this.zoomIn = document.getElementById('zoomIn');
        this.zoomOut = document.getElementById('zoomOut');
        this.zoomLevel = document.getElementById('zoomLevel');
    }
    
    bindEvents() {
        // Araç seçimi
        Object.entries(this.tools).forEach(([tool, element]) => {
            element.addEventListener('click', () => this.selectTool(tool));
        });
        
        // Şekil seçimi
        this.shapeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const shape = button.dataset.shape;
                this.selectShape(shape);
            });
        });
        
        // Dosya yükleme
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Kaydetme
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const quality = e.target.dataset.quality;
                this.savePDF(quality);
            });
        });
        
        // Yakınlaştırma kontrolü
        this.zoomIn.addEventListener('click', () => this.handleZoom(10));
        this.zoomOut.addEventListener('click', () => this.handleZoom(-10));
        
        // PDF Container olayları
        this.pdfContainer.addEventListener('click', (e) => this.handleContainerClick(e));
        this.pdfContainer.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.pdfContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.pdfContainer.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    selectTool(tool) {
        // Aktif aracı değiştir
        if (this.currentTool) {
            this.tools[this.currentTool].classList.remove('active');
        }
        this.currentTool = tool;
        this.tools[tool].classList.add('active');
        
        // Şekil menüsünü göster/gizle
        const shapeGroup = document.querySelector('.shape-group');
        if (tool === 'shape') {
            shapeGroup.style.display = 'block';
        } else {
            shapeGroup.style.display = 'none';
        }
        
        // İmleç stilini güncelle
        this.updateCursor();
    }
    
    selectShape(shape) {
        this.currentShape = shape;
        this.shapeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.shape === shape) {
                button.classList.add('active');
            }
        });
    }
    
    updateCursor() {
        const cursors = {
            select: 'default',
            pan: 'grab',
            text: 'text',
            highlight: 'crosshair',
            underline: 'crosshair',
            strikethrough: 'crosshair',
            squiggle: 'crosshair',
            draw: 'crosshair',
            shape: 'crosshair',
            redact: 'crosshair'
        };
        
        this.pdfContainer.style.cursor = cursors[this.currentTool];
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.currentFile = file;
            
            // PDF'i yükle ve görüntüle
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.loadPDF(data.filename);
                    
                    // Yazı tiplerini güncelle
                    if (data.fonts && data.fonts.length > 0) {
                        this.updateFontList(data.fonts);
                    }
                } else {
                    alert('PDF yüklenirken bir hata oluştu.');
                }
            } catch (error) {
                console.error('Yükleme hatası:', error);
                alert('PDF yüklenirken bir hata oluştu.');
            }
        }
    }
    
    updateFontList(fonts) {
        const fontSelect = this.formatControls.fontFamily;
        fontSelect.innerHTML = '';
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            fontSelect.appendChild(option);
        });
    }
    
    async loadPDF(filename) {
        try {
            // PDF'i görüntüle
            this.pdfContainer.innerHTML = '<div class="loading">PDF yükleniyor...</div>';
            
            // pdfjsLib'i yapılandır
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const loadingTask = pdfjsLib.getDocument(filename);
            const pdf = await loadingTask.promise;
            
            this.pdfContainer.innerHTML = '';
            
            // Her sayfayı render et
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: this.zoom / 100 });
                
                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page';
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                this.pdfContainer.appendChild(canvas);
            }
        } catch (error) {
            console.error('PDF yükleme hatası:', error);
            this.pdfContainer.innerHTML = '<div class="error">PDF yüklenirken bir hata oluştu.</div>';
        }
    }
    
    createAnnotation(type, x, y) {
        const annotation = document.createElement('div');
        annotation.className = `annotation ${type}-annotation`;
        annotation.style.left = `${x}px`;
        annotation.style.top = `${y}px`;
        
        switch (type) {
            case 'text':
                annotation.contentEditable = true;
                annotation.classList.add('draggable', 'resizable');
                break;
            case 'highlight':
            case 'underline':
            case 'strikethrough':
            case 'squiggle':
                annotation.style.width = '100px';
                annotation.style.height = '20px';
                break;
            case 'shape':
                annotation.style.width = '50px';
                annotation.style.height = '50px';
                annotation.classList.add('draggable', 'resizable');
                if (this.currentShape === 'circle') {
                    annotation.classList.add('circle');
                }
                break;
            case 'redact':
                annotation.style.width = '100px';
                annotation.style.height = '20px';
                annotation.classList.add('draggable', 'resizable');
                break;
        }
        
        this.pdfContainer.appendChild(annotation);
        this.annotations.push(annotation);
        return annotation;
    }
    
    handleContainerClick(event) {
        if (!this.currentTool || !this.currentFile) return;
        
        const rect = this.pdfContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        switch (this.currentTool) {
            case 'text':
            case 'highlight':
            case 'underline':
            case 'strikethrough':
            case 'squiggle':
            case 'shape':
            case 'redact':
                this.createAnnotation(this.currentTool, x, y);
                break;
        }
    }
    
    handleMouseDown(event) {
        if (this.currentTool === 'select') {
            const target = event.target;
            if (target.classList.contains('annotation')) {
                this.selectedAnnotation = target;
                this.dragStart = {
                    x: event.clientX - target.offsetLeft,
                    y: event.clientY - target.offsetTop
                };
            }
        }
    }
    
    handleMouseMove(event) {
        if (this.selectedAnnotation && this.currentTool === 'select') {
            const x = event.clientX - this.dragStart.x;
            const y = event.clientY - this.dragStart.y;
            this.selectedAnnotation.style.left = `${x}px`;
            this.selectedAnnotation.style.top = `${y}px`;
        }
    }
    
    handleMouseUp() {
        this.selectedAnnotation = null;
    }
    
    handleZoom(delta) {
        this.zoom = Math.max(50, Math.min(200, this.zoom + delta));
        this.zoomLevel.textContent = `${this.zoom}%`;
        this.loadPDF(this.currentFile.name);
    }
    
    async savePDF(quality = 'normal') {
        if (!this.currentFile) return;
        
        try {
            // Düzenlemeleri topla
            const edits = this.annotations.map(annotation => ({
                type: this.getAnnotationType(annotation),
                x: parseFloat(annotation.style.left),
                y: parseFloat(annotation.style.top),
                width: parseFloat(annotation.style.width),
                height: parseFloat(annotation.style.height),
                content: annotation.textContent || '',
                fontFamily: this.formatControls.fontFamily.value,
                fontSize: parseFloat(this.formatControls.fontSize.value),
                shape: annotation.classList.contains('circle') ? 'circle' : 'rectangle'
            }));
            
            // Sunucuya gönder
            const response = await fetch('/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: this.currentFile.name,
                    edits: edits,
                    quality: quality
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `edited_${this.currentFile.name}`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('PDF kaydedilirken bir hata oluştu.');
            }
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            alert('PDF kaydedilirken bir hata oluştu.');
        }
    }
    
    getAnnotationType(annotation) {
        if (annotation.classList.contains('text-annotation')) return 'text';
        if (annotation.classList.contains('highlight-annotation')) return 'highlight';
        if (annotation.classList.contains('underline-annotation')) return 'underline';
        if (annotation.classList.contains('strikethrough-annotation')) return 'strikethrough';
        if (annotation.classList.contains('squiggle-annotation')) return 'squiggle';
        if (annotation.classList.contains('shape-annotation')) return 'shape';
        if (annotation.classList.contains('redact-annotation')) return 'redact';
        return null;
    }
}

// PDF düzenleyiciyi başlat
document.addEventListener('DOMContentLoaded', () => {
    window.pdfEditor = new PDFEditor();
});