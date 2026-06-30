# V21 - Electricity Online Tariff Fix

تم تعديل الكهرباء لتعمل مثل المياه بنظام سعر Online من مصدر رسمي.

## ماذا تغير؟
- مصدر الكهرباء: EgyptERA official tariff page.
- التعريفة الافتراضية: Low Voltage 380V - Other Users.
- الموقع الرسمي يعرض السعر بوحدة قرش/ك.و.س، والكود يحوله تلقائيًا إلى جنيه/ك.و.س.
- السعر الحالي الافتراضي من EgyptERA: 274 قرش/ك.و.س = 2.74 EGP/kWh.
- عند حفظ Utilities يتم حفظ: الاستهلاك، السعر، المصدر، وقت التحديث، حالة السعر، وتكلفة الكهرباء.

## طريقة الحساب
Electricity Consumed Kwh = End Reading - Start Reading
Electricity Cost EGP = Electricity Consumed Kwh × Electricity Rate EGP/kWh

## مهم
لو عداد المصنع ليس Low Voltage 380V، يجب تغيير Product Type في Price Sources أو إبلاغ المطور بنوع الجهد:
- Extra High Voltage 220-132KV
- High Voltage 66-33KV
- Medium Voltage 22-11KV
- Low Voltage 380V

النسخة آمنة ولا تحذف بيانات قديمة.
