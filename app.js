'use strict';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxeCI_nmUg5llBZHrmRWnVlHlwXaTGLR0RNuK_5B-2MkDmZte88GPFXb3XmvneLGLCr4g/exec';
const APP_VERSION = 'FLAKES_V24_MANUAL_SODA_RATE';

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

const state = {
  page:'summary', lang:localStorage.getItem('lang')||'en', dark:localStorage.getItem('dark')==='1',
  raw:{shifts:[],receivings:[],downtimes:[],boilers:[],ph:[],waste:[],sales:[],utilities:[],priceSources:[],tariffCache:[]},
  filtered:{}, activeFilter:null, charts:{},
  entryType:'shift', boilerTab:1, boilerDraft:{}, phDraft:{}, loading:false
};

const i18n = {
  en:{summary:'Executive Summary',production:'Production & Yield',receiving:'Receiving',sales:'Sales & Revenue',quality:'Quality Control',boilerph:'Boiler & PH',shifts:'Shift Comparison',intelligence:'Intelligence',reports:'Raw Data'},
  ar:{summary:'الملخص التنفيذي',production:'الإنتاج والكفاءة',receiving:'الاستلام',sales:'المبيعات والإيرادات',quality:'مراقبة الجودة',boilerph:'الغلايات والـ PH',shifts:'مقارنة الورديات',intelligence:'الذكاء التشغيلي',reports:'البيانات الخام'}
};

/* ── FULL ARABIC UI TRANSLATION ── */
const AR_TEXT = {
  'Shift Comparison':'مقارنة الورديات','Intelligence':'الذكاء التشغيلي','Day Shifts':'ورديات نهار','Night Shifts':'ورديات ليل',
  'Day vs Night':'نهار مقابل ليل','Best Shift':'أفضل وردية','Worst Shift':'أسوأ وردية','Avg per Shift':'متوسط الوردية',
  'Shift Performance':'أداء الورديات','Workers Productivity':'إنتاجية العمال','Cost per Shift':'تكلفة الوردية',
  'Supplier Intelligence':'ذكاء الموردين','Buyer Intelligence':'ذكاء المشترين','Avg Bale Weight':'متوسط وزن البالة',
  'Total Supplied MT':'إجمالي المورّد طن','Cost per MT':'تكلفة الطن','Avg Discount':'متوسط الخصم',
  'Trips':'نقلات','Best Supplier':'أفضل مورد','Revenue per MT':'الإيراد/طن','Total Bought MT':'إجمالي المشتري طن',
  'Supplier Performance':'أداء الموردين','Buyer Performance':'أداء المشترين','Yield per Supplier':'كفاءة لكل مورد',
  'Shifts':'الورديات',
  'Executive Summary':'الملخص التنفيذي','Production & Yield':'الإنتاج والكفاءة','Receiving':'الاستلام','Sales & Revenue':'المبيعات والإيرادات','Quality Control':'مراقبة الجودة','Boiler & PH':'الغلايات والـ PH','Raw Data':'البيانات الخام','Dashboard':'لوحة التحكم',
  'Operations':'التشغيل','Quality & Process':'الجودة والعمليات','Reports':'التقارير','Synced':'متزامن','Live':'مباشر','Offline':'غير متصل','Ready':'جاهز','Loading…':'جاري التحميل…','Live from Google Sheets':'مباشر من Google Sheets','PET Flakes Washing Intelligence':'ذكاء تشغيل خط غسيل رقائق PET',
  'DATE FROM':'من تاريخ','DATE TO':'إلى تاريخ','SHIFT':'الوردية','All Shifts':'كل الورديات','Day':'نهار','Night':'ليل','Refresh':'تحديث','Export':'تصدير','New Entry':'إدخال جديد','Choose entry type and save directly to Google Sheets.':'اختر نوع الإدخال واحفظ مباشرة في Google Sheets.','Save to Sheets':'حفظ في الشيت','Cancel':'إلغاء','Close modal':'إغلاق النافذة','Open menu':'فتح القائمة','Toggle sidebar':'فتح/غلق القائمة','Toggle theme':'تغيير الوضع',
  'Shift':'وردية','Downtime':'توقف','Boiler':'غلاية','PH':'PH','Waste':'هالك','Sale':'بيع','Utilities':'مرافق','Date':'التاريخ','Time':'الوقت','Shift Type':'نوع الوردية','Shift Start':'بداية الوردية','Shift End':'نهاية الوردية','Workers':'العمال','Factory':'المصنع','Owner':'المالك','Consumed Bales':'البالات المستهلكة','Avg Bale Wt (kg)':'متوسط وزن البالة (كجم)','Produced Bags':'الأجولة المنتجة','Avg Bag Wt (kg)':'متوسط وزن الجوال (كجم)','Big Jumbo Bags Count':'عدد الجواني الكبيرة','Small Jumbo Bags Count':'عدد الجواني الصغيرة','Sacks Count':'عدد الشكاير','Packaging Counts':'أعداد الجواني والشكاير','Notes':'ملاحظات',
  'Supplier':'المورد','Region':'المنطقة','Vehicle':'السيارة','Driver':'السائق','Bales Count':'عدد البالات','Price / Ton (×1000)':'سعر الطن (×1000)','Karte No.':'رقم الكارتة','Gross Weight (kg)':'الوزن القائم (كجم)','Tare Weight (kg)':'وزن الفارغ (كجم)','Discount %':'نسبة الخصم %','Stop From':'توقف من','Stop To':'توقف إلى','Reason':'السبب',
  'Sortex Wt (kg)':'وزن السورتكس (كجم)','Sortex Count':'عدد السورتكس','Green Bottle Wt (kg)':'زجاجة خضراء (كجم)','Color Bottle Wt (kg)':'بالات ألوان (كجم)','Big Flex Wt (kg)':'زجاجة خضراء (كجم)','Green Bottle Count':'عدد الزجاجات الخضراء','Color Bottle Count':'عدد بالات الألوان','Big Flex Count':'عدد الزجاجات الخضراء','Bag & Strap Wt (kg)':'وزن الشمبر والأكياس (كجم)','Wire & Bags Wt (kg)':'وزن الشمبر والأكياس (كجم)','Bag & Strap Count':'عدد الشمبر والأكياس','Wire & Bags Count':'عدد الشمبر والأكياس','Caps & Labels Wt (kg)':'وزن الغطاء والليبل المكسر (كجم)','Caps & Labels Count':'عدد الغطاء والليبل المكسر','Buyer Factory':'مصنع العميل','Location':'الموقع','Net Weight (kg)':'صافي الوزن (كجم)',
  'Meter':'عداد','PV (°C)':'PV (°م)','SV (°C)':'SV (°م)','Current (A)':'الأمبير (A)','Area':'المنطقة','PH Reading':'قراءة PH','Optional…':'اختياري…','Electricity':'الكهرباء','Water':'المياه','Chemicals':'الكيماويات','Start Reading (kWh)':'قراءة البداية (kWh)','End Reading (kWh)':'قراءة النهاية (kWh)','Start Reading (m³)':'قراءة البداية (م³)','End Reading (m³)':'قراءة النهاية (م³)','Soda Bags Used':'عدد أجولة الصودا','Soda kg per Bag':'كجم الصودا لكل جوال','Inner Bags Used':'الأكياس الداخلية','Bags count':'عدد الأجولة','Total = Bags × kg/Bag':'الإجمالي = عدد الأجولة × كجم/جوال','Consumed = End − Start':'الاستهلاك = النهاية − البداية',
  'Production Efficiency':'كفاءة الإنتاج','Operational Uptime':'زمن التشغيل','Revenue Generated':'الإيراد المحقق','Received':'المستلم','Consumed':'المستهلك','Produced':'المنتج','Waste':'الهالك','Actual Yield':'الكفاءة الفعلية','Actual Loss':'الفقد الفعلي','Revenue':'الإيرادات','Production vs Consumption — Daily (MT)':'الإنتاج مقابل الاستهلاك يوميًا (طن)','Material Flow Breakdown':'تحليل تدفق الخامة','Net Production':'صافي الإنتاج','Uptime':'زمن التشغيل','Sales vs Produced':'المبيعات مقابل الإنتاج','Key Ratios':'النسب الرئيسية','Metric':'المؤشر','Value':'القيمة','Status':'الحالة','Material Yield':'كفاءة الخامة','Waste Rate':'معدل الهالك','Loss Rate':'معدل الفقد','Avg PH':'متوسط PH','Boiler Δ (PV-SV)':'فرق الغلاية (PV-SV)','Management Signals — What to do next':'إشارات الإدارة — ماذا نفعل بعد ذلك','Production':'الإنتاج','Sales':'المبيعات',
  'Total Waste':'إجمالي الهالك','Downtime':'التوقفات','Avg Bag Weight':'متوسط وزن الجوال','Sortex':'سورتكس','Green Bottle':'زجاجة خضراء','Color Bottle':'بالات ألوان','Big Flex':'زجاجة خضراء','Bag & Strap':'شمبر وأكياس','Wire & Bags':'شمبر وأكياس','Caps & Labels':'غطاء وليبل مكسر','Unaccounted':'غير محسوب','Daily Production vs Consumption (MT)':'الإنتاج اليومي مقابل الاستهلاك (طن)','Waste Distribution':'توزيع الهالك','Daily Yield % Trend':'اتجاه الكفاءة اليومية %','Downtime by Reason (min)':'التوقف حسب السبب (دقيقة)','Shift Records':'سجلات الورديات','Downtime Log':'سجل التوقفات','Utilities per Shift':'المرافق لكل وردية','No records':'لا توجد سجلات','No data':'لا توجد بيانات',
  'Total Received':'إجمالي المستلم','Avg Daily Receiving':'متوسط الاستلام اليومي','Gross → Net':'القائم → الصافي','Discount Applied':'الخصم المطبق','Price Before Discount':'السعر قبل الخصم','Price After Discount':'السعر بعد الخصم','Total Discount Amount':'إجمالي قيمة الخصم','Avg Price / Ton':'متوسط سعر الطن','Discount Weight':'وزن الخصم','Supplier Share (MT)':'نسبة الموردين (طن)','Daily Receiving Trend (MT)':'اتجاه الاستلام اليومي (طن)','By Supplier — Total MT':'حسب المورد — إجمالي طن','Discount % by Trip':'نسبة الخصم لكل نقلة','All Receiving Records':'كل سجلات الاستلام',
  'Total Revenue':'إجمالي الإيرادات','Avg Sale Price':'متوسط سعر البيع','Est. Cost / MT':'التكلفة التقديرية/طن','Gross Margin':'هامش الربح','Sales Discount Given':'خصم المبيعات','Price Before Disc':'السعر قبل الخصم','Revenue / MT':'الإيراد/طن','Break-even Price':'سعر التعادل','Price Analysis':'تحليل السعر','Risk Analysis':'تحليل المخاطر','Risk Factor':'عامل الخطر','Current':'الحالي','Daily Revenue Trend':'اتجاه الإيراد اليومي','Revenue by Buyer':'الإيراد حسب العميل','All Sales Records':'كل سجلات المبيعات','Buyer':'العميل',
  'Contaminant rates as % of consumed material · PH readings per area':'نسب الشوائب من الخامة المستهلكة · قراءات PH حسب المنطقة','PVC / Sortex':'PVC / سورتكس','Metal / Wire':'شمبر وأكياس','Color / Green Bottle':'لون / زجاجة خضراء','Color / Green + Color Bottle':'لون / زجاجة خضراء + بالات ألوان','Color / Big Flex':'لون / زجاجة خضراء','Other / Caps':'أخرى / أغطية','Boiler PH':'PH الغلاية','Sand Filter PH':'PH فلتر الرمل','Rinse Tank PH':'PH تنك الشطف','Total Contamination %':'إجمالي الشوائب %','PH Trend by Area':'اتجاه PH حسب المنطقة','Contaminant Breakdown (kg)':'تحليل الشوائب (كجم)','Waste Type Trend (Daily MT)':'اتجاه نوع الهالك يوميًا (طن)','PH Status Summary':'ملخص حالة PH','Readings':'قراءات','PH Readings Log':'سجل قراءات PH','Normal':'طبيعي','Out of Range':'خارج النطاق','Acidic':'حمضي','Alkaline':'قلوي','Min':'أقل','Max':'أعلى','All':'الكل','Sand Filter':'فلتر الرمل','Rinse Tank':'تنك الشطف','Sand':'رمل','Rinse':'شطف',
  'Boiler Avg PV':'متوسط PV للغلاية','PV/SV Delta':'فرق PV/SV','Boiler Readings':'قراءات الغلاية','Boiler Temperature Trend (°C)':'اتجاه حرارة الغلاية (°م)','Boiler Readings — Full Log':'قراءات الغلاية — السجل الكامل','PH Readings — Full Log':'قراءات PH — السجل الكامل','All Boilers':'كل الغلايات','Boiler 1':'غلاية 1','Boiler 2':'غلاية 2','All Meters':'كل العدادات','PV':'PV','SV':'SV','Ampere (A)':'الأمبير (A)',

  'Worker Daily Wage':'يومية العامل','Labor Cost':'تكلفة العمالة','Packaging Cost':'تكلفة الجواني','Big Jumbo Unit Cost':'سعر الجونية الكبيرة','Small Jumbo Unit Cost':'سعر الجونية الصغيرة','Sacks Unit Cost':'سعر الشيكارة','Forklift Fuel':'وقود الفورك لفت','Fuel Type':'نوع الوقود','Fuel Liters':'لترات الوقود','Fuel Cost':'تكلفة الوقود','Operating Cost / MT':'تكلفة التشغيل/طن','Total Operating Cost':'إجمالي تكلفة التشغيل','Soda Type':'نوع الصودا','Flakes / Bags':'قشور / شكاير','Liquid':'سائلة','Soda Liquid Liters':'لتر صودا سائلة','Line Sludge':'طينة الخط','Line Sludge Wt (kg)':'وزن طينة الخط (كجم)','Line Sludge Count':'عدد/دفعات الطينة','Operation Waste':'هالك تشغيل','Material Waste':'هالك خامة','Total Utilities Cost':'إجمالي تكلفة المرافق','Utilities Cost / MT':'تكلفة المرافق/طن','Electricity Cost':'تكلفة الكهرباء','Water Cost':'تكلفة المياه','Soda Cost':'تكلفة الصودا','Manual Rate':'سعر يدوي','Soda Rate EGP/Kg':'سعر كيلو الصودا','Soda Liquid Rate EGP/L':'سعر لتر الصودا','Online Rate':'سعر أونلاين','Price Status':'حالة السعر','Gap To Target':'العجز عن المطلوب','High Boiler Reading':'قراءة غلاية عالية','Boiler PH uses 0-100 scale; monitor high reading.':'PH الغلاية بنظام 0-100؛ راقب القراءة العالية.',
  'Shift Entries':'إدخالات الورديات','No data to export':'لا توجد بيانات للتصدير','Cannot reach Google Sheets: ':'تعذر الاتصال بـ Google Sheets: ','Save failed: ':'فشل الحفظ: ','Enter at least one reading':'أدخل قراءة واحدة على الأقل','Enter at least one PH reading':'أدخل قراءة PH واحدة على الأقل','Saved':'تم الحفظ','record':'سجل','records':'سجلات','to Google Sheets':'في Google Sheets','Actual Production ÷ Actual Input':'الإنتاج الفعلي ÷ الاستهلاك الفعلي','Actual Input ÷ Actual Production':'الاستهلاك الفعلي ÷ الإنتاج','(Actual Production + Total Material Recovery) ÷ Actual Input':'(الإنتاج الفعلي + إجمالي المواد القابلة للاستفادة) ÷ الاستهلاك الفعلي','Actual Input ÷ (Actual Production + Total Material Recovery)':'الاستهلاك الفعلي ÷ (الإنتاج الفعلي + المواد القابلة للاستفادة)','(Actual Production + Operation Recovery) ÷ Actual Input':'(الإنتاج الفعلي + نواتج التشغيل القابلة للاستفادة) ÷ الاستهلاك الفعلي','Actual Input ÷ (Actual Production + Operation Recovery)':'الاستهلاك الفعلي ÷ (الإنتاج الفعلي + نواتج التشغيل القابلة للاستفادة)','Selected:':'المحدد:','Clear':'مسح'
};

