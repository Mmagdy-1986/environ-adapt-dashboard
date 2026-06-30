# Checklist قبل التشغيل

1. شغل `setupFlakesSystem` من Apps Script.
2. تأكد أن شيتات `Price Sources`, `Tariff Cache`, `System Logs` اتعملت.
3. اختبر الرابط من المتصفح:
   `YOUR_WEB_APP_URL?action=testConnection`
4. لازم يرجع JSON فيه `ok:true`.
5. اختبر من الموبايل بعد مسح الكاش أو فتح نافذة جديدة.
6. لو ظهرت رسالة Cannot reach Apps Script:
   - اعمل Deploy جديد.
   - غير الوصول إلى Anyone with the link.
   - تأكد أن الرابط في app.js هو رابط `/exec` وليس `/dev`.
7. لا تشغل أي كود يمسح الشيتات؛ النسخة دي Safe Append Only.
