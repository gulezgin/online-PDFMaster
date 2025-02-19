from flask import Flask, request, jsonify, send_file
from flask import Flask, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import PyPDF2
from pdf2image import convert_from_path
import io
from PIL import Image, ImageDraw, ImageFont
import fitz  # PyMuPDF

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_pdf_fonts(filepath):
    doc = fitz.open(filepath)
    fonts = set()
    for page in doc:
        for font in page.get_fonts():
            fonts.add(font[3])  # font name
    return list(fonts)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Dosya yüklenmedi'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Dosya seçilmedi'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # PDF'deki yazı tiplerini al
        fonts = get_pdf_fonts(filepath)
        
        # Dosya URL'sini oluştur
        file_url = f'/uploads/{filename}'
        
        return jsonify({
            'message': 'Dosya başarıyla yüklendi',
            'filename': file_url,
            'fonts': fonts
        })

# Uploads klasörü için statik route ekle
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/edit', methods=['POST'])
def edit_pdf():
    data = request.json
    filename = data.get('filename')
    edits = data.get('edits', [])
    quality = data.get('quality', 'normal')  # normal, high, premium
    
    if not filename:
        return jsonify({'error': 'Dosya adı belirtilmedi'}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        # PDF'i aç
        doc = fitz.open(filepath)
        
        # Her düzenleme için
        for edit in edits:
            page = doc[edit.get('page', 0)]
            edit_type = edit.get('type')
            
            if edit_type == 'text':
                # Metin düzenleme
                rect = fitz.Rect(edit['x'], edit['y'], 
                               edit['x'] + float(edit['width']), 
                               edit['y'] + float(edit['height']))
                page.insert_text(rect.tl, edit['content'],
                               fontname=edit.get('fontFamily', 'Helvetica'),
                               fontsize=float(edit.get('fontSize', 12)),
                               color=edit.get('color', (0, 0, 0)))
                
            elif edit_type == 'highlight':
                # Vurgulama
                rect = fitz.Rect(edit['x'], edit['y'], 
                               edit['x'] + float(edit['width']), 
                               edit['y'] + float(edit['height']))
                page.add_highlight_annot(rect)
                
            elif edit_type == 'shape':
                # Şekil çizme
                shape = edit.get('shape', 'rectangle')
                rect = fitz.Rect(edit['x'], edit['y'], 
                               edit['x'] + float(edit['width']), 
                               edit['y'] + float(edit['height']))
                
                if shape == 'rectangle':
                    page.draw_rect(rect)
                elif shape == 'circle':
                    page.draw_circle(rect.center, radius=min(rect.width, rect.height)/2)
                elif shape == 'arrow':
                    page.draw_line(rect.tl, rect.br, arrow=True)
                elif shape == 'checkmark':
                    # Onay işareti çizimi
                    points = [rect.tl, (rect.center.x, rect.br.y), rect.br]
                    page.draw_polyline(points)
                
            elif edit_type == 'redact':
                # Redaksiyon
                rect = fitz.Rect(edit['x'], edit['y'], 
                               edit['x'] + float(edit['width']), 
                               edit['y'] + float(edit['height']))
                page.add_redact_annot(rect)
                page.apply_redactions()
        
        # Kalite ayarları
        if quality == 'high':
            doc.save(filepath, clean=True, deflate=True)
        elif quality == 'premium':
            doc.save(filepath, clean=True, deflate=True, garbage=4, linear=True)
        else:
            doc.save(filepath)
        
        # Düzenlenmiş PDF'i gönder
        with open(filepath, 'rb') as f:
            return send_file(
                io.BytesIO(f.read()),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='edited_' + filename
            )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/")  # Ana sayfa rotası
def home():
    return render_template("index.html")  # index.html dosyanız yüklenecektir.

if __name__ == '__main__':
    app.run(debug=True)