function tr(txt){
  const s=String(txt==null?'':txt);
  if(state.lang!=='ar') return s;
  return AR_TEXT[s] || s;
}
function trLoose(txt){
  let s=String(txt==null?'':txt);
  if(state.lang!=='ar') return s;
  if(AR_TEXT[s]) return AR_TEXT[s];
  // Common dynamic fragments
  Object.keys(AR_TEXT).sort((a,b)=>b.length-a.length).forEach(k=>{
    if(k && s.includes(k)) s=s.split(k).join(AR_TEXT[k]);
  });
  s=s.replace(/\brecords\b/g,'سجلات').replace(/\brecord\b/g,'سجل')
     .replace(/\btrips\b/g,'نقلات').replace(/\btrip\b/g,'نقلة')
     .replace(/\bdays\b/g,'أيام').replace(/\bactive days\b/g,'أيام نشطة')
     .replace(/\bbags\b/g,'أجولة').replace(/\bbales\b/g,'بالات')
     .replace(/\bmin\b/g,'دقيقة').replace(/\bminutes\b/g,'دقائق')
     .replace(/\bof consumed\b/g,'من المستهلك').replace(/\bof waste\b/g,'من الهالك')
     .replace(/\bAvg\b/g,'متوسط').replace(/\bTarget\b/g,'الهدف')
     .replace(/\bNo readings\b/g,'لا توجد قراءات');
  return s;
}
function translateNodeText(root=document){
  if(state.lang!=='ar') return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
    const p=node.parentElement;if(!p) return NodeFilter.FILTER_REJECT;
    if(['SCRIPT','STYLE','CANVAS'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
    const t=node.nodeValue.trim();
    return t?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n=>{
    const old=n.nodeValue; const trimmed=old.trim();
    const translated=trLoose(trimmed);
    if(translated!==trimmed) n.nodeValue=old.replace(trimmed,translated);
  });
}
function translateAttrs(root=document){
  if(state.lang!=='ar') return;
  root.querySelectorAll('[placeholder],[aria-label],title').forEach(el=>{
    ['placeholder','aria-label','title'].forEach(a=>{
      const v=el.getAttribute(a); if(v) el.setAttribute(a,trLoose(v));
    });
  });
  root.querySelectorAll('option').forEach(o=>{o.textContent=trLoose(o.textContent.trim());});
}
function translateDashboardText(root=document){translateNodeText(root);translateAttrs(root);}


/* ── UTILITIES ── */
function normalizeKey(k){return String(k||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');}
function rowVal(row,names,fallback=''){
  for(const n of names){
    if(row[n]!==undefined&&row[n]!==null&&row[n]!=='') return row[n];
    const nk=normalizeKey(n);
    for(const k of Object.keys(row||{})) if(normalizeKey(k)===nk&&row[k]!==''&&row[k]!==null&&row[k]!==undefined) return row[k];
  }
  return fallback;
}
function num(v){if(v===null||v===undefined||v==='')return 0;if(typeof v==='number')return isFinite(v)?v:0;const x=Number(String(v).replace(/,/g,'').replace('%','').trim());return isFinite(x)?x:0;}
function fmt(n,d=2){return num(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});}
function fmt0(n){return num(n).toLocaleString('en-US',{maximumFractionDigits:0});}
function pct(a,b){return num(b)?num(a)/num(b)*100:0;}
function safeDiv(a,b){return num(b)?num(a)/num(b):0;}
function parseDate(v){
  if(!v)return null; if(v instanceof Date)return v;
  if(typeof v==='number')return new Date(Math.round((v-25569)*86400*1000));
  const s=String(v).trim(); const d=new Date(s); if(!isNaN(d))return d;
  const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);
  return null;
}
function dateKey(v){const d=parseDate(v);if(!d)return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function timeLabel(v){if(!v&&v!==0)return '';if(typeof v==='string'){if(/^\d+\.\d+$/.test(v.trim())){const frac=parseFloat(v);if(frac>=0&&frac<1){const m=Math.round(frac*1440);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}}return v.replace(/:\d{2}\s*$/,'');}if(typeof v==='number'&&v>=0&&v<1){const m=Math.round(v*1440);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}if(v instanceof Date)return `${String(v.getHours()).padStart(2,'0')}:${String(v.getMinutes()).padStart(2,'0')}`;return String(v);}
function shiftType(row){return String(rowVal(row,['Shift Type','shiftType'],'')).trim()||'Day';}
function trend(arr){
  if(arr.length<2)return 0;
  const n=arr.length, sx=arr.reduce((s,_,i)=>s+i,0), sy=arr.reduce((s,v)=>s+v,0);
  const sxy=arr.reduce((s,v,i)=>s+i*v,0), sxx=arr.reduce((s,_,i)=>s+i*i,0);
  return (n*sxy-sx*sy)/(n*sxx-sx*sx||1);
}

function phLimits(area){
  const a=String(area||'').toLowerCase();
  if(a.includes('boiler')) return {min:0,max:100,normalMin:0,normalMax:100,label:'0–100'};
  return {min:0,max:14,normalMin:6.5,normalMax:8.5,label:'0–14'};
}
function phStatusFor(area,value){
  const v=num(value), lim=phLimits(area), isBoiler=String(area||'').toLowerCase().includes('boiler');
  if(v===0)return {text:'—',cls:''};
  if(v<lim.min||v>lim.max)return {text:'Out of Range',cls:'red'};
  if(isBoiler&&v>14)return {text:'High Boiler Reading',cls:'yellow'};
  if(v<lim.normalMin)return {text:'Low',cls:'red'};
  if(v>lim.normalMax)return {text:'High',cls:'red'};
  return {text:'Normal',cls:'green'};
}
function wasteVal(r,keys){ return num(rowVal(r,keys)); }
function wasteBreakdown(r){
  const sortex=wasteVal(r,['Sortex Weight Kg']);
  const caps=wasteVal(r,['Caps And Labels PO Weight Kg','Broken Caps Labels Weight Kg']);
  const bag=wasteVal(r,['Bag And Strap Weight Kg','Wire And Bags Weight Kg']);
  const green=wasteVal(r,['Green Bottle Weight Kg','Green Weight Kg','Big Flex Weight Kg']);
  const color=wasteVal(r,['Color Bottle Weight Kg','Color Bottle Wt Kg','Color Bottle Wt (kg)']);
  const sludge=wasteVal(r,['Line Sludge Weight Kg']);
  const total=rowVal(r,['Total Waste Weight Kg'])!==''?num(rowVal(r,['Total Waste Weight Kg'])):sortex+caps+bag+green+color+sludge;
  const operation=rowVal(r,['Operation Waste Weight Kg'])!==''?num(rowVal(r,['Operation Waste Weight Kg'])):sortex+caps+sludge;
  const material=rowVal(r,['Material Waste Weight Kg'])!==''?num(rowVal(r,['Material Waste Weight Kg'])):bag+green+color;
  return {sortex,caps,bag,green,color,sludge,total,operation,material};
}
function utilCostVal(r,keys){ return num(rowVal(r,keys)); }

/* ── TOAST / CONNECTION ── */
let _tt=null;
function showToast(msg,type='ok'){
  const t=$('#toast');if(_tt)clearTimeout(_tt);
  t.textContent=msg;t.className=`toast ${type==='error'?'error':type==='warn'?'warn':''}`;
  _tt=setTimeout(()=>{t.classList.add('hidden');_tt=null;},4500);
}
function setConnection(text,ok=true){
  $('#connectionState').innerHTML=`<span class="dot" style="${ok?'':'background:#ef4444;animation:none'}"></span> ${tr(text)}`;
  $('#sideStatus').textContent=tr(ok?'Live':'Offline');
}



/* ── V20 PRO FULL SCREEN LOADER ── */
const appLoaderStartedAt = Date.now();
const appLoaderSteps = [
  {label:'Connecting', msg:'جاري الوصول إلى Google Apps Script...', mini:0},
  {label:'Syncing sheets', msg:'جاري تحميل بيانات الورديات والإنتاج والهالك...', mini:1},
  {label:'Computing KPIs', msg:'جاري حساب Yield و Waste و Utilities...', mini:2},
  {label:'Costing', msg:'جاري تجهيز تكلفة التشغيل للطن...', mini:3},
  {label:'Ready', msg:'تم تجهيز الداش بورد للعرض...', mini:3}
];
let appLoaderProgress = 0;
let appLoaderTimer = null;
function setAppLoaderMini(index){
  $$('.ea20-step').forEach((item,i)=>item.classList.toggle('active', i<=index));
}
function setAppLoaderProgress(progress, text){
  const p = Math.max(0, Math.min(100, Number(progress)||0));
  appLoaderProgress = Math.max(appLoaderProgress, p);
  const stepIndex = Math.min(appLoaderSteps.length-1, Math.floor(appLoaderProgress/22));
  const step = appLoaderSteps[stepIndex] || appLoaderSteps[0];
  const pctEl = document.getElementById('ea20Pct');
  const barEl = document.getElementById('ea20Bar');
  const stepEl = document.getElementById('ea20StepLabel');
  const msgEl = document.getElementById('appLoaderText');
  const bottle = document.getElementById('ea20BottleFill');
  if(pctEl) pctEl.textContent = Math.round(appLoaderProgress)+'%';
  if(barEl) barEl.style.width = Math.max(5,appLoaderProgress)+'%';
  if(bottle) bottle.style.height = Math.max(6,appLoaderProgress)+'%';
  if(stepEl) stepEl.textContent = step.label;
  if(msgEl) msgEl.textContent = text || step.msg;
  setAppLoaderMini(step.mini);
}
function setAppLoaderText(text){
  if(text) setAppLoaderProgress(appLoaderProgress || 8, text);
}
function startAppLoaderSimulation(){
  if(appLoaderTimer) return;
  setAppLoaderProgress(6);
  appLoaderTimer = setInterval(()=>{
    if(appLoaderProgress < 82) setAppLoaderProgress(appLoaderProgress + 2.2);
  }, 420);
}
function updateAppLoaderStats(raw={}){
  const sheets = ['shifts','receivings','downtimes','boilers','ph','waste','sales','utilities'];
  const synced = sheets.filter(k=>Array.isArray(raw[k])).length;
  const records = sheets.reduce((a,k)=>a+(Array.isArray(raw[k])?raw[k].length:0),0);
  const shifts = Array.isArray(raw.shifts) ? raw.shifts.length : 0;
  const wasteRows = Array.isArray(raw.waste) ? raw.waste.length : 0;
  const yieldEl = document.getElementById('ea20Yield');
  const recordsEl = document.getElementById('ea20Records');
  const costEl = document.getElementById('ea20Cost');
  const shiftsEl = document.getElementById('ea20Shifts');
  const sheetsEl = document.getElementById('ea20Sheets');
  const wasteEl = document.getElementById('ea20WasteGroups');
  const tariffEl = document.getElementById('ea20Tariff');
  if(recordsEl) recordsEl.textContent = records || '—';
  if(shiftsEl) shiftsEl.textContent = shifts;
  if(sheetsEl) sheetsEl.textContent = synced + ' / 8';
  if(wasteEl) wasteEl.textContent = wasteRows ? 6 : 0;
  if(tariffEl) tariffEl.textContent = (raw.tariffCache||[]).length ? 'Online' : 'Check';
  const consumed = (raw.shifts||[]).reduce((a,r)=>a+num(rowVal(r,['Consumed Weight Kg'])),0);
  const produced = (raw.shifts||[]).reduce((a,r)=>a+num(rowVal(r,['Net Production Kg'])),0);
  const totalCost = (raw.utilities||[]).reduce((a,r)=>a+num(rowVal(r,['Total Utilities Cost EGP'])),0) + (raw.shifts||[]).reduce((a,r)=>a+num(rowVal(r,['Packaging Total Cost EGP']))+num(rowVal(r,['Labor Cost EGP'])),0);
  if(yieldEl) yieldEl.textContent = consumed ? fmt(pct(produced,consumed),1)+'%' : '—';
  if(costEl) costEl.textContent = produced ? fmt0(totalCost/(produced/1000))+' EGP' : '—';
}
function hideAppLoader(){
  const loader = document.getElementById('appLoader');
  if (!loader) return;
  const minDuration = 950;
  const wait = Math.max(0, minDuration - (Date.now() - appLoaderStartedAt));
  setAppLoaderProgress(100, 'تم تجهيز الداش بورد للعرض...');
  setTimeout(() => {
    if(appLoaderTimer) clearInterval(appLoaderTimer);
    appLoaderTimer = null;
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 650);
  }, wait);
}
startAppLoaderSimulation();

/* ── JSONP ── */
function jsonp(action,params={},options={}){
  return new Promise((resolve,reject)=>{
    const cb='cb_'+Date.now()+'_'+Math.floor(Math.random()*999999);
    const url=new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action',action);url.searchParams.set('callback',cb);
    url.searchParams.set('_v',APP_VERSION);url.searchParams.set('_ts',Date.now());
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,typeof v==='string'?v:JSON.stringify(v)));
    const s=document.createElement('script');s.async=true;s.referrerPolicy='no-referrer';

    // V23: saving and loading can take longer on mobile/slow Apps Script deployments.
    // Do not fail too early while Google Sheets is appending or returning large data.
    const timeoutMs = options.timeoutMs || (String(action).startsWith('save') ? 90000 : 70000);
    const timer=setTimeout(()=>{cleanup();reject(new Error('Timeout — Apps Script did not answer within '+Math.round(timeoutMs/1000)+'s. The request may still complete in Google Sheets; refresh after a few seconds.'));},timeoutMs);
    function cleanup(){clearTimeout(timer);delete window[cb];if(s.parentNode)s.remove();}
    window[cb]=(data)=>{cleanup();data&&data.ok===false?reject(new Error(data.error||'Error')):resolve(data);};
    s.onerror=()=>{cleanup();reject(new Error('Cannot reach Apps Script — redeploy Web App as Anyone with the link and check internet on mobile.'));};
    s.src=url.toString();document.body.appendChild(s);
  });
}

async function loadData(){
  state.loading=true;setConnection('Loading…',true);
  setAppLoaderProgress(12,'جاري الاتصال بـ Google Sheets...');
  try{
    const res=await jsonp('getDashboardData');
    setAppLoaderProgress(62,'تم الاتصال، جاري قراءة البيانات...');
    const s=res.sheets||res.data||res||{};
    state.raw={shifts:s.shifts||[],receivings:s.receivings||[],downtimes:s.downtimes||[],boilers:s.boilers||[],ph:s.ph||[],waste:s.waste||[],sales:s.sales||[],utilities:s.utilities||[],priceSources:s.priceSources||[],tariffCache:s.tariffCache||[]};
    updateAppLoaderStats(state.raw);
    setAppLoaderProgress(86,'جاري حساب المؤشرات وتكلفة الطن...');
    setConnection('Live',true);applyFilters();render();
  }catch(e){
    console.error(e);setConnection('Offline',false);
    setAppLoaderProgress(88,'تعذر الاتصال، يتم فتح الداش بورد بدون تحديث...');
    showToast('Cannot reach Google Sheets: '+e.message,'error');
    applyFilters();render();
  }finally{state.loading=false;hideAppLoader();}
}

/* ── FILTERS ── */
function applyFilters(){
  const from=$('#dateFrom').value,to=$('#dateTo').value,sh=$('#shiftFilter').value;
  const byDate=r=>{const dk=dateKey(rowVal(r,['Date','date']));return(!from||dk>=from)&&(!to||dk<=to);};
  const byShift=r=>sh==='all'||shiftType(r)===sh||String(rowVal(r,['Shift ID'])).toLowerCase().includes(sh.toLowerCase());
  const all=state.raw;
  const shiftIds=sh==='all'?null:new Set(all.shifts.filter(r=>byShift(r)).map(r=>rowVal(r,['Shift ID'])).filter(Boolean));
  const bySID=r=>!shiftIds||shiftIds.has(rowVal(r,['Shift ID']));
  state.filtered={
    shifts:all.shifts.filter(r=>byDate(r)&&byShift(r)),
    receivings:all.receivings.filter(r=>byDate(r)&&bySID(r)),
    downtimes:all.downtimes.filter(r=>byDate(r)&&bySID(r)),
    boilers:all.boilers.filter(r=>byDate(r)&&bySID(r)),
    ph:all.ph.filter(r=>byDate(r)&&bySID(r)),
    waste:all.waste.filter(r=>byDate(r)&&bySID(r)),
    sales:all.sales.filter(r=>byDate(r)&&bySID(r)),
    utilities:all.utilities.filter(r=>byDate(r)&&bySID(r))
  };
}

/* ── METRICS ── */
function metrics(){
  const f=state.filtered;
  // Net Weight = what physically entered the factory (supplier leaves full load)
  // Net After Discount = payment basis only (paper deduction)
  const netIntoFactory=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Net Weight Kg'])),0);
  const receivingKg=netIntoFactory; // use physical intake for yield calculations
  const paymentKg=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Net Weight After Discount Kg'])),0); // payment basis
  const receivingGross=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Gross Weight Kg'])),0);
  const receivingTare=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Tare Weight Kg'])),0);
  const receivingNet=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Net Weight Kg'])),0);
  const discountKg=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Discount Weight Kg'])),0);
  const priceBeforeDiscount=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Trip Price Before Discount'])),0);
  const priceAfterDiscount=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Trip Price After Discount'])),0);
  const priceDiff=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Price Difference'])),0);
  const avgDiscount=f.receivings.length?f.receivings.reduce((a,r)=>a+num(rowVal(r,['Discount Percent'])),0)/f.receivings.length:0;
  const consumedKg=f.shifts.reduce((a,r)=>a+(num(rowVal(r,['Consumed Weight Kg']))||num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg']))),0);
  const bales=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Consumed Bales Count'])),0);
  const prodKg=f.shifts.reduce((a,r)=>a+(num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg']))),0);
  const bags=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Produced Bags Count'])),0);
  const wasteKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).total,0);
  const sortexKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).sortex,0);
  const bigFlexKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).green,0); // Green Bottle / Material
  const colorBottleKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).color,0); // Color Bottle / Material
  const wireKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).bag,0); // Bag & Strap / Material
  const capsKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).caps,0); // Caps & Labels PO / Operation
  const sludgeKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).sludge,0); // Line Sludge / Operation
  const materialRecoveryKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).material,0);
  const operationRecoveryKg=f.waste.reduce((a,r)=>a+wasteBreakdown(r).operation,0);
  const actualInputKg=consumedKg;
  const bigJumboBags=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Big Jumbo Bags Count','bigJumboBagsCount'])),0);
  const smallJumboBags=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Small Jumbo Bags Count','smallJumboBagsCount'])),0);
  const sacksCount=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Sacks Count','sacksCount'])),0);
  const downtimeMin=f.downtimes.reduce((a,r)=>a+num(rowVal(r,['Downtime Minutes'])),0);
  const phVals=f.ph.map(r=>num(rowVal(r,['PH Reading']))).filter(Boolean);
  const avgPh=phVals.length?phVals.reduce((a,b)=>a+b)/phVals.length:0;
  // Boiler uses 0-100 scale — exclude from the 6.5-8.5 Sand/Rinse normal-range check
  const sandRinsePhVals=f.ph.filter(r=>!String(rowVal(r,['Area'])||'').toLowerCase().includes('boiler')).map(r=>num(rowVal(r,['PH Reading']))).filter(Boolean);
  const avgSandRinsePh=sandRinsePhVals.length?sandRinsePhVals.reduce((a,b)=>a+b)/sandRinsePhVals.length:0;
  const pvVals=f.boilers.map(r=>num(rowVal(r,['Current Temperature PV']))).filter(Boolean);
  const svVals=f.boilers.map(r=>num(rowVal(r,['Set Temperature SV']))).filter(Boolean);
  const avgPv=pvVals.length?pvVals.reduce((a,b)=>a+b)/pvVals.length:0;
  const avgSv=svVals.length?svVals.reduce((a,b)=>a+b)/svVals.length:0;
  const actualLossKg=Math.max(0,consumedKg-prodKg-wasteKg);
  const salesKg=f.sales.reduce((a,r)=>a+num(rowVal(r,['Net Weight After Discount Kg','Net Trip Weight Kg'])),0);
  const salesRevenue=f.sales.reduce((a,r)=>a+num(rowVal(r,['Sale Price After Discount'])),0);
  const salesBeforeDiscount=f.sales.reduce((a,r)=>a+num(rowVal(r,['Sale Price Before Discount'])),0);
  const salesDiscountLoss=f.sales.reduce((a,r)=>a+num(rowVal(r,['Price Difference'])),0);
  const avgSalePrice=salesKg?salesRevenue/(salesKg/1000):0;
  // Daily receiving map for avg
  const dailyRecMap={};f.receivings.forEach(r=>{const k=dateKey(rowVal(r,['Date']));dailyRecMap[k]=(dailyRecMap[k]||0)+num(rowVal(r,['Net Weight Kg']))/1000;});
  const activeDays=Object.keys(dailyRecMap);
  const avgDailyReceiving=activeDays.length?Object.values(dailyRecMap).reduce((a,b)=>a+b)/activeDays.length:0;
  // Utilities metrics
  const elecKwh=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Electricity Consumed Kwh'])),0);
  const waterM3=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Water Consumed M3'])),0);
  const sodaKg=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Soda Total Kg','Soda Flakes Total Kg','Soda Liquid Total Kg'])),0);
  const innerBagsCount=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Inner Bags Count','Inne Bags Count'])),0);
  const elecPerMT=prodKg?elecKwh/(prodKg/1000):0;
  const waterPerMT=prodKg?waterM3/(prodKg/1000):0;
  const sodaPerMT=prodKg?sodaKg/(prodKg/1000):0;
  // Utility cost tracking (for reference only - not added to sale price)
  const elecCost=f.utilities.reduce((a,r)=>a+utilCostVal(r,['Electricity Cost EGP','Electricity Cost']),0);
  const waterCost=f.utilities.reduce((a,r)=>a+utilCostVal(r,['Water Cost EGP','Water Cost']),0);
  const sodaCost=f.utilities.reduce((a,r)=>a+utilCostVal(r,['Soda Cost EGP','Soda Cost']),0);
  const fuelCost=f.utilities.reduce((a,r)=>a+utilCostVal(r,['Forklift Fuel Cost EGP','Fuel Cost EGP']),0);
  const packagingCost=f.shifts.reduce((a,r)=>a+utilCostVal(r,['Packaging Total Cost EGP','Packaging Cost EGP']),0);
  const laborCost=f.shifts.reduce((a,r)=>a+utilCostVal(r,['Labor Cost EGP','Worker Cost EGP']),0);
  const totalUtilityCost=f.utilities.reduce((a,r)=>a+(utilCostVal(r,['Total Utilities Cost EGP','Total Utility Cost']) || utilCostVal(r,['Electricity Cost EGP','Electricity Cost'])+utilCostVal(r,['Water Cost EGP','Water Cost'])+utilCostVal(r,['Soda Cost EGP','Soda Cost'])+utilCostVal(r,['Forklift Fuel Cost EGP','Fuel Cost EGP'])),0);
  const utilCostPerMT=prodKg&&totalUtilityCost?totalUtilityCost/(prodKg/1000):0;
  const totalOperatingCost=totalUtilityCost+packagingCost+laborCost;
  const operatingCostPerMT=prodKg&&totalOperatingCost?totalOperatingCost/(prodKg/1000):0;
  // Inventory change: Net Into Factory - Consumed (positive = added to stock, negative = drew from stock)
  const inventoryChange=netIntoFactory-consumedKg;
  // PH alerts: Boiler uses 0-100 scale; Sand/Rinse use standard 0-14 with 6.5-8.5 normal.
  const phAlerts=f.ph.filter(r=>{const st=phStatusFor(rowVal(r,['Area']),rowVal(r,['PH Reading']));return st.cls==='red'||st.cls==='yellow';});
  const phCritical=f.ph.filter(r=>{const area=String(rowVal(r,['Area'])).toLowerCase(),v=num(rowVal(r,['PH Reading']));return area.includes('boiler')?(v>100||v<0):(v>14||v<0||v<4||v>10);});
  // Yield formulas requested by Environ Adapt
  // Actual Yield = Actual Production / Actual Input * 100
  // Material Yield = (Actual Production + Total Material Recovery) / Actual Input * 100
  // Operation Yield = (Actual Production + Operation Recovery) / Actual Input * 100
  const actualYieldPct=pct(prodKg,actualInputKg);
  const actualYieldRatio=safeDiv(actualInputKg,prodKg);
  const materialPct=pct(prodKg+materialRecoveryKg,actualInputKg);
  const materialRatio=safeDiv(actualInputKg,prodKg+materialRecoveryKg);
  const operationPct=pct(prodKg+operationRecoveryKg,actualInputKg);
  const operationRatio=safeDiv(actualInputKg,prodKg+operationRecoveryKg);
  return {
    receivingKg,receivingGross,receivingTare,receivingNet,discountKg,
    priceBeforeDiscount,priceAfterDiscount,priceDiff,avgDiscount,
    receivingTrips:f.receivings.length,avgDailyReceiving,activeDays:activeDays.length,
    consumedKg,bales,prodKg,bags,wasteKg,sortexKg,bigFlexKg,colorBottleKg,wireKg,capsKg,sludgeKg,materialRecoveryKg,operationRecoveryKg,actualInputKg,bigJumboBags,smallJumboBags,sacksCount,
    downtimeMin,stops:f.downtimes.length,actualLossKg,
    avgPh,avgSandRinsePh,avgPv,avgSv,
    salesKg,salesRevenue,salesBeforeDiscount,salesDiscountLoss,avgSalePrice,
    salesTrips:f.sales.length,
    elecKwh,waterM3,sodaKg,innerBagsCount,elecPerMT,waterPerMT,sodaPerMT,elecCost,waterCost,sodaCost,fuelCost,packagingCost,laborCost,totalUtilityCost,utilCostPerMT,totalOperatingCost,operatingCostPerMT,paymentKg,netIntoFactory,inventoryChange,phAlerts,phCritical,actualYieldPct,actualYieldRatio,materialPct,materialRatio,operationPct,operationRatio,
    wastePct:pct(wasteKg,consumedKg),lossPct:pct(actualLossKg,consumedKg)
  };
}

