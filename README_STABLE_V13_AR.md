# Environ Adapt Stable Final v13

نسخة مستقرة مبنية على آخر ملف Google Sheet شغال لديك: Flakes Database (2).xlsx.

## أهم الإصلاحات
- قراءة وكتابة Google Sheets عبر JSONP لتجنب مشاكل CORS.
- New Entry يعمل بدون نافذة فاضية.
- Boiler Reading يدعم إدخال Boiler 1 و Boiler 2 دفعة واحدة.
- الشارتات تقرأ من الصفحات الحقيقية: Shift, Receiving, Downtime, Boiler, PH, Waste, Sales.
- عند عدم وجود بيانات يظهر No data بدل مساحة فاضية.
- setupFlakesSystem لا يمسح البيانات القديمة.

## التركيب
1. ارفع ملفات الجذر على GitHub: index.html, app.js, styles.css, manifest.json.
2. ارفع مجلد assets بالكامل.
3. في Apps Script انسخ google-apps-script/Flakes_Google_Sheets_Script_v16_Stable_Final.gs.
4. شغل setupFlakesSystem().
5. اعمل Deploy جديد كـ Web App بصلاحية Anyone.
6. لو الرابط تغير، عدّل APPS_SCRIPT_URL داخل app.js.
7. افتح الداشبورد مع ?v=13 لمسح الكاش.
