const API_URL = 'https://script.google.com/macros/s/AKfycbxLnb2avucZNZtn7OZ8VFUCgEfC1tzyyM1z9RcNSHHnOASSUiB9SfXgb39pKBDeelQYQA/exec';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const today = () => new Date().toISOString().slice(0,10);
const nowTime = () => new Date().toTimeString().slice(0,5);
const n = v => Number(v || 0);
const fmt = (v, digits=0) => Number(v || 0).toLocaleString(app.lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: digits });
const pct = v => `${fmt(v, 1)}%`;
const kg = v => `${fmt(v, 0)} kg`;

const translations = {
  ar: {
    sidebarSubtitle:'لوحة تشغيل خط غسيل PET', sidebarFooter:'متصل مع Google Sheets', overview:'الملخص العام', supply:'التوريد والإنتاج', process:'التشغيل و PH والغلايات', waste:'الهالك والتوقفات',
    pageDescription:'لوحة متابعة احترافية لتشغيل خط غسيل PET Flex', entry:'إدخال', exportExcel:'تصدير Excel', fromDate:'من تاريخ', toDate:'إلى تاريخ', shift:'الوردية', all:'الكل', day:'نهار', night:'ليل', refresh:'تحديث', ready:'جاهز',
    newEntry:'إدخال بيانات جديدة', entryHelp:'اختر نوع الإدخال وسيتم رفع البيانات إلى Google Sheets.', cancel:'إلغاء', save:'حفظ', uploadOk:'تم رفع البيانات إلى Google Sheets', uploadFail:'فشل الرفع، تم حفظ البيانات محليًا مؤقتًا', clearFilter:'مسح الفلتر', activeFilter:'فلتر نشط',
  },
  en: {
    sidebarSubtitle:'PET Washing Line Dashboard', sidebarFooter:'Synced with Google Sheets', overview:'Overview', supply:'Receiving & Production', process:'Process, PH & Boilers', waste:'Waste & Downtime',
    pageDescription:'Professional PET Flex washing line operations dashboard', entry:'Entry', exportExcel:'Export Excel', fromDate:'From Date', toDate:'To Date', shift:'Shift', all:'All', day:'Day', night:'Night', refresh:'Refresh', ready:'Ready',
    newEntry:'New Data Entry', entryHelp:'Choose the entry type. Data will be uploaded to Google Sheets.', cancel:'Cancel', save:'Save', uploadOk:'Data uploaded to Google Sheets', uploadFail:'Upload failed. Data saved locally as pending.', clearFilter:'Clear filter', activeFilter:'Active filter',
  }
};

const fieldLabels = {
  date:['Date','التاريخ'], entryTime:['Time','الوقت'], shiftType:['Shift Type','الوردية'], shiftStart:['Shift Start','بداية الوردية'], shiftEnd:['Shift End','نهاية الوردية'], workersCount:['Workers Count','عدد العمالة'], factoryName:['Factory Name','اسم المصنع'], factoryOwner:['Factory Owner','اسم صاحب المصنع'], consumedBalesCount:['Consumed Bales','عدد البالات المستهلكة'], producedBagsCount:['Produced Bags','عدد الجواني المنتجة'], avgBagWeightKg:['Avg Bag Weight Kg','متوسط وزن الجونية'],
  supplierName:['Supplier Name','اسم المورد'], region:['Region','المنطقة'], vehicleNumber:['Vehicle Number','رقم السيارة'], driverName:['Driver Name','اسم السائق'], balesCount:['Bales Count','عدد البالات'], pricePerTonThousand:['Price Per Ton Thousand','سعر الطن بالألف'], karteNumber:['Karte Number','رقم الكارتة'], grossWeightKg:['Gross Weight Kg','الوزن قائم'], tareWeightKg:['Tare Weight Kg','الوزن فارغ'], discountPercent:['Discount Percent','نسبة الخصم'],
  stopFromTime:['Stop From','التوقف من'], stopToTime:['Stop To','التوقف إلى'], downtimeReason:['Downtime Reason','سبب التوقف'], notes:['Notes','ملاحظات'],
  boilerNumber:['Boiler Number','رقم الغلاية'], meterNumber:['Meter Number','رقم العداد'], currentTemperaturePv:['Current Temperature PV','الحرارة الحالية'], setTemperatureSv:['Set Temperature SV','الحرارة المطلوبة'], currentAmpere:['Current A','الأمبير'],
  area:['Area','المنطقة'], phValue:['PH Value','قراءة PH'],
  sortexWeightKg:['Sortex Weight Kg','سورتكس وزن'], sortexCount:['Sortex Count','سورتكس عدد'], bigFlexWeightKg:['Big Flex Weight Kg','بيج فليكس وزن'], bigFlexCount:['Big Flex Count','بيج فليكس عدد'], wireBagWeightKg:['Wire Bag Weight Kg','شمبر وأكياس وزن'], wireBagCount:['Wire Bag Count','شمبر وأكياس عدد'], brokenCapsLabelsWeightKg:['Broken Caps Labels Weight Kg','غطاء وليبول وزن'], brokenCapsLabelsCount:['Broken Caps Labels Count','غطاء وليبول عدد'],
  buyerFactoryName:['Buyer Factory Name','اسم المصنع المشتري'], buyerFactoryLocation:['Buyer Factory Location','مكان المصنع'], netTripWeightKg:['Net Trip Weight Kg','صافي النقلة'], flexPricePerTonThousand:['Flex Price Per Ton Thousand','سعر الطن فليكس']
};