/* ── CHART UTILS ── */
const C={green:'#00a651',teal:'#0891b2',blue:'#2563eb',purple:'#7c3aed',amber:'#d97706',red:'#e53e3e',greenDk:'#005c2c',greenLt:'#34d879'};
function cd(){
  Chart.defaults.font.family='Inter,ui-sans-serif,sans-serif';Chart.defaults.font.size=12;
  Chart.defaults.color=state.dark?'#7aab8a':'#5a7060';
  Chart.defaults.borderColor=state.dark?'#1e3327':'#e0ebe3';
  Chart.defaults.plugins.legend.labels.usePointStyle=true;
  Chart.defaults.plugins.legend.labels.pointStyle='circle';
  Chart.defaults.plugins.legend.labels.padding=16;
  Chart.defaults.plugins.tooltip.backgroundColor=state.dark?'#0e1a12':'#0a1a10';
  Chart.defaults.plugins.tooltip.titleColor='#fff';
  Chart.defaults.plugins.tooltip.bodyColor='rgba(255,255,255,0.75)';
  Chart.defaults.plugins.tooltip.padding=10;
  Chart.defaults.plugins.tooltip.cornerRadius=8;
}
function dk(id){if(state.charts[id]){state.charts[id].destroy();delete state.charts[id];}}
function eb(id,msg){const el=$('#'+id);if(el)el.innerHTML=`<div class="empty-state">${msg||'No data'}</div>`;}
function ec(id,msg){const c=$('#'+id);const p=c?.parentElement;if(p)p.innerHTML=`<div class="empty-state">${msg||'No data'}</div>`;}
function cc(label,val){state.activeFilter={label,val};$('#activeFilterText').textContent=`Selected: ${label} — ${fmt(val,2)}`;$('#activeFilterBar').classList.remove('hidden');showToast(`${label}: ${fmt(val,2)}`);}

