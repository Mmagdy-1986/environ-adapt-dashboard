# Environ Adapt Dashboard V14 — Safe Pricing & Waste Fix

## ما تم إصلاحه

### 1. حماية البيانات
- لا يتم حذف أي شيت.
- لا يتم حذف أي صفوف قديمة.
- تحديث الهيدرز يتم بإضافة الأعمدة الناقصة فقط في آخر الشيت.
- تم الاحتفاظ بقراءة الأعمدة القديمة مثل Big Flex / Green Weight و Wire And Bags / Bag And Strap حتى لا تضيع البيانات القديمة.

### 2. Utilities / الاستهلاكات والتكلفة
- الكهرباء: قراءة البداية والنهاية ثم حساب kWh تلقائيًا.
- المياه: قراءة البداية والنهاية ثم حساب m³ تلقائيًا.
- المياه مضبوطة على: Giza - 6 October / Industrial داخل Apps Script.
- الصودا القشور: Bags × Kg/Bag.
- الصودا السائلة: Liter مع Density و Concentration.
- إضافة تكلفة الكهرباء والمياه والصودا وإجمالي تكلفة المرافق.
- إضافة Price Sources و Tariff Cache لاستخدام Online source / API / Regex مع حفظ آخر سعر مستخدم.

> ملاحظة مهمة: الكهرباء والمياه والصودا لا يوجد لها API حكومي مجاني ثابت مضمون لكل الحالات. الكود الآن جاهز لجلب السعر من مصدر Online قابل للقراءة Regex/JSON أو API، ويعرض حالة السعر لو المصدر غير مضبوط بدل ما يحسب رقم غلط.

### 3. Waste / الهالك
تم إعادة تنظيم الهالك حسب تعريفك:
- Sortex Waste = Operation
- Caps & Label (PO) = Operation
- Bag & Strap = Material
- Green Bottle = Material
- Line Sludge / طينة الخط = Operation

الشاشة بقت جدول احترافي مع إجماليات Live:
- Operation Waste
- Material Waste
- Total Waste
- Total Count

### 4. PH
- Boiler PH مسموح 0–100.
- Sand Filter PH مسموح 0–14.
- Rinse Tank PH مسموح 0–14.
- تم إضافة Warning / Status بدل منع إدخال Boiler PH العالي.

### 5. Boiler
- أضيف Gap To Target = SV - PV.
- تم ترك Ampere كسلسلة في الرسم فقط، وليس كفلتر KPI.
- تم تصحيح محور رسم الغلاية بدل محور pH.

### 6. Receiving / Sales Pricing
- Price Per Ton Thousand = 30 يعني 30,000 EGP/MT.
- تم إضافة Price Per Ton EGP للحساب الصحيح.

### 7. Mobile / Apps Script error
- تحسين JSONP timeout.
- إضافة cache buster للموبايل.
- رسالة الخطأ أصبحت أوضح: راجع نشر Apps Script كـ Web App وإتاحة Anyone with the link.

## طريقة التركيب
1. افتح Google Apps Script الخاص بالشيت.
2. انسخ محتوى ملف `AppsScript_Code.gs` بالكامل مكان الكود القديم.
3. شغل function اسمها `setupFlakesSystem` مرة واحدة من Apps Script.
4. اعمل Deploy جديد كـ Web App.
5. اختار:
   - Execute as: Me
   - Who has access: Anyone with the link
6. لو رابط Web App اتغير، حدّث قيمة `APPS_SCRIPT_URL` في `app.js`.
7. ارفع ملفات `index.html`, `app.js`, `styles.css` على GitHub Pages / الاستضافة.

## إعداد Online Prices
افتح شيت `Price Sources` بعد تشغيل setup.
لكل مصدر سعر، ضع:
- Source URL
- Regex أو Json Path لاستخراج الرقم
- Active = TRUE

لو المصدر مدفوع أو API، ضع API URL في Source URL و Json Path أو Regex المناسب.

## أهم الأعمدة الجديدة
- Electricity Rate EGP/kWh
- Electricity Cost EGP
- Water Rate EGP/M3
- Water Cost EGP
- Soda Type
- Soda Liquid Liters
- Soda Liquid Total Kg
- Soda Cost EGP
- Total Utilities Cost EGP
- Operation Waste Weight Kg
- Material Waste Weight Kg
- Line Sludge Weight Kg
- PH Alert
- Gap To Target
