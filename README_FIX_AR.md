# Environ Adapt Dashboard - Stable Connector v10

هذه النسخة لإصلاح مشكلة القراءة والكتابة مع Google Sheets.

## ما الذي تغير؟
- حذف الاعتماد على CORS POST من المتصفح.
- القراءة والكتابة تتم بطريقة JSONP GET المتوافقة مع GitHub Pages و Google Apps Script.
- إدخال الغلايات Batch يتم حفظه كصفوف منفصلة لتجنب مشكلة طول الرابط.
- إضافة اختبار اتصال `testConnection` قبل القراءة.
- Apps Script لا يمسح البيانات القديمة عند تشغيل `setupFlakesSystem()`.

## ملفات GitHub التي يجب رفعها
ارفع واستبدل:
- `app.js`

باقي ملفات التصميم لا تحتاج تغيير في هذا الإصلاح.

## ملف Apps Script
استبدل كود Apps Script بالكامل بالملف:
`google-apps-script/Flakes_Google_Sheets_Script_v14_Stable_Connector.gs`

ثم شغل:
`setupFlakesSystem()`

ثم:
Deploy > Manage deployments > Edit > New version > Deploy

## اختبار سريع
1. افتح رابط Web App مباشرة مع هذا الرابط:
`?action=testConnection`
يجب أن ترى JSON فيه `ok:true`.

2. افتح الداشبورد واضغط Refresh.

3. أدخل Shift بسيط واحفظ.

4. راجع Google Sheet.

5. اضغط Refresh في الداشبورد.