function drawLine(id,labels,ds,opts={}){
  dk(id);const ctx=$('#'+id);if(!ctx)return;if(!labels.length){ec(id,'No data');return;}cd();
  const extra=opts.extra||{};
  const extraScales=extra.scales||{};
  const extraRest=Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='scales'));
  state.charts[id]=new Chart(ctx,{type:'line',data:{labels:labels.map(trLoose),datasets:ds.map(d=>({
    label:tr(d.label),data:d.data,borderColor:d.color,backgroundColor:d.fill?(d.color+'28'):'transparent',
    borderWidth:2.5,tension:.4,spanGaps:true,pointRadius:4,pointHoverRadius:7,
    pointBackgroundColor:d.color,pointBorderColor:'#fff',pointBorderWidth:2,fill:!!d.fill,
    ...(d.yAxisID?{yAxisID:d.yAxisID}:{})
  }))},options:{responsive:true,maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'top'},tooltip:{callbacks:{label:ctx=>{const v=ctx.parsed.y;return ctx.dataset.label+': '+(ctx.dataset.label.toLowerCase().includes('revenue')||ctx.dataset.label.toLowerCase().includes('cost')||ctx.dataset.label.toLowerCase().includes('price')?fmt0(v):fmt(v,2));}}}},
    onClick:(e,els)=>{if(els[0]){const i=els[0].index,di=els[0].datasetIndex;cc(ds[di].label+' '+labels[i],ds[di].data[i]);}},
    scales:{x:{grid:{display:false},ticks:{maxRotation:30,font:{size:11}}},
      y:{beginAtZero:true,grid:{color:state.dark?'#1e3327':'#f0f4f1'},ticks:{callback:v=>fmt(v,1)},...(opts.yOpts||{})},
      ...extraScales
    },...extraRest
  }});
}
function drawBar(id,labels,ds,opts={}){
  dk(id);const ctx=$('#'+id);if(!ctx)return;if(!labels.length){ec(id,'No data');return;}cd();
  state.charts[id]=new Chart(ctx,{type:'bar',data:{labels:labels.map(trLoose),datasets:ds.map(d=>({
    label:tr(d.label),data:d.data,backgroundColor:d.color+'cc',borderColor:d.color,
    borderWidth:1.5,borderRadius:6,borderSkipped:false
  }))},options:{responsive:true,maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'top'}},
    onClick:(e,els)=>{if(els[0])cc(ds[els[0].datasetIndex].label+' '+labels[els[0].index],ds[els[0].datasetIndex].data[els[0].index]);},
    scales:{x:{grid:{display:false},ticks:{maxRotation:35,font:{size:11}}},
      y:{beginAtZero:true,grid:{color:state.dark?'#1e3327':'#f0f4f1'},ticks:{callback:v=>fmt(v,1)},...(opts.yOpts||{})}
    }
  }});
}
function drawDoughnut(id,labels,data,colors){
  dk(id);const ctx=$('#'+id);if(!ctx)return;cd();
  const total=data.reduce((a,b)=>a+b,0);
  state.charts[id]=new Chart(ctx,{type:'doughnut',data:{labels:labels.map(trLoose),datasets:[{data,backgroundColor:colors,borderColor:state.dark?'#0e1a12':'#fff',borderWidth:3,hoverOffset:10}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'68%',
      plugins:{legend:{position:'right',labels:{padding:12,font:{size:12}}},
        tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.raw,2)} MT (${fmt(c.raw/total*100,1)}%)`}}
      },onClick:(e,els)=>{if(els[0])cc(labels[els[0].index],data[els[0].index]);}}});
}

/* ── KPI BUILDERS ── */
function kpi(title,value,sub,icon='✓',ib=''){
  return `<article class="kpi-card">
    <div class="kpi-icon" style="${ib?'background:'+ib:''}">${icon}</div>
    <div style="min-width:0">
      <div class="kpi-title">${title}</div>
      <div class="kpi-value">${value}</div>
      ${sub?`<div class="kpi-sub">${sub}</div>`:''}
    </div></article>`;
}
function yieldKpi(title,ratio,percent,sub,icon){
  return `<article class="kpi-card"><div class="kpi-icon">${icon}</div><div style="min-width:0">
    <div class="kpi-title">${title}</div>
    <div class="kpi-value"><span>${fmt(ratio,2)} <span class="unit">kg/kg</span></span></div>
    <div class="kpi-sub" style="font-size:15px;font-weight:800;color:var(--green);margin-top:4px">${fmt(percent,1)}%</div>
    <div class="kpi-sub">${sub}</div></div></article>`;
}
function statRow(cells){
  return `<div class="stat-row">${cells.map(c=>`<div class="stat-cell"><div class="lbl">${c.label}</div><div class="val">${c.value}</div>${c.sub?`<div class="sub">${c.sub}</div>`:''}</div>`).join('')}</div>`;
}
function table(rows,cols,emptyMsg='No records'){
  if(!rows.length)return `<div class="empty-state">${emptyMsg}<br><button class="btn ghost" style="margin-top:12px;font-size:12px" onclick="openEntry()">+ Add First Entry</button></div>`;
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c.label||c}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>{const isEstimated=String(rowVal(r,['Notes'])||'').toLowerCase().includes('estimated');const rowStyle=isEstimated?'background:rgba(217,119,6,0.06);border-left:3px solid var(--warn);':'';const cells=cols.map(c=>{const key=c.key||c;const v=rowVal(r,[key],'—');const isDateCol=(key==='Date'||key==='date'||(c.label||'').toLowerCase()==='date');const isTimeCol=key.includes('Time')||key.includes('time')||(c.label||'').toLowerCase().includes('time');const isNotesCol=key==='Notes'||key==='notes';const disp=c.fmt?c.fmt(v):isDateCol?fmtDate(v):isTimeCol?timeLabel(v):v;const cellVal=isEstimated&&isNotesCol?`<span style="color:var(--warn);font-weight:700">⚠ </span>${disp}`:disp;return `<td>${cellVal}</td>`}).join('');return `<tr style="${rowStyle}">${cells}</tr>`;}).join('')}</tbody></table></div>`;
}
function fmtDate(v){if(!v||v==='—')return '—';const d=parseDate(v);if(!d||isNaN(d))return String(v);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function badge(val,good,warn){return `<span class="badge ${val<=good?'green':val<=warn?'yellow':'red'}">${fmt(val,1)}%</span>`;}
function progressBar(label,val,max,color){
  const p=Math.min(100,num(val)/Math.max(num(max),0.001)*100);
  return `<div class="progress-wrap">
    <div class="progress-label"><span>${label}</span><span>${fmt(val,2)}</span></div>
    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${p}%;background:${color||C.green}"></div></div>
  </div>`;
}

/* ── AGGREGATE HELPERS ── */
function byDate(rows,getter){const m={};rows.forEach(r=>{const k=dateKey(rowVal(r,['Date']));if(!k)return;m[k]=(m[k]||0)+getter(r);});return m;}
function alignSeries(maps){const labels=[...new Set(maps.flatMap(m=>Object.keys(m)))].sort();return{labels,series:maps.map(m=>labels.map(l=>m[l]||0))};}

/* ════════════════════════════════════════════════════
   PAGE: SUMMARY — Executive dashboard for decision-makers
═════════════════════════════════════════════════════ */
function renderSummary(){
  const m=metrics(),f=state.filtered;
  const yieldTrend=()=>{
    const d=byDate(f.shifts,r=>(num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg'])))/num(rowVal(r,['Consumed Weight Kg'])||num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg']))));
    const vals=Object.keys(d).sort().map(k=>d[k]).filter(v=>v>0&&v<2);
    return trend(vals);
  };
  const yt=yieldTrend();
  const efficiency=m.materialPct;
  const effClass=efficiency>=68?'green':efficiency>=55?'yellow':'red';
  const uptimePct=m.stops?Math.max(0,100-pct(m.downtimeMin,(f.shifts.length||1)*480)):100;

  $('#page-summary').innerHTML=`
  <!-- DECISION SIGNALS -->
  <div class="decision-grid">
    <div class="decision-card ${effClass}">
      <div class="dc-icon">⚙</div>
      <div class="dc-label">Production Efficiency</div>
      <div class="dc-value" style="color:${effClass==='green'?C.green:effClass==='yellow'?C.amber:C.red}">${fmt(efficiency,1)}%</div>
      <div class="dc-note">${efficiency>=68?'✓ Running well — yield above target':'⚠ Below target — check consumption vs production'}<br>Trend: ${yt>0.001?'↑ Improving':yt<-0.001?'↓ Declining':'→ Stable'}</div>
    </div>
    <div class="decision-card ${m.downtimeMin>120?'red':m.downtimeMin>60?'yellow':'green'}">
      <div class="dc-icon">⏱</div>
      <div class="dc-label">Operational Uptime</div>
      <div class="dc-value" style="color:${m.downtimeMin>120?C.red:m.downtimeMin>60?C.amber:C.green}">${fmt(uptimePct,1)}%</div>
      <div class="dc-note">${m.downtimeMin} min downtime across ${m.stops} stops<br>${m.stops?'Avg stop: '+fmt(m.downtimeMin/m.stops,0)+' min · based on 8hr/shift':'No downtime recorded'}</div>
    </div>
    <div class="decision-card ${m.salesRevenue>0?'green':'yellow'}">
      <div class="dc-icon">$</div>
      <div class="dc-label">Revenue Generated</div>
      <div class="dc-value" style="color:${C.green}">${fmt0(m.salesRevenue/1000)}K</div>
      <div class="dc-note">${fmt(m.salesKg/1000,2)} MT sold · Avg ${fmt(m.avgSalePrice,0)} per MT<br>${m.salesTrips} trips · Discount saved: ${fmt0(m.salesDiscountLoss)}</div>
    </div>
  </div>

  <!-- QUICK METRICS STRIP -->
  ${statRow([
    {label:'Net Into Factory',value:`${fmt(m.netIntoFactory/1000,2)} <span class="u">MT</span>`,sub:`${m.receivingTrips} trips · physical intake`},
    {label:'Payment Basis',value:`${fmt(m.paymentKg/1000,2)} <span class="u">MT</span>`,sub:`After discount · what we paid for`},
    {label:'Consumed',value:`${fmt(m.consumedKg/1000,2)} <span class="u">MT</span>`,sub:`${fmt0(m.bales)} bales`},
    {label:'Produced',value:`${fmt(m.prodKg/1000,2)} <span class="u">MT</span>`,sub:`${fmt0(m.bags)} bags`},
    {label:'Actual Yield',value:`${fmt(m.actualYieldRatio,2)} <span class="u">kg/kg</span>`,sub:`${fmt(m.actualYieldPct,1)}% · Production ÷ Consumed`},
    {label:'Inventory Change',value:`${m.inventoryChange>=0?'+':''}${fmt(m.inventoryChange/1000,3)} <span class="u">MT</span>`,sub:m.inventoryChange>=0?'Added to stock':'Drew from stock'},
    {label:'PH Alerts',value:`${m.phAlerts.length}`,sub:m.phCritical.length?`${m.phCritical.length} critical readings!`:'readings out of range'},
    {label:'Revenue',value:`${fmt0(m.salesRevenue)}`,sub:`${m.salesTrips} trips`}
  ])}

  <div class="grid-2">
    <!-- PRODUCTION TREND -->
    <section class="panel">
      <h3>Production vs Consumption — Daily (MT)</h3>
      <div class="chart-wrap"><canvas id="sumProdChart"></canvas></div>
    </section>
    <!-- YIELD BREAKDOWN -->
    <section class="panel">
      <h3>Material Flow Breakdown</h3>
      <div style="padding:8px 0">
        ${progressBar('Net Production',m.prodKg/1000,m.consumedKg/1000,C.green)}
        ${progressBar('Waste',m.wasteKg/1000,m.consumedKg/1000,C.amber)}
        ${progressBar('Actual Loss',m.actualLossKg/1000,m.consumedKg/1000,C.red)}
      </div>
      <div style="margin-top:16px">
        ${progressBar('Uptime',uptimePct,100,C.green)}
        ${progressBar('Sales vs Produced',m.salesKg/1000,m.prodKg/1000,C.blue)}
      </div>
      <div style="margin-top:18px">
        <h3 style="margin-bottom:12px">Key Ratios</h3>
        <table class="risk-table">
          <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Material Yield</td><td>${fmt(m.materialRatio,3)} kg/kg<br><small>${fmt(m.materialPct,1)}%</small></td><td>${badge(100-m.materialPct,35,45)}</td></tr>
            <tr><td>Waste Rate</td><td>${fmt(m.wastePct,1)}%</td><td>${badge(m.wastePct,8,15)}</td></tr>
            <tr><td>Loss Rate</td><td>${fmt(m.lossPct,1)}%</td><td>${badge(m.lossPct,5,10)}</td></tr>
            <tr><td>Avg PH</td><td>${fmt(m.avgSandRinsePh,2)}<br><small style="color:var(--muted)">Sand/Rinse only</small></td><td><span class="badge ${m.avgSandRinsePh>=6.5&&m.avgSandRinsePh<=8.5?'green':m.avgSandRinsePh===0?'':'red'}">${m.avgSandRinsePh===0?'—':m.avgSandRinsePh>=6.5&&m.avgSandRinsePh<=8.5?'Normal':'Out of Range'}</span></td></tr>
            <tr><td>PH Alerts</td><td>${m.phAlerts.length} readings out of 6.5–8.5</td><td><span class="badge ${m.phAlerts.length===0?'green':m.phCritical.length>0?'red':'yellow'}">${m.phAlerts.length===0?'All Normal':m.phCritical.length>0?m.phCritical.length+' Critical!':'Watch'}</span></td></tr>
            <tr><td>Inventory Change</td><td>${m.inventoryChange>=0?'+':''}${fmt(m.inventoryChange/1000,3)} MT</td><td><span class="badge ${Math.abs(m.inventoryChange)<50?'green':'yellow'}">${m.inventoryChange>=0?'Added to Stock':'Drew from Stock'}</span></td></tr>
            <tr><td>Boiler Δ (PV-SV)</td><td>${fmt(m.avgPv-m.avgSv,1)} °C</td><td><span class="badge ${Math.abs(m.avgPv-m.avgSv)<=5?'green':Math.abs(m.avgPv-m.avgSv)<=10?'yellow':'red'}">${Math.abs(m.avgPv-m.avgSv)<=5?'Normal':Math.abs(m.avgPv-m.avgSv)<=10?'Watch':'Alert'}</span></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <!-- MANAGER RECOMMENDATION -->
  <section class="panel mt">
    <h3>🧭 Management Signals — What to do next</h3>
    <div class="grid-4" style="margin-top:14px">
      ${summarySignal('Production',efficiency>=68?'green':efficiency>=55?'yellow':'red',efficiency>=68?'Continue current operations. Yield is on target.':efficiency>=55?'Monitor closely. Yield is below target — review bale quality and machine settings.':'Immediate action needed. Yield is critically low — investigate consumption losses.',fmt(efficiency,1)+'% efficiency · Target ≥68%')}
      ${summarySignal('Waste',m.wastePct<=8?'green':m.wastePct<=15?'yellow':'red',m.wastePct<=8?'Waste is well controlled.':m.wastePct<=15?'Waste is moderate. Review Sortex, Green Bottle and Color Bottle reject rates.':'Waste is high. Check sorting line calibration and raw material quality.',fmt(m.wastePct,1)+'% of consumed · Target ≤8%')}
      ${summarySignal('Sales',m.salesKg>=m.prodKg*0.8?'green':m.salesKg>0?'yellow':'red',m.salesKg>=m.prodKg*0.8?'Sales are moving well relative to production.':m.salesKg>0?'Sales are below production — check inventory buildup.':'No sales recorded in this period.',fmt(m.salesKg/1000,2)+' MT sold vs '+fmt(m.prodKg/1000,2)+' MT produced')}
      ${summarySignal('PH Quality',m.phCritical.length>0?'red':m.phAlerts.length>0?'yellow':'green',m.phCritical.length>0?'⚠ Critical PH readings detected — immediate attention required for process quality.':m.phAlerts.length>0?'PH readings outside normal range — monitor closely and adjust chemical dosing.':'All PH readings within normal range 6.5–8.5.',m.phAlerts.length+' alert(s) · '+m.phCritical.length+' critical')}
    </div>
  </section>`;

  // Draw summary chart
  const prodMap=byDate(f.shifts,r=>(num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg'])))/1000);
  const consMap=byDate(f.shifts,r=>(num(rowVal(r,['Consumed Weight Kg']))||num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg'])))/1000);
  const {labels,series}=alignSeries([consMap,prodMap]);
  drawLine('sumProdChart',labels,[
    {label:'Consumed',data:series[0],color:C.greenDk,fill:false},
    {label:'Production',data:series[1],color:C.green,fill:true}
  ]);
}
function summarySignal(title,cls,msg,sub){
  return `<div class="decision-card ${cls}">
    <div class="dc-label">${title}</div>
    <div class="dc-note" style="font-size:13px;opacity:1;margin-bottom:8px">${msg}</div>
    <div class="dc-note">${sub}</div>
  </div>`;
}

/* ════════════════════════════════════════════════════
   PAGE: PRODUCTION — Full yield, waste, downtime
═════════════════════════════════════════════════════ */
function renderProduction(){
  const m=metrics(),f=state.filtered;
  $('#page-production').innerHTML=`
  <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
    ${kpi('Consumed',`${fmt(m.consumedKg/1000,2)} <span class="unit">MT</span>`,`${fmt0(m.bales)} bales`,'↓')}
    ${kpi('Net Production',`${fmt(m.prodKg/1000,2)} <span class="unit">MT</span>`,`${fmt0(m.bags)} bags`,'✓')}
    ${kpi('Total Waste',`${fmt(m.wasteKg/1000,2)} <span class="unit">MT</span>`,`${fmt(m.wastePct,1)}% of consumed`,'♻','rgba(217,119,6,.12)')}
    ${kpi('Actual Loss',`${fmt(m.actualLossKg/1000,2)} <span class="unit">MT</span>`,`${fmt(m.lossPct,1)}% of consumed`,'↘','rgba(229,62,62,.12)')}
    ${yieldKpi('Material Yield',m.materialRatio,m.materialPct,'Actual Input ÷ (Actual Production + Total Material Recovery)','η')}
    ${yieldKpi('Operation Yield',m.operationRatio,m.operationPct,'Actual Input ÷ (Actual Production + Operation Recovery)','⚙')}
    ${yieldKpi('Actual Yield',m.actualYieldRatio,m.actualYieldPct,'Actual Input ÷ Actual Production','◎')}
    ${kpi('Downtime',`${fmt0(m.downtimeMin)} <span class="unit">min</span>`,`${m.stops} stops · avg ${fmt(m.stops?m.downtimeMin/m.stops:0,0)} min/stop`,'⏸','rgba(229,62,62,.08)')}
    ${kpi('Avg Bag Weight',`${fmt(safeDiv(m.prodKg,m.bags),1)} <span class="unit">kg</span>`,`${fmt0(m.bags)} bags · ${fmt0(m.bales)} bales`,'▦')}
    ${kpi('Packaging Counts',`${fmt0(m.bigJumboBags+m.smallJumboBags+m.sacksCount)}`,`Big ${fmt0(m.bigJumboBags)} · Small ${fmt0(m.smallJumboBags)} · Sacks ${fmt0(m.sacksCount)}`,'▤')}
    ${kpi('Operating Cost / MT',`${fmt0(m.operatingCostPerMT||0)}`,`Utilities ${fmt0(m.utilCostPerMT||0)} · Packaging ${fmt0(m.packagingCost)} · Labor ${fmt0(m.laborCost)} · Fuel ${fmt0(m.fuelCost)}`,'💰','rgba(124,58,237,.08)')}
    ${kpi('Total Operating Cost',`${fmt0(m.totalOperatingCost||0)}`,`Utilities + packaging + labor + fuel`,'Σ','rgba(124,58,237,.06)')}
  </div>

  <!-- WASTE BREAKDOWN -->
  ${statRow([
    {label:'Sortex Waste',value:`${fmt0(m.sortexKg)} <span class='u'>kg</span>`,sub:`Operation · ${fmt(pct(m.sortexKg,m.wasteKg),1)}% of waste`},
    {label:'Caps & Label (PO)',value:`${fmt0(m.capsKg)} <span class='u'>kg</span>`,sub:`Operation · ${fmt(pct(m.capsKg,m.wasteKg),1)}% of waste`},
    {label:'Bag & Strap',value:`${fmt0(m.wireKg)} <span class='u'>kg</span>`,sub:`Material · ${fmt(pct(m.wireKg,m.wasteKg),1)}% of waste`},
    {label:'Green Bottle',value:`${fmt0(m.bigFlexKg)} <span class='u'>kg</span>`,sub:`Material · ${fmt(pct(m.bigFlexKg,m.wasteKg),1)}% of waste`},
    {label:'Color Bottle',value:`${fmt0(m.colorBottleKg)} <span class='u'>kg</span>`,sub:`Material · ${fmt(pct(m.colorBottleKg,m.wasteKg),1)}% of waste`},
    {label:'Line Sludge',value:`${fmt0(m.sludgeKg)} <span class='u'>kg</span>`,sub:`Operation · ${fmt(pct(m.sludgeKg,m.wasteKg),1)}% of waste`},
    {label:'Actual Loss',value:`${fmt0(m.actualLossKg)} <span class='u'>kg</span>`,sub:`${fmt(m.lossPct,1)}% of consumed · unaccounted`}
  ])}

  <div class="grid-3">
    <section class="panel" style="grid-column:span 2"><h3>Daily Production vs Consumption (MT)</h3><div class="chart-wrap"><canvas id="prodDailyChart"></canvas></div></section>
    <section class="panel"><h3>Waste Distribution</h3><div class="chart-wrap" id="wastePieBox"><canvas id="wastePieChart"></canvas></div></section>
  </div>
  <div class="grid-2 mt">
    <section class="panel"><h3>Daily Yield % Trend</h3><div class="chart-wrap"><canvas id="yieldTrendChart"></canvas></div></section>
    <section class="panel"><h3>Downtime by Reason (min)</h3><div class="chart-wrap"><canvas id="downChart"></canvas></div></section>
  </div>
  <section class="panel mt"><h3>Shift Records</h3>${table(f.shifts.slice().reverse(),[
    {key:'Date'},{key:'Shift Type'},{key:'Shift Start Time',label:'Start'},{key:'Shift End Time',label:'End'},
    {key:'Workers Count',label:'Workers'},
    {key:'Consumed Weight Kg',label:'Consumed (kg)',fmt:v=>fmt0(v)},
    {key:'Net Production Kg',label:'Production (kg)',fmt:v=>fmt0(v)},
    {key:'Big Jumbo Bags Count',label:'Big Jumbo',fmt:v=>fmt0(v)},
    {key:'Small Jumbo Bags Count',label:'Small Jumbo',fmt:v=>fmt0(v)},
    {key:'Sacks Count',label:'Sacks',fmt:v=>fmt0(v)},
    {key:'Material Yield Percent',label:'Yield %',fmt:v=>fmt(v,1)+'%'},
    {key:'Actual Loss Kg',label:'Loss (kg)',fmt:v=>fmt0(v)},
    {key:'Notes'}
  ])}</section>
  <section class="panel mt"><h3>Downtime Log</h3>${table(f.downtimes.slice().reverse(),[
    {key:'Date'},{key:'Stop From Time',label:'From'},{key:'Stop To Time',label:'To'},
    {key:'Downtime Minutes',label:'Minutes',fmt:v=>fmt0(v)},
    {key:'Downtime Reason',label:'Reason'},{key:'Notes'}
  ])}</section>
  <section class="panel mt">
    <h3>Utilities per Shift</h3>
    ${statRow([
      {label:'Electricity',value:`${fmt(m.elecKwh,1)} <span class="u">kWh</span>`,sub:`Cost ${fmt0(m.elecCost)} EGP · ${m.prodKg?fmt(m.elecPerMT,1)+' kWh/MT':''}`},
      {label:'Water',value:`${fmt(m.waterM3,1)} <span class="u">m³</span>`,sub:`Cost ${fmt0(m.waterCost)} EGP · ${m.prodKg?fmt(m.waterPerMT,2)+' m³/MT':''}`},
      {label:'Soda',value:`${fmt(m.sodaKg,1)} <span class="u">kg</span>`,sub:`Cost ${fmt0(m.sodaCost)} EGP · ${m.prodKg?fmt(m.sodaPerMT,2)+' kg/MT':''}`},
      {label:'Forklift Fuel Cost',value:`${fmt0(m.fuelCost)} <span class="u">EGP</span>`,sub:'Diesel / gasoline source rate'},
      {label:'Total Utilities Cost',value:`${fmt0(m.totalUtilityCost)} <span class="u">EGP</span>`,sub:m.utilCostPerMT?fmt0(m.utilCostPerMT)+' EGP/MT':`${f.utilities.length} utility records`},
      {label:'Total Operating Cost',value:`${fmt0(m.totalOperatingCost)} <span class="u">EGP</span>`,sub:m.operatingCostPerMT?fmt0(m.operatingCostPerMT)+' EGP/MT':'Utilities + packaging + labor'}
    ])}
    ${table(f.utilities.slice().reverse(),[
      {key:'Date'},{key:'Shift Type',label:'Shift'},
      {key:'Electricity Start Reading Kwh',label:'Elec Start',fmt:v=>fmt(v,1)},
      {key:'Electricity End Reading Kwh',label:'Elec End',fmt:v=>fmt(v,1)},
      {key:'Electricity Consumed Kwh',label:'Elec kWh',fmt:v=>fmt(v,1)},
      {key:'Electricity Rate EGP/kWh',label:'EGP/kWh',fmt:v=>fmt(v,3)},
      {key:'Electricity Cost EGP',label:'Elec Cost',fmt:v=>fmt0(v)},
      {key:'Water Consumed M3',label:'Water m³',fmt:v=>fmt(v,2)},
      {key:'Water Rate EGP/M3',label:'EGP/m³',fmt:v=>fmt(v,3)},
      {key:'Water Cost EGP',label:'Water Cost',fmt:v=>fmt0(v)},
      {key:'Soda Type',label:'Soda Type'},
      {key:'Soda Total Kg',label:'Soda kg',fmt:v=>fmt(v,1)},
      {key:'Soda Liquid Liters',label:'Soda L',fmt:v=>fmt(v,1)},
      {key:'Soda Cost EGP',label:'Soda Cost',fmt:v=>fmt0(v)},
      {key:'Total Utilities Cost EGP',label:'Total Cost',fmt:v=>fmt0(v)},
      {key:'Validation Status',label:'Status'},
      {key:'Notes'}
    ],'No utility records yet')}
  </section>`;

  // Charts
  const prodMap=byDate(f.shifts,r=>(num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg'])))/1000);
  const consMap=byDate(f.shifts,r=>(num(rowVal(r,['Consumed Weight Kg']))||num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg'])))/1000);
  const lossMap={};Object.keys(consMap).forEach(k=>lossMap[k]=Math.max(0,(consMap[k]||0)-(prodMap[k]||0)));
  const {labels:dl,series:ds}=alignSeries([consMap,prodMap,lossMap]);
  drawLine('prodDailyChart',dl,[
    {label:'Consumed',data:ds[0],color:C.greenDk},{label:'Production',data:ds[1],color:C.green,fill:true},{label:'Loss',data:ds[2],color:C.red}
  ]);
  // Waste pie
  const wv=[m.sortexKg,m.bigFlexKg,m.colorBottleKg,m.wireKg,m.capsKg,m.sludgeKg].map(v=>v/1000);
  if(wv.reduce((a,b)=>a+b))drawDoughnut('wastePieChart',['Sortex','Green Bottle','Color Bottle','Bag & Strap','Caps & Labels (PO)','Line Sludge'],wv,[C.green,C.teal,C.blue,C.amber,C.purple,C.red]);
  else eb('wastePieBox','No waste data');
  // Yield trend
  const ym=byDate(f.shifts,r=>{const p=num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg']));const c=num(rowVal(r,['Consumed Weight Kg']))||num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg']));return c?p/c*100:0;});
  const yl=Object.keys(ym).sort();
  if(yl.length)drawLine('yieldTrendChart',yl,[{label:'Actual Yield %',data:yl.map(k=>ym[k]),color:C.green,fill:true}],{yOpts:{min:0,max:100,ticks:{callback:v=>v+'%'}}});
  else ec('yieldTrendChart','No yield data');
  // Downtime bar
  const dm={};f.downtimes.forEach(r=>{const s=rowVal(r,['Downtime Reason'],'Unknown');dm[s]=(dm[s]||0)+num(rowVal(r,['Downtime Minutes']));});
  const dk2=Object.keys(dm).sort((a,b)=>dm[b]-dm[a]);
  if(dk2.length)drawBar('downChart',dk2,[{label:'Minutes',data:dk2.map(k=>dm[k]),color:C.red}]);
  else ec('downChart','No downtime data');
}

/* ════════════════════════════════════════════════════
   PAGE: RECEIVING — Full details with discount & prices
═════════════════════════════════════════════════════ */
function renderReceiving(){
  const m=metrics(),f=state.filtered;
  const dailyMap=byDate(f.receivings,r=>num(rowVal(r,['Net Weight Kg']))/1000);
  const dKeys=Object.keys(dailyMap).sort();
  $('#page-receiving').innerHTML=`
  <div class="kpi-grid">
    ${kpi('Net Into Factory',`${fmt(m.netIntoFactory/1000,2)} <span class="unit">MT</span>`,`${m.receivingTrips} trips · supplier leaves full load`,'▣')}
    ${kpi('Payment Basis',`${fmt(m.paymentKg/1000,2)} <span class="unit">MT</span>`,`After discount · ${fmt(m.discountKg/1000,2)} MT deducted on paper`,'💳','rgba(217,119,6,.08)')}
    ${kpi('Avg Daily (Physical)',`${fmt(m.avgDailyReceiving,2)} <span class="unit">MT</span>`,`${m.activeDays} active days · net weight basis`,'📅')}
    ${kpi('Discount (Paper Only)',`${fmt(m.avgDiscount,1)} <span class="unit">%</span>`,`${fmt(m.discountKg/1000,2)} MT · material stays in factory`,'%','rgba(217,119,6,.1)')}
  </div>

  <!-- PRICE ROW -->
  ${statRow([
    {label:'Price Before Discount',value:`${fmt0(m.priceBeforeDiscount)}`,sub:'Total trip prices'},
    {label:'Price After Discount',value:`${fmt0(m.priceAfterDiscount)}`,sub:'What we paid'},
    {label:'Total Discount Amount',value:`${fmt0(m.priceDiff)}`,sub:'Saved via deduction'},
    {label:'Avg Price / Ton',value:`${fmt(m.paymentKg?m.priceAfterDiscount/(m.paymentKg/1000):0,0)}`,sub:'After discount · per payment MT'},
    {label:'Discount Weight',value:`${fmt(m.discountKg/1000,2)} MT`,sub:`${fmt(m.avgDiscount,1)}% avg rate`}
  ])}

  <div class="grid-3">
    <section class="panel"><h3>Supplier Share (MT)</h3><div class="chart-wrap" id="supPieBox"><canvas id="supPieChart"></canvas></div></section>
    <section class="panel" style="grid-column:span 2"><h3>Daily Receiving Trend (MT)</h3><div class="chart-wrap"><canvas id="recTrendChart"></canvas></div></section>
  </div>
  <div class="grid-2 mt">
    <section class="panel"><h3>By Supplier — Total MT</h3><div class="chart-wrap"><canvas id="supBarChart"></canvas></div></section>
    <section class="panel"><h3>Discount % by Trip</h3><div class="chart-wrap"><canvas id="discountChart"></canvas></div></section>
  </div>
  <section class="panel mt"><h3>All Receiving Records</h3>${table(f.receivings.slice().reverse(),[
    {key:'Date'},{key:'Supplier Name',label:'Supplier'},{key:'Region'},{key:'Vehicle Number',label:'Vehicle'},
    {key:'Bales Count',label:'Bales',fmt:v=>fmt0(v)},
    {key:'Gross Weight Kg',label:'Gross (kg)',fmt:v=>fmt0(v)},
    {key:'Tare Weight Kg',label:'Tare (kg)',fmt:v=>fmt0(v)},
    {key:'Net Weight Kg',label:'Net (kg)',fmt:v=>fmt0(v)},
    {key:'Discount Percent',label:'Disc %',fmt:v=>fmt(v,1)+'%'},
    {key:'Discount Weight Kg',label:'Disc (kg)',fmt:v=>fmt0(v)},
    {key:'Net Weight After Discount Kg',label:'After Disc (kg)',fmt:v=>fmt0(v)},
    {key:'Trip Price Before Discount',label:'Price Before',fmt:v=>fmt0(v)},
    {key:'Trip Price After Discount',label:'Price After',fmt:v=>fmt0(v)},
    {key:'Price Difference',label:'Diff',fmt:v=>fmt0(v)},
    {key:'Average Bale Weight Kg',label:'Avg Bale',fmt:v=>fmt(v,1)},
    {key:'Notes'}
  ])}</section>
  <div style="margin-top:10px;padding:12px 16px;background:var(--panel2);border-radius:10px;font-size:12.5px;color:var(--muted);border:1px solid var(--line)">
    <b style="color:var(--text)">📌 Note on Receiving Figures</b> · <b>Net Into Factory</b> = physical material (Net Weight) used for Yield calculations · <b>Payment Basis</b> = Net Weight minus discount used for cost calculations · Discount weight stays in the factory — supplier does not take it back.
  </div>`;

  // Supplier pie
  const sm={};f.receivings.forEach(r=>{const s=rowVal(r,['Supplier Name'],'Unknown');sm[s]=(sm[s]||0)+num(rowVal(r,['Net Weight Kg']))/1000;});
  const sk=Object.keys(sm).sort((a,b)=>sm[b]-sm[a]);
  if(sk.length){drawDoughnut('supPieChart',sk,sk.map(k=>sm[k]),[C.green,C.teal,C.blue,C.purple,C.amber]);}else eb('supPieBox','No data');
  // Daily trend
  if(dKeys.length)drawLine('recTrendChart',dKeys,[{label:'Received MT',data:dKeys.map(k=>dailyMap[k]),color:C.green,fill:true}]);else ec('recTrendChart','No data');
  // Supplier bar
  if(sk.length)drawBar('supBarChart',sk,[{label:'MT',data:sk.map(k=>sm[k]),color:C.green}]);else ec('supBarChart','No data');
  // Discount scatter as bar per trip
  const dLabels=f.receivings.map(r=>rowVal(r,['Date'])+' '+rowVal(r,['Supplier Name'],'').slice(0,8));
  const dVals=f.receivings.map(r=>num(rowVal(r,['Discount Percent'])));
  if(dLabels.length)drawBar('discountChart',dLabels,[{label:'Discount %',data:dVals,color:C.amber}]);else ec('discountChart','No data');
}

/* ════════════════════════════════════════════════════
   PAGE: SALES — Revenue, profitability, risk analysis
═════════════════════════════════════════════════════ */
function renderSales(){
  const m=metrics(),f=state.filtered;
  // Raw material cost = payment basis (After Discount) not physical intake
  const rawMatCostPerMT=m.prodKg?m.priceAfterDiscount/(m.prodKg/1000):0;
  // Full cost per MT = raw material + operating cost (utilities + packaging + labor + forklift fuel)
  const costPerMT=rawMatCostPerMT; // raw material only for price decision
  const fullCostPerMT=costPerMT+(m.operatingCostPerMT||0);
  const grossMarginPct=m.salesRevenue&&costPerMT?pct(m.avgSalePrice-costPerMT,m.avgSalePrice):0;
  const fullMarginPct=m.salesRevenue&&fullCostPerMT?pct(m.avgSalePrice-fullCostPerMT,m.avgSalePrice):0;
  const breakeven=fullCostPerMT||costPerMT;
  $('#page-sales').innerHTML=`
  <div class="kpi-grid">
    ${kpi('Total Revenue',`${fmt0(m.salesRevenue)}`,`${m.salesTrips} trips · ${fmt(m.salesKg/1000,2)} MT sold`,'$')}
    ${kpi('Avg Sale Price',`${fmt0(m.avgSalePrice)} <span class="unit">/MT</span>`,`Before discount: ${fmt0(m.salesBeforeDiscount/(m.salesKg/1000||1))} /MT`,'↗')}
    ${kpi('Raw Material Cost/MT',`${fmt0(rawMatCostPerMT)}`,`Payment basis ÷ production`,'÷','rgba(37,99,235,.1)')}
    ${kpi('Full Cost/MT',`${fmt0(fullCostPerMT)}`,m.operatingCostPerMT?`Raw ${fmt0(rawMatCostPerMT)} + Operating ${fmt0(m.operatingCostPerMT)}`:'Add operating data','⚙','rgba(124,58,237,.08)')}
    ${kpi('Margin (Raw only)',`${fmt(grossMarginPct,1)} <span class="unit">%</span>`,grossMarginPct>0?`~${fmt((m.avgSalePrice-costPerMT)*m.salesKg/1000,0)} total`:'No cost data','◈',grossMarginPct>15?'rgba(0,166,81,.1)':'rgba(229,62,62,.1)')}
    ${kpi('Sales Discount Given',`${fmt0(m.salesDiscountLoss)}`,`${fmt(f.sales.length?f.sales.reduce((a,r)=>a+num(rowVal(r,['Discount Percent'])),0)/f.sales.length:0,1)}% avg discount`,'%','rgba(217,119,6,.1)')}
    ${kpi('Price Before Disc',`${fmt0(m.salesBeforeDiscount)}`,`Discount loss: ${fmt0(m.salesDiscountLoss)}`,'✦')}
    ${kpi('Revenue / MT',`${fmt0(m.salesKg?m.salesRevenue/(m.salesKg/1000):0)}`,`Net after all discounts`,'=')}
    ${kpi('Break-even Price',`${fmt0(breakeven)} <span class="unit">/MT</span>`,breakeven?`Selling at ${fmt(pct(m.avgSalePrice-breakeven,breakeven),1)}% above cost`:'Add receiving cost','⚖',breakeven&&m.avgSalePrice>breakeven?'rgba(0,166,81,.1)':'rgba(229,62,62,.1)')}
  </div>

  <!-- PRICE ANALYSIS -->
  <div class="price-analysis">
    <div class="insight-card">
      <h4>Price Analysis</h4>
      <div class="insight-row"><span class="ir-label">Avg Sale Price (MT)</span><span class="ir-value">${fmt0(m.avgSalePrice)}</span></div>
      <div class="insight-row"><span class="ir-label">Raw Material Cost (MT)</span><span class="ir-value">${fmt0(rawMatCostPerMT)}</span></div>
      <div class="insight-row"><span class="ir-label">Operating Cost (MT)</span><span class="ir-value">${fmt0(m.operatingCostPerMT||0)}</span></div>
      <div class="insight-row"><span class="ir-label">Full Cost (MT)</span><span class="ir-value">${fmt0(fullCostPerMT)}</span></div>
      <div class="insight-row"><span class="ir-label">Margin vs Raw Cost</span><span class="ir-value ${m.avgSalePrice>rawMatCostPerMT?'pos':'neg'}">${m.avgSalePrice>rawMatCostPerMT?'+':''}${fmt0(m.avgSalePrice-rawMatCostPerMT)}</span></div>
      <div class="insight-row"><span class="ir-label">Gross Profit / MT</span><span class="ir-value ${m.avgSalePrice>rawMatCostPerMT?'pos':'neg'}">${m.avgSalePrice>rawMatCostPerMT?'+':''}${fmt0(m.avgSalePrice-rawMatCostPerMT)} EGP</span></div>
      <div class="insight-row"><span class="ir-label">Margin vs Full Cost</span><span class="ir-value ${m.avgSalePrice>fullCostPerMT?'pos':'neg'}">${m.avgSalePrice>fullCostPerMT?'+':''}${fmt0(m.avgSalePrice-fullCostPerMT)}</span></div>
      <div class="insight-row"><span class="ir-label">Break-even (full cost)</span><span class="ir-value">${fmt0(breakeven)}</span></div>
      <div class="insight-row"><span class="ir-label">Safety Margin</span><span class="ir-value ${m.avgSalePrice>breakeven*1.1?'pos':'neg'}">${fmt(pct(m.avgSalePrice-breakeven,breakeven),1)}%</span></div>
    </div>
    <div class="insight-card">
      <h4>Risk Analysis</h4>
      <table class="risk-table">
        <thead><tr><th>Risk Factor</th><th>Current</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Price above cost</td><td>${fmt0(m.avgSalePrice)} vs ${fmt0(costPerMT)}</td><td><span class="badge ${m.avgSalePrice>costPerMT*1.05?'green':m.avgSalePrice>costPerMT?'yellow':'red'}">${m.avgSalePrice>costPerMT*1.05?'Safe':m.avgSalePrice>costPerMT?'Tight':'Loss'}</span></td></tr>
          <tr><td>Discount given</td><td>${fmt(f.sales.length?f.sales.reduce((a,r)=>a+num(rowVal(r,['Discount Percent'])),0)/f.sales.length:0,1)}%</td><td><span class="badge ${(f.sales.length?f.sales.reduce((a,r)=>a+num(rowVal(r,['Discount Percent'])),0)/f.sales.length:0)<=3?'green':'yellow'}">Review</span></td></tr>
          <tr><td>Sales coverage</td><td>${fmt(pct(m.salesKg,m.prodKg),0)}% of production</td><td><span class="badge ${m.salesKg>=m.prodKg*0.8?'green':m.salesKg>0?'yellow':'red'}">${m.salesKg>=m.prodKg*0.8?'Good':'Low'}</span></td></tr>
          <tr><td>Yield impact</td><td>${fmt(m.materialPct,1)}% efficiency</td><td><span class="badge ${m.materialPct>=68?'green':m.materialPct>=55?'yellow':'red'}">${m.materialPct>=68?'On Target':m.materialPct>=55?'Watch':'Critical'}</span></td></tr>
        </tbody>
      </table>
      <div style="margin-top:14px;padding:12px;background:var(--panel2);border-radius:10px;font-size:12.5px;line-height:1.7;color:var(--muted)">
        <b style="color:var(--text)">💡 Optimal Selling Price Suggestion</b><br>
        Raw material cost: ${fmt0(rawMatCostPerMT)}/MT · Operating: ${fmt0(m.operatingCostPerMT||0)}/MT · Full cost: ${fmt0(fullCostPerMT)}/MT<br>
        Target price (full cost + 15%) = <b style="color:var(--green)">${fmt0(fullCostPerMT*1.15)}/MT</b><br>
        ${m.avgSalePrice>fullCostPerMT*1.15?'✓ Current price exceeds target':'⚠ Consider negotiating higher price — utilities included in calculation'}
      </div>
    </div>
  </div>

  <div class="grid-2">
    <section class="panel"><h3>Daily Revenue Trend</h3><div class="chart-wrap"><canvas id="revTrendChart"></canvas></div></section>
    <section class="panel"><h3>Revenue by Buyer</h3><div class="chart-wrap"><canvas id="buyerChart"></canvas></div></section>
  </div>
  <section class="panel mt"><h3>All Sales Records</h3>${table(f.sales.slice().reverse(),[
    {key:'Date'},{key:'Buyer Factory Name',label:'Buyer'},{key:'Buyer Factory Location',label:'Location'},
    {key:'Vehicle Number',label:'Vehicle'},
    {key:'Net Trip Weight Kg',label:'Net Trip Wt (kg)',fmt:v=>fmt0(v)},
    {key:'Discount Percent',label:'Disc %',fmt:v=>fmt(v,1)+'%'},
    {key:'Discount Weight Kg',label:'Disc Weight (kg)',fmt:v=>fmt0(v)},
    {key:'Net Weight After Discount Kg',label:'Net Weight (kg)',fmt:v=>fmt0(v)},
    {key:'Flex Price Per Ton Thousand',label:'Price/Ton (×1K)',fmt:v=>fmt(v,1)},
    {key:'Sale Price Before Discount',label:'Before Disc',fmt:v=>fmt0(v)},
    {key:'Sale Price After Discount',label:'After Disc',fmt:v=>fmt0(v)},
    {key:'Price Difference',label:'Disc Amount',fmt:v=>fmt0(v)},
    {key:'Notes'}
  ])}</section>`;

  const revMap=byDate(f.sales,r=>num(rowVal(r,['Sale Price After Discount'])));
  const rKeys=Object.keys(revMap).sort();
  if(rKeys.length)drawLine('revTrendChart',rKeys,[{label:'Revenue',data:rKeys.map(k=>revMap[k]),color:C.green,fill:true}]);else ec('revTrendChart','No data');
  const bm={};f.sales.forEach(r=>{const b=rowVal(r,['Buyer Factory Name'],'Unknown');bm[b]=(bm[b]||0)+num(rowVal(r,['Sale Price After Discount']));});
  const bk=Object.keys(bm).sort((a,b2)=>bm[b2]-bm[a]);
  if(bk.length)drawBar('buyerChart',bk,[{label:'Revenue',data:bk.map(k=>bm[k]),color:C.blue}]);else ec('buyerChart','No data');
}

/* ════════════════════════════════════════════════════
   PAGE: QUALITY — PVC, Metal, Color, Other, PH
═════════════════════════════════════════════════════ */
function renderQuality(){
  const f=state.filtered;
  // PH analysis per area
  const phByArea={Boiler:[],Rinse:[],Sand:[]};
  f.ph.forEach(r=>{
    const area=String(rowVal(r,['Area'])||'').toLowerCase();
    const val=num(rowVal(r,['PH Reading']));
    if(!val)return;
    if(area.includes('boiler'))phByArea.Boiler.push(val);
    else if(area.includes('rinse'))phByArea.Rinse.push(val);
    else if(area.includes('sand'))phByArea.Sand.push(val);
  });
  const phAvg=arr=>arr.length?arr.reduce((a,b)=>a+b)/arr.length:0;
  const phStatus=(area,v)=>phStatusFor(area,v).text;
  const phClass=(area,v)=>phStatusFor(area,v).cls;

  // Waste quality proxies
  const m=metrics();
  const sortexPct=pct(m.sortexKg,m.consumedKg);
  const metalPct=pct(m.wireKg,m.consumedKg);   // Bag & Strap proxy
  const colorPct=pct(m.bigFlexKg+m.colorBottleKg,m.consumedKg); // Green Bottle + Color Bottle proxy
  const otherPct=pct(m.capsKg,m.consumedKg);

  function gauge(label,val,limit,unit='%'){
    const p=limit>0?Math.min(100,val/limit*100):0;
    const cls=unit==='pH'?(val===0?'':phStatusFor(label,val).cls==='red'?'bad':phStatusFor(label,val).cls==='yellow'?'warn':'ok'):(val<=limit*0.5?'ok':val<=limit*0.8?'warn':'bad');
    return `<div class="gauge-card ${cls}">
      <div class="g-label">${label}</div>
      <div class="g-value">${val===0&&unit==='pH'?'—':fmt(val,2)}${unit==='%'?' %':unit==='pH'?' pH':' '+unit}</div>
      <div class="g-bar-wrap"><div class="g-bar" style="width:${p}%"></div></div>
      <div class="g-limit">Limit: ${fmt(limit,1)}${unit==='%'?' %':unit==='pH'?' pH':' '+unit}</div>
    </div>`;
  }

  const phAlertHtml = m.phAlerts.length ? `
    <div style="background:${m.phCritical.length?'#fef2f2':'#fffbeb'};border:1px solid ${m.phCritical.length?'#fca5a5':'#fcd34d'};border-radius:10px;padding:14px 18px;margin-bottom:14px">
      <b style="color:${m.phCritical.length?'#991b1b':'#854d0e'}">${m.phCritical.length?'🚨 Critical PH Readings!':'⚠ PH Out of Range'}</b>
      <div style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">
        ${m.phAlerts.map(r=>`<div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:8px 12px;font-size:12.5px">
          <b>${rowVal(r,['Area'])}</b> · ${fmt(num(rowVal(r,['PH Reading'])),2)} pH<br>
          <span style="color:var(--muted)">${rowVal(r,['Date'])} ${rowVal(r,['Entry Time'])} · 
          ${phStatusFor(rowVal(r,['Area']),rowVal(r,['PH Reading'])).text}</span>
        </div>`).join('')}
      </div>
    </div>` : '';
  $('#page-quality').innerHTML=`
  ${phAlertHtml}
  <!-- QUALITY GAUGES -->
  <div style="margin-bottom:14px">
    <p style="font-size:12px;color:var(--muted);margin-bottom:10px">Contaminant rates as % of consumed material · PH readings per area</p>
    <div class="gauge-grid">
      ${gauge('PVC / Sortex',sortexPct,5)}
      ${gauge('Bag & Strap',metalPct,1)}
      ${gauge('Color / Green + Color Bottle',colorPct,3)}
      ${gauge('Other / Caps',otherPct,2)}
      ${gauge('Boiler PH',phAvg(phByArea.Boiler),100,'pH')}
    </div>
    <div class="gauge-grid" style="grid-template-columns:repeat(3,1fr)">
      ${gauge('Sand Filter PH',phAvg(phByArea.Sand),14,'pH')}
      ${gauge('Rinse Tank PH',phAvg(phByArea.Rinse),14,'pH')}
      ${gauge('Total Contamination %',sortexPct+metalPct+colorPct+otherPct,10)}
    </div>
  </div>

  <!-- PH TABLE -->
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    ${['Boiler','Sand Filter','Rinse Tank'].map(area=>{
      const key=area.split(' ')[0];const vals=phByArea[key]||[];const avg=phAvg(vals);
      const mn=vals.length?Math.min(...vals):0,mx=vals.length?Math.max(...vals):0;
      const st=phStatusFor(area,avg);return kpi(area+' PH',avg?fmt(avg,2):'—',vals.length?`Min ${fmt(mn,2)} · Max ${fmt(mx,2)} · ${vals.length} readings · ${st.text}`:'No readings','pH',st.cls==='red'?'rgba(229,62,62,.12)':st.cls==='yellow'?'rgba(217,119,6,.12)':'');
    }).join('')}
  </div>

  <div class="grid-2">
    <section class="panel"><h3>PH Trend by Area</h3><div class="panel-head" style="margin-top:-8px">${phFilterHtml()}</div><div class="chart-wrap"><canvas id="phQChart"></canvas></div></section>
    <section class="panel"><h3>Contaminant Breakdown (kg)</h3><div class="chart-wrap" id="contPieBox"><canvas id="contPieChart"></canvas></div></section>
  </div>
  <div class="grid-2 mt">
    <section class="panel"><h3>Waste Type Trend (Daily MT)</h3><div class="chart-wrap"><canvas id="wasteTrendChart"></canvas></div></section>
    <section class="panel"><h3>PH Status Summary</h3>
      <table class="risk-table">
        <thead><tr><th>Area</th><th>Avg PH</th><th>Min</th><th>Max</th><th>Readings</th><th>Status</th></tr></thead>
        <tbody>${['Boiler','Sand','Rinse'].map(k=>{
          const vals=phByArea[k]||[],avg=phAvg(vals),mn=vals.length?Math.min(...vals):0,mx=vals.length?Math.max(...vals):0;
          return `<tr><td>${k==='Sand'?'Sand Filter':k==='Rinse'?'Rinse Tank':k}</td><td><b>${avg?fmt(avg,2):'—'}</b></td><td>${mn?fmt(mn,2):'—'}</td><td>${mx?fmt(mx,2):'—'}</td><td>${vals.length}</td><td><span class="badge ${phClass(k==='Sand'?'Sand Filter':k==='Rinse'?'Rinse Tank':k,avg)==='red'?'red':phClass(k==='Sand'?'Sand Filter':k==='Rinse'?'Rinse Tank':k,avg)==='yellow'?'yellow':'green'}">${phStatus(k==='Sand'?'Sand Filter':k==='Rinse'?'Rinse Tank':k,avg)}</span></td></tr>`;
        }).join('')}</tbody>
      </table>
    </section>
  </div>
  <section class="panel mt"><h3>PH Readings Log</h3>${table(f.ph.slice().reverse(),[
    {key:'Date'},{key:'Entry Time',label:'Time'},{key:'Area'},
    {key:'PH Reading',label:'PH',fmt:v=>fmt(v,2)},
    {key:'PH Status',label:'Status'},{key:'Notes'}
  ])}</section>`;

  wireLocalFilters('Q');
  drawPHTrendInto('phQChart');

  // Contaminant pie
  const cv=[m.sortexKg,m.capsKg,m.wireKg,m.bigFlexKg,m.colorBottleKg,m.sludgeKg];
  if(cv.reduce((a,b)=>a+b))drawDoughnut('contPieChart',['Sortex Waste','Caps & Label (PO)','Bag & Strap','Green Bottle','Color Bottle','Line Sludge'],cv,[C.green,C.purple,C.teal,C.amber,C.blue,C.red]);
  else eb('contPieBox','No contamination data');

  // Waste trend
  const sm2=byDate(f.waste,r=>wasteBreakdown(r).sortex/1000);
  const cm2=byDate(f.waste,r=>wasteBreakdown(r).caps/1000);
  const gm2=byDate(f.waste,r=>wasteBreakdown(r).green/1000);
  const cbm2=byDate(f.waste,r=>wasteBreakdown(r).color/1000);
  const bm2=byDate(f.waste,r=>wasteBreakdown(r).bag/1000);
  const lm2=byDate(f.waste,r=>wasteBreakdown(r).sludge/1000);
  const {labels:wl,series:ws}=alignSeries([sm2,cm2,gm2,cbm2,bm2,lm2]);
  if(wl.length)drawLine('wasteTrendChart',wl,[{label:'Sortex',data:ws[0],color:C.green},{label:'Caps & Label (PO)',data:ws[1],color:C.purple},{label:'Green Bottle',data:ws[2],color:C.amber},{label:'Color Bottle',data:ws[3],color:C.blue},{label:'Bag & Strap',data:ws[4],color:C.teal},{label:'Line Sludge',data:ws[5],color:C.red}]);
  else ec('wasteTrendChart','No data');
}

/* ════════════════════════════════════════════════════
   PAGE: BOILER & PH — Full process monitoring
═════════════════════════════════════════════════════ */
function renderBoilerPH(){
  const m=metrics(),f=state.filtered;
  $('#page-boilerph').innerHTML=`
  <div class="kpi-grid">
    ${kpi('Boiler Avg PV',`${fmt(m.avgPv,1)} <span class="unit">°C</span>`,`SV avg: ${fmt(m.avgSv,1)} °C`,'℃')}
    ${kpi('Gap To Target',`${fmt(m.avgSv-m.avgPv,1)} <span class="unit">°C</span>`,'SV − PV · positive means still below target','Δ',(m.avgSv-m.avgPv)>10?'rgba(229,62,62,.12)':(m.avgSv-m.avgPv)>5?'rgba(217,119,6,.12)':'')}
    ${kpi('Boiler Readings',`${fmt0(f.boilers.length)}`,`${[...new Set(f.boilers.map(r=>rowVal(r,['Boiler Number'])))].length} boilers · ${[...new Set(f.boilers.map(r=>rowVal(r,['Meter Number'])))].length} meters`,'▤')}
    ${kpi('PH Alerts',`${fmt0(m.phAlerts.length)}`,`Boiler 0–100 · Sand/Rinse 0–14 · ${f.ph.length} readings`,'pH',m.phCritical.length?'rgba(229,62,62,.12)':m.phAlerts.length?'rgba(217,119,6,.12)':'')}
  </div>

  <!-- METER CARDS -->
  <div id="meterCards" class="meter-cards" style="grid-template-columns:repeat(6,1fr)"></div>

  <div class="panel-head" style="margin-bottom:10px">${boilerFilterHtml()}</div>
  <div class="grid-2">
    <section class="panel"><h3>Boiler Temperature Trend (°C)</h3><div class="chart-wrap tall"><canvas id="boilerChart"></canvas></div></section>
    <section class="panel"><div class="panel-head"><h3>PH Trend by Area</h3>${phFilterHtml()}</div><div class="chart-wrap tall"><canvas id="phBChart"></canvas></div></section>
  </div>
  <section class="panel mt"><h3>Boiler Readings — Full Log</h3>${table(f.boilers.slice().reverse(),[
    {key:'Date'},{key:'Entry Time',label:'Time'},{key:'Boiler Number',label:'Boiler'},{key:'Meter Number',label:'Meter'},
    {key:'Current Temperature PV',label:'PV (°C)',fmt:v=>fmt(v,1)},
    {key:'Set Temperature SV',label:'SV (°C)',fmt:v=>fmt(v,1)},
    {key:'Temperature Difference',label:'PV-SV Δ',fmt:v=>fmt(v,1)},
    {key:'Gap To Target',label:'SV-PV Gap',fmt:v=>fmt(v,1)},
    {key:'Current Ampere',label:'Ampere (A)',fmt:v=>fmt(v,2)},
    {key:'Sensor Status',label:'Sensor'},
    {key:'Notes'}
  ])}</section>
  <section class="panel mt"><h3>PH Readings — Full Log</h3>${table(f.ph.slice().reverse(),[
    {key:'Date'},{key:'Entry Time',label:'Time'},{key:'Area'},
    {key:'PH Reading',label:'PH',fmt:v=>fmt(v,2)},{key:'PH Status',label:'Status'},{key:'PH Alert',label:'Alert'},{key:'Notes'}
  ])}</section>`;

  renderMeterCards(f.boilers);
  wireLocalFilters('B');
  drawBoilerTrendInto('boilerChart');
  drawPHTrendInto('phBChart');
}

/* ── PH / BOILER SHARED CHART FUNCTIONS ── */
function phFilterHtml(){return `<div class="filters-row"><button class="chip active" data-ph="all">All</button><button class="chip" data-ph="Boiler">Boiler</button><button class="chip" data-ph="Sand Filter">Sand</button><button class="chip" data-ph="Rinse Tank">Rinse</button></div>`;}
function boilerFilterHtml(){return `<div class="filters-row"><select id="boilerSel" style="min-height:30px;padding:4px 8px;font-size:12px"><option value="all">All Boilers</option><option value="1">Boiler 1</option><option value="2">Boiler 2</option></select><select id="meterSel" style="min-height:30px;padding:4px 8px;font-size:12px"><option value="all">All Meters</option>${[1,2,3,4,5,6].map(i=>`<option value="${i}">Meter ${i}</option>`).join('')}</select><button class="chip active" data-boiler-mode="pv">PV</button><button class="chip active" data-boiler-mode="sv">SV</button><button class="chip" data-boiler-mode="amp">A</button></div>`;}
function wireLocalFilters(suffix=''){
  $$('[data-ph]').forEach(b=>b.onclick=()=>{$$('[data-ph]').forEach(x=>x.classList.remove('active'));b.classList.add('active');drawPHTrendInto(suffix==='Q'?'phQChart':'phBChart',b.dataset.ph);});
  $$('#boilerSel,#meterSel').forEach(el=>el.onchange=()=>drawBoilerTrendInto('boilerChart'));
  $$('[data-boiler-mode]').forEach(b=>b.onclick=()=>{b.classList.toggle('active');drawBoilerTrendInto('boilerChart');});
}
function drawPHTrendInto(chartId,area='all'){
  let rows=state.filtered.ph;if(area&&area!=='all')rows=rows.filter(r=>String(rowVal(r,['Area'])).toLowerCase()===area.toLowerCase());
  const areas=area==='all'||!area?['Boiler','Sand Filter','Rinse Tank']:[area];
  const labels=[...new Set(rows.map(r=>timeLabel(rowVal(r,['Entry Time']))).filter(Boolean))].sort();
  if(!rows.length||!labels.length){ec(chartId,'No PH readings');return;}
  const colors=[C.green,C.blue,C.amber];
  const showingAll=area==='all'||!area;
  const ds=areas.map((a,i)=>({label:a,data:labels.map(l=>{const v=rows.filter(r=>timeLabel(rowVal(r,['Entry Time']))===l&&String(rowVal(r,['Area'])).toLowerCase()===a.toLowerCase()).map(r=>num(rowVal(r,['PH Reading'])));return v.length?v.reduce((x,y)=>x+y)/v.length:null;}),color:colors[i],
    // Boiler uses a 0-100 scale; Sand/Rinse use 0-14. When showing all areas together,
    // route Boiler to a separate right-hand axis so it doesn't flatten the other two series.
    yAxisID:showingAll&&a==='Boiler'?'y1':'y'
  }));
  if(!showingAll){
    const maxY=area==='Boiler'?100:14;
    drawLine(chartId,labels,ds,{yOpts:{min:0,max:maxY}});
    return;
  }
  drawLine(chartId,labels,ds,{
    yOpts:{min:0,max:14},
    extra:{scales:{y1:{position:'right',min:0,max:100,grid:{drawOnChartArea:false},ticks:{callback:v=>fmt(v,0)}}}}
  });
}
function drawBoilerTrendInto(chartId){
  const bs=$('#boilerSel')?.value||'all',ms=$('#meterSel')?.value||'all';
  const modes=$$('[data-boiler-mode].active').map(x=>x.dataset.boilerMode);
  let rows=state.filtered.boilers;
  if(bs!=='all')rows=rows.filter(r=>String(rowVal(r,['Boiler Number']))===bs);
  if(ms!=='all')rows=rows.filter(r=>String(rowVal(r,['Meter Number']))===ms);
  renderMeterCards(rows);
  const labels=[...new Set(rows.map(r=>timeLabel(rowVal(r,['Entry Time']))).filter(Boolean))].sort();
  if(!rows.length||!labels.length){ec(chartId,'No boiler readings');return;}
  const mk=(field,label,color)=>({label,data:labels.map(l=>{const v=rows.filter(r=>timeLabel(rowVal(r,['Entry Time']))===l).map(r=>num(rowVal(r,[field]))).filter(v=>v!==undefined);return v.length?v.reduce((a,b)=>a+b)/v.length:null;}),color});
  const ds=[];
  if(modes.includes('pv'))ds.push(mk('Current Temperature PV','PV (°C)',C.green));
  if(modes.includes('sv'))ds.push(mk('Set Temperature SV','SV (°C)',C.teal));
  if(modes.includes('amp'))ds.push(mk('Current Ampere','Ampere (A)',C.amber));
  // Ampere is only a plotted series here; it is not used as a filter KPI.
  const maxY=modes.includes('amp')&&!modes.includes('pv')&&!modes.includes('sv')?120:320;
  drawLine(chartId,labels,ds,{yOpts:{min:0,max:maxY}});
}
function renderMeterCards(rows){
  const box=$('#meterCards');if(!box)return;
  const bs=$('#boilerSel')?.value||'all';
  const boilers=bs==='all'?['1','2']:[bs];
  // If no boiler readings at all, show a single helpful message
  if(!rows.length){box.innerHTML=`<div class="empty-state" style="grid-column:1/-1">No boiler readings yet<br><button class="btn ghost" style="margin-top:10px;font-size:12px" onclick="state.entryType='boiler';openEntry()">+ Add Boiler Reading</button></div>`;return;}
  let html='';
  boilers.forEach(b=>{for(let i=1;i<=6;i++){
    const r=[...rows].reverse().find(x=>String(rowVal(x,['Boiler Number']))===b&&String(rowVal(x,['Meter Number']))===String(i));
    const pv=num(rowVal(r||{},['Current Temperature PV'])),sv=num(rowVal(r||{},['Set Temperature SV'])),delta=pv-sv,gap=sv-pv;
    const sensorOff=r&&pv===0&&sv>0; // PV=0 with SV>0 = sensor disconnected
    const dc=sensorOff?C.red:Math.abs(gap)>10?C.red:Math.abs(gap)>5?C.amber:C.green;
    html+=`<div class="meter-card" style="${sensorOff?'border-color:'+C.red+';background:rgba(229,62,62,0.06)':''}"><b>B${b}·M${i}</b><div>${sensorOff?'<span style="color:var(--danger);font-size:11px;font-weight:700">⚠ Sensor Off</span>':r?'PV <strong>'+fmt(pv,0)+'°C</strong>':'<span style="color:var(--muted);font-size:11px">No data</span>'}</div><div style="font-size:11px;color:var(--muted)">SV ${r?fmt(sv,0):'-'}°C</div><div style="font-size:11px;color:${dc}">${sensorOff?'Check connection':r?'Gap '+fmt(gap,1)+'°C':''}</div></div>`;
  }});
  box.innerHTML=html;
}

/* ════════════════════════════════════════════════════
   PAGE: SHIFT COMPARISON — Day vs Night, per-shift analytics
═════════════════════════════════════════════════════ */
function renderShiftComparison(){
  const f=state.filtered;
  const day=f.shifts.filter(r=>shiftType(r)==='Day');
  const night=f.shifts.filter(r=>shiftType(r)==='Night');
  function shiftMetrics(rows){
    const consumed=rows.reduce((a,r)=>a+num(rowVal(r,['Consumed Weight Kg'])),0);
    const produced=rows.reduce((a,r)=>a+num(rowVal(r,['Net Production Kg'])),0);
    const loss=rows.reduce((a,r)=>a+num(rowVal(r,['Actual Loss Kg'])),0);
    const bigJ=rows.reduce((a,r)=>a+num(rowVal(r,['Big Jumbo Bags Count'])),0);
    const smallJ=rows.reduce((a,r)=>a+num(rowVal(r,['Small Jumbo Bags Count'])),0);
    const sacks=rows.reduce((a,r)=>a+num(rowVal(r,['Sacks Count'])),0);
    const workers=rows.reduce((a,r)=>a+num(rowVal(r,['Workers Count'])),0);
    const labor=rows.reduce((a,r)=>a+num(rowVal(r,['Labor Cost EGP'])),0);
    const pkg=rows.reduce((a,r)=>a+num(rowVal(r,['Packaging Total Cost EGP'])),0);
    const yield_pct=consumed?pct(produced,consumed):0;
    const prodPerShift=rows.length?produced/rows.length:0;
    const consPerShift=rows.length?consumed/rows.length:0;
    const prodPerWorker=workers?produced/workers:0;
    const costPerMT=produced?(labor+pkg)/(produced/1000):0;
    return {count:rows.length,consumed,produced,loss,bigJ,smallJ,sacks,workers,labor,pkg,yield_pct,prodPerShift,consPerShift,prodPerWorker,costPerMT};
  }
  const dm=shiftMetrics(day), nm=shiftMetrics(night), am=shiftMetrics(f.shifts);

  // Per-shift data for ranking
  const shiftRows=f.shifts.map(r=>{
    const consumed=num(rowVal(r,['Consumed Weight Kg']));
    const produced=num(rowVal(r,['Net Production Kg']));
    const yp=consumed?pct(produced,consumed):0;
    return {date:fmtDate(rowVal(r,['Date'])),type:shiftType(r),consumed,produced,yield_pct:yp,
      workers:num(rowVal(r,['Workers Count'])),labor:num(rowVal(r,['Labor Cost EGP'])),
      pkg:num(rowVal(r,['Packaging Total Cost EGP'])),
      bigJ:num(rowVal(r,['Big Jumbo Bags Count'])),smallJ:num(rowVal(r,['Small Jumbo Bags Count'])),sacks:num(rowVal(r,['Sacks Count']))};
  }).filter(r=>r.consumed>0);

  const best=shiftRows.length?[...shiftRows].sort((a,b)=>b.yield_pct-a.yield_pct)[0]:null;
  const worst=shiftRows.length?[...shiftRows].sort((a,b)=>a.yield_pct-b.yield_pct)[0]:null;

  function compRow(label,dayVal,nightVal,fmtFn=v=>fmt(v,1),lowerIsBetter=false){
    const better=lowerIsBetter?(dayVal<nightVal?'day':dayVal>nightVal?'night':'tie'):(dayVal>nightVal?'day':dayVal<nightVal?'night':'tie');
    const dCell=`<td class="cmp-val ${better==='day'?'cmp-win':''}">${fmtFn(dayVal)}</td>`;
    const nCell=`<td class="cmp-val ${better==='night'?'cmp-win':''}">${fmtFn(nightVal)}</td>`;
    const diff=dayVal-nightVal;
    const diffCell=`<td class="cmp-diff ${diff>0?'pos':diff<0?'neg':''}">${diff>0?'+':''}${fmtFn(diff)}</td>`;
    return `<tr><td class="cmp-label">${label}</td>${dCell}${nCell}${diffCell}</tr>`;
  }

  $('#page-shifts').innerHTML=`
  <!-- TOP SUMMARY CARDS -->
  <div class="grid-3" style="margin-bottom:14px">
    <div class="decision-card ${dm.yield_pct>=nm.yield_pct?'green':'yellow'}">
      <div class="dc-icon">☀</div>
      <div class="dc-label">Day Shifts</div>
      <div class="dc-value">${fmt(dm.yield_pct,1)}%</div>
      <div class="dc-note">${dm.count} shifts · ${fmt(dm.produced/1000,2)} MT produced<br>Avg ${fmt(dm.prodPerShift/1000,2)} MT/shift · ${fmt(dm.prodPerWorker/1000,3)} MT/worker</div>
    </div>
    <div class="decision-card ${nm.yield_pct>dm.yield_pct?'green':'yellow'}">
      <div class="dc-icon">🌙</div>
      <div class="dc-label">Night Shifts</div>
      <div class="dc-value">${nm.count?fmt(nm.yield_pct,1)+'%':'—'}</div>
      <div class="dc-note">${nm.count?nm.count+' shifts · '+fmt(nm.produced/1000,2)+' MT produced<br>Avg '+fmt(nm.prodPerShift/1000,2)+' MT/shift · '+fmt(nm.prodPerWorker/1000,3)+' MT/worker':'No night shifts recorded'}</div>
    </div>
    <div class="decision-card ${best&&best.yield_pct>=65?'green':'yellow'}">
      <div class="dc-icon">★</div>
      <div class="dc-label">Best Shift</div>
      <div class="dc-value">${best?fmt(best.yield_pct,1)+'%':'—'}</div>
      <div class="dc-note">${best?best.date+' · '+best.type+'<br>'+fmt(best.produced/1000,2)+' MT from '+fmt(best.consumed/1000,2)+' MT consumed':'No shifts yet'}</div>
    </div>
  </div>

  <!-- KPI COMPARISON STRIP -->
  ${statRow([
    {label:'Total Shifts',value:`${am.count}`,sub:`${dm.count} day · ${nm.count} night`},
    {label:'Avg Yield',value:`${fmt(am.yield_pct,1)} <span class="u">%</span>`,sub:`Day ${fmt(dm.yield_pct,1)}% · Night ${fmt(nm.yield_pct,1)}%`},
    {label:'Avg Production/Shift',value:`${fmt(am.prodPerShift/1000,2)} <span class="u">MT</span>`,sub:`Day ${fmt(dm.prodPerShift/1000,2)} · Night ${fmt(nm.prodPerShift/1000,2)}`},
    {label:'Avg MT/Worker',value:`${fmt(am.prodPerWorker/1000,3)} <span class="u">MT</span>`,sub:`Day ${fmt(dm.prodPerWorker/1000,3)} · Night ${fmt(nm.prodPerWorker/1000,3)}`},
    {label:'Worst Shift Yield',value:`${worst?fmt(worst.yield_pct,1)+'%':'—'}`,sub:worst?worst.date+' · '+worst.type:''},
    {label:'Avg Cost / MT',value:`${fmt(am.costPerMT,0)} <span class="u">EGP</span>`,sub:`Day ${fmt(dm.costPerMT,0)} · Night ${fmt(nm.costPerMT,0)}`}
  ])}

  <div class="grid-2">
    <!-- HEAD-TO-HEAD TABLE -->
    <section class="panel">
      <h3>☀ Day vs 🌙 Night — Head to Head</h3>
      <div class="table-wrap" style="margin-top:12px">
        <table class="cmp-table">
          <thead><tr><th>Metric</th><th>☀ Day</th><th>🌙 Night</th><th>Difference</th></tr></thead>
          <tbody>
            ${compRow('Shifts',dm.count,nm.count,v=>fmt0(v))}
            ${compRow('Avg Yield %',dm.yield_pct,nm.yield_pct,v=>fmt(v,1)+'%')}
            ${compRow('Total Produced (MT)',dm.produced/1000,nm.produced/1000,v=>fmt(v,2))}
            ${compRow('Avg MT / Shift',dm.prodPerShift/1000,nm.prodPerShift/1000,v=>fmt(v,2))}
            ${compRow('Avg MT / Worker',dm.prodPerWorker/1000,nm.prodPerWorker/1000,v=>fmt(v,3))}
            ${compRow('Total Consumed (MT)',dm.consumed/1000,nm.consumed/1000,v=>fmt(v,2))}
            ${compRow('Actual Loss (MT)',dm.loss/1000,nm.loss/1000,v=>fmt(v,2),true)}
            ${compRow('Avg Cost / MT (EGP)',dm.costPerMT,nm.costPerMT,v=>fmt0(v),true)}
            ${compRow('Big Jumbo Bags',dm.bigJ,nm.bigJ,v=>fmt0(v))}
            ${compRow('Small Jumbo Bags',dm.smallJ,nm.smallJ,v=>fmt0(v))}
            ${compRow('Sacks',dm.sacks,nm.sacks,v=>fmt0(v))}
          </tbody>
        </table>
      </div>
    </section>

    <!-- YIELD PER SHIFT CHART -->
    <section class="panel">
      <h3>Yield % — Per Shift</h3>
      <div class="chart-wrap tall"><canvas id="shiftYieldChart"></canvas></div>
    </section>
  </div>

  <div class="grid-2 mt">
    <!-- PRODUCTION PER SHIFT CHART -->
    <section class="panel">
      <h3>Production (MT) — Per Shift</h3>
      <div class="chart-wrap"><canvas id="shiftProdChart"></canvas></div>
    </section>
    <!-- WORKERS PRODUCTIVITY -->
    <section class="panel">
      <h3>MT Produced per Worker — Per Shift</h3>
      <div class="chart-wrap"><canvas id="shiftWorkerChart"></canvas></div>
    </section>
  </div>

  <!-- ALL SHIFTS RANKED TABLE -->
  <section class="panel mt">
    <h3>All Shifts — Ranked by Yield</h3>
    ${table([...shiftRows].sort((a,b)=>b.yield_pct-a.yield_pct).map((r,i)=>({
      '#':i+1,
      'Date':r.date,'Type':r.type,
      'Consumed (kg)':fmt0(r.consumed),
      'Produced (kg)':fmt0(r.produced),
      'Yield %':fmt(r.yield_pct,1)+'%',
      'Workers':r.workers||'—',
      'MT/Worker':r.workers?fmt(r.prodPerWorker/1000||r.produced/r.workers/1000,3):'—',
      'Big Jumbo':r.bigJ||'—','Small Jumbo':r.smallJ||'—','Sacks':r.sacks||'—',
      'Labor (EGP)':r.labor?fmt0(r.labor):'—'
    })),[
      {key:'#'},{key:'Date'},{key:'Type'},{key:'Consumed (kg)'},{key:'Produced (kg)'},
      {key:'Yield %'},{key:'Workers'},{key:'MT/Worker'},{key:'Big Jumbo'},{key:'Small Jumbo'},{key:'Sacks'},{key:'Labor (EGP)'}
    ],'No shift data')}
  </section>`;

  // Shift yield chart - color by day/night
  if(shiftRows.length){
    const labels=shiftRows.map(r=>r.date+' '+r.type.slice(0,1));
    const colors=shiftRows.map(r=>r.type==='Day'?C.green:C.blue);
    dk('shiftYieldChart');const ctx=$('#shiftYieldChart');if(ctx){cd();
      state.charts['shiftYieldChart']=new Chart(ctx,{type:'bar',
        data:{labels,datasets:[{label:'Yield %',data:shiftRows.map(r=>r.yield_pct),backgroundColor:colors,borderColor:colors,borderWidth:1.5,borderRadius:5,borderSkipped:false}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.parsed.y,1)}%`}}},
          scales:{x:{grid:{display:false},ticks:{maxRotation:45,font:{size:10}}},y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}}}});}
    drawBar('shiftProdChart',labels,[{label:'MT',data:shiftRows.map(r=>r.produced/1000),color:C.green}]);
    const workerData=shiftRows.map(r=>r.workers?r.produced/r.workers/1000:0);
    drawBar('shiftWorkerChart',labels,[{label:'MT/Worker',data:workerData,color:C.teal}]);
  }else{
    ec('shiftYieldChart','No shift data');ec('shiftProdChart','No shift data');ec('shiftWorkerChart','No shift data');
  }
}

/* ════════════════════════════════════════════════════
   PAGE: INTELLIGENCE — Supplier & Buyer deep analytics
═════════════════════════════════════════════════════ */
function renderIntelligence(){
  const f=state.filtered,m=metrics();

  // ── SUPPLIER ANALYSIS ──
  const supMap={};
  f.receivings.forEach(r=>{
    const s=rowVal(r,['Supplier Name'])||'Unknown';
    if(!supMap[s])supMap[s]={name:s,trips:0,grossKg:0,netKg:0,paymentKg:0,discountKg:0,totalCost:0,avgDisc:0,discSum:0,bales:0};
    const sg=supMap[s];
    sg.trips++;
    sg.grossKg+=num(rowVal(r,['Gross Weight Kg']));
    sg.netKg+=num(rowVal(r,['Net Weight Kg']));
    sg.paymentKg+=num(rowVal(r,['Net Weight After Discount Kg']));
    sg.discountKg+=num(rowVal(r,['Discount Weight Kg']));
    sg.totalCost+=num(rowVal(r,['Trip Price After Discount']));
    sg.discSum+=num(rowVal(r,['Discount Percent']));
    sg.bales+=num(rowVal(r,['Bales Count']));
  });
  const suppliers=Object.values(supMap).map(s=>({
    ...s,
    avgDisc:s.trips?s.discSum/s.trips:0,
    costPerMT:s.paymentKg?s.totalCost/(s.paymentKg/1000):0,
    avgBaleWt:s.bales?s.netKg/s.bales:0
  })).sort((a,b)=>b.netKg-a.netKg);

  // ── BUYER ANALYSIS ──
  const buyMap={};
  f.sales.forEach(r=>{
    const b=rowVal(r,['Buyer Factory Name'])||'Unknown';
    if(!buyMap[b])buyMap[b]={name:b,trips:0,netKg:0,revenue:0,discSum:0,priceSum:0};
    const bg=buyMap[b];
    bg.trips++;
    bg.netKg+=num(rowVal(r,['Net Weight After Discount Kg']));
    bg.revenue+=num(rowVal(r,['Sale Price After Discount']));
    bg.discSum+=num(rowVal(r,['Discount Percent']));
    bg.priceSum+=num(rowVal(r,['Flex Price Per Ton Thousand']));
  });
  const buyers=Object.values(buyMap).map(b=>({
    ...b,
    avgDisc:b.trips?b.discSum/b.trips:0,
    revPerMT:b.netKg?b.revenue/(b.netKg/1000):0,
    avgPrice:b.trips?b.priceSum/b.trips:0
  })).sort((a,b2)=>b2.revenue-a.revenue);

  const topSup=suppliers[0];
  const topBuy=buyers[0];

  $('#page-intelligence').innerHTML=`
  <!-- INTELLIGENCE HEADER -->
  <div class="grid-2" style="margin-bottom:14px">
    <div class="decision-card ${suppliers.length?'green':'yellow'}">
      <div class="dc-icon">🏭</div>
      <div class="dc-label">Top Supplier</div>
      <div class="dc-value" style="font-size:18px;letter-spacing:-.02em">${topSup?topSup.name:'—'}</div>
      <div class="dc-note">${topSup?fmt(topSup.netKg/1000,2)+' MT · '+topSup.trips+' trips · '+fmt(topSup.avgDisc,1)+'% avg discount':'No receiving data'}</div>
    </div>
    <div class="decision-card ${buyers.length?'green':'yellow'}">
      <div class="dc-icon">🛒</div>
      <div class="dc-label">Top Buyer</div>
      <div class="dc-value" style="font-size:18px;letter-spacing:-.02em">${topBuy?topBuy.name:'—'}</div>
      <div class="dc-note">${topBuy?fmt0(topBuy.revenue)+' EGP · '+topBuy.trips+' trips · '+fmt(topBuy.revPerMT,0)+' EGP/MT':'No sales data'}</div>
    </div>
  </div>

  <!-- SUPPLIER KPIs -->
  ${statRow([
    {label:'Suppliers',value:`${suppliers.length}`,sub:'active in period'},
    {label:'Total Received',value:`${fmt(m.netIntoFactory/1000,2)} <span class="u">MT</span>`,sub:`${m.receivingTrips} trips`},
    {label:'Avg Cost / MT',value:`${fmt(m.priceAfterDiscount/(m.paymentKg/1000||1),0)} <span class="u">EGP</span>`,sub:'after discount · payment basis'},
    {label:'Total Discount Saved',value:`${fmt0(m.priceDiff)} <span class="u">EGP</span>`,sub:`${fmt(m.discountKg/1000,2)} MT deducted`},
    {label:'Buyers',value:`${buyers.length}`,sub:'active in period'},
    {label:'Revenue / MT',value:`${fmt(m.avgSalePrice,0)} <span class="u">EGP</span>`,sub:`${m.salesTrips} sale trips`}
  ])}

  <div class="grid-2">
    <!-- SUPPLIER TABLE -->
    <section class="panel">
      <h3>🏭 Supplier Performance</h3>
      ${suppliers.length?`<div class="table-wrap"><table>
        <thead><tr><th>Supplier</th><th>Trips</th><th>Net MT</th><th>Avg Disc%</th><th>Cost/MT</th><th>Avg Bale kg</th><th>Total Cost</th></tr></thead>
        <tbody>${suppliers.map((s,i)=>`<tr ${i===0?'style="background:rgba(0,166,81,0.06);font-weight:600"':''}>
          <td><b>${s.name}</b></td>
          <td>${s.trips}</td>
          <td>${fmt(s.netKg/1000,2)}</td>
          <td><span class="badge ${s.avgDisc<=2?'green':s.avgDisc<=5?'yellow':'red'}">${fmt(s.avgDisc,1)}%</span></td>
          <td>${fmt0(s.costPerMT)}</td>
          <td>${fmt(s.avgBaleWt,1)}</td>
          <td>${fmt0(s.totalCost)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`:`<div class="empty-state">No supplier data<br><button class="btn ghost" style="margin-top:10px;font-size:12px" onclick="openEntry()">+ Add Receiving</button></div>`}
    </section>

    <!-- BUYER TABLE -->
    <section class="panel">
      <h3>🛒 Buyer Performance</h3>
      ${buyers.length?`<div class="table-wrap"><table>
        <thead><tr><th>Buyer</th><th>Trips</th><th>Net MT</th><th>Revenue</th><th>EGP/MT</th><th>Avg Disc%</th></tr></thead>
        <tbody>${buyers.map((b,i)=>`<tr ${i===0?'style="background:rgba(0,166,81,0.06);font-weight:600"':''}>
          <td><b>${b.name}</b></td>
          <td>${b.trips}</td>
          <td>${fmt(b.netKg/1000,2)}</td>
          <td>${fmt0(b.revenue)}</td>
          <td><span class="badge ${b.revPerMT>=(m.priceAfterDiscount/(m.paymentKg/1000||1))*1.1?'green':'yellow'}">${fmt0(b.revPerMT)}</span></td>
          <td>${fmt(b.avgDisc,1)}%</td>
        </tr>`).join('')}</tbody>
      </table></div>`:`<div class="empty-state">No buyer data<br><button class="btn ghost" style="margin-top:10px;font-size:12px" onclick="openEntry()">+ Add Sale</button></div>`}
    </section>
  </div>

  <div class="grid-2 mt">
    <section class="panel">
      <h3>Supplier Share — Net MT Received</h3>
      <div class="chart-wrap"><canvas id="intlSupPieChart"></canvas></div>
    </section>
    <section class="panel">
      <h3>Revenue by Buyer</h3>
      <div class="chart-wrap"><canvas id="intlBuyBarChart"></canvas></div>
    </section>
  </div>
  <div class="grid-2 mt">
    <section class="panel">
      <h3>Cost per MT by Supplier (EGP)</h3>
      <div class="chart-wrap"><canvas id="intlSupCostChart"></canvas></div>
    </section>
    <section class="panel">
      <h3>Revenue per MT by Buyer (EGP)</h3>
      <div class="chart-wrap"><canvas id="intlBuyRevChart"></canvas></div>
    </section>
  </div>`;

  // Charts
  const colors5=[C.green,C.teal,C.blue,C.purple,C.amber];
  if(suppliers.length){
    drawDoughnut('intlSupPieChart',suppliers.map(s=>s.name),suppliers.map(s=>s.netKg/1000),colors5);
    drawBar('intlSupCostChart',suppliers.map(s=>s.name),[{label:'Cost/MT',data:suppliers.map(s=>s.costPerMT),color:C.amber}]);
  }else{eb('intlSupPieChart','No data');ec('intlSupCostChart','No data');}
  if(buyers.length){
    drawBar('intlBuyBarChart',buyers.map(b=>b.name),[{label:'Revenue',data:buyers.map(b=>b.revenue),color:C.blue}]);
    drawBar('intlBuyRevChart',buyers.map(b=>b.name),[{label:'EGP/MT',data:buyers.map(b=>b.revPerMT),color:C.green}]);
  }else{ec('intlBuyBarChart','No data');ec('intlBuyRevChart','No data');}
}

/* ════════════════════════════════════════════════════
   PAGE: REPORTS — Raw data all sheets
═════════════════════════════════════════════════════ */
function renderReports(){
  const all=state.filtered;
  const sections=[
    {label:'Shift Entries',rows:all.shifts,cols:['Date','Shift Type','Consumed Weight Kg','Net Production Kg','Big Jumbo Total Kg','Small Jumbo Total Kg','Sacks Total Kg','Packaging Total Cost EGP','Worker Daily Wage EGP','Labor Cost EGP','Material Yield Percent','Actual Loss Kg','Validation Status','Notes']},
    {label:'Receiving',rows:all.receivings,cols:['Date','Supplier Name','Net Weight After Discount Kg','Discount Percent','Price Per Ton Thousand','Price Per Ton EGP','Trip Price After Discount','Validation Status','Notes']},
    {label:'Sales',rows:all.sales,cols:['Date','Buyer Factory Name','Net Weight After Discount Kg','Flex Price Per Ton Thousand','Flex Price Per Ton EGP','Sale Price After Discount','Discount Percent','Validation Status','Notes']},
    {label:'Waste',rows:all.waste,cols:['Date','Total Waste Weight Kg','Operation Waste Weight Kg','Material Waste Weight Kg','Sortex Weight Kg','Caps And Labels PO Weight Kg','Bag And Strap Weight Kg','Green Bottle Weight Kg','Color Bottle Weight Kg','Line Sludge Weight Kg','Validation Status','Notes']},
    {label:'Downtime',rows:all.downtimes,cols:['Date','Downtime Minutes','Downtime Reason','Notes']},
    {label:'PH Readings',rows:all.ph,cols:['Date','Entry Time','Area','PH Reading','PH Status','PH Alert','PH Min Limit','PH Max Limit','Notes']},
    {label:'Boiler Readings',rows:all.boilers,cols:['Date','Entry Time','Boiler Number','Meter Number','Current Temperature PV','Set Temperature SV','Temperature Difference','Gap To Target','Current Ampere','Sensor Status']},
    {label:'Utilities',rows:all.utilities||[],cols:['Date','Shift Type','Electricity Consumed Kwh','Electricity Rate EGP/kWh','Electricity Cost EGP','Water Consumed M3','Water Rate EGP/M3','Water Cost EGP','Soda Type','Soda Flakes Total Kg','Soda Liquid Liters','Soda Liquid Total Kg','Soda Cost EGP','Forklift Fuel Type','Forklift Fuel Liters','Forklift Fuel Rate EGP/L','Forklift Fuel Cost EGP','Total Utilities Cost EGP','Validation Status','Notes']}
  ];
  const total=sections.reduce((a,s)=>a+s.rows.length,0);
  $('#page-reports').innerHTML=sections.map(s=>
    `<section class="panel mt"><h3>${s.label} <span style="font-size:12px;font-weight:400;color:var(--muted)">(${s.rows.length} records)</span></h3>${table(s.rows.slice().reverse(),s.cols)}</section>`
  ).join('');
  // fix first mt
  $('#page-reports').querySelector('.mt')?.classList.remove('mt');
}

/* ════════════════════════════════════════════════════
   ENTRY FORM
═════════════════════════════════════════════════════ */
const entryTypes=[['shift','Shift'],['receiving','Receiving'],['downtime','Downtime'],['boiler','Boiler'],['ph','PH'],['waste','Waste'],['sale','Sale'],['utilities','Utilities']];
function openEntry(){$('#entryModal').classList.remove('hidden');renderEntryTabs();renderEntryForm();}
function renderEntryTabs(){
  $('#entryTypeTabs').innerHTML=entryTypes.map(([id,txt])=>`<button type="button" class="entry-tab ${state.entryType===id?'active':''}" data-entry="${id}">${tr(txt)}</button>`).join('');
  $$('[data-entry]').forEach(b=>b.onclick=()=>{saveBoilerDraft();savePHDraft();state.entryType=b.dataset.entry;renderEntryTabs();renderEntryForm();});
}
function today(){return new Date().toISOString().slice(0,10);}
function nowTime(){return new Date().toTimeString().slice(0,5);}
function inp(name,label,type='text',val=''){return `<label>${label}<input name="${name}" type="${type}" value="${val}" step="${type==='number'?'any':''}"></label>`;}
function sel(name,label,opts){return `<label>${label}<select name="${name}">${opts.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></label>`;}


function lastPositive(rows, keys, fallback=0){
  const list = Array.isArray(rows) ? rows : [];
  for(let i=list.length-1;i>=0;i--){
    const v = num(rowVal(list[i], keys));
    if(v>0) return v;
  }
  return fallback;
}
function weightedAvgBaleFromReceiving(){
  const rows = (state.filtered && state.filtered.receivings && state.filtered.receivings.length) ? state.filtered.receivings : (state.raw.receivings || []);
  let totalKg=0,totalBales=0;
  rows.forEach(r=>{
    const b=num(rowVal(r,['Bales Count','balesCount']));
    const kg=num(rowVal(r,['Net Weight After Discount Kg','Net Weight Kg']));
    if(b>0 && kg>0){ totalBales+=b; totalKg+=kg; }
  });
  if(totalBales>0) return totalKg/totalBales;
  return lastPositive(state.raw.receivings,['Average Bale Weight Kg'],0);
}
function autoPackageWeights(){
  return {
    big:lastPositive(state.raw.shifts,['Big Jumbo Weight Kg'],1000),
    small:lastPositive(state.raw.shifts,['Small Jumbo Weight Kg'],500),
    sacks:lastPositive(state.raw.shifts,['Sacks Weight Kg'],25)
  };
}
function hiddenInput(name,val='') { return `<input type="hidden" name="${name}" value="${val}">`; }
function entrySection(title,sub,body,cls=''){
  return `<div class="entry-section ${cls}" style="grid-column:1/-1"><div class="entry-section-head"><div><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div></div><div class="entry-section-grid">${body}</div></div>`;
}

function renderEntryForm(){
  const d=today(),t=nowTime();let html='';
  if(state.entryType==='shift'){
    const autoAvg=weightedAvgBaleFromReceiving();
    const pkg=autoPackageWeights();
    html=`${hiddenInput('averageBaleWeightKg',fmt(autoAvg,3))}${hiddenInput('bigJumboWeightKg',pkg.big)}${hiddenInput('smallJumboWeightKg',pkg.small)}${hiddenInput('sacksWeightKg',pkg.sacks)}
    ${entrySection('بيانات الوردية','التاريخ والوقت ونوع الوردية',`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${sel('shiftType','Shift Type',['Day','Night'])}${inp('shiftStartTime','Shift Start','time')}${inp('shiftEndTime','Shift End','time')}`)}
    ${entrySection('المصنع والعمالة','اليومية تدخل هنا وتدخل تلقائيًا في تكلفة التشغيل للطن',`${inp('factoryName','Factory')}${inp('factoryOwner','Owner')}${inp('workersCount','Workers','number')}${inp('workerDailyWageEGP','Worker Daily Wage','number')}`)}
    ${entrySection('استهلاك الخامة','متوسط وزن البالة محسوب تلقائيًا من الاستلامات ولا يتم إدخاله يدويًا',`${inp('consumedBalesCount','Consumed Bales','number')}<div class="readonly-metric"><small>متوسط وزن البالة التلقائي</small><b id="avgBaleAutoText">${autoAvg>0?fmt(autoAvg,1)+' kg':'—'}</b><span>من بيانات Receiving</span></div><div class="readonly-metric"><small>إجمالي الخامة المستهلكة</small><b id="consumedPreview">—</b><span>البالات × متوسط وزن البالة</span></div>`)}
    ${entrySection('الإنتاج حسب نوع التعبئة','أدخل العدد فقط — أوزان الجواني والشكاير تحسب تلقائيًا من الإعدادات/آخر بيانات محفوظة',`${inp('bigJumboBagsCount','Big Jumbo Bags Count','number')}${inp('smallJumboBagsCount','Small Jumbo Bags Count','number')}${inp('sacksCount','Sacks Count','number')}<div class="package-weight-strip"><span>Big Jumbo: <b>${fmt0(pkg.big)} kg</b></span><span>Small Jumbo: <b>${fmt0(pkg.small)} kg</b></span><span>Sacks: <b>${fmt0(pkg.sacks)} kg</b></span></div>`,'production-section')}
    <div id='prodPreview' class='entry-total-preview'>Total Production: — kg · packaging and labor cost are calculated from online/cache sources.</div>
    <label class="full">Notes<input name="notes" type="text"></label>`;
  }
  if(state.entryType==='receiving') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${inp('supplierName','Supplier')}${inp('region','Region')}${inp('vehicleNumber','Vehicle')}${inp('driverName','Driver')}${inp('balesCount','Bales Count','number')}${inp('pricePerTonThousand','Price / Ton (×1000)','number')}${inp('karteNumber','Karte No.')}${inp('grossWeightKg','Gross Weight (kg)','number')}${inp('tareWeightKg','Tare Weight (kg)','number')}${inp('discountPercent','Discount %','number')}<div id='netPreview' style='grid-column:1/-1;padding:10px 14px;background:var(--green-dim);border-radius:8px;font-size:13px;color:var(--green-dark)'>Net Weight: — kg &nbsp;|&nbsp; After Discount: — kg</div>${inp('notes','Notes')}`;
  if(state.entryType==='downtime') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${inp('stopFromTime','Stop From','time')}${inp('stopToTime','Stop To','time')}${inp('downtimeReason','Reason')}${inp('notes','Notes')}`;
  if(state.entryType==='waste') html=wasteForm(d,t);
  if(state.entryType==='sale') html=`
    ${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}
    ${inp('buyerFactoryName','Buyer Factory')}${inp('buyerFactoryLocation','Location')}
    ${inp('vehicleNumber','Vehicle')}${inp('driverName','Driver')}
    ${inp('netTripWeightKg','Net Weight (kg)','number')}
    ${inp('discountPercent','Discount % (0 if none)','number')}
    ${inp('flexPricePerTonThousand','Price / Ton (×1000 EGP)','number')}
    <div id="salePreview" style="grid-column:1/-1;padding:10px 14px;background:var(--green-dim);border-radius:8px;font-size:13px;color:var(--green-dark);display:none">
      Sale Price: <b id="saleTotal">—</b> EGP &nbsp;|&nbsp; After Discount: <b id="saleAfter">—</b> EGP
    </div>
    ${inp('notes','Notes')}`;
  if(state.entryType==='boiler') html=boilerBatchForm(d,t);
  if(state.entryType==='ph') html=phBatchForm(d,t);
  if(state.entryType==='utilities') html=utilitiesForm(d,t);
  html+=`<div class="entry-actions"><button type="button" class="btn ghost" id="cancelEntry">Cancel</button><button type="submit" class="btn primary">Save to Sheets</button></div>`;
  $('#entryForm').innerHTML=html;
  $('#cancelEntry').onclick=()=>$('#entryModal').classList.add('hidden');
  $('#entryForm').onsubmit=saveEntry;
  if(state.entryType==='boiler')wireBoilerForm();
  if(state.entryType==='waste')wireWasteForm();
  if(state.entryType==='utilities')wireUtilitiesForm();
  if(state.entryType==='sale')wireSaleForm();
  if(state.entryType==='receiving'){
    const calcNet=()=>{
      const el=$('#entryForm');
      const gross=num(el?.querySelector('[name=grossWeightKg]')?.value);
      const tare=num(el?.querySelector('[name=tareWeightKg]')?.value);
      const disc=num(el?.querySelector('[name=discountPercent]')?.value);
      const net=Math.max(0,gross-tare);
      const after=net*(1-disc/100);
      const prev=$('#netPreview');
      if(prev) prev.innerHTML=`Net Weight: <b style='color:var(--green)'>${net>0?fmt0(net)+' kg':'—'}</b> &nbsp;|&nbsp; After Discount: <b style='color:var(--green)'>${after>0?fmt0(after)+' kg':'—'}</b>`;
    };
    $$('[name=grossWeightKg],[name=tareWeightKg],[name=discountPercent]',$('#entryForm')).forEach(i=>i.oninput=calcNet);
  }
  if(state.entryType==='shift'){
    const calcProd=()=>{
      const f=$('#entryForm');
      const v=n=>num(f?.querySelector(`[name=${n}]`)?.value);
      const autoAvg=weightedAvgBaleFromReceiving();
      const pkg=autoPackageWeights();
      const set=(n,val)=>{const el=f?.querySelector(`[name=${n}]`); if(el)el.value=val;};
      set('averageBaleWeightKg',fmt(autoAvg,3));
      set('bigJumboWeightKg',pkg.big); set('smallJumboWeightKg',pkg.small); set('sacksWeightKg',pkg.sacks);
      const consumed=v('consumedBalesCount')*autoAvg;
      const big=v('bigJumboBagsCount')*pkg.big, small=v('smallJumboBagsCount')*pkg.small, sacks=v('sacksCount')*pkg.sacks;
      const total=big+small+sacks;
      const labor=v('workersCount')*v('workerDailyWageEGP');
      const avgTxt=$('#avgBaleAutoText'), consTxt=$('#consumedPreview'), prev=$('#prodPreview');
      if(avgTxt) avgTxt.textContent=autoAvg>0?fmt(autoAvg,1)+' kg':'—';
      if(consTxt) consTxt.textContent=consumed>0?fmt0(consumed)+' kg':'—';
      if(prev) prev.innerHTML=`<b>Total Production:</b> <span style='color:var(--green);font-weight:800'>${total>0?fmt0(total)+' kg = '+fmt(total/1000,3)+' MT':'—'}</span> &nbsp;|&nbsp; <b>Labor:</b> <span style='color:var(--green);font-weight:800'>${labor>0?fmt0(labor)+' EGP':'online/cache'}</span> &nbsp;|&nbsp; <b>Consumed:</b> <span style='color:var(--green);font-weight:800'>${consumed>0?fmt0(consumed)+' kg':'—'}</span>`;
    };
    $$('[name=consumedBalesCount],[name=bigJumboBagsCount],[name=smallJumboBagsCount],[name=sacksCount],[name=workersCount],[name=workerDailyWageEGP]',$('#entryForm')).forEach(i=>i.oninput=calcProd);
    calcProd();
  }
  if(state.entryType==='ph'){$$('[data-ph-area]').forEach(i=>i.oninput=()=>savePHDraft());$$('[name=phDate],[name=phTime]').forEach(i=>i.onchange=()=>savePHDraft());}
  translateDashboardText($('#entryModal'));
}

function boilerBatchForm(d,t){
  state.boilerDraft.date=state.boilerDraft.date||d;state.boilerDraft.entryTime=state.boilerDraft.entryTime||t;
  return `<label>Date<input name="date" type="date" value="${state.boilerDraft.date}"></label>
  <label>Time<input name="entryTime" type="time" value="${state.boilerDraft.entryTime}"></label>
  <div class="boiler-batch"><div class="boiler-tabs">
    <button type="button" class="chip ${state.boilerTab===1?'active':''}" data-boiler-tab="1">Boiler 1</button>
    <button type="button" class="chip ${state.boilerTab===2?'active':''}" data-boiler-tab="2">Boiler 2</button>
  </div>
  <table class="boiler-table"><thead><tr><th>Meter</th><th>PV (°C)</th><th>SV (°C)</th><th>Current (A)</th></tr></thead>
  <tbody>${[1,2,3,4,5,6].map(i=>{const r=(state.boilerDraft[state.boilerTab]||{})[i]||{};return `<tr><td><b>M${i}</b></td><td><input data-meter="${i}" data-field="pv" type="number" step="0.1" value="${r.pv||''}"></td><td><input data-meter="${i}" data-field="sv" type="number" step="0.1" value="${r.sv||''}"></td><td><input data-meter="${i}" data-field="currentAmpere" type="number" step="0.1" value="${r.currentAmpere||''}"></td></tr>`;}).join('')}</tbody></table></div>`;
}
function phBatchForm(d,t){
  if(!state.phDraft)state.phDraft={};
  state.phDraft.date=state.phDraft.date||d;state.phDraft.entryTime=state.phDraft.entryTime||t;
  const areas=['Boiler','Sand Filter','Rinse Tank'];
  return `<label>Date<input name="phDate" type="date" value="${state.phDraft.date}"></label>
  <label>Time<input name="phTime" type="time" value="${state.phDraft.entryTime}"></label>
  <div class="boiler-batch" style="grid-column:1/-1"><table class="boiler-table smart-table">
    <thead><tr><th>Area</th><th>Allowed Range</th><th>PH Reading</th><th>Status</th><th>Notes</th></tr></thead>
    <tbody>${areas.map(a=>{const v=(state.phDraft[a]||{}),lim=phLimits(a),st=phStatusFor(a,v.phReading||0);return `<tr><td><b>${a}</b></td><td><span class="mini-chip">${lim.label}</span></td><td><input data-ph-area="${a}" data-ph-field="phReading" type="number" step="0.01" min="0" max="${lim.max}" placeholder="${lim.label}" value="${v.phReading||''}"></td><td><span class="badge ${st.cls}">${st.text}</span></td><td><input data-ph-area="${a}" data-ph-field="notes" type="text" placeholder="Optional…" value="${v.notes||''}"></td></tr>`;}).join('')}</tbody>
  </table><div class="form-hint">Boiler PH is allowed on 0–100 scale. Sand Filter and Rinse Tank are controlled on 0–14 scale.</div></div>`;
}

function wasteForm(d,t){
  const rows=[
    ['sortex','Sortex Waste','Operation','sortexWeightKg','sortexCount'],
    ['caps','Caps & Label (PO)','Operation','capsAndLabelsPOWeightKg','capsAndLabelsPOCount'],
    ['bag','Bag & Strap','Material','bagAndStrapWeightKg','bagAndStrapCount'],
    ['green','Green Bottle','Material','greenBottleWeightKg','greenBottleCount'],
    ['color','Color Bottle','Material','colorBottleWeightKg','colorBottleCount'],
    ['sludge','Line Sludge','Operation','lineSludgeWeightKg','lineSludgeCount']
  ];
  return `<label>Date<input name="date" type="date" value="${d}"></label>
  <label>Time<input name="entryTime" type="time" value="${t}"></label>
  <div class="boiler-batch waste-entry-card" style="grid-column:1/-1">
    <table class="boiler-table smart-table waste-table">
      <thead><tr><th>Waste Type</th><th>Category</th><th>Weight (Kg)</th><th>Count</th></tr></thead>
      <tbody>${rows.map(([id,label,cat,w,c])=>`<tr data-waste-row="${id}"><td><b>${label}</b></td><td><span class="mini-chip ${cat==='Operation'?'op':'mat'}">${cat}</span></td><td><input name="${w}" type="number" min="0" step="0.01" placeholder="0.00"></td><td><input name="${c}" type="number" min="0" step="1" placeholder="0"></td></tr>`).join('')}</tbody>
    </table>
    <div class="auto-summary" id="wasteSummary">
      <div><small>Operation Waste</small><b>0 kg</b></div>
      <div><small>Material Waste</small><b>0 kg</b></div>
      <div><small>Total Waste</small><b>0 kg</b></div>
      <div><small>Total Count</small><b>0</b></div>
    </div>
  </div>
  <label style="grid-column:1/-1">Notes<input name="notes" type="text"></label>`;
}

function utilitiesForm(d,t){
  return `
  <label>Date<input name="date" type="date" value="${d}"></label>
  <label>Time<input name="entryTime" type="time" value="${t}"></label>
  ${sel('shiftType','Shift Type',['Day','Night'])}
  <div class="boiler-batch utilities-entry-card" style="grid-column:1/-1">
    <table class="boiler-table smart-table utility-table">
      <thead><tr><th>Section</th><th>Start / Quantity</th><th>End / Unit</th><th>Auto Result</th></tr></thead>
      <tbody>
        <tr><td><b>⚡ Electricity</b><small>EgyptERA · Low Voltage 380V / Other Users</small></td><td><input name="electricityStartReading" type="number" min="0" step="0.1" placeholder="Start kWh"></td><td><input name="electricityEndReading" type="number" min="0" step="0.1" placeholder="End kWh"></td><td id="elecPreview">0 kWh · online rate</td></tr>
        <tr><td><b>💧 Water</b><small>Giza - 6 October / Industrial</small></td><td><input name="waterStartReading" type="number" min="0" step="0.01" placeholder="Start m³"></td><td><input name="waterEndReading" type="number" min="0" step="0.01" placeholder="End m³"></td><td id="waterPreview">0 m³ · online rate</td></tr>
        <tr><td><b>🧴 Soda</b><small>Manual price · flakes by kg / liquid by liter</small></td><td><select name="sodaType" id="sodaType"><option value="flakes">Flakes / Bags</option><option value="liquid">Liquid</option></select></td><td><div id="sodaInputs" class="inline-inputs"><input name="sodaFlakesBagsCount" type="number" min="0" step="1" placeholder="Bags"><input name="sodaFlakesKgPerBag" type="number" min="0" step="0.5" value="25" placeholder="Kg/Bag"><input name="sodaFlakesRateEGPPerKg" type="number" min="0" step="0.01" placeholder="EGP/Kg"></div></td><td id="sodaPreview">0 kg × manual rate = 0 EGP</td></tr>
        <tr><td><b>⛽ Forklift Fuel</b><small>diesel/gasoline official rate</small></td><td><select name="forkliftFuelType"><option value="diesel">Diesel / Solar</option><option value="gasoline80">Gasoline 80</option><option value="gasoline92">Gasoline 92</option><option value="gasoline95">Gasoline 95</option></select></td><td><input name="forkliftFuelLiters" type="number" min="0" step="0.1" placeholder="Liters consumed"></td><td id="fuelPreview">0 L × official rate</td></tr>
        <tr><td><b>🧾 Inner Bags</b><small>الأكياس الداخلية</small></td><td><input name="innerBagsCount" type="number" min="0" step="1" placeholder="Bags count"></td><td></td><td>Count only</td></tr>
      </tbody>
    </table>
    <div class="auto-summary" id="utilitiesSummary">
      <div><small>Electricity</small><b>0 kWh</b></div>
      <div><small>Water</small><b>0 m³</b></div>
      <div><small>Soda</small><b>0</b></div>
      <div><small>Fuel</small><b>0 L</b></div><div><small>Electricity Tariff</small><b>EgyptERA Online</b></div>
    </div>
    <div class="form-hint">Electricity, water and fuel can use Price Sources / Tariff Cache. Soda price is manual: enter EGP/Kg for flakes or EGP/Liter for liquid, and the value is saved with the shift so old records do not change when prices change.</div>
  </div>
  <label style="grid-column:1/-1">Notes<input name="notes" type="text"></label>`;
}

function wireSaleForm(){
  const calc=()=>{
    const el=$('#entryForm');if(!el)return;
    const net=num(el.querySelector('[name=netTripWeightKg]')?.value);
    const disc=num(el.querySelector('[name=discountPercent]')?.value);
    const priceK=num(el.querySelector('[name=flexPricePerTonThousand]')?.value);
    const preview=$('#salePreview');
    if(!preview)return;
    if(net>0&&priceK>0){
      const priceEGP=priceK*1000;
      const discKg=net*disc/100;
      const afterKg=net-discKg;
      const total=net/1000*priceEGP;
      const after=afterKg/1000*priceEGP;
      $('#saleTotal').textContent=fmt0(total)+' EGP ('+fmt(net/1000,2)+' MT × '+fmt0(priceEGP)+')';
      $('#saleAfter').textContent=fmt0(after)+' EGP'+(disc>0?' (−'+fmt(disc,1)+'% = −'+fmt0(total-after)+')':'');
      preview.style.display='block';
    }else{preview.style.display='none';}
  };
  const el=$('#entryForm');if(!el)return;
  ['netTripWeightKg','discountPercent','flexPricePerTonThousand'].forEach(name=>{
    el.querySelector(`[name=${name}]`)?.addEventListener('input',calc);
  });
}
function wireWasteForm(){
  const form=$('#entryForm'); if(!form)return;
  const update=()=>{
    const v=n=>num(form.querySelector(`[name=${n}]`)?.value);
    const sortex=v('sortexWeightKg'), caps=v('capsAndLabelsPOWeightKg'), bag=v('bagAndStrapWeightKg'), green=v('greenBottleWeightKg'), color=v('colorBottleWeightKg'), sludge=v('lineSludgeWeightKg');
    const counts=['sortexCount','capsAndLabelsPOCount','bagAndStrapCount','greenBottleCount','colorBottleCount','lineSludgeCount'].reduce((a,k)=>a+v(k),0);
    const op=sortex+caps+sludge, mat=bag+green+color, total=op+mat;
    const box=$('#wasteSummary'); if(box)box.innerHTML=`<div><small>Operation Waste</small><b>${fmt(op,2)} kg</b></div><div><small>Material Waste</small><b>${fmt(mat,2)} kg</b></div><div><small>Total Waste</small><b>${fmt(total,2)} kg</b></div><div><small>Total Count</small><b>${fmt0(counts)}</b></div>`;
  };
  $$('input',form).forEach(i=>i.oninput=update); update();
}

function wireUtilitiesForm(){
  const form=$('#entryForm'); if(!form)return;
  const renderSodaInputs=()=>{
    const type=form.querySelector('[name=sodaType]')?.value||'flakes';
    const box=$('#sodaInputs'); if(!box)return;
    box.innerHTML=type==='liquid'?`<input name="sodaLiquidLiters" type="number" min="0" step="0.1" placeholder="Liters"><input name="sodaLiquidRateEGPPerLiter" type="number" min="0" step="0.01" placeholder="EGP/Liter"><input name="sodaLiquidConcentrationPercent" type="number" min="0" max="100" step="1" value="50" placeholder="% concentration"><input name="sodaLiquidDensityKgPerLiter" type="number" min="0" step="0.01" value="1.53" placeholder="Density kg/L">`:`<input name="sodaFlakesBagsCount" type="number" min="0" step="1" placeholder="Bags"><input name="sodaFlakesKgPerBag" type="number" min="0" step="0.5" value="25" placeholder="Kg/Bag"><input name="sodaFlakesRateEGPPerKg" type="number" min="0" step="0.01" placeholder="EGP/Kg">`;
    $$('input',box).forEach(i=>i.oninput=update); update();
  };
  const update=()=>{
    const v=n=>num(form.querySelector(`[name=${n}]`)?.value);
    const ekwh=Math.max(0,v('electricityEndReading')-v('electricityStartReading'));
    const wm3=Math.max(0,v('waterEndReading')-v('waterStartReading'));
    const type=form.querySelector('[name=sodaType]')?.value||'flakes';
    const flakesKg=v('sodaFlakesBagsCount')*v('sodaFlakesKgPerBag');
    const liquidLiters=v('sodaLiquidLiters');
    const flakesRate=v('sodaFlakesRateEGPPerKg');
    const liquidRate=v('sodaLiquidRateEGPPerLiter');
    const sodaQty=type==='liquid'?liquidLiters:flakesKg;
    const sodaUnit=type==='liquid'?'L':'kg';
    const sodaRate=type==='liquid'?liquidRate:flakesRate;
    const sodaCost=sodaQty*sodaRate;
    const soda=`${fmt(sodaQty,2)} ${sodaUnit}`;
    const fuel=v('forkliftFuelLiters');
    const ft=form.querySelector('[name=forkliftFuelType]')?.selectedOptions?.[0]?.textContent||'Diesel';
    const e=$('#elecPreview'),w=$('#waterPreview'),so=$('#sodaPreview'),fu=$('#fuelPreview'),sum=$('#utilitiesSummary');
    if(e)e.textContent=`${fmt(ekwh,1)} kWh × EgyptERA online tariff`;
    if(w)w.textContent=`${fmt(wm3,2)} m³ × online/cache rate`;
    if(so)so.textContent=`${soda} × ${fmt(sodaRate,2)} EGP/${sodaUnit} = ${fmt0(sodaCost)} EGP`;
    if(fu)fu.textContent=`${fmt(fuel,1)} L ${ft} × official rate`;
    if(sum)sum.innerHTML=`<div><small>Electricity</small><b>${fmt(ekwh,1)} kWh</b></div><div><small>Water</small><b>${fmt(wm3,2)} m³</b></div><div><small>Soda</small><b>${soda}</b><em>${fmt0(sodaCost)} EGP manual</em></div><div><small>Fuel</small><b>${fmt(fuel,1)} L</b></div><div><small>Electricity Tariff</small><b>EgyptERA Online</b></div>`;
  };
  form.querySelector('[name=sodaType]')?.addEventListener('change',renderSodaInputs);
  $$('input',form).forEach(i=>i.oninput=update); renderSodaInputs(); update();
}

function saveBoilerDraft(){
  if(state.entryType!=='boiler')return;const form=$('#entryForm');if(!form)return;
  const fd=new FormData(form);state.boilerDraft.date=fd.get('date')||state.boilerDraft.date;state.boilerDraft.entryTime=fd.get('entryTime')||state.boilerDraft.entryTime;
  state.boilerDraft[state.boilerTab]=state.boilerDraft[state.boilerTab]||{};
  $$('[data-meter]',form).forEach(i=>{const m=i.dataset.meter,f2=i.dataset.field;state.boilerDraft[state.boilerTab][m]=state.boilerDraft[state.boilerTab][m]||{};state.boilerDraft[state.boilerTab][m][f2]=i.value;});
}
function savePHDraft(){
  if(state.entryType!=='ph')return;const form=$('#entryForm');if(!form)return;
  if(!state.phDraft)state.phDraft={};
  const fd=new FormData(form);state.phDraft.date=fd.get('phDate')||state.phDraft.date;state.phDraft.entryTime=fd.get('phTime')||state.phDraft.entryTime;
  $$('[data-ph-area]',form).forEach(i=>{const a=i.dataset.phArea,f2=i.dataset.phField;state.phDraft[a]=state.phDraft[a]||{};state.phDraft[a][f2]=i.value;});
}
function wireBoilerForm(){
  $$('[data-boiler-tab]').forEach(b=>b.onclick=()=>{saveBoilerDraft();state.boilerTab=Number(b.dataset.boilerTab);renderEntryForm();});
  $$('[data-meter]').forEach(i=>i.oninput=()=>saveBoilerDraft());
}

async function saveEntry(e){
  e.preventDefault();
  const form = $('#entryForm');
  const btn = form ? form.querySelector('[type=submit]') : null;
  const oldBtnText = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = isAr() ? 'جاري الحفظ...' : 'Saving...'; }

  try{
    let res;
    if(state.entryType==='boiler'){
      saveBoilerDraft();
      const data={date:state.boilerDraft.date,entryTime:state.boilerDraft.entryTime,readings:[]};
      [1,2].forEach(b=>{const obj=state.boilerDraft[b]||{};Object.keys(obj).forEach(m=>{const r=obj[m];if(r.pv!==''||r.sv!==''||r.currentAmpere!=='')data.readings.push({boilerNumber:b,meterNumber:Number(m),currentTemperaturePV:r.pv,setTemperatureSV:r.sv,currentAmpere:r.currentAmpere});});});
      if(!data.readings.length)throw new Error('Enter at least one reading');
      res=await jsonp('saveBoilerBatch',{payload:JSON.stringify(data)},{timeoutMs:90000});
    }else if(state.entryType==='ph'){
      savePHDraft();
      const areas=['Boiler','Sand Filter','Rinse Tank'];
      const readings=areas.filter(a=>state.phDraft[a]?.phReading!=='').map(a=>({date:state.phDraft.date,entryTime:state.phDraft.entryTime,area:a,phReading:state.phDraft[a]?.phReading||'',notes:state.phDraft[a]?.notes||''}));
      if(!readings.length)throw new Error('Enter at least one PH reading');
      let count=0;for(const r of readings){await jsonp('savePH',{payload:JSON.stringify(r)},{timeoutMs:90000});count++;}
      res={count};
    }else{
      const data=Object.fromEntries(new FormData(form).entries());
      const action={shift:'saveShift',receiving:'saveReceiving',downtime:'saveDowntime',waste:'saveWaste',sale:'saveSale',utilities:'saveUtilities'}[state.entryType];
      if(!action)throw new Error('Unknown entry type: '+state.entryType);
      // Client-side validation for sale
      if(state.entryType==='sale'){
        const weight=Number(data.netTripWeightKg||0), price=Number(data.flexPricePerTonThousand||0);
        if(weight<=0)throw new Error('Net Weight must be greater than zero');
        if(price<=0)throw new Error('Price per Ton must be greater than zero');
      }
      // Client-side validation for receiving
      if(state.entryType==='receiving'){
        const gross=Number(data.grossWeightKg||0), tare=Number(data.tareWeightKg||0);
        if(gross<=0)throw new Error('Gross Weight must be greater than zero');
        if(tare<=0)throw new Error('Tare Weight must be greater than zero');
        if(tare>=gross)throw new Error('Tare Weight must be less than Gross Weight');
      }
      res=await jsonp(action,{payload:JSON.stringify(data)},{timeoutMs:90000});
    }

    showToast(`✓ Saved ${res.count||1} record${(res.count||1)>1?'s':''} to Google Sheets`);
    // If GAS returned a validation warning (e.g. weight=0 or price=0), show it as a yellow warning
    if(res.validation && res.validation!=='OK'){
      setTimeout(()=>showToast('⚠ Warning: '+res.validation,'warn'),600);
    }
    $('#entryModal').classList.add('hidden');state.boilerDraft={};state.phDraft={};

    // V23: do not mark the save as failed if the post-save refresh is slow.
    // The record is already saved; refresh in the background.
    loadData().catch(err=>{
      console.warn('Background refresh failed after save:', err);
      showToast('Saved, but refresh was slow. Press Refresh after a few seconds.','warn');
      setConnection('Saved • refresh needed', false);
    });
  }catch(err){
    console.error(err);
    showToast('Save failed: '+err.message,'error');
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = oldBtnText; }
  }
}

/* ── EXPORT ── */
function exportCsv(){
  const f=state.filtered;
  const sets={summary:f.shifts,production:f.shifts,receiving:f.receivings,sales:f.sales,quality:f.ph,boilerph:f.boilers,waste:f.waste,shifts:f.shifts,intelligence:[...f.receivings,...f.sales],reports:[...f.shifts,...f.receivings,...f.downtimes,...f.boilers,...f.ph,...f.waste,...f.sales,...f.utilities]};
  const rows=(sets[state.page]||f.shifts)||[];
  if(!rows.length){showToast('No data to export','warn');return;}
  const cols=Object.keys(rows[0]);
  const csv=[cols.join(','),...rows.map(r=>cols.map(c=>`"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`${state.page}-${today()}.csv`;a.click();
}

/* ── RENDER ROUTER ── */
function render(){
  document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
  document.documentElement.lang=state.lang==='ar'?'ar':'en';
  document.body.classList.toggle('dark',state.dark);
  $$('#brandLogo').forEach(img=>img.src=state.dark?'assets/logo-environ-adapt-white.png':'assets/logo-environ-adapt-light.png');
  $$('[data-i18n]').forEach(el=>el.textContent=i18n[state.lang][el.dataset.i18n]||el.textContent);
  const titles={summary:'Executive Summary',production:'Production & Yield',receiving:'Receiving',sales:'Sales & Revenue',quality:'Quality Control',boilerph:'Boiler & PH',shifts:'Shift Comparison',intelligence:'Intelligence',reports:'Raw Data'};
  $('#pageTitle').textContent=tr(titles[state.page]||'Dashboard');
  const subtitle=$('#pageSubTitle'); if(subtitle) subtitle.textContent=tr('PET Flakes Washing Intelligence');
  const live=$('#liveText'); if(live) live.textContent=tr('Live from Google Sheets');
  const langBtn=$('#langBtn'); if(langBtn) langBtn.textContent=state.lang==='ar'?'EN':'AR';
  const fn={summary:renderSummary,production:renderProduction,receiving:renderReceiving,sales:renderSales,quality:renderQuality,boilerph:renderBoilerPH,shifts:renderShiftComparison,intelligence:renderIntelligence,reports:renderReports}[state.page]||renderSummary;
  fn();
  translateDashboardText(document);
}

/* ── INIT ── */
function initDates(){
  const now=new Date(),to=now.toISOString().slice(0,10),from=new Date(now.getTime()-30*864e5).toISOString().slice(0,10);
  $('#dateFrom').value=from;$('#dateTo').value=to;
}
function bind(){
  $$('.nav-item').forEach(b=>b.onclick=()=>{
    $$('.nav-item').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');

    state.page = b.dataset.page;

    $$('.page').forEach(p=>p.classList.remove('active'));
    $('#page-' + state.page).classList.add('active');

    if (window.innerWidth <= 900) {
      $('#sidebar').classList.remove('open');
    }

    render();
  });

  const mobileMenuBtn = $('#mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.onclick = () => {
      $('#sidebar').classList.add('open');
    };
  }

  $('#sidebarToggle').onclick=()=>{const sb=$('#sidebar');if(window.innerWidth<=900)sb.classList.toggle('open');else sb.classList.toggle('collapsed');};
  $('#newEntryBtn').onclick=openEntry;
  $('#modalClose').onclick=()=>{$('#entryModal').classList.add('hidden');state.boilerDraft={};state.phDraft={};};
  $('#entryModal').onclick=e=>{if(e.target===$('#entryModal')){$('#entryModal').classList.add('hidden');state.boilerDraft={};state.phDraft={};};};
  $('#refreshBtn').onclick=loadData;
  $('#exportBtn').onclick=exportCsv;
  $('#themeBtn').onclick=()=>{state.dark=!state.dark;localStorage.setItem('dark',state.dark?'1':'0');render();};
  $('#langBtn').onclick=()=>{state.lang=state.lang==='en'?'ar':'en';localStorage.setItem('lang',state.lang);render();};
  $('#dateFrom').onchange=()=>{applyFilters();render();};
  $('#dateTo').onchange=()=>{applyFilters();render();};
  $('#shiftFilter').onchange=()=>{applyFilters();render();};
  $('#clearChartFilter').onclick=()=>{state.activeFilter=null;$('#activeFilterBar').classList.add('hidden');};
}

(async function init(){
  try{if(window.Chart)cd();}catch(e){}
  initDates();bind();
  if(state.dark)document.body.classList.add('dark');
  await loadData();
})();