const entryTypes = {
  saveShift: { labelAr:'بيانات وردية', labelEn:'Shift', sheet:'Shift Entries', fields:[['date','date'],['shiftType','select:Day,Night'],['shiftStart','time'],['shiftEnd','time'],['workersCount','number'],['factoryName','text'],['factoryOwner','text'],['consumedBalesCount','number'],['producedBagsCount','number'],['avgBagWeightKg','number'],['notes','text']] },
  saveReceiving: { labelAr:'توريد', labelEn:'Receiving', sheet:'Receiving Entries', fields:[['date','date'],['supplierName','text'],['region','text'],['vehicleNumber','text'],['driverName','text'],['balesCount','number'],['pricePerTonThousand','number'],['karteNumber','text'],['grossWeightKg','number'],['tareWeightKg','number'],['discountPercent','number'],['notes','text']] },
  saveDowntime: { labelAr:'توقف', labelEn:'Downtime', sheet:'Downtime Entries', fields:[['date','date'],['stopFromTime','time'],['stopToTime','time'],['downtimeReason','text'],['notes','text']] },
  saveBoiler: { labelAr:'قراءة غلاية', labelEn:'Boiler', sheet:'Boiler Readings', fields:[['date','date'],['entryTime','time'],['boilerNumber','select:1,2'],['meterNumber','select:1,2,3,4,5,6'],['currentTemperaturePv','number'],['setTemperatureSv','number'],['currentAmpere','number'],['notes','text']] },
  savePH: { labelAr:'قراءة PH', labelEn:'PH', sheet:'PH Readings', fields:[['date','date'],['entryTime','time'],['area','select:Boiler,Sand Filter,Rinse Tank'],['phValue','number'],['notes','text']] },
  saveWaste: { labelAr:'هالك', labelEn:'Waste', sheet:'Waste Entries', fields:[['date','date'],['sortexWeightKg','number'],['sortexCount','number'],['bigFlexWeightKg','number'],['bigFlexCount','number'],['wireBagWeightKg','number'],['wireBagCount','number'],['brokenCapsLabelsWeightKg','number'],['brokenCapsLabelsCount','number'],['notes','text']] },
  saveSale: { labelAr:'بيع', labelEn:'Sales', sheet:'Sales Entries', fields:[['date','date'],['buyerFactoryName','text'],['buyerFactoryLocation','text'],['vehicleNumber','text'],['driverName','text'],['netTripWeightKg','number'],['discountPercent','number'],['flexPricePerTonThousand','number'],['notes','text']] }
};

// Demo data removed. Dashboard now reads live data from Google Sheets only.
function emptyData(){
  return {shifts:[], receivings:[], downtimes:[], boilers:[], ph:[], waste:[], sales:[]};
}

const SHEET_KEY_MAP = {
  'Record ID':'id', 'Shift ID':'shiftId', 'Date':'date', 'Entry Time':'entryTime', 'Saved At':'savedAt', 'Notes':'notes',
  'Shift Type':'shiftType', 'Shift Start Time':'shiftStart', 'Shift End Time':'shiftEnd', 'Workers Count':'workersCount', 'Factory Name':'factoryName', 'Factory Owner':'factoryOwner', 'Consumed Bales Count':'consumedBalesCount', 'Average Bale Weight Kg':'avgBaleWeightKg', 'Consumed Weight Kg':'consumedWeightKg', 'Produced Bags Count':'producedBagsCount', 'Average Bag Weight Kg':'avgBagWeightKg', 'Net Production Kg':'netProductionKg', 'Material Yield Percent':'materialYieldPercent', 'Operation Yield Percent':'operationYieldPercent', 'Actual Yield Percent':'actualYieldPercent', 'Waste Percent':'wastePercent', 'Actual Loss Kg':'actualLossKg', 'Actual Loss Percent':'actualLossPercent',
  'Supplier Name':'supplierName', 'Region':'region', 'Vehicle Number':'vehicleNumber', 'Driver Name':'driverName', 'Bales Count':'balesCount', 'Price Per Ton Thousand':'pricePerTonThousand', 'Karte Number':'karteNumber', 'Gross Weight Kg':'grossWeightKg', 'Tare Weight Kg':'tareWeightKg', 'Net Weight Kg':'netWeightKg', 'Discount Percent':'discountPercent', 'Discount Weight Kg':'discountWeightKg', 'Net Weight After Discount Kg':'netWeightAfterDiscountKg', 'Trip Price Before Discount':'tripPriceBeforeDiscount', 'Trip Price After Discount':'tripPriceAfterDiscount', 'Price Difference':'priceDifference',
  'Stop From Time':'stopFromTime', 'Stop To Time':'stopToTime', 'Downtime Minutes':'downtimeMinutes', 'Downtime Reason':'downtimeReason',
  'Boiler Number':'boilerNumber', 'Meter Number':'meterNumber', 'Current Temperature PV':'currentTemperaturePv', 'Set Temperature SV':'setTemperatureSv', 'Temperature Difference':'temperatureDifference', 'Current Ampere':'currentAmpere',
  'Area':'area', 'PH Reading':'phValue', 'PH Value':'phValue', 'PH Status':'phStatus',
  'Sortex Weight Kg':'sortexWeightKg', 'Sortex Count':'sortexCount', 'Big Flex Weight Kg':'bigFlexWeightKg', 'Big Flex Count':'bigFlexCount', 'Wire And Bags Weight Kg':'wireBagWeightKg', 'Wire And Bags Count':'wireBagCount', 'Broken Caps Labels Weight Kg':'brokenCapsLabelsWeightKg', 'Broken Caps Labels Count':'brokenCapsLabelsCount', 'Total Waste Weight Kg':'totalWasteWeightKg', 'Total Waste Count':'totalWasteCount',
  'Buyer Factory Name':'buyerFactoryName', 'Buyer Factory Location':'buyerFactoryLocation', 'Net Trip Weight Kg':'netTripWeightKg', 'Flex Price Per Ton Thousand':'flexPricePerTonThousand', 'Sale Price Before Discount':'salePriceBeforeDiscount', 'Sale Price After Discount':'salePriceAfterDiscount'
};
function normalizeRow(row){
  const out={};
  Object.entries(row||{}).forEach(([k,v])=>{
    const nk = SHEET_KEY_MAP[k] || k;
    out[nk] = v;
  });
  return out;
}
function normalizeRows(rows){ return Array.isArray(rows) ? rows.map(normalizeRow) : []; }

