# تركيب Environ Adapt Operations Dashboard

## ملفات GitHub
ارفع كل الملفات التالية في جذر Repository:
- index.html
- styles.css
- app.js
- manifest.json
- favicon.ico
- assets/

## تشغيل GitHub Pages
Settings > Pages > Deploy from branch > main > /root ثم Save.

## تركيب Google Apps Script
1. افتح Google Sheet.
2. Extensions > Apps Script.
3. انسخ محتوى الملف:
   google-apps-script/Flakes_Google_Sheets_Script_v13_Final.gs
4. شغل الدالة setupFlakesSystem مرة واحدة.
5. Deploy > New deployment > Web app.
6. Execute as: Me.
7. Who has access: Anyone.
8. انسخ رابط Web App.
9. لو الرابط مختلف، افتح app.js وغير قيمة APPS_SCRIPT_URL.

## اختبار
- افتح الداشبورد.
- اضغط New Entry.
- سجل Shift أو Boiler Batch.
- اضغط Save.
- راجع Google Sheet.
- اضغط Refresh في الداشبورد.
