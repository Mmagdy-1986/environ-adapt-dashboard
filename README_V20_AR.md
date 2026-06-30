# Environ Adapt Dashboard V20 — Final Reviewed Build

هذه النسخة تجمع آخر التعديلات التي تم الاتفاق عليها في المحادثة:

- شاشة تحميل Full Screen احترافية V20 مستوحاة من التصميم الذي أرسلته، مع حركة كاملة وخطوات تحميل حقيقية.
- Waste مقسم إلى Operation Waste و Material Waste.
- Material Waste = Bag & Strap + Green Bottle + Color Bottle.
- Operation Waste = Sortex Waste + Caps & Label (PO) + Line Sludge / طينة الخط.
- Utilities تشمل الكهرباء، المياه، الصودا القشور بالكيلو، الصودا السائلة باللتر، ووقود الفورك لفت.
- دعم أسعار الجواني الكبيرة والصغيرة والشكاير، ويومية العامل، وتكلفة التشغيل/طن.
- PH: Boiler 0–100 مع تحذير، و Sand Filter / Rinse Tank من 0–14.
- الحفاظ على البيانات القديمة بنظام Append Only.
- لا توجد دوال حذف أو مسح بيانات في خطوات الإعداد.

## مهم قبل التركيب

1. ارفع ملف AppsScript_Code.gs الموجود في هذه النسخة إلى Google Apps Script.
2. شغل setupFlakesSystem مرة واحدة.
3. اعمل Deploy كـ Web App بصلاحية Anyone.
4. ضع رابط /exec داخل APPS_SCRIPT_URL في app.js.

## ملاحظة الأسعار Online

النسخة مجهزة لربط مصادر الأسعار والكاش. إذا كان المصدر لا يعطي API واضحًا، يتم تسجيل الحالة NEEDS_SOURCE / NEEDS_REGEX_OR_API بدل حساب سعر وهمي.