const app = {
  lang: localStorage.getItem('flakes_lang') || 'en',
  theme: localStorage.getItem('flakes_theme') || 'light',
  page: 'overview',
  charts: {},
  data: emptyData(),
  activeEntry: 'saveShift',
  activeFilter: null
};

function t(key){ return translations[app.lang][key] || key; }
function setStatus(type, text){
  const dot = $('#syncStatus .dot'); dot.className = 'dot' + (type ? ' ' + type : '');
  $('#syncStatus span:last-child').textContent = text || t('ready');
}
function updateBrandLogo(){
  const img = $('.brand-logo');
  if(!img) return;
  img.src = app.theme === 'dark' ? (img.dataset.darkLogo || img.src) : (img.dataset.lightLogo || img.src);
}
function toast(msg, type='success'){
  const el = $('#toast'); el.className = `toast show ${type}`; el.textContent = msg;
  setTimeout(()=> el.className = 'toast', 4200);
}
function saveLocal(){ localStorage.setItem('flakes_data', JSON.stringify(app.data)); }

function init(){
  document.body.classList.toggle('dark', app.theme === 'dark');
  updateBrandLogo();
  document.documentElement.lang = app.lang;
  document.documentElement.dir = app.lang === 'ar' ? 'rtl' : 'ltr';
  $('#dateFrom').value = today().slice(0,8)+'01'; $('#dateTo').value = today();
  setupFilterChip(); bindEvents(); applyI18n(); renderAll(); loadFromApi();
}


function setupFilterChip(){
  if($('#activeFilterChip')) return;
  const host = $('.filters-card');
  const chip = document.createElement('div');
  chip.id = 'activeFilterChip';
  chip.className = 'active-filter-chip hidden';
  chip.innerHTML = `<span></span><button type="button" id="clearDrillFilter">×</button>`;
  host.appendChild(chip);
  $('#clearDrillFilter').onclick = () => { app.activeFilter = null; renderAll(); toast(app.lang==='ar'?'تم مسح الفلتر':'Filter cleared','success'); };
}
function renderActiveFilter(){
  const chip = $('#activeFilterChip');
  if(!chip) return;
  if(!app.activeFilter){ chip.classList.add('hidden'); return; }
  chip.classList.remove('hidden');
  chip.querySelector('span').textContent = `${t('activeFilter')}: ${app.activeFilter.label}`;
}
function applyDrillFilter(filter){
  if(!filter || !filter.type) return;
  app.activeFilter = filter;
  renderAll();
  toast(`${t('activeFilter')}: ${filter.label}`, 'success');
}

