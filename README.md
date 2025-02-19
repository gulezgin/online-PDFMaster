# Çevrimiçi PDF Düzenleyici

Bu proje, SmallPDF benzeri özelliklere sahip gelişmiş bir çevrimiçi PDF düzenleyici uygulamasıdır.

## Özellikler

- PDF metin düzenleme
- Metin biçimlendirme (yazı tipi, boyut, stil)
- Açıklama araçları (vurgulama, altını çizme, üstü çizili)
- Şekil araçları (daire, dikdörtgen, çizgi, ok)
- Redaksiyon aracı
- Yakınlaştırma/uzaklaştırma kontrolü
- Düzenlenmiş PDF'i dışa aktarma

## Kurulum

1. Python 3.8 veya üstü sürümünün yüklü olduğundan emin olun
2. Proje dizinine gidin:
   ```bash
   cd pdf_editor
   ```
3. Sanal ortam oluşturun ve etkinleştirin:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```
4. Gerekli paketleri yükleyin:
   ```bash
   pip install -r requirements.txt
   ```

## Çalıştırma

1. Flask uygulamasını başlatın:
   ```bash
   python app.py
   ```
2. Tarayıcınızda `http://localhost:5000` adresine gidin

## Kullanım

1. "PDF Yükle" butonuna tıklayarak bir PDF dosyası seçin
2. Sol taraftaki araç çubuğundan istediğiniz düzenleme aracını seçin
3. PDF üzerinde düzenlemeler yapın
4. "Kaydet" butonuna tıklayarak düzenlenmiş PDF'i indirin

## Geliştirme

### Proje Yapısı

```
pdf_editor/
├── app.py              # Flask uygulaması
├── requirements.txt    # Python bağımlılıkları
├── static/
│   ├── css/
│   │   └── style.css  # Stil dosyası
│   ├── js/
│   │   └── pdf-editor.js  # JavaScript kodu
│   └── index.html     # Ana HTML sayfası
└── uploads/           # Yüklenen PDF'ler için dizin
```

### Teknolojiler

- Backend: Python (Flask)
- Frontend: HTML, CSS, JavaScript
- PDF İşleme: PyPDF2, PyMuPDF
- PDF Görüntüleme: PDF.js

## Lisans

MIT

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir özellik dalı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Dalınıza push yapın (`git push origin yeni-ozellik`)
5. Bir Pull Request oluşturun