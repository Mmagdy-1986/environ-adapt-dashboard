# Environ Adapt Operations Dashboard - Final v6

هذه النسخة مخصصة للعرض الاحترافي على الإدارة أو المستثمرين، مع ربط مباشر بـ Google Sheets عن طريق Apps Script.

## 1) الملفات التي ترفع على GitHub

ارفع الملفات التالية في جذر Repository `environ-adapt-dashboard`:

- `index.html`  
  الصفحة الرئيسية، بيانات الرابط، favicon، روابط CSS/JS، وهيكل الداشبورد.

- `styles.css`  
  تصميم الداشبورد، Light/Dark Mode، الكروت المصغرة، السايدبار، الجداول، المودال، والشكل الاحترافي.

- `app.js`  
  كل تفاعل الداشبورد: قراءة Google Sheets، الحفظ، الفلاتر، الشارتات، أرقام الشارتات، اللغة، الدارك مود، تصدير Excel، وفتح/غلق السايدبار.

- `manifest.json`  
  إعدادات PWA وأيقونات التطبيق.

- `favicon.ico`  
  الأيقونة التي تظهر بجانب اسم الصفحة في تبويب المتصفح.

- مجلد `assets/` بالكامل  
  يحتوي على اللوجوهات، صورة المعاينة، صور الشركة، والفافيكونات.

## 2) الملفات التي تركب داخل Google Apps Script

افتح:

`Extensions > Apps Script`

ثم استبدل الكود الحالي بمحتوى الملف:

`google-apps-script/Flakes_Google_Sheets_Script_v11_Final.gs`

بعد الحفظ، شغل الدالة:

`setupFlakesSystem()`

هذه الدالة تنشئ صفحات Google Sheets:

- `Summary`
- `Shift Entries`
- `Receiving Entries`
- `Downtime Entries`
- `Boiler Readings`
- `PH Readings`
- `Waste Entries`
- `Sales Entries`

## 3) نشر Apps Script كـ Web App

من Apps Script:

`Deploy > Manage deployments > Edit`

اختر:

- `New version`
- `Execute as: Me`
- `Who has access: Anyone`

ثم اضغط `Deploy`.

انسخ رابط Web App، ثم افتح `app.js` وابحث عن:

`APPS_SCRIPT_URL`

وتأكد أن الرابط هو رابط Web App الصحيح.

## 4) نشر GitHub Pages

من GitHub Repository:

`Settings > Pages`

ثم:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

بعد دقيقة سيظهر الرابط:

`https://mmagdy-1986.github.io/environ-adapt-dashboard/`

## 5) مهم لصورة الرابط عند الإرسال

داخل `index.html` تم ضبط:

- `og:title`
- `og:description`
- `og:image`
- `twitter:image`

وصورة المعاينة هي:

`assets/preview.jpg`

لو واتساب عرض نسخة قديمة، أرسل الرابط مع رقم نسخة:

`https://mmagdy-1986.github.io/environ-adapt-dashboard/?v=6`

## 6) ما تم اعتماده في هذه النسخة

- اللغة الافتراضية: English.
- اللغة العربية موجودة بزر `AR | EN`.
- Light/Dark Mode.
- اللوجو مفرغ الخلفية.
- في Light Mode يظهر اللوجو بالألوان الأساسية.
- في Dark Mode يظهر اللوجو بالأبيض بنفس الشكل.
- كروت أصغر وأهدأ.
- الأرقام والنسب تظهر على الشارتات.
- الضغط على أي شارت أو Pie/Donut يفعل فلتر على الصفحة.
- الضغط على صف جدول يفعل فلتر على الوردية/التاريخ.
- يوجد زر Clear Filter عند تفعيل أي فلتر.
- زر Entry يرسل البيانات إلى Google Sheets.
- بعد الحفظ تظهر رسالة نجاح أو فشل واضحة.
- زر Refresh يقرأ البيانات من Google Sheets.
- زر Export Excel يصدر بيانات الصفحة الحالية.

## 7) اختبار التشغيل

بعد الرفع:

1. افتح رابط GitHub Pages.
2. اضغط `Entry`.
3. سجل Shift بسيط.
4. اضغط Save.
5. يجب أن تظهر رسالة نجاح.
6. افتح Google Sheet وتأكد من وصول البيانات.
7. اضغط Refresh في الداشبورد.
8. يجب أن تظهر الأرقام في الكروت والشارتات.

## 8) في حالة عدم ظهور البيانات

راجع:

- هل Apps Script منشور كـ Web App؟
- هل `Who has access` = `Anyone`؟
- هل رابط `APPS_SCRIPT_URL` داخل `app.js` صحيح؟
- هل شغلت `setupFlakesSystem()`؟
- هل أسماء صفحات الشيت بالإنجليزية كما هي؟