function bindEvents(){
  $$('.nav-item').forEach(btn => btn.onclick = () => setPage(btn.dataset.page));
  $('#toggleSidebar').onclick = () => $('#sidebar').classList.toggle('collapsed');
  $('#themeBtn').onclick = () => { app.theme = app.theme === 'dark' ? 'light':'dark'; localStorage.setItem('flakes_theme', app.theme); document.body.classList.toggle('dark', app.theme === 'dark'); $('#themeBtn').textContent = app.theme === 'dark' ? '☀️':'🌙'; updateBrandLogo(); renderAll(); };
  $('#languageBtn').onclick = () => { app.lang = app.lang === 'ar' ? 'en':'ar'; localStorage.setItem('flakes_lang', app.lang); document.documentElement.lang=app.lang; document.documentElement.dir=app.lang==='ar'?'rtl':'ltr'; applyI18n(); renderAll(); };
  $('#openEntryBtn').onclick = openEntryModal;
  $('#closeEntry').onclick = closeEntryModal; $('#cancelEntry').onclick = closeEntryModal;
  $('#saveEntry').onclick = saveEntry;
  $('#refreshBtn').onclick = () => { renderAll(); loadFromApi(); };
  $('#exportBtn').onclick = exportCurrentPage;
  ['dateFrom','dateTo','shiftFilter'].forEach(id => $('#'+id).onchange = renderAll);
}
function applyI18n(){
  $$('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  $('#themeBtn').textContent = app.theme === 'dark' ? '☀️':'🌙';
  $('#pageTitle').textContent = t(app.page);
}
function setPage(page){ app.page=page; $$('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.page===page)); $$('.page').forEach(p=>p.classList.toggle('active-page', p.id===page)); $('#pageTitle').textContent=t(page); renderAll(); }

function filtered(){
  const from=$('#dateFrom').value, to=$('#dateTo').value, shift=$('#shiftFilter').value;
  const pass = (row,key) => {
    const rowDate = String(row.date||row.Date||'');
    const rowShift = row.shiftType || row['Shift Type'] || '';
    const base = (!from || rowDate >= from) && (!to || rowDate <= to) && (shift==='all' || rowShift===shift || !rowShift);
    return base && drillPass(row,key);
  };
  return Object.fromEntries(Object.entries(app.data).map(([k,v])=>[k,(v||[]).filter(row=>pass(row,k))]));
}
function drillPass(row, key){
  const f = app.activeFilter;
  if(!f) return true;
  if(f.type === 'dateShift'){
    const rowDate = String(row.date||row.Date||'');
    const rowShift = row.shiftType || row['Shift Type'] || '';
    return (!f.date || rowDate === f.date) && (!f.shift || rowShift === f.shift || !rowShift);
  }
  if(f.type === 'supplier') return key !== 'receivings' || String(row.supplierName||'Unknown') === f.value;
  if(f.type === 'region') return key !== 'receivings' || String(row.region||'Unknown') === f.value;
  if(f.type === 'phArea') return key !== 'ph' || String(row.area||'Unknown') === f.value;
  if(f.type === 'downtimeReason') return key !== 'downtimes' || String(row.downtimeReason||'Unknown') === f.value;
  if(f.type === 'boilerMeter') return key !== 'boilers' || (`B${row.boilerNumber}-M${row.meterNumber}` === f.value);
  if(f.type === 'wasteType') return key !== 'waste' || n(row[f.field]) > 0;
  return true;
}
function metrics(){
  const d=filtered();
  const receivingAfter=d.receivings.reduce((s,r)=>s+n(r.netWeightAfterDiscountKg||r['Net Weight After Discount Kg']),0);
  const receivingNet=d.receivings.reduce((s,r)=>s+n(r.netWeightKg||r['Net Weight Kg']),0);
  const bales=d.receivings.reduce((s,r)=>s+n(r.balesCount||r['Bales Count']),0);
  const avgBale=bales?receivingNet/bales:0;
  const consumedBales=d.shifts.reduce((s,r)=>s+n(r.consumedBalesCount||r['Consumed Bales Count']),0);
  const consumedWeight=consumedBales*avgBale;
  const production=d.shifts.reduce((s,r)=>s+n(r.netProductionKg||r['Net Production Kg']||(n(r.producedBagsCount)*n(r.avgBagWeightKg))),0);
  const bags=d.shifts.reduce((s,r)=>s+n(r.producedBagsCount||r['Produced Bags Count']),0);
  const avgBag=bags?production/bags:0;
  const waste=d.waste.reduce((s,r)=>s+n(r.totalWasteWeightKg||r['Total Waste Weight Kg']||n(r.sortexWeightKg)+n(r.bigFlexWeightKg)+n(r.wireBagWeightKg)+n(r.brokenCapsLabelsWeightKg)),0);
  const downtime=d.downtimes.reduce((s,r)=>s+n(r.downtimeMinutes||r['Downtime Minutes']),0);
  const avgPH=avg(d.ph.map(r=>n(r.phValue||r['PH Value'])));
  const avgPV=avg(d.boilers.map(r=>n(r.currentTemperaturePv||r['Current Temperature PV'])));
  const avgSV=avg(d.boilers.map(r=>n(r.setTemperatureSv||r['Set Temperature SV'])));
  const actualLoss=consumedWeight-(production+waste);
  const salesWeight=d.sales.reduce((s,r)=>s+n(r.netTripWeightKg||r['Net Trip Weight Kg']),0);
  const salesAfter=d.sales.reduce((s,r)=>s+n(r.salePriceAfterDiscount||r['Sale Price After Discount']),0);
  return {receivingAfter, receivingNet, bales, avgBale, consumedBales, consumedWeight, production, bags, avgBag, waste, downtime, avgPH, avgPV, avgSV, diffPVSV: avgPV-avgSV, materialYield: ratio(production, consumedWeight), operationYield: ratio(production, receivingAfter), actualYield: ratio(production, production+waste), wastePercent: ratio(waste, consumedWeight), actualLoss, actualLossPercent: ratio(actualLoss, consumedWeight), salesWeight, salesAfter, shifts:d.shifts.length, receivings:d.receivings.length};
}
const avg = arr => arr.filter(Boolean).length ? arr.filter(Boolean).reduce((a,b)=>a+b,0)/arr.filter(Boolean).length : 0;
const ratio = (a,b) => b ? (a/b*100) : 0;

function renderAll(){
  const renderers = {overview:renderOverview, supply:renderSupply, process:renderProcess, waste:renderWaste};
  renderers[app.page]();
  renderActiveFilter();
  bindTableDrillRows();
}
function kpi(label, value, sub='', cls='') { return `<article class="kpi-card"><div class="kpi-label">${label}</div><div class="kpi-value ${cls}">${value}</div><div class="kpi-sub">${sub}</div></article>`; }
function panel(title, content) { return `<div class="panel"><h3>${title}</h3>${content}</div>`; }
function chart(id){ return `<div class="chart-wrap"><canvas id="${id}"></canvas></div>`; }
function table(rows, cols){
  if(!rows || !rows.length) return `<div class="empty-state">${app.lang==='ar'?'لا توجد بيانات حتى الآن':'No data yet'}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr class="interactive-row" data-date="${escAttr(r.date||'')}" data-shift="${escAttr(r.shiftType||'')}" data-label="${escAttr(rowLabel(r))}">${cols.map(c=>`<td>${formatCell(r[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function escAttr(v){ return String(v ?? '').replace(/"/g,'&quot;'); }
function rowLabel(r){ return r.supplierName || r.buyerFactoryName || r.downtimeReason || r.area || r.vehicleNumber || r.shiftType || r.date || 'Row'; }
function bindTableDrillRows(){
  $$('.interactive-row').forEach(row => row.onclick = () => {
    const date = row.dataset.date;
    const shift = row.dataset.shift;
    if(date || shift) applyDrillFilter({type:'dateShift', date, shift, label:`${date || ''}${shift ? ' / ' + shift : ''}`});
  });
}
function formatCell(v){ if(typeof v === 'number') return fmt(v, v%1?2:0); return v ?? ''; }

function renderOverview(){
  const m=metrics(), d=filtered();
  $('#overview').innerHTML = `<div class="kpi-grid">
    ${kpi('Total Receiving After Discount', kg(m.receivingAfter), `${m.receivings} trips`)}
    ${kpi('Consumed Weight', kg(m.consumedWeight), `${fmt(m.consumedBales)} bales × ${fmt(m.avgBale,1)} kg`)}
    ${kpi('Net Production', kg(m.production), `${fmt(m.bags)} bags | avg ${fmt(m.avgBag,1)} kg`)}
    ${kpi('Total Waste', kg(m.waste), `${pct(m.wastePercent)} of consumed`)}
    ${kpi('Actual Loss', kg(m.actualLoss), `${pct(m.actualLossPercent)} of consumed`, m.actualLoss>0?'':'kpi-trend')}
    ${kpi('Material Yield', pct(m.materialYield), 'Production / consumed weight')}
    ${kpi('Operation Yield', pct(m.operationYield), 'Production / receiving after discount')}
    ${kpi('Actual Yield', pct(m.actualYield), 'Production / production + waste')}
    ${kpi('Downtime', `${fmt(m.downtime)} min`, `${fmt(d.downtimes.length)} stops`)}
    ${kpi('Average PH', fmt(m.avgPH,2), `PV ${fmt(m.avgPV,1)}°C | Δ ${fmt(m.diffPVSV,1)}`)}
  </div>
  <div class="grid-2">${panel('Production vs Consumption', chart('overviewBar'))}${panel('Yield Comparison', chart('overviewYield'))}</div>
  <div class="grid-2">${panel('Waste Distribution', chart('overviewWaste'))}${panel('Shift Summary Table', table(shiftSummaryRows(), [['date','Date'],['shiftType','Shift'],['receivingAfter','Receiving After Discount'],['consumedWeight','Consumed'],['production','Production'],['waste','Waste'],['actualLoss','Actual Loss'],['materialYield','Material Yield %'],['operationYield','Operation Yield %'],['actualYield','Actual Yield %']]))}</div>`;
  makeBar('overviewBar', ['Consumed','Production','Waste','Actual Loss'], [m.consumedWeight,m.production,m.waste,m.actualLoss], {type:'metric'});
  makeLine('overviewYield', ['Material','Operation','Actual'], [m.materialYield,m.operationYield,m.actualYield], {type:'metric', percent:true});
  makeDoughnut('overviewWaste', ['Sortex','Big Flex','Wire & Bag','Caps & Labels'], wasteTotals(d.waste), {type:'wasteType'});
}
function shiftSummaryRows(){
  const d=filtered();
  return d.shifts.map(s=>{
    const rec=d.receivings.filter(r=>!s.shiftType || !r.shiftType || r.shiftType===s.shiftType); const was=d.waste.filter(r=>!s.shiftType || !r.shiftType || r.shiftType===s.shiftType);
    const receivingAfter=rec.reduce((a,r)=>a+n(r.netWeightAfterDiscountKg),0); const bales=rec.reduce((a,r)=>a+n(r.balesCount),0); const net=rec.reduce((a,r)=>a+n(r.netWeightKg),0); const avgBale=bales?net/bales:0;
    const consumedWeight=n(s.consumedBalesCount)*avgBale; const production=n(s.netProductionKg)||(n(s.producedBagsCount)*n(s.avgBagWeightKg)); const waste=was.reduce((a,r)=>a+n(r.totalWasteWeightKg),0); const actualLoss=consumedWeight-(production+waste);
    return {date:s.date, shiftType:s.shiftType, receivingAfter, consumedWeight, production, waste, actualLoss, materialYield:pct(ratio(production,consumedWeight)), operationYield:pct(ratio(production,receivingAfter)), actualYield:pct(ratio(production,production+waste))};
  });
}
function renderSupply(){
  const m=metrics(), d=filtered();
  $('#supply').innerHTML = `<div class="kpi-grid">
    ${kpi('Trips Count', fmt(d.receivings.length), 'Receiving trips')}${kpi('Received Bales', fmt(m.bales), 'Total bales')}${kpi('Net Weight', kg(m.receivingNet), 'Before discount')}${kpi('After Discount', kg(m.receivingAfter), 'Accepted raw material')}${kpi('Avg Bale Weight', kg(m.avgBale), 'Net / bales')}
    ${kpi('Net Production', kg(m.production), 'Output')}${kpi('Produced Bags', fmt(m.bags), 'Bags / sacks')}${kpi('Avg Bag Weight', kg(m.avgBag), 'Production / bags')}${kpi('Sales Weight', kg(m.salesWeight), 'Outgoing flakes')}${kpi('Sales Value', fmt(m.salesAfter,0), 'After discount')}
  </div>
  <div class="grid-2">${panel('Receiving by Supplier', chart('supSupplier'))}${panel('Before vs After Discount', chart('supDiscount'))}</div>
  <div class="grid-2">${panel('Receiving Table', table(d.receivings, [['date','Date'],['supplierName','Supplier'],['region','Region'],['vehicleNumber','Vehicle'],['driverName','Driver'],['balesCount','Bales'],['netWeightKg','Net Kg'],['discountPercent','Discount %'],['netWeightAfterDiscountKg','After Discount'],['pricePerTonThousand','Price/Ton'],['tripPriceAfterDiscount','Trip Price']]))}${panel('Sales Table', table(d.sales, [['date','Date'],['buyerFactoryName','Buyer Factory'],['buyerFactoryLocation','Location'],['vehicleNumber','Vehicle'],['driverName','Driver'],['netTripWeightKg','Net Trip Kg'],['discountPercent','Discount %'],['flexPricePerTonThousand','Flex Price/Ton'],['salePriceBeforeDiscount','Before Discount'],['salePriceAfterDiscount','After Discount'],['priceDifference','Difference']]))}</div>`;
  makeBar('supSupplier', groupSum(d.receivings,'supplierName','netWeightAfterDiscountKg').labels, groupSum(d.receivings,'supplierName','netWeightAfterDiscountKg').values, {type:'supplier'});
  makeBar('supDiscount', ['Before Discount Kg','After Discount Kg'], [m.receivingNet,m.receivingAfter], {type:'metric'});
}
function renderProcess(){
  const m=metrics(), d=filtered();
  $('#process').innerHTML = `<div class="kpi-grid">
    ${kpi('Average PH', fmt(m.avgPH,2), 'All areas')}${kpi('Boiler 1 PV', fmt(avg(d.boilers.filter(b=>n(b.boilerNumber)===1).map(b=>n(b.currentTemperaturePv))),1)+'°C','Current temperature')}${kpi('Boiler 2 PV', fmt(avg(d.boilers.filter(b=>n(b.boilerNumber)===2).map(b=>n(b.currentTemperaturePv))),1)+'°C','Current temperature')}${kpi('Avg SV', fmt(m.avgSV,1)+'°C','Set temperature')}${kpi('Avg Current', fmt(avg(d.boilers.map(b=>n(b.currentAmpere))),1)+' A','Electrical current')}
  </div>
  <div class="grid-2">${panel('PH by Area', chart('phArea'))}${panel('Boiler PV / SV', chart('boilerPvSv'))}</div>
  <div class="grid-2">${panel('Boiler Readings', table(d.boilers, [['date','Date'],['entryTime','Time'],['boilerNumber','Boiler'],['meterNumber','Meter'],['currentTemperaturePv','PV'],['setTemperatureSv','SV'],['temperatureDifference','Diff'],['currentAmpere','Current A']]))}${panel('PH Readings', table(d.ph, [['date','Date'],['entryTime','Time'],['area','Area'],['phValue','PH Value']]))}</div>`;
  const phg=groupAvg(d.ph,'area','phValue'); makeBar('phArea', phg.labels, phg.values, {type:'phArea'});
  makeGrouped('boilerPvSv', d.boilers.map((b,i)=>`B${b.boilerNumber}-M${b.meterNumber}`), [d.boilers.map(b=>n(b.currentTemperaturePv)), d.boilers.map(b=>n(b.setTemperatureSv))], ['PV','SV'], {type:'boilerMeter'});
}
function renderWaste(){
  const m=metrics(), d=filtered();
  const wt=wasteTotals(d.waste); const reason=groupSum(d.downtimes,'downtimeReason','downtimeMinutes');
  $('#waste').innerHTML = `<div class="kpi-grid">
    ${kpi('Total Waste', kg(m.waste), `${pct(m.wastePercent)} of consumed`)}${kpi('Sortex', kg(wt[0]), 'Weight')}${kpi('Big Flex', kg(wt[1]), 'Weight')}${kpi('Wire & Bag', kg(wt[2]), 'Weight')}${kpi('Caps & Labels', kg(wt[3]), 'Weight')}
    ${kpi('Actual Loss', kg(m.actualLoss), pct(m.actualLossPercent))}${kpi('Downtime Minutes', fmt(m.downtime), 'Total stop time')}${kpi('Stops Count', fmt(d.downtimes.length), 'Records')}${kpi('Avg Stop', fmt(d.downtimes.length?m.downtime/d.downtimes.length:0,1)+' min', 'Average')}${kpi('Operation Loss Time', pct(ratio(m.downtime, 720)), 'Assuming 12h shift')}
  </div>
  <div class="grid-2">${panel('Waste by Type', chart('wasteType'))}${panel('Downtime by Reason', chart('downReason'))}</div>
  <div class="grid-2">${panel('Waste Table', table(d.waste, [['date','Date'],['sortexWeightKg','Sortex Kg'],['sortexCount','Sortex Count'],['bigFlexWeightKg','Big Flex Kg'],['bigFlexCount','Big Flex Count'],['wireBagWeightKg','Wire Bag Kg'],['wireBagCount','Wire Bag Count'],['brokenCapsLabelsWeightKg','Caps Labels Kg'],['brokenCapsLabelsCount','Caps Labels Count'],['totalWasteWeightKg','Total Waste Kg']]))}${panel('Downtime Table', table(d.downtimes, [['date','Date'],['stopFromTime','From'],['stopToTime','To'],['downtimeMinutes','Minutes'],['downtimeReason','Reason'],['notes','Notes']]))}</div>`;
  makeDoughnut('wasteType', ['Sortex','Big Flex','Wire & Bag','Caps & Labels'], wt, {type:'wasteType'});
  makeBar('downReason', reason.labels, reason.values, {type:'downtimeReason'});
}

function wasteTotals(rows){ return ['sortexWeightKg','bigFlexWeightKg','wireBagWeightKg','brokenCapsLabelsWeightKg'].map(k=>rows.reduce((s,r)=>s+n(r[k]),0)); }
function groupSum(rows, key, val){ const m={}; rows.forEach(r=>m[r[key]||'Unknown']=(m[r[key]||'Unknown']||0)+n(r[val])); return {labels:Object.keys(m), values:Object.values(m)}; }
function groupAvg(rows,key,val){ const m={}; rows.forEach(r=>{const k=r[key]||'Unknown'; m[k]=m[k]||[]; m[k].push(n(r[val]));}); return {labels:Object.keys(m), values:Object.values(m).map(avg)}; }

function chartColors(){ return ['#00a94f','#5cff6d','#0ea5e9','#f59e0b','#ef4444','#8b5cf6']; }

const valueLabelPlugin = {
  id: 'valueLabelPlugin',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const {ctx, data} = chart;
    const type = chart.config.type;
    const locale = app.lang === 'ar' ? 'ar-EG' : 'en-US';
    ctx.save();
    ctx.font = '700 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const raw = Number(dataset.data[index] || 0);
        if (!raw || !isFinite(raw)) return;
        const label = pluginOptions?.percent ? `${raw.toLocaleString(locale, {maximumFractionDigits:1})}%` : raw.toLocaleString(locale, {maximumFractionDigits: raw % 1 ? 1 : 0});
        const pos = element.tooltipPosition();
        let x = pos.x, y = pos.y;
        if (type === 'bar') y -= 12;
        if (type === 'line') y -= 16;
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#0f172a';
        if (type === 'doughnut') {
          ctx.fillStyle = '#ffffff';
          const total = dataset.data.reduce((a,b)=>a+Number(b||0),0);
          const percent = total ? raw / total * 100 : 0;
          ctx.fillText(`${percent.toLocaleString(locale,{maximumFractionDigits:1})}%`, x, y);
        } else {
          ctx.fillText(label, x, y);
        }
      });
    });
    ctx.restore();
  }
};
if (window.Chart && !Chart.registry.plugins.get('valueLabelPlugin')) Chart.register(valueLabelPlugin);

function destroy(id){ if(app.charts[id]) app.charts[id].destroy(); }
function normalizeChartData(values){ return (values || []).map(v => Number(v || 0)); }
function makeBar(id, labels, values, meta={}){
  destroy(id);
  const clean = normalizeChartData(values);
  app.charts[id]=new Chart($('#'+id),{type:'bar',data:{labels,datasets:[{label:'Value',data:clean,backgroundColor:chartColors(),borderRadius:12,borderSkipped:false}]},options:baseOpts({percent:false, ...meta})});
}
function makeLine(id, labels, values, meta={}){
  destroy(id);
  const clean = normalizeChartData(values);
  app.charts[id]=new Chart($('#'+id),{type:'line',data:{labels,datasets:[{label:'%',data:clean,borderColor:'#00e676',backgroundColor:'rgba(0,230,118,.12)',tension:.35,fill:true,pointRadius:4,pointHoverRadius:7}]},options:baseOpts({percent:true, ...meta})});
}
function makeDoughnut(id, labels, values, meta={}){
  destroy(id);
  const clean = normalizeChartData(values);
  app.charts[id]=new Chart($('#'+id),{type:'doughnut',data:{labels,datasets:[{data:clean,backgroundColor:chartColors(),borderWidth:2}]},options:{...baseOpts({percent:false, circular:true, ...meta}), cutout:'62%'}});
}
function makeGrouped(id, labels, arrays, dsLabels, meta={}){
  destroy(id);
  app.charts[id]=new Chart($('#'+id),{type:'line',data:{labels,datasets:arrays.map((a,i)=>({label:dsLabels[i],data:normalizeChartData(a),borderColor:chartColors()[i],backgroundColor:'transparent',tension:.35,pointRadius:4,pointHoverRadius:7}))},options:baseOpts({percent:false, ...meta})});
}

function applyChartDrill(flags, label, value){
  const suffix = flags.percent ? '%' : '';
  if(flags.type === 'supplier') return applyDrillFilter({type:'supplier', value:label, label:`Supplier: ${label}`});
  if(flags.type === 'phArea') return applyDrillFilter({type:'phArea', value:label, label:`PH Area: ${label}`});
  if(flags.type === 'downtimeReason') return applyDrillFilter({type:'downtimeReason', value:label, label:`Downtime: ${label}`});
  if(flags.type === 'boilerMeter') return applyDrillFilter({type:'boilerMeter', value:label, label:`Boiler Meter: ${label}`});
  if(flags.type === 'wasteType'){
    const map = {'Sortex':'sortexWeightKg','Big Flex':'bigFlexWeightKg','Wire & Bag':'wireBagWeightKg','Caps & Labels':'brokenCapsLabelsWeightKg'};
    return applyDrillFilter({type:'wasteType', value:label, field:map[label]||'totalWasteWeightKg', label:`Waste Type: ${label}`});
  }
  toast(`${label}: ${fmt(value, value%1?1:0)}${suffix}`,'success');
}

function baseOpts(flags={}){
  const textColor = getComputedStyle(document.body).getPropertyValue('--text');
  const mutedColor = getComputedStyle(document.body).getPropertyValue('--muted');
  return {
    responsive:true,
    maintainAspectRatio:false,
    interaction:{mode:'nearest', intersect:true},
    onClick:(evt,elements,chart)=>{
      if(!elements.length) return;
      const el=elements[0];
      const label=String(chart.data.labels[el.index]);
      const value=chart.data.datasets[el.datasetIndex].data[el.index];
      applyChartDrill(flags, label, value);
    },
    plugins:{
      legend:{labels:{color:textColor}},
      tooltip:{enabled:true, callbacks:{label:(ctx)=>`${ctx.dataset.label || ctx.label}: ${fmt(ctx.raw, ctx.raw%1?1:0)}${flags.percent?'%':''}`}},
      valueLabelPlugin:{percent:!!flags.percent}
    },
    scales: flags.circular ? {} : {
      x:{ticks:{color:mutedColor},grid:{color:'rgba(128,128,128,.12)'}},
      y:{ticks:{color:mutedColor},grid:{color:'rgba(128,128,128,.12)'}, beginAtZero:true}
    }
  };
}

function openEntryModal(){ buildEntryTabs(); buildForm(); $('#entryModal').classList.add('open'); }
function closeEntryModal(){ $('#entryModal').classList.remove('open'); $('#formResult').textContent=''; }
function buildEntryTabs(){ $('#entryTabs').innerHTML = Object.entries(entryTypes).map(([k,e])=>`<button type="button" class="entry-tab ${k===app.activeEntry?'active':''}" data-type="${k}">${app.lang==='ar'?e.labelAr:e.labelEn}</button>`).join(''); $$('.entry-tab').forEach(b=>b.onclick=()=>{app.activeEntry=b.dataset.type; buildEntryTabs(); buildForm();}); }
function buildForm(){
  const cfg=entryTypes[app.activeEntry];
  $('#entryForm').innerHTML = cfg.fields.map(([name,type])=>fieldHtml(name,type)).join('');
  $$('[name=date]').forEach(i=>i.value=today()); $$('[name=entryTime]').forEach(i=>i.value=nowTime());
}
function fieldHtml(name,type){
  const label=(fieldLabels[name]||[name,name])[app.lang==='ar'?1:0];
  if(type.startsWith('select:')) return `<label class="form-field"><span>${label}</span><select name="${name}">${type.split(':')[1].split(',').map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label>`;
  return `<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" ${type==='number'?'step="any"':''}></label>`;
}
async function saveEntry(){
  const data={}; new FormData($('#entryForm')).forEach((v,k)=>data[k]=v);
  Object.keys(data).forEach(k=>{ if(data[k]!=='' && !isNaN(data[k]) && !['vehicleNumber','karteNumber','driverName','factoryName','factoryOwner','supplierName','region','buyerFactoryName','buyerFactoryLocation','downtimeReason','notes','area'].includes(k)) data[k]=Number(data[k]); });
  enrich(app.activeEntry, data);
  setStatus('loading','Uploading...'); $('#saveEntry').disabled=true;
  try{
    const res = await fetch(API_URL, {method:'POST', mode:'cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action: app.activeEntry, data})});
    const text = await res.text();
    let json; try{ json=JSON.parse(text); }catch{ json={success:res.ok, raw:text}; }
    if(!res.ok || json.success===false) throw new Error(json.message || text || 'Upload failed');
    addLocal(app.activeEntry, data, json.recordId || json.id);
    setStatus('', t('uploadOk')); toast(t('uploadOk'), 'success'); $('#formResult').textContent = `${t('uploadOk')} ✓ ${json.recordId || ''}`; closeEntryModal(); await loadFromApi();
  }catch(err){
    addLocal(app.activeEntry, data); queuePending(app.activeEntry, data); setStatus('error','Upload failed'); toast(t('uploadFail'), 'error'); $('#formResult').textContent = err.message;
  } finally { $('#saveEntry').disabled=false; }
}
function enrich(action,data){
  data.id = data.id || `FLK-${Date.now()}`; data.savedAt = new Date().toISOString();
  if(action==='saveReceiving'){
    data.netWeightKg = n(data.grossWeightKg)-n(data.tareWeightKg); data.discountWeightKg=data.netWeightKg*n(data.discountPercent)/100; data.netWeightAfterDiscountKg=data.netWeightKg-data.discountWeightKg; data.tripPriceBeforeDiscount=data.netWeightKg/1000*n(data.pricePerTonThousand)*1000; data.tripPriceAfterDiscount=data.netWeightAfterDiscountKg/1000*n(data.pricePerTonThousand)*1000; data.avgBaleWeightKg=n(data.balesCount)?data.netWeightKg/n(data.balesCount):0;
  }
  if(action==='saveDowntime') data.downtimeMinutes = minutesBetween(data.stopFromTime,data.stopToTime);
  if(action==='saveBoiler') data.temperatureDifference = n(data.currentTemperaturePv)-n(data.setTemperatureSv);
  if(action==='saveWaste') { data.totalWasteWeightKg=n(data.sortexWeightKg)+n(data.bigFlexWeightKg)+n(data.wireBagWeightKg)+n(data.brokenCapsLabelsWeightKg); data.totalWasteCount=n(data.sortexCount)+n(data.bigFlexCount)+n(data.wireBagCount)+n(data.brokenCapsLabelsCount); }
  if(action==='saveSale') { data.discountWeightKg=n(data.netTripWeightKg)*n(data.discountPercent)/100; data.netWeightAfterDiscountKg=n(data.netTripWeightKg)-data.discountWeightKg; data.salePriceBeforeDiscount=n(data.netTripWeightKg)/1000*n(data.flexPricePerTonThousand)*1000; data.salePriceAfterDiscount=data.netWeightAfterDiscountKg/1000*n(data.flexPricePerTonThousand)*1000; data.priceDifference=data.salePriceBeforeDiscount-data.salePriceAfterDiscount; }
  if(action==='saveShift') data.netProductionKg=n(data.producedBagsCount)*n(data.avgBagWeightKg);
}
function minutesBetween(a,b){ if(!a||!b) return 0; const [ah,am]=a.split(':').map(Number), [bh,bm]=b.split(':').map(Number); let s=ah*60+am, e=bh*60+bm; if(e<s)e+=1440; return e-s; }
function addLocal(action,data,id){ const map={saveShift:'shifts',saveReceiving:'receivings',saveDowntime:'downtimes',saveBoiler:'boilers',savePH:'ph',saveWaste:'waste',saveSale:'sales'}; app.data[map[action]].push({...data, id:id||data.id}); saveLocal(); }
function queuePending(action,data){ const q=JSON.parse(localStorage.getItem('flakes_pending')||'[]'); q.push({action,data,createdAt:new Date().toISOString()}); localStorage.setItem('flakes_pending',JSON.stringify(q)); }
async function loadFromApi(){
  try{
    setStatus('loading','Loading...');
    const res=await fetch(`${API_URL}?action=getAll&ts=${Date.now()}`); const text=await res.text(); const json=JSON.parse(text);
    const payload=json.data || json;
    if(payload && (payload.shifts || payload.receivings || payload['Shift Entries'])){
      app.data = normalizePayload(payload); saveLocal(); renderAll(); setStatus('', t('ready'));
    } else { app.data = emptyData(); renderAll(); setStatus('', 'No data yet'); }
  }catch(err){ console.warn('Google Sheets load failed', err); app.data = emptyData(); renderAll(); setStatus('error', 'Sheet connection failed'); toast('Google Sheets connection failed. Check Apps Script v11 deployment.', 'error'); }
}
function normalizePayload(p){
  const src = p || {};
  return {
    shifts: normalizeRows(src.shifts || src['Shift Entries'] || []),
    receivings: normalizeRows(src.receivings || src['Receiving Entries'] || []),
    downtimes: normalizeRows(src.downtimes || src['Downtime Entries'] || []),
    boilers: normalizeRows(src.boilers || src['Boiler Readings'] || []),
    ph: normalizeRows(src.ph || src['PH Readings'] || []),
    waste: normalizeRows(src.waste || src['Waste Entries'] || []),
    sales: normalizeRows(src.sales || src['Sales Entries'] || [])
  };
}
function exportCurrentPage(){
  const d=filtered(); let rows=[];
  if(app.page==='overview') rows=shiftSummaryRows();
  if(app.page==='supply') rows=[...d.receivings, ...d.sales.map(r=>({type:'Sale',...r}))];
  if(app.page==='process') rows=[...d.boilers, ...d.ph.map(r=>({type:'PH',...r}))];
  if(app.page==='waste') rows=[...d.waste, ...d.downtimes.map(r=>({type:'Downtime',...r}))];
  if(window.XLSX){ const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, app.page); XLSX.writeFile(wb, `Flakes_${app.page}_${today()}.xlsx`); }
  else { const csv = rowsToCsv(rows); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`Flakes_${app.page}_${today()}.csv`; a.click(); }
}
function rowsToCsv(rows){ if(!rows.length) return ''; const keys=Object.keys(rows[0]); return [keys.join(','), ...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n'); }

init();
