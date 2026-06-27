'use strict';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLnb2avucZNZtn7OZ8VFUCgEfC1tzyyM1z9RcNSHHnOASSUiB9SfXgb39pKBDeelQYQA/exec';

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

const state = {
  page:'summary', lang:localStorage.getItem('lang')||'en', dark:localStorage.getItem('dark')==='1',
  raw:{shifts:[],receivings:[],downtimes:[],boilers:[],ph:[],waste:[],sales:[],utilities:[]},
  filtered:{}, activeFilter:null, charts:{},
  entryType:'shift', boilerTab:1, boilerDraft:{}, phDraft:{}, loading:false
};

const i18n = {
  en:{summary:'Executive Summary',production:'Production & Yield',receiving:'Receiving',sales:'Sales & Revenue',quality:'Quality Control',boilerph:'Boiler & PH',reports:'Raw Data'},
  ar:{summary:'الملخص التنفيذي',production:'الإنتاج والكفاءة',receiving:'الاستلام',sales:'المبيعات والإيرادات',quality:'مراقبة الجودة',boilerph:'الغلايات والـ PH',reports:'البيانات الخام'}
};

/* ── FULL ARABIC UI TRANSLATION ── */
const AR_TEXT = {
  'Executive Summary':'الملخص التنفيذي','Production & Yield':'الإنتاج والكفاءة','Receiving':'الاستلام','Sales & Revenue':'المبيعات والإيرادات','Quality Control':'مراقبة الجودة','Boiler & PH':'الغلايات والـ PH','Raw Data':'البيانات الخام','Dashboard':'لوحة التحكم',
  'Operations':'التشغيل','Quality & Process':'الجودة والعمليات','Reports':'التقارير','Synced':'متزامن','Live':'مباشر','Offline':'غير متصل','Ready':'جاهز','Loading…':'جاري التحميل…','Live from Google Sheets':'مباشر من Google Sheets','PET Flakes Washing Intelligence':'ذكاء تشغيل خط غسيل رقائق PET',
  'DATE FROM':'من تاريخ','DATE TO':'إلى تاريخ','SHIFT':'الوردية','All Shifts':'كل الورديات','Day':'نهار','Night':'ليل','Refresh':'تحديث','Export':'تصدير','New Entry':'إدخال جديد','Choose entry type and save directly to Google Sheets.':'اختر نوع الإدخال واحفظ مباشرة في Google Sheets.','Save to Sheets':'حفظ في الشيت','Cancel':'إلغاء','Close modal':'إغلاق النافذة','Open menu':'فتح القائمة','Toggle sidebar':'فتح/غلق القائمة','Toggle theme':'تغيير الوضع',
  'Shift':'وردية','Downtime':'توقف','Boiler':'غلاية','PH':'PH','Waste':'هالك','Sale':'بيع','Utilities':'مرافق','Date':'التاريخ','Time':'الوقت','Shift Type':'نوع الوردية','Shift Start':'بداية الوردية','Shift End':'نهاية الوردية','Workers':'العمال','Factory':'المصنع','Owner':'المالك','Consumed Bales':'البالات المستهلكة','Avg Bale Wt (kg)':'متوسط وزن البالة (كجم)','Produced Bags':'الأجولة المنتجة','Avg Bag Wt (kg)':'متوسط وزن الجوال (كجم)','Big Jumbo Bags Count':'عدد الجواني الكبيرة','Small Jumbo Bags Count':'عدد الجواني الصغيرة','Sacks Count':'عدد الشكاير','Packaging Counts':'أعداد الجواني والشكاير','Notes':'ملاحظات',
  'Supplier':'المورد','Region':'المنطقة','Vehicle':'السيارة','Driver':'السائق','Bales Count':'عدد البالات','Price / Ton (×1000)':'سعر الطن (×1000)','Karte No.':'رقم الكارتة','Gross Weight (kg)':'الوزن القائم (كجم)','Tare Weight (kg)':'وزن الفارغ (كجم)','Discount %':'نسبة الخصم %','Stop From':'توقف من','Stop To':'توقف إلى','Reason':'السبب',
  'Sortex Wt (kg)':'وزن السورتكس (كجم)','Sortex Count':'عدد السورتكس','Green Bottle Wt (kg)':'زجاجة خضراء (كجم)','Big Flex Wt (kg)':'زجاجة خضراء (كجم)','Green Bottle Count':'عدد الزجاجات الخضراء','Big Flex Count':'عدد الزجاجات الخضراء','Bag & Strap Wt (kg)':'وزن الشمبر والأكياس (كجم)','Wire & Bags Wt (kg)':'وزن الشمبر والأكياس (كجم)','Bag & Strap Count':'عدد الشمبر والأكياس','Wire & Bags Count':'عدد الشمبر والأكياس','Caps & Labels Wt (kg)':'وزن الغطاء والليبل المكسر (كجم)','Caps & Labels Count':'عدد الغطاء والليبل المكسر','Buyer Factory':'مصنع العميل','Location':'الموقع','Net Weight (kg)':'صافي الوزن (كجم)',
  'Meter':'عداد','PV (°C)':'PV (°م)','SV (°C)':'SV (°م)','Current (A)':'الأمبير (A)','Area':'المنطقة','PH Reading':'قراءة PH','Optional…':'اختياري…','Electricity':'الكهرباء','Water':'المياه','Chemicals':'الكيماويات','Start Reading (kWh)':'قراءة البداية (kWh)','End Reading (kWh)':'قراءة النهاية (kWh)','Start Reading (m³)':'قراءة البداية (م³)','End Reading (m³)':'قراءة النهاية (م³)','Soda Bags Used':'عدد أجولة الصودا','Soda kg per Bag':'كجم الصودا لكل جوال','Inne Bags Used':'عدد أجولة Inne','Bags count':'عدد الأجولة','Total = Bags × kg/Bag':'الإجمالي = عدد الأجولة × كجم/جوال','Consumed = End − Start':'الاستهلاك = النهاية − البداية',
  'Production Efficiency':'كفاءة الإنتاج','Operational Uptime':'زمن التشغيل','Revenue Generated':'الإيراد المحقق','Received':'المستلم','Consumed':'المستهلك','Produced':'المنتج','Waste':'الهالك','Actual Yield':'الكفاءة الفعلية','Actual Loss':'الفقد الفعلي','Revenue':'الإيرادات','Production vs Consumption — Daily (MT)':'الإنتاج مقابل الاستهلاك يوميًا (طن)','Material Flow Breakdown':'تحليل تدفق الخامة','Net Production':'صافي الإنتاج','Uptime':'زمن التشغيل','Sales vs Produced':'المبيعات مقابل الإنتاج','Key Ratios':'النسب الرئيسية','Metric':'المؤشر','Value':'القيمة','Status':'الحالة','Material Yield':'كفاءة الخامة','Waste Rate':'معدل الهالك','Loss Rate':'معدل الفقد','Avg PH':'متوسط PH','Boiler Δ (PV-SV)':'فرق الغلاية (PV-SV)','Management Signals — What to do next':'إشارات الإدارة — ماذا نفعل بعد ذلك','Production':'الإنتاج','Sales':'المبيعات',
  'Total Waste':'إجمالي الهالك','Downtime':'التوقفات','Avg Bag Weight':'متوسط وزن الجوال','Sortex':'سورتكس','Green Bottle':'زجاجة خضراء','Big Flex':'زجاجة خضراء','Bag & Strap':'شمبر وأكياس','Wire & Bags':'شمبر وأكياس','Caps & Labels':'غطاء وليبل مكسر','Unaccounted':'غير محسوب','Daily Production vs Consumption (MT)':'الإنتاج اليومي مقابل الاستهلاك (طن)','Waste Distribution':'توزيع الهالك','Daily Yield % Trend':'اتجاه الكفاءة اليومية %','Downtime by Reason (min)':'التوقف حسب السبب (دقيقة)','Shift Records':'سجلات الورديات','Downtime Log':'سجل التوقفات','Utilities per Shift':'المرافق لكل وردية','No records':'لا توجد سجلات','No data':'لا توجد بيانات',
  'Total Received':'إجمالي المستلم','Avg Daily Receiving':'متوسط الاستلام اليومي','Gross → Net':'القائم → الصافي','Discount Applied':'الخصم المطبق','Price Before Discount':'السعر قبل الخصم','Price After Discount':'السعر بعد الخصم','Total Discount Amount':'إجمالي قيمة الخصم','Avg Price / Ton':'متوسط سعر الطن','Discount Weight':'وزن الخصم','Supplier Share (MT)':'نسبة الموردين (طن)','Daily Receiving Trend (MT)':'اتجاه الاستلام اليومي (طن)','By Supplier — Total MT':'حسب المورد — إجمالي طن','Discount % by Trip':'نسبة الخصم لكل نقلة','All Receiving Records':'كل سجلات الاستلام',
  'Total Revenue':'إجمالي الإيرادات','Avg Sale Price':'متوسط سعر البيع','Est. Cost / MT':'التكلفة التقديرية/طن','Gross Margin':'هامش الربح','Sales Discount Given':'خصم المبيعات','Price Before Disc':'السعر قبل الخصم','Revenue / MT':'الإيراد/طن','Break-even Price':'سعر التعادل','Price Analysis':'تحليل السعر','Risk Analysis':'تحليل المخاطر','Risk Factor':'عامل الخطر','Current':'الحالي','Daily Revenue Trend':'اتجاه الإيراد اليومي','Revenue by Buyer':'الإيراد حسب العميل','All Sales Records':'كل سجلات المبيعات','Buyer':'العميل',
  'Contaminant rates as % of consumed material · PH readings per area':'نسب الشوائب من الخامة المستهلكة · قراءات PH حسب المنطقة','PVC / Sortex':'PVC / سورتكس','Metal / Wire':'شمبر وأكياس','Color / Green Bottle':'لون / زجاجة خضراء','Color / Big Flex':'لون / زجاجة خضراء','Other / Caps':'أخرى / أغطية','Boiler PH':'PH الغلاية','Sand Filter PH':'PH فلتر الرمل','Rinse Tank PH':'PH تنك الشطف','Total Contamination %':'إجمالي الشوائب %','PH Trend by Area':'اتجاه PH حسب المنطقة','Contaminant Breakdown (kg)':'تحليل الشوائب (كجم)','Waste Type Trend (Daily MT)':'اتجاه نوع الهالك يوميًا (طن)','PH Status Summary':'ملخص حالة PH','Readings':'قراءات','PH Readings Log':'سجل قراءات PH','Normal':'طبيعي','Out of Range':'خارج النطاق','Acidic':'حمضي','Alkaline':'قلوي','Min':'أقل','Max':'أعلى','All':'الكل','Sand Filter':'فلتر الرمل','Rinse Tank':'تنك الشطف','Sand':'رمل','Rinse':'شطف',
  'Boiler Avg PV':'متوسط PV للغلاية','PV/SV Delta':'فرق PV/SV','Boiler Readings':'قراءات الغلاية','Boiler Temperature Trend (°C)':'اتجاه حرارة الغلاية (°م)','Boiler Readings — Full Log':'قراءات الغلاية — السجل الكامل','PH Readings — Full Log':'قراءات PH — السجل الكامل','All Boilers':'كل الغلايات','Boiler 1':'غلاية 1','Boiler 2':'غلاية 2','All Meters':'كل العدادات','PV':'PV','SV':'SV','Ampere (A)':'الأمبير (A)',
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
function timeLabel(v){if(!v)return '';if(typeof v==='string')return v.replace(/:\d{2}\s*$/,'');if(v instanceof Date)return `${String(v.getHours()).padStart(2,'0')}:${String(v.getMinutes()).padStart(2,'0')}`;return String(v);}
function shiftType(row){return String(rowVal(row,['Shift Type','shiftType'],'')).trim()||'Day';}
function trend(arr){
  if(arr.length<2)return 0;
  const n=arr.length, sx=arr.reduce((s,_,i)=>s+i,0), sy=arr.reduce((s,v)=>s+v,0);
  const sxy=arr.reduce((s,v,i)=>s+i*v,0), sxx=arr.reduce((s,_,i)=>s+i*i,0);
  return (n*sxy-sx*sy)/(n*sxx-sx*sx||1);
}

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

/* ── JSONP ── */
function jsonp(action,params={}){
  return new Promise((resolve,reject)=>{
    const cb='cb_'+Date.now()+'_'+Math.floor(Math.random()*999999);
    const url=new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action',action);url.searchParams.set('callback',cb);
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,typeof v==='string'?v:JSON.stringify(v)));
    const s=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();reject(new Error('Timeout'));},22000);
    function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
    window[cb]=(data)=>{cleanup();data&&data.ok===false?reject(new Error(data.error||'Error')):resolve(data);};
    s.onerror=()=>{cleanup();reject(new Error('Cannot reach Apps Script'));};
    s.src=url.toString();document.body.appendChild(s);
  });
}

