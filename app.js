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
    newEntry:'إدخال بيانات جديدة', entryHelp:'اختر نوع الإدخال وسيتم رفع البيانات إلى Google Sheets.', cancel:'إلغاء', save:'حفظ', uploadOk:'تم رفع البيانات إلى Google Sheets', uploadFail:'فشل الرفع، تم حفظ البيانات محليًا مؤقتًا',
  },
  en: {
    sidebarSubtitle:'PET Washing Line Dashboard', sidebarFooter:'Synced with Google Sheets', overview:'Overview', supply:'Receiving & Production', process:'Process, PH & Boilers', waste:'Waste & Downtime',
    pageDescription:'Professional PET Flex washing line operations dashboard', entry:'Entry', exportExcel:'Export Excel', fromDate:'From Date', toDate:'To Date', shift:'Shift', all:'All', day:'Day', night:'Night', refresh:'Refresh', ready:'Ready',
    newEntry:'New Data Entry', entryHelp:'Choose the entry type. Data will be uploaded to Google Sheets.', cancel:'Cancel', save:'Save', uploadOk:'Data uploaded to Google Sheets', uploadFail:'Upload failed. Data saved locally as pending.',
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

const sample = {
  shifts: [
    {id:'SH-1', date:today(), shiftType:'Day', consumedBalesCount:220, producedBagsCount:410, avgBagWeightKg:25, netProductionKg:10250, workersCount:14},
    {id:'SH-2', date:today(), shiftType:'Night', consumedBalesCount:180, producedBagsCount:330, avgBagWeightKg:25, netProductionKg:8250, workersCount:12}
  ],
  receivings: [
    {date:today(), shiftType:'Day', supplierName:'Supplier A', region:'Cairo', vehicleNumber:'CA-1258', driverName:'Ahmed', balesCount:210, grossWeightKg:24800, tareWeightKg:7200, netWeightKg:17600, discountPercent:4, netWeightAfterDiscountKg:16896, pricePerTonThousand:16, tripPriceBeforeDiscount:281600, tripPriceAfterDiscount:270336},
    {date:today(), shiftType:'Night', supplierName:'Supplier B', region:'Giza', vehicleNumber:'GZ-7712', driverName:'Mahmoud', balesCount:170, grossWeightKg:20900, tareWeightKg:6900, netWeightKg:14000, discountPercent:3, netWeightAfterDiscountKg:13580, pricePerTonThousand:15.5, tripPriceBeforeDiscount:217000, tripPriceAfterDiscount:210490}
  ],
  downtimes: [
    {date:today(), shiftType:'Day', stopFromTime:'10:20', stopToTime:'10:55', downtimeMinutes:35, downtimeReason:'Machine Fault', notes:'Pump cleaning'},
    {date:today(), shiftType:'Night', stopFromTime:'02:00', stopToTime:'02:30', downtimeMinutes:30, downtimeReason:'Labor Break', notes:''}
  ],
  boilers: [
    {date:today(), entryTime:'10:00', shiftType:'Day', boilerNumber:1, meterNumber:1, currentTemperaturePv:87, setTemperatureSv:90, temperatureDifference:-3, currentAmpere:18},
    {date:today(), entryTime:'10:00', shiftType:'Day', boilerNumber:2, meterNumber:4, currentTemperaturePv:82, setTemperatureSv:85, temperatureDifference:-3, currentAmpere:16},
    {date:today(), entryTime:'22:00', shiftType:'Night', boilerNumber:1, meterNumber:2, currentTemperaturePv:89, setTemperatureSv:90, temperatureDifference:-1, currentAmpere:19}
  ],
  ph: [
    {date:today(), entryTime:'09:30', shiftType:'Day', area:'Boiler', phValue:8.2},
    {date:today(), entryTime:'11:30', shiftType:'Day', area:'Rinse Tank', phValue:7.8},
    {date:today(), entryTime:'23:00', shiftType:'Night', area:'Sand Filter', phValue:8.6}
  ],
  waste: [
    {date:today(), shiftType:'Day', sortexWeightKg:180, sortexCount:7, bigFlexWeightKg:95, bigFlexCount:4, wireBagWeightKg:55, wireBagCount:2, brokenCapsLabelsWeightKg:70, brokenCapsLabelsCount:5, totalWasteWeightKg:400, totalWasteCount:18},
    {date:today(), shiftType:'Night', sortexWeightKg:150, sortexCount:6, bigFlexWeightKg:80, bigFlexCount:3, wireBagWeightKg:45, wireBagCount:2, brokenCapsLabelsWeightKg:50, brokenCapsLabelsCount:4, totalWasteWeightKg:325, totalWasteCount:15}
  ],
  sales: [
    {date:today(), buyerFactoryName:'Factory X', buyerFactoryLocation:'10th Ramadan', vehicleNumber:'SL-20', driverName:'Ali', netTripWeightKg:9000, discountPercent:2, flexPricePerTonThousand:18, salePriceBeforeDiscount:162000, salePriceAfterDiscount:158760, priceDifference:3240}
  ]
};

const app = {
  lang: localStorage.getItem('flakes_lang') || 'ar',
  theme: localStorage.getItem('flakes_theme') || 'light',
  page: 'overview',
  charts: {},
  data: JSON.parse(localStorage.getItem('flakes_data') || 'null') || sample,
  activeEntry: 'saveShift'
};

function t(key){ return translations[app.lang][key] || key; }
function setStatus(type, text){
  const dot = $('#syncStatus .dot'); dot.className = 'dot' + (type ? ' ' + type : '');
  $('#syncStatus span:last-child').textContent = text || t('ready');
}
function toast(msg, type='success'){
  const el = $('#toast'); el.className = `toast show ${type}`; el.textContent = msg;
  setTimeout(()=> el.className = 'toast', 4200);
}
function saveLocal(){ localStorage.setItem('flakes_data', JSON.stringify(app.data)); }

function init(){
  document.body.classList.toggle('dark', app.theme === 'dark');
  document.documentElement.lang = app.lang;
  document.documentElement.dir = app.lang === 'ar' ? 'rtl' : 'ltr';
  $('#dateFrom').value = today().slice(0,8)+'01'; $('#dateTo').value = today();
  bindEvents(); applyI18n(); renderAll(); loadFromApi();
}

function bindEvents(){
  $$('.nav-item').forEach(btn => btn.onclick = () => setPage(btn.dataset.page));
  $('#toggleSidebar').onclick = () => $('#sidebar').classList.toggle('collapsed');
  $('#themeBtn').onclick = () => { app.theme = app.theme === 'dark' ? 'light':'dark'; localStorage.setItem('flakes_theme', app.theme); document.body.classList.toggle('dark', app.theme === 'dark'); $('#themeBtn').textContent = app.theme === 'dark' ? '☀️':'🌙'; renderAll(); };
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
  const pass = row => (!from || String(row.date||row.Date||'') >= from) && (!to || String(row.date||row.Date||'') <= to) && (shift==='all' || row.shiftType===shift || row['Shift Type']===shift || !row.shiftType);
  return Object.fromEntries(Object.entries(app.data).map(([k,v])=>[k,(v||[]).filter(pass)]));
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
}
function kpi(label, value, sub='', cls='') { return `<article class="kpi-card"><div class="kpi-label">${label}</div><div class="kpi-value ${cls}">${value}</div><div class="kpi-sub">${sub}</div></article>`; }
function panel(title, content) { return `<div class="panel"><h3>${title}</h3>${content}</div>`; }
function chart(id){ return `<div class="chart-wrap"><canvas id="${id}"></canvas></div>`; }
function table(rows, cols){
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${formatCell(r[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
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
  makeBar('overviewBar', ['Consumed','Production','Waste','Actual Loss'], [m.consumedWeight,m.production,m.waste,m.actualLoss]);
  makeLine('overviewYield', ['Material','Operation','Actual'], [m.materialYield,m.operationYield,m.actualYield]);
  makeDoughnut('overviewWaste', ['Sortex','Big Flex','Wire & Bag','Caps & Labels'], wasteTotals(d.waste));
}
function shiftSummaryRows(){
  const d=filtered();
  return d.shifts.map(s=>{
    const rec=d.receivings.filter(r=>r.shiftType===s.shiftType); const was=d.waste.filter(r=>r.shiftType===s.shiftType);
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
  makeBar('supSupplier', groupSum(d.receivings,'supplierName','netWeightAfterDiscountKg').labels, groupSum(d.receivings,'supplierName','netWeightAfterDiscountKg').values);
  makeBar('supDiscount', ['Before Discount Kg','After Discount Kg'], [m.receivingNet,m.receivingAfter]);
}
function renderProcess(){
  const m=metrics(), d=filtered();
  $('#process').innerHTML = `<div class="kpi-grid">
    ${kpi('Average PH', fmt(m.avgPH,2), 'All areas')}${kpi('Boiler 1 PV', fmt(avg(d.boilers.filter(b=>n(b.boilerNumber)===1).map(b=>n(b.currentTemperaturePv))),1)+'°C','Current temperature')}${kpi('Boiler 2 PV', fmt(avg(d.boilers.filter(b=>n(b.boilerNumber)===2).map(b=>n(b.currentTemperaturePv))),1)+'°C','Current temperature')}${kpi('Avg SV', fmt(m.avgSV,1)+'°C','Set temperature')}${kpi('Avg Current', fmt(avg(d.boilers.map(b=>n(b.currentAmpere))),1)+' A','Electrical current')}
  </div>
  <div class="grid-2">${panel('PH by Area', chart('phArea'))}${panel('Boiler PV / SV', chart('boilerPvSv'))}</div>
  <div class="grid-2">${panel('Boiler Readings', table(d.boilers, [['date','Date'],['entryTime','Time'],['boilerNumber','Boiler'],['meterNumber','Meter'],['currentTemperaturePv','PV'],['setTemperatureSv','SV'],['temperatureDifference','Diff'],['currentAmpere','Current A']]))}${panel('PH Readings', table(d.ph, [['date','Date'],['entryTime','Time'],['area','Area'],['phValue','PH Value']]))}</div>`;
  const phg=groupAvg(d.ph,'area','phValue'); makeBar('phArea', phg.labels, phg.values);
  makeGrouped('boilerPvSv', d.boilers.map((b,i)=>`B${b.boilerNumber}-M${b.meterNumber}`), [d.boilers.map(b=>n(b.currentTemperaturePv)), d.boilers.map(b=>n(b.setTemperatureSv))], ['PV','SV']);
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
  makeDoughnut('wasteType', ['Sortex','Big Flex','Wire & Bag','Caps & Labels'], wt);
  makeBar('downReason', reason.labels, reason.values);
}

function wasteTotals(rows){ return ['sortexWeightKg','bigFlexWeightKg','wireBagWeightKg','brokenCapsLabelsWeightKg'].map(k=>rows.reduce((s,r)=>s+n(r[k]),0)); }
function groupSum(rows, key, val){ const m={}; rows.forEach(r=>m[r[key]||'Unknown']=(m[r[key]||'Unknown']||0)+n(r[val])); return {labels:Object.keys(m), values:Object.values(m)}; }
function groupAvg(rows,key,val){ const m={}; rows.forEach(r=>{const k=r[key]||'Unknown'; m[k]=m[k]||[]; m[k].push(n(r[val]));}); return {labels:Object.keys(m), values:Object.values(m).map(avg)}; }
function chartColors(){ return ['#00a94f','#5cff6d','#0ea5e9','#f59e0b','#ef4444','#8b5cf6']; }
function destroy(id){ if(app.charts[id]) app.charts[id].destroy(); }
function makeBar(id, labels, values){ destroy(id); app.charts[id]=new Chart($('#'+id),{type:'bar',data:{labels,datasets:[{label:'Value',data:values,backgroundColor:chartColors()}]},options:baseOpts()}); }
function makeLine(id, labels, values){ destroy(id); app.charts[id]=new Chart($('#'+id),{type:'line',data:{labels,datasets:[{label:'%',data:values,borderColor:'#00e676',backgroundColor:'rgba(0,230,118,.12)',tension:.35,fill:true}]},options:baseOpts()}); }
function makeDoughnut(id, labels, values){ destroy(id); app.charts[id]=new Chart($('#'+id),{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:chartColors()}]},options:{...baseOpts(), cutout:'62%'}}); }
function makeGrouped(id, labels, arrays, dsLabels){ destroy(id); app.charts[id]=new Chart($('#'+id),{type:'line',data:{labels,datasets:arrays.map((a,i)=>({label:dsLabels[i],data:a,borderColor:chartColors()[i],backgroundColor:'transparent',tension:.35}))},options:baseOpts()}); }
function baseOpts(){ return {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:getComputedStyle(document.body).getPropertyValue('--text')}}}, scales:{x:{ticks:{color:getComputedStyle(document.body).getPropertyValue('--muted')},grid:{color:'rgba(128,128,128,.12)'}}, y:{ticks:{color:getComputedStyle(document.body).getPropertyValue('--muted')},grid:{color:'rgba(128,128,128,.12)'}}}}; }

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
    setStatus('', t('uploadOk')); toast(t('uploadOk'), 'success'); $('#formResult').textContent = `${t('uploadOk')} ✓ ${json.recordId || ''}`; closeEntryModal(); renderAll();
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
    } else setStatus('', t('ready'));
  }catch{ setStatus('', t('ready')); }
}
function normalizePayload(p){ return {
  shifts:p.shifts||p['Shift Entries']||app.data.shifts||[], receivings:p.receivings||p['Receiving Entries']||app.data.receivings||[], downtimes:p.downtimes||p['Downtime Entries']||app.data.downtimes||[], boilers:p.boilers||p['Boiler Readings']||app.data.boilers||[], ph:p.ph||p['PH Readings']||app.data.ph||[], waste:p.waste||p['Waste Entries']||app.data.waste||[], sales:p.sales||p['Sales Entries']||app.data.sales||[]
};}
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
