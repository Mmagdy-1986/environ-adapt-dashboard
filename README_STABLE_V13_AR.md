[README_SOCIAL_PREVIEW_V14_AR.md](https://github.com/user-attachments/files/29398104/README_SOCIAL_PREVIEW_V14_AR.md)
# Environ Adapt Dashboard - Social Preview & DAWAR Toggle v14

## ما تم تعديله

- إضافة صورة مشاركة احترافية عندما ترسل رابط الداشبورد لأي شخص.
- إضافة Open Graph و Twitter Card داخل `index.html`.
- تحديث وصف الرابط ليظهر هدف الشركة من إعادة التدوير:
  Turning waste into measurable value through smarter PET recycling operations.
- إضافة صورة `assets/social-preview.png` بمقاس 1200x630 المناسب للواتساب وفيسبوك ولينكدإن.
- تحديث الفافيكون ليكون أوضح وأكبر بصريًا باستخدام DAWAR icon.
- تحويل زر فتح/غلق السايدبار إلى زر DAWAR احترافي.
- عند السايدبار المفتوحة يظهر اتجاه الأيقونة للداخل، وعند الغلق ينعكس للخارج.
- تحديث `manifest.json` باسم ووصف مناسبين للداشبورد.

## الملفات التي يتم رفعها على GitHub

ارفع واستبدل الملفات التالية:

- `index.html`
- `styles.css`
- `manifest.json`
- مجلد `assets` أو على الأقل الملفات التالية داخله:
  - `social-preview.png`
  - `social-preview.jpg`
  - `favicon-32.png`
  - `favicon-180.png`
  - `favicon-192.png`
  - `favicon-512.png`
  - `dawar-toggle-green.png`
  - `dawar-toggle-green-reverse.png`
  - `dawar-toggle-white.png`
  - `dawar-toggle-white-reverse.png`

## مهم بعد الرفع

افتح الرابط بكسر الكاش:

https://mmagdy-1986.github.io/environ-adapt-dashboard/?v=14

## ملاحظة عن ظهور صورة الرابط

واتساب وفيسبوك ولينكدإن أحيانًا يحتفظون بالكاش. لو الصورة القديمة ظهرت أول مرة، انتظر عدة دقائق أو أرسل الرابط بهذا الشكل:

https://mmagdy-1986.github.io/environ-adapt-dashboard/?v=14

لكن الصورة النهائية الرسمية مرتبطة بالرابط الأساسي داخل `index.html`.