async function loadData(){
  state.loading=true;setConnection('Loading…',true);
  try{
    const res=await jsonp('getDashboardData');
    const s=res.sheets||res.data||res||{};
    state.raw={shifts:s.shifts||[],receivings:s.receivings||[],downtimes:s.downtimes||[],boilers:s.boilers||[],ph:s.ph||[],waste:s.waste||[],sales:s.sales||[],utilities:s.utilities||[]};
    setConnection('Live',true);applyFilters();render();
  }catch(e){
    console.error(e);setConnection('Offline',false);
    showToast('Cannot reach Google Sheets: '+e.message,'error');
    applyFilters();render();
  }finally{state.loading=false;}
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
  const receivingKg=f.receivings.reduce((a,r)=>a+num(rowVal(r,['Net Weight After Discount Kg'])),0);
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
  const wasteKg=f.waste.reduce((a,r)=>a+(num(rowVal(r,['Total Waste Weight Kg']))||num(rowVal(r,['Sortex Weight Kg']))+num(rowVal(r,['Green Weight Kg','Green Bottle Weight Kg','Big Flex Weight Kg']))+num(rowVal(r,['Bag And Strap Weight Kg','Wire And Bags Weight Kg']))+num(rowVal(r,['Broken Caps Labels Weight Kg']))),0);
  const sortexKg=f.waste.reduce((a,r)=>a+num(rowVal(r,['Sortex Weight Kg'])),0);
  const bigFlexKg=f.waste.reduce((a,r)=>a+num(rowVal(r,['Green Weight Kg','Green Bottle Weight Kg','Big Flex Weight Kg'])),0); // Green Bottle
  const wireKg=f.waste.reduce((a,r)=>a+num(rowVal(r,['Bag And Strap Weight Kg','Wire And Bags Weight Kg'])),0); // Bag & Strap
  const capsKg=f.waste.reduce((a,r)=>a+num(rowVal(r,['Broken Caps Labels Weight Kg'])),0);
  const materialRecoveryKg=bigFlexKg+wireKg;
  const operationRecoveryKg=sortexKg+capsKg;
  const actualInputKg=consumedKg;
  const bigJumboBags=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Big Jumbo Bags Count','bigJumboBagsCount'])),0);
  const smallJumboBags=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Small Jumbo Bags Count','smallJumboBagsCount'])),0);
  const sacksCount=f.shifts.reduce((a,r)=>a+num(rowVal(r,['Sacks Count','sacksCount'])),0);
  const downtimeMin=f.downtimes.reduce((a,r)=>a+num(rowVal(r,['Downtime Minutes'])),0);
  const phVals=f.ph.map(r=>num(rowVal(r,['PH Reading']))).filter(Boolean);
  const avgPh=phVals.length?phVals.reduce((a,b)=>a+b)/phVals.length:0;
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
  const dailyRecMap={};f.receivings.forEach(r=>{const k=dateKey(rowVal(r,['Date']));dailyRecMap[k]=(dailyRecMap[k]||0)+num(rowVal(r,['Net Weight After Discount Kg']))/1000;});
  const activeDays=Object.keys(dailyRecMap);
  const avgDailyReceiving=activeDays.length?Object.values(dailyRecMap).reduce((a,b)=>a+b)/activeDays.length:0;
  // Utilities metrics
  const elecKwh=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Electricity Consumed Kwh'])),0);
  const waterM3=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Water Consumed M3'])),0);
  const sodaKg=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Soda Total Kg'])),0);
  const inneCount=f.utilities.reduce((a,r)=>a+num(rowVal(r,['Inne Bags Count'])),0);
  const elecPerMT=prodKg?elecKwh/(prodKg/1000):0;
  const waterPerMT=prodKg?waterM3/(prodKg/1000):0;
  const sodaPerMT=prodKg?sodaKg/(prodKg/1000):0;
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
    consumedKg,bales,prodKg,bags,wasteKg,sortexKg,bigFlexKg,wireKg,capsKg,materialRecoveryKg,operationRecoveryKg,actualInputKg,bigJumboBags,smallJumboBags,sacksCount,
    downtimeMin,stops:f.downtimes.length,actualLossKg,
    avgPh,avgPv,avgSv,
    salesKg,salesRevenue,salesBeforeDiscount,salesDiscountLoss,avgSalePrice,
    salesTrips:f.sales.length,
    elecKwh,waterM3,sodaKg,inneCount,elecPerMT,waterPerMT,sodaPerMT,actualYieldPct,actualYieldRatio,materialPct,materialRatio,operationPct,operationRatio,
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
  Chart.defaults.plugins.legend.labels.padding=100;
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
  state.charts[id]=new Chart(ctx,{type:'line',data:{labels:labels.map(trLoose),datasets:ds.map(d=>({
    label:tr(d.label),data:d.data,borderColor:d.color,backgroundColor:d.fill?(d.color+'28'):'transparent',
    borderWidth:2.5,tension:.4,spanGaps:true,pointRadius:4,pointHoverRadius:7,
    pointBackgroundColor:d.color,pointBorderColor:'#fff',pointBorderWidth:2,fill:!!d.fill
  }))},options:{responsive:true,maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'top'},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.parsed.y,2)}`}}},
    onClick:(e,els)=>{if(els[0]){const i=els[0].index,di=els[0].datasetIndex;cc(ds[di].label+' '+labels[i],ds[di].data[i]);}},
    scales:{x:{grid:{display:false},ticks:{maxRotation:30,font:{size:11}}},
      y:{beginAtZero:true,grid:{color:state.dark?'#1e3327':'#f0f4f1'},ticks:{callback:v=>fmt(v,1)},...(opts.yOpts||{})}
    },...(opts.extra||{})
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
  if(!rows.length)return `<div class="empty-state">${emptyMsg}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c.label||c}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${cols.map(c=>{const key=c.key||c;const v=rowVal(r,[key],'—');return `<td>${c.fmt?c.fmt(v):v}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
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
  const profitPerMT=m.avgSalePrice-(m.consumedKg&&m.prodKg?m.priceAfterDiscount/(m.prodKg/1000):0);
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
      <div class="dc-note">${m.downtimeMin} min downtime across ${m.stops} stops<br>${m.stops?'Avg stop: '+fmt(m.downtimeMin/m.stops,0)+' min':'No downtime recorded'}</div>
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
    {label:'Received',value:`${fmt(m.receivingKg/1000,2)} <span class="u">MT</span>`,sub:`${m.receivingTrips} trips`},
    {label:'Consumed',value:`${fmt(m.consumedKg/1000,2)} <span class="u">MT</span>`,sub:`${fmt0(m.bales)} bales`},
    {label:'Produced',value:`${fmt(m.prodKg/1000,2)} <span class="u">MT</span>`,sub:`${fmt0(m.bags)} bags`},
    {label:'Waste',value:`${fmt(m.wasteKg/1000,2)} <span class="u">MT</span>`,sub:`${fmt(m.wastePct,1)}% of consumed`},
    {label:'Actual Yield',value:`${fmt(m.actualYieldRatio,2)} <span class="u">kg/kg</span>`,sub:`${fmt(m.actualYieldPct,1)}% · Actual Production ÷ Actual Input`},
    {label:'Actual Loss',value:`${fmt(m.actualLossKg/1000,2)} <span class="u">MT</span>`,sub:`${fmt(m.lossPct,1)}% of consumed`},
    {label:'Electricity',value:`${fmt(m.elecKwh,0)} <span class="u">kWh</span>`,sub:m.elecPerMT?fmt(m.elecPerMT,1)+' /MT':''},
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
            <tr><td>Avg PH</td><td>${fmt(m.avgPh,2)}</td><td><span class="badge ${m.avgPh>=6.5&&m.avgPh<=8.5?'green':'red'}">${m.avgPh>=6.5&&m.avgPh<=8.5?'Normal':'Out of Range'}</span></td></tr>
            <tr><td>Boiler Δ (PV-SV)</td><td>${fmt(m.avgPv-m.avgSv,1)} °C</td><td><span class="badge ${Math.abs(m.avgPv-m.avgSv)<=5?'green':Math.abs(m.avgPv-m.avgSv)<=10?'yellow':'red'}">${Math.abs(m.avgPv-m.avgSv)<=5?'Normal':Math.abs(m.avgPv-m.avgSv)<=10?'Watch':'Alert'}</span></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <!-- MANAGER RECOMMENDATION -->
  <section class="panel mt">
    <h3>🧭 Management Signals — What to do next</h3>
    <div class="grid-3" style="margin-top:14px">
      ${summarySignal('Production',efficiency>=68?'green':efficiency>=55?'yellow':'red',efficiency>=68?'Continue current operations. Yield is on target.':efficiency>=55?'Monitor closely. Yield is below target — review bale quality and machine settings.':'Immediate action needed. Yield is critically low — investigate consumption losses.',fmt(efficiency,1)+'% efficiency · Target ≥68%')}
      ${summarySignal('Waste',m.wastePct<=8?'green':m.wastePct<=15?'yellow':'red',m.wastePct<=8?'Waste is well controlled.':m.wastePct<=15?'Waste is moderate. Review Sortex and Green Bottle reject rates.':'Waste is high. Check sorting line calibration and raw material quality.',fmt(m.wastePct,1)+'% of consumed · Target ≤8%')}
      ${summarySignal('Sales',m.salesKg>=m.prodKg*0.8?'green':m.salesKg>0?'yellow':'red',m.salesKg>=m.prodKg*0.8?'Sales are moving well relative to production.':m.salesKg>0?'Sales are below production — check inventory buildup.':'No sales recorded in this period.',fmt(m.salesKg/1000,2)+' MT sold vs '+fmt(m.prodKg/1000,2)+' MT produced')}
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
  <div class="kpi-grid">
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
  </div>

  <!-- WASTE BREAKDOWN -->
  ${statRow([
    {label:'Sortex',value:`${fmt(m.sortexKg/1000,3)} MT`,sub:`${fmt(pct(m.sortexKg,m.wasteKg),1)}% of waste`},
    {label:'Green Bottle',value:`${fmt(m.bigFlexKg/1000,3)} MT`,sub:`${fmt(pct(m.bigFlexKg,m.wasteKg),1)}% of waste`},
    {label:'Bag & Strap',value:`${fmt(m.wireKg/1000,3)} MT`,sub:`${fmt(pct(m.wireKg,m.wasteKg),1)}% of waste`},
    {label:'Caps & Labels',value:`${fmt(m.capsKg/1000,3)} MT`,sub:`${fmt(pct(m.capsKg,m.wasteKg),1)}% of waste`},
    {label:'Actual Loss',value:`${fmt(m.actualLossKg/1000,3)} MT`,sub:'Unaccounted'}
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
      {label:'Electricity',value:`${fmt(m.elecKwh,1)} <span class="u">kWh</span>`,sub:m.prodKg?fmt(m.elecPerMT,1)+' kWh/MT':''},
      {label:'Water',value:`${fmt(m.waterM3,1)} <span class="u">m³</span>`,sub:m.prodKg?fmt(m.waterPerMT,2)+' m³/MT':''},
      {label:'Soda',value:`${fmt(m.sodaKg,1)} <span class="u">kg</span>`,sub:m.prodKg?fmt(m.sodaPerMT,2)+' kg/MT':''},
      {label:'Inne Bags',value:`${fmt0(m.inneCount)} <span class="u">bags</span>`,sub:`${f.utilities.length} utility records`}
    ])}
    ${table(f.utilities.slice().reverse(),[
      {key:'Date'},{key:'Shift Type',label:'Shift'},
      {key:'Electricity Start Reading Kwh',label:'Elec Start',fmt:v=>fmt(v,1)},
      {key:'Electricity End Reading Kwh',label:'Elec End',fmt:v=>fmt(v,1)},
      {key:'Electricity Consumed Kwh',label:'Elec kWh',fmt:v=>fmt(v,1)},
      {key:'Water Start Reading M3',label:'Water Start',fmt:v=>fmt(v,2)},
      {key:'Water End Reading M3',label:'Water End',fmt:v=>fmt(v,2)},
      {key:'Water Consumed M3',label:'Water m³',fmt:v=>fmt(v,2)},
      {key:'Soda Bags Count',label:'Soda Bags',fmt:v=>fmt0(v)},
      {key:'Soda Kg Per Bag',label:'kg/Bag',fmt:v=>fmt(v,1)},
      {key:'Soda Total Kg',label:'Soda Total kg',fmt:v=>fmt(v,1)},
      {key:'Inne Bags Count',label:'Inne Bags',fmt:v=>fmt0(v)},
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
  const wv=[m.sortexKg,m.bigFlexKg,m.wireKg,m.capsKg].map(v=>v/1000);
  if(wv.reduce((a,b)=>a+b))drawDoughnut('wastePieChart',['Sortex','Green Bottle','Bag & Strap','Caps & Labels'],wv,[C.green,C.teal,C.amber,C.purple]);
  else eb('wastePieBox','No waste data');
  // Yield trend
  const ym=byDate(f.shifts,r=>{const p=num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg']));const c=num(rowVal(r,['Consumed Weight Kg']))||num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg']));return c?p/c*100:0;});
  const yl=Object.keys(ym).sort();
  if(yl.length)drawLine('yieldTrendChart',yl,[{label:'Material Yield %',data:yl.map(k=>ym[k]),color:C.green,fill:true}],{yOpts:{min:0,max:100,ticks:{callback:v=>v+'%'}}});
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
  const dailyMap=byDate(f.receivings,r=>num(rowVal(r,['Net Weight After Discount Kg']))/1000);
  const dKeys=Object.keys(dailyMap).sort();
  $('#page-receiving').innerHTML=`
  <div class="kpi-grid">
    ${kpi('Total Received',`${fmt(m.receivingKg/1000,2)} <span class="unit">MT</span>`,`${m.receivingTrips} trips · ${m.activeDays} days`,'▣')}
    ${kpi('Avg Daily Receiving',`${fmt(m.avgDailyReceiving,2)} <span class="unit">MT</span>`,`${m.activeDays} active days`,'📅')}
    ${kpi('Gross → Net',`${fmt(m.receivingNet/1000,2)} <span class="unit">MT</span>`,`Gross: ${fmt(m.receivingGross/1000,2)} · Tare: ${fmt(m.receivingTare/1000,2)} MT`,'⚖')}
    ${kpi('Discount Applied',`${fmt(m.avgDiscount,1)} <span class="unit">%</span>`,`${fmt(m.discountKg/1000,2)} MT deducted`,'%','rgba(217,119,6,.1)')}
  </div>

  <!-- PRICE ROW -->
  ${statRow([
    {label:'Price Before Discount',value:`${fmt0(m.priceBeforeDiscount)}`,sub:'Total trip prices'},
    {label:'Price After Discount',value:`${fmt0(m.priceAfterDiscount)}`,sub:'What we paid'},
    {label:'Total Discount Amount',value:`${fmt0(m.priceDiff)}`,sub:'Saved via deduction'},
    {label:'Avg Price / Ton',value:`${fmt(m.receivingKg?m.priceAfterDiscount/(m.receivingKg/1000):0,0)}`,sub:'After discount'},
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
  ])}</section>`;

  // Supplier pie
  const sm={};f.receivings.forEach(r=>{const s=rowVal(r,['Supplier Name'],'Unknown');sm[s]=(sm[s]||0)+num(rowVal(r,['Net Weight After Discount Kg']))/1000;});
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
  const costPerMT=m.prodKg?m.priceAfterDiscount/(m.prodKg/1000):0;
  const grossMarginPct=m.salesRevenue&&costPerMT?pct(m.avgSalePrice-costPerMT,m.avgSalePrice):0;
  const breakeven=costPerMT;
  $('#page-sales').innerHTML=`
  <div class="kpi-grid">
    ${kpi('Total Revenue',`${fmt0(m.salesRevenue)}`,`${m.salesTrips} trips · ${fmt(m.salesKg/1000,2)} MT sold`,'$')}
    ${kpi('Avg Sale Price',`${fmt0(m.avgSalePrice)} <span class="unit">/MT</span>`,`Before discount: ${fmt0(m.salesBeforeDiscount/(m.salesKg/1000||1))} /MT`,'↗')}
    ${kpi('Est. Cost / MT',`${fmt0(costPerMT)}`,`Based on receiving cost ÷ production`,'÷','rgba(37,99,235,.1)')}
    ${kpi('Gross Margin',`${fmt(grossMarginPct,1)} <span class="unit">%</span>`,grossMarginPct>0?`~${fmt((m.avgSalePrice-costPerMT)*m.salesKg/1000,0)} total margin`:'No cost data for margin','◈',grossMarginPct>15?'rgba(0,166,81,.1)':'rgba(229,62,62,.1)')}
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
      <div class="insight-row"><span class="ir-label">Est. Raw Material Cost (MT)</span><span class="ir-value">${fmt0(costPerMT)}</span></div>
      <div class="insight-row"><span class="ir-label">Gross Margin per MT</span><span class="ir-value ${m.avgSalePrice>costPerMT?'pos':'neg'}">${m.avgSalePrice>costPerMT?'+':''}${fmt0(m.avgSalePrice-costPerMT)}</span></div>
      <div class="insight-row"><span class="ir-label">Break-even Price</span><span class="ir-value">${fmt0(breakeven)}</span></div>
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
        Based on current cost ${fmt0(breakeven)}/MT + 15% margin target = <b style="color:var(--green)">${fmt0(breakeven*1.15)}/MT</b><br>
        ${m.avgSalePrice>breakeven*1.15?'✓ Current price exceeds target':'⚠ Consider negotiating higher price'}
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
    {key:'Net Trip Weight Kg',label:'Gross Weight (kg)',fmt:v=>fmt0(v)},
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
    const area=String(rowVal(r,['Area']),'').toLowerCase();
    const val=num(rowVal(r,['PH Reading']));
    if(!val)return;
    if(area.includes('boiler'))phByArea.Boiler.push(val);
    else if(area.includes('rinse'))phByArea.Rinse.push(val);
    else if(area.includes('sand'))phByArea.Sand.push(val);
  });
  const phAvg=arr=>arr.length?arr.reduce((a,b)=>a+b)/arr.length:0;
  const phStatus=(v)=>v===0?'—':v>=6.5&&v<=8.5?'Normal':v<6.5?'Acidic':'Alkaline';
  const phClass=(v)=>v===0?'':v>=6.5&&v<=8.5?'ok':'bad';

  // Waste quality proxies
  const m=metrics();
  const sortexPct=pct(m.sortexKg,m.consumedKg);
  const metalPct=pct(m.wireKg,m.consumedKg);   // Bag & Strap proxy
  const colorPct=pct(m.bigFlexKg,m.consumedKg); // Green Bottle proxy
  const otherPct=pct(m.capsKg,m.consumedKg);

  function gauge(label,val,limit,unit='%'){
    const p=limit>0?Math.min(100,val/limit*100):0;
    const cls=unit==='pH'?(val===0?'':'ok'):(val<=limit*0.5?'ok':val<=limit*0.8?'warn':'bad');
    return `<div class="gauge-card ${cls}">
      <div class="g-label">${label}</div>
      <div class="g-value">${val===0&&unit==='pH'?'—':fmt(val,2)}${unit==='%'?' %':unit==='pH'?' pH':' '+unit}</div>
      <div class="g-bar-wrap"><div class="g-bar" style="width:${p}%"></div></div>
      <div class="g-limit">Limit: ${fmt(limit,1)}${unit==='%'?' %':unit==='pH'?' pH':' '+unit}</div>
    </div>`;
  }

  $('#page-quality').innerHTML=`
  <!-- QUALITY GAUGES -->
  <div style="margin-bottom:14px">
    <p style="font-size:12px;color:var(--muted);margin-bottom:10px">Contaminant rates as % of consumed material · PH readings per area</p>
    <div class="gauge-grid">
      ${gauge('PVC / Sortex',sortexPct,5)}
      ${gauge('Bag & Strap',metalPct,1)}
      ${gauge('Color / Green Bottle',colorPct,3)}
      ${gauge('Other / Caps',otherPct,2)}
      ${gauge('Boiler PH',phAvg(phByArea.Boiler),100,'pH')}
    </div>
    <div class="gauge-grid" style="grid-template-columns:repeat(3,1fr)">
      ${gauge('Sand Filter PH',phAvg(phByArea.Sand),100,'pH')}
      ${gauge('Rinse Tank PH',phAvg(phByArea.Rinse),100,'pH')}
      ${gauge('Total Contamination %',sortexPct+metalPct+colorPct+otherPct,10)}
    </div>
  </div>

  <!-- PH TABLE -->
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    ${['Boiler','Sand Filter','Rinse Tank'].map(area=>{
      const key=area.split(' ')[0];const vals=phByArea[key]||[];const avg=phAvg(vals);
      const mn=vals.length?Math.min(...vals):0,mx=vals.length?Math.max(...vals):0;
      return kpi(area+' PH',avg?fmt(avg,2):'—',vals.length?`Min ${fmt(mn,2)} · Max ${fmt(mx,2)} · ${vals.length} readings`:'No readings','pH',avg&&(avg<6.5||avg>8.5)?'rgba(229,62,62,.12)':'');
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
          return `<tr><td>${k==='Sand'?'Sand Filter':k==='Rinse'?'Rinse Tank':k}</td><td><b>${avg?fmt(avg,2):'—'}</b></td><td>${mn?fmt(mn,2):'—'}</td><td>${mx?fmt(mx,2):'—'}</td><td>${vals.length}</td><td><span class="badge ${avg===0?'':avg>=6.5&&avg<=8.5?'green':'red'}">${phStatus(avg)}</span></td></tr>`;
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
  const cv=[m.sortexKg,m.wireKg,m.bigFlexKg,m.capsKg];
  if(cv.reduce((a,b)=>a+b))drawDoughnut('contPieChart',['Sortex/PVC','Bag & Strap','Green Bottle','Caps/Other'],cv,[C.green,C.teal,C.amber,C.purple]);
  else eb('contPieBox','No contamination data');

  // Waste trend
  const sm2=byDate(f.waste,r=>num(rowVal(r,['Sortex Weight Kg']))/1000);
  const bm2=byDate(f.waste,r=>num(rowVal(r,['Green Bottle Weight Kg','Big Flex Weight Kg']))/1000);
  const {labels:wl,series:ws}=alignSeries([sm2,bm2]);
  if(wl.length)drawLine('wasteTrendChart',wl,[{label:'Sortex',data:ws[0],color:C.green},{label:'Green Bottle',data:ws[1],color:C.amber}]);
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
    ${kpi('PV/SV Delta',`${fmt(m.avgPv-m.avgSv,1)} <span class="unit">°C</span>`,'Avg deviation — target ≤5°C','Δ',Math.abs(m.avgPv-m.avgSv)>10?'rgba(229,62,62,.12)':Math.abs(m.avgPv-m.avgSv)>5?'rgba(217,119,6,.12)':'')}
    ${kpi('Boiler Readings',`${fmt0(f.boilers.length)}`,`${[...new Set(f.boilers.map(r=>rowVal(r,['Boiler Number'])))].length} boilers · ${[...new Set(f.boilers.map(r=>rowVal(r,['Meter Number'])))].length} meters`,'▤')}
    ${kpi('Avg PH',`${fmt(m.avgPh,2)}`,`Range 6.5–8.5 normal · ${f.ph.length} readings`,'pH',m.avgPh&&(m.avgPh<6.5||m.avgPh>8.5)?'rgba(229,62,62,.12)':'')}
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
    {key:'Temperature Difference',label:'Δ (°C)',fmt:v=>fmt(v,1)},
    {key:'Current Ampere',label:'Ampere (A)',fmt:v=>fmt(v,2)},
    {key:'Notes'}
  ])}</section>
  <section class="panel mt"><h3>PH Readings — Full Log</h3>${table(f.ph.slice().reverse(),[
    {key:'Date'},{key:'Entry Time',label:'Time'},{key:'Area'},
    {key:'PH Reading',label:'PH',fmt:v=>fmt(v,2)},{key:'PH Status',label:'Status'},{key:'Notes'}
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
  const ds=areas.map((a,i)=>({label:a,data:labels.map(l=>{const v=rows.filter(r=>timeLabel(rowVal(r,['Entry Time']))===l&&String(rowVal(r,['Area'])).toLowerCase()===a.toLowerCase()).map(r=>num(rowVal(r,['PH Reading'])));return v.length?v.reduce((x,y)=>x+y)/v.length:null;}),color:colors[i]}));
  drawLine(chartId,labels,ds,{yOpts:{min:0,max:100}});
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
  drawLine(chartId,labels,ds);
}
function renderMeterCards(rows){
  const box=$('#meterCards');if(!box)return;
  const bs=$('#boilerSel')?.value||'all';
  const boilers=bs==='all'?['1','2']:[bs];
  let html='';
  boilers.forEach(b=>{for(let i=1;i<=6;i++){
    const r=[...rows].reverse().find(x=>String(rowVal(x,['Boiler Number']))===b&&String(rowVal(x,['Meter Number']))===String(i));
    const pv=num(rowVal(r||{},['Current Temperature PV'])),sv=num(rowVal(r||{},['Set Temperature SV'])),delta=pv-sv;
    const dc=Math.abs(delta)>10?C.red:Math.abs(delta)>5?C.amber:C.green;
    html+=`<div class="meter-card"><b>B${b}·M${i}</b><div>PV <strong>${r?fmt(pv,0):'-'}°C</strong></div><div style="font-size:11px;color:var(--muted)">SV ${r?fmt(sv,0):'-'}°C</div><div style="font-size:11px;color:${dc}">Δ ${r?fmt(delta,1):'-'}°C</div></div>`;
  }});
  box.innerHTML=html;
}

/* ════════════════════════════════════════════════════
   PAGE: REPORTS — Raw data all sheets
═════════════════════════════════════════════════════ */
function renderReports(){
  const all=state.filtered;
  const sections=[
    {label:'Shift Entries',rows:all.shifts,cols:['Date','Shift Type','Consumed Weight Kg','Net Production Kg','Material Yield Percent','Actual Loss Kg','Notes']},
    {label:'Receiving',rows:all.receivings,cols:['Date','Supplier Name','Net Weight After Discount Kg','Discount Percent','Trip Price After Discount','Notes']},
    {label:'Sales',rows:all.sales,cols:['Date','Buyer Factory Name','Net Weight After Discount Kg','Sale Price After Discount','Discount Percent','Notes']},
    {label:'Waste',rows:all.waste,cols:['Date','Total Waste Weight Kg','Sortex Weight Kg','Green Weight Kg','Green Bottle Weight Kg','Big Flex Weight Kg','Bag And Strap Weight Kg','Wire And Bags Weight Kg','Broken Caps Labels Weight Kg']},
    {label:'Downtime',rows:all.downtimes,cols:['Date','Downtime Minutes','Downtime Reason','Notes']},
    {label:'PH Readings',rows:all.ph,cols:['Date','Entry Time','Area','PH Reading','PH Status','Notes']},
    {label:'Boiler Readings',rows:all.boilers,cols:['Date','Entry Time','Boiler Number','Meter Number','Current Temperature PV','Set Temperature SV','Temperature Difference','Current Ampere']},
    {label:'Utilities',rows:all.utilities||[],cols:['Date','Shift Type','Electricity Consumed Kwh','Water Consumed M3','Soda Bags Count','Soda Total Kg','Inne Bags Count','Notes']}
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

function renderEntryForm(){
  const d=today(),t=nowTime();let html='';
  if(state.entryType==='shift') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${sel('shiftType','Shift Type',['Day','Night'])}${inp('shiftStartTime','Shift Start','time')}${inp('shiftEndTime','Shift End','time')}${inp('workersCount','Workers','number')}${inp('factoryName','Factory')}${inp('factoryOwner','Owner')}${inp('consumedBalesCount','Consumed Bales','number')}${inp('averageBaleWeightKg','Avg Bale Wt (kg)','number')}${inp('producedBagsCount','Produced Bags','number')}${inp('averageBagWeightKg','Avg Bag Wt (kg)','number')}${inp('bigJumboBagsCount','Big Jumbo Bags Count','number')}${inp('smallJumboBagsCount','Small Jumbo Bags Count','number')}${inp('sacksCount','Sacks Count','number')}${inp('notes','Notes')}`;
  if(state.entryType==='receiving') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${inp('supplierName','Supplier')}${inp('region','Region')}${inp('vehicleNumber','Vehicle')}${inp('driverName','Driver')}${inp('balesCount','Bales Count','number')}${inp('pricePerTonThousand','Price / Ton (×1000)','number')}${inp('karteNumber','Karte No.')}${inp('grossWeightKg','Gross Weight (kg)','number')}${inp('tareWeightKg','Tare Weight (kg)','number')}${inp('discountPercent','Discount %','number')}${inp('notes','Notes')}`;
  if(state.entryType==='downtime') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${inp('stopFromTime','Stop From','time')}${inp('stopToTime','Stop To','time')}${inp('downtimeReason','Reason')}${inp('notes','Notes')}`;
  if(state.entryType==='waste') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${inp('sortexWeightKg','Sortex Wt (kg)','number')}${inp('sortexCount','Sortex Count','number')}${inp('bigFlexWeightKg','Green Bottle Wt (kg)','number')}${inp('bigFlexCount','Green Bottle Count','number')}${inp('wireAndBagsWeightKg','Bag & Strap Wt (kg)','number')}${inp('wireAndBagsCount','Bag & Strap Count','number')}${inp('brokenCapsLabelsWeightKg','Caps & Labels Wt (kg)','number')}${inp('brokenCapsLabelsCount','Caps & Labels Count','number')}${inp('notes','Notes')}`;
  if(state.entryType==='sale') html=`${inp('date','Date','date',d)}${inp('entryTime','Time','time',t)}${inp('buyerFactoryName','Buyer Factory')}${inp('buyerFactoryLocation','Location')}${inp('vehicleNumber','Vehicle')}${inp('driverName','Driver')}${inp('netTripWeightKg','Net Weight (kg)','number')}${inp('discountPercent','Discount %','number')}${inp('flexPricePerTonThousand','Price / Ton (×1000)','number')}${inp('notes','Notes')}`;
  if(state.entryType==='boiler') html=boilerBatchForm(d,t);
  if(state.entryType==='ph') html=phBatchForm(d,t);
  if(state.entryType==='utilities') html=utilitiesForm(d,t);
  html+=`<div class="entry-actions"><button type="button" class="btn ghost" id="cancelEntry">Cancel</button><button type="submit" class="btn primary">Save to Sheets</button></div>`;
  $('#entryForm').innerHTML=html;
  $('#cancelEntry').onclick=()=>$('#entryModal').classList.add('hidden');
  $('#entryForm').onsubmit=saveEntry;
  if(state.entryType==='boiler')wireBoilerForm();
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
  <div class="boiler-batch"><table class="boiler-table">
    <thead><tr><th>Area</th><th>PH Reading</th><th>Notes</th></tr></thead>
    <tbody>${areas.map(a=>{const v=(state.phDraft[a]||{});return `<tr><td><b>${a}</b></td><td><input data-ph-area="${a}" data-ph-field="phReading" type="number" step="0.01" min="0" max="100" placeholder="0–100" value="${v.phReading||''}"></td><td><input data-ph-area="${a}" data-ph-field="notes" type="text" placeholder="Optional…" value="${v.notes||''}"></td></tr>`;}).join('')}</tbody>
  </table></div>`;
}
function utilitiesForm(d,t){
  return `
  <label>Date<input name="date" type="date" value="${d}"></label> 
  <label>Time<input name="entryTime" type="time" value="${t}"></label>
  ${sel('shiftType','Shift Type',['Day','Night'])}
  <div class="boiler-batch" style="grid-column:1/-1">
    <table class="boiler-table">
      <thead>
        <tr><th colspan="3" style="padding:8px 0;font-size:13px;color:var(--text)">⚡ Electricity</th></tr>
      </thead>
      <tbody>
        <tr><td><b>Start Reading (kWh)</b></td><td><input name="electricityStartReading" type="number" step="0.1" placeholder="e.g. 12500"></td><td></td></tr>
        <tr><td><b>End Reading (kWh)</b></td><td><input name="electricityEndReading" type="number" step="0.1" placeholder="e.g. 12680"></td><td style="font-size:12px;color:var(--muted)">Consumed = End − Start</td></tr>
      </tbody>
      <thead>
        <tr><th colspan="3" style="padding:12px 0 8px;font-size:13px;color:var(--text)">💧 Water</th></tr>
      </thead>
      <tbody>
        <tr><td><b>Start Reading (m³)</b></td><td><input name="waterStartReading" type="number" step="0.01" placeholder="e.g. 340.5"></td><td></td></tr>
        <tr><td><b>End Reading (m³)</b></td><td><input name="waterEndReading" type="number" step="0.01" placeholder="e.g. 358.2"></td><td style="font-size:12px;color:var(--muted)">Consumed = End − Start</td></tr>
      </tbody>
      <thead>
        <tr><th colspan="3" style="padding:12px 0 8px;font-size:13px;color:var(--text)">🧴 Chemicals</th></tr>
      </thead>
      <tbody>
        <tr><td><b>Soda Bags Used</b></td><td><input name="sodaBagsCount" type="number" step="1" placeholder="Bags count"></td><td></td></tr>
        <tr><td><b>Soda kg per Bag</b></td><td><input name="sodaKgPerBag" type="number" step="0.5" placeholder="e.g. 25"></td><td style="font-size:12px;color:var(--muted)">Total = Bags × kg/Bag</td></tr>
        <tr><td><b>Inne Bags Used</b></td><td><input name="inneBagsCount" type="number" step="1" placeholder="Bags count"></td><td></td></tr>
      </tbody>
    </table>
  </div>
  <label style="grid-column:1/-1">Notes<input name="notes" type="text"></label>`;
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
  try{
    let res;
    if(state.entryType==='boiler'){
      saveBoilerDraft();
      const data={date:state.boilerDraft.date,entryTime:state.boilerDraft.entryTime,readings:[]};
      [1,2].forEach(b=>{const obj=state.boilerDraft[b]||{};Object.keys(obj).forEach(m=>{const r=obj[m];if(r.pv!==''||r.sv!==''||r.currentAmpere!=='')data.readings.push({boilerNumber:b,meterNumber:Number(m),currentTemperaturePV:r.pv,setTemperatureSV:r.sv,currentAmpere:r.currentAmpere});});});
      if(!data.readings.length)throw new Error('Enter at least one reading');
      res=await jsonp('saveBoilerBatch',{payload:JSON.stringify(data)});
    }else if(state.entryType==='ph'){
      savePHDraft();
      const areas=['Boiler','Sand Filter','Rinse Tank'];
      const readings=areas.filter(a=>state.phDraft[a]?.phReading!=='').map(a=>({date:state.phDraft.date,entryTime:state.phDraft.entryTime,area:a,phReading:state.phDraft[a]?.phReading||'',notes:state.phDraft[a]?.notes||''}));
      if(!readings.length)throw new Error('Enter at least one PH reading');
      let count=0;for(const r of readings){await jsonp('savePH',{payload:JSON.stringify(r)});count++;}
      res={count};
    }else{
      const data=Object.fromEntries(new FormData($('#entryForm')).entries());
      const action={shift:'saveShift',receiving:'saveReceiving',downtime:'saveDowntime',waste:'saveWaste',sale:'saveSale',utilities:'saveUtilities'}[state.entryType];
      res=await jsonp(action,{payload:JSON.stringify(data)});
    }
    showToast(`✓ Saved ${res.count||1} record${(res.count||1)>1?'s':''} to Google Sheets`);
    $('#entryModal').classList.add('hidden');state.boilerDraft={};state.phDraft={};
    await loadData();
  }catch(err){console.error(err);showToast('Save failed: '+err.message,'error');}
}

/* ── EXPORT ── */
function exportCsv(){
  const f=state.filtered;
  const sets={summary:f.shifts,production:f.shifts,receiving:f.receivings,sales:f.sales,quality:f.ph,boilerph:f.boilers,reports:[...f.shifts,...f.receivings,...f.downtimes,...f.boilers,...f.ph,...f.waste,...f.sales,...f.utilities]};
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
  const titles={summary:'Executive Summary',production:'Production & Yield',receiving:'Receiving',sales:'Sales & Revenue',quality:'Quality Control',boilerph:'Boiler & PH',reports:'Raw Data'};
  $('#pageTitle').textContent=tr(titles[state.page]||'Dashboard');
  const subtitle=$('#pageSubTitle'); if(subtitle) subtitle.textContent=tr('PET Flakes Washing Intelligence');
  const live=$('#liveText'); if(live) live.textContent=tr('Live from Google Sheets');
  const langBtn=$('#langBtn'); if(langBtn) langBtn.textContent=state.lang==='ar'?'EN':'AR';
  const fn={summary:renderSummary,production:renderProduction,receiving:renderReceiving,sales:renderSales,quality:renderQuality,boilerph:renderBoilerPH,reports:renderReports}[state.page]||renderSummary;
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
