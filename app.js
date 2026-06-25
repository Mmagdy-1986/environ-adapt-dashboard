'use strict';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLnb2avucZNZtn7OZ8VFUCgEfC1tzyyM1z9RcNSHHnOASSUiB9SfXgb39pKBDeelQYQA/exec'; 
const STORAGE_KEY = 'environAdaptDashboardStateV9';
const DATE_FMT = new Intl.DateTimeFormat('en-CA');
const COLORS = { green:'#08a653', green2:'#39f76c', dark:'#04733d', danger:'#ef4444', warn:'#f59e0b', blue:'#1e88e5', grey:'#cbd5e1' };
let raw = emptyData();
let state = { page:'overview', lang:'en', theme:'light', collapsed:false, dateFrom:'', dateTo:'', shift:'all', chartFilter:null, phArea:'all', boiler:'all', meter:'all', signal:{pv:true,sv:true,a:false} };
let charts = {};
let entryType = 'shift';
let boilerTab = 1;

const i18n = {
  en: { navOverview:'Overview', navReceiving:'Receiving & Production', navProcess:'Process, PH & Boilers', navWaste:'Waste & Downtime', navSales:'Sales & Export', navReports:'Reports', missionTitle:'Reducing waste, maximizing recovery', missionBody:'Sustainable solutions for cleaner PET washing operations.', dawarLine:'Turning waste into measurable value', liveFromSheets:'Live from Google Sheets', dateFrom:'Date From', dateTo:'Date To', shift:'Shift', refresh:'Refresh', newEntry:'New Entry', exportExcel:'Export Excel' },
  ar: { navOverview:'الملخص العام', navReceiving:'التوريد والإنتاج', navProcess:'التشغيل و PH والغلايات', navWaste:'الهالك والتوقفات', navSales:'المبيعات والتصدير', navReports:'التقارير', missionTitle:'تقليل الهالك وتعظيم الاسترداد', missionBody:'حلول مستدامة لتشغيل أنظف وأكثر كفاءة.', dawarLine:'تحويل المخلفات إلى قيمة قابلة للقياس', liveFromSheets:'مباشر من Google Sheets', dateFrom:'من تاريخ', dateTo:'إلى تاريخ', shift:'الوردية', refresh:'تحديث', newEntry:'إدخال', exportExcel:'تصدير Excel' }
};

function emptyData(){ return { shifts:[], receivings:[], downtimes:[], boilers:[], ph:[], waste:[], sales:[] }; }
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const n = v => Number(String(v ?? '').replace(/,/g,'').replace('%','')) || 0;
const today = () => DATE_FMT.format(new Date());
const fmt = (v,d=0) => Number.isFinite(Number(v)) ? Number(v).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}) : '0';
const pct = v => `${fmt(v,1)}%`;
const kg = v => `${fmt(v,0)} kg`;
const mt = v => `${fmt(v/1000,2)} MT`;

init();
function init(){
  loadState();
  setDefaultDates();
  bindUI();
  applyState();
  renderAll();
  loadFromSheets();
}
function loadState(){ try{ state = {...state, ...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; }catch(e){} }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function setDefaultDates(){
  if(!state.dateTo) state.dateTo = today();
  if(!state.dateFrom){ const d=new Date(); d.setDate(d.getDate()-30); state.dateFrom = DATE_FMT.format(d); }
}
function bindUI(){
  $('#dateFrom').value=state.dateFrom; $('#dateTo').value=state.dateTo; $('#shiftFilter').value=state.shift;
  $('#dateFrom').addEventListener('change', e=>{state.dateFrom=e.target.value; saveState(); renderAll();});
  $('#dateTo').addEventListener('change', e=>{state.dateTo=e.target.value; saveState(); renderAll();});
  $('#shiftFilter').addEventListener('change', e=>{state.shift=e.target.value; saveState(); renderAll();});
  $('#refreshBtn').addEventListener('click', loadFromSheets);
  $('#entryBtn').addEventListener('click', openEntryModal);
  $('#closeModal').addEventListener('click', closeEntryModal);
  $('#entryModal').addEventListener('click', e=>{ if(e.target.id==='entryModal') closeEntryModal(); });
  $('#exportBtn').addEventListener('click', exportCurrentPage);
  $('#themeBtn').addEventListener('click', ()=>{ state.theme = state.theme==='dark'?'light':'dark'; saveState(); applyState(); updateChartsTheme(); });
  $('#langBtn').addEventListener('click', ()=>{ state.lang = state.lang==='en'?'ar':'en'; saveState(); applyState(); renderAll(); });
  $('#collapseBtn').addEventListener('click', ()=>{ state.collapsed=!state.collapsed; saveState(); applyState(); });
  $$('.nav-item').forEach(btn=> btn.addEventListener('click', ()=>{ state.page=btn.dataset.page; saveState(); applyState(); renderAll(); }));
  $('#clearFilterBtn').addEventListener('click', ()=>{ state.chartFilter=null; saveState(); renderAll(); });
  $('#boilerFilter').addEventListener('change', e=>{ state.boiler=e.target.value; saveState(); renderAll(); });
  $('#meterFilter').addEventListener('change', e=>{ state.meter=e.target.value; saveState(); renderAll(); });
  $('#processBoilerFilter').addEventListener('change', e=>{ state.boiler=e.target.value; $('#boilerFilter').value=e.target.value; saveState(); renderAll(); });
  $('#processMeterFilter').addEventListener('change', e=>{ state.meter=e.target.value; $('#meterFilter').value=e.target.value; saveState(); renderAll(); });
  document.addEventListener('click', e=>{ const chip=e.target.closest('[data-ph-area]'); if(chip){ state.phArea=chip.dataset.phArea; saveState(); renderAll(); } const sig=e.target.closest('[data-signal]'); if(sig){ state.signal[sig.dataset.signal]=!state.signal[sig.dataset.signal]; saveState(); renderAll(); }});
}
function applyState(){
  document.documentElement.lang=state.lang; document.documentElement.dir=state.lang==='ar'?'rtl':'ltr'; document.body.dir=document.documentElement.dir;
  document.documentElement.classList.toggle('dark', state.theme==='dark'); document.body.classList.toggle('dark', state.theme==='dark');
  $('#themeBtn').textContent=state.theme==='dark'?'☀':'☾';
  $('#appShell').classList.toggle('collapsed', state.collapsed);
  $$('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.page===state.page));
  $$('.page').forEach(p=>p.classList.toggle('active', p.id===`page-${state.page}`));
  $('#dateFrom').value=state.dateFrom; $('#dateTo').value=state.dateTo; $('#shiftFilter').value=state.shift;
  if($('#boilerFilter')) $('#boilerFilter').value=state.boiler; if($('#meterFilter')) $('#meterFilter').value=state.meter;
  if($('#processBoilerFilter')) $('#processBoilerFilter').value=state.boiler; if($('#processMeterFilter')) $('#processMeterFilter').value=state.meter;
  $('#langBtn').innerHTML = state.lang==='en' ? 'AR | <b>EN</b>' : '<b>AR</b> | EN';
  Object.entries(i18n[state.lang]).forEach(([k,v])=>$$(`[data-i18n="${k}"]`).forEach(el=>el.textContent=v));
  const titles={overview:'Environ Adapt Operations Dashboard',receiving:'Receiving & Production',process:'Process, PH & Boilers',waste:'Waste & Downtime',sales:'Sales & Export',reports:'Reports'};
  $('#pageTitle').textContent=titles[state.page]||titles.overview; $('#pageSubtitle').textContent='PET Flakes Washing Intelligence';
}

async function loadFromSheets(){
  setStatus('Loading...', 'pending');
  try{
    const data = await jsonp(`${APPS_SCRIPT_URL}?action=getDashboardData`);
    raw = normalizePayload(data && data.data ? data.data : data);
    setStatus('Ready', 'ok'); toast('Data synced from Google Sheets','good');
  }catch(err){
    console.warn(err); setStatus('Offline / local mode','bad'); toast('Could not read Google Sheets. Check Web App deployment.','bad');
    raw = readLocalFallback();
  }
  renderAll();
}
function jsonp(url){
  return new Promise((resolve,reject)=>{
    const cb = `jsonp_${Date.now()}_${Math.round(Math.random()*9999)}`; const sep=url.includes('?')?'&':'?';
    const s=document.createElement('script'); const timer=setTimeout(()=>{ cleanup(); reject(new Error('JSONP timeout')); },15000);
    window[cb]=payload=>{ cleanup(); resolve(payload); };
    function cleanup(){ clearTimeout(timer); delete window[cb]; s.remove(); }
    s.src=`${url}${sep}callback=${cb}&v=${Date.now()}`; s.onerror=()=>{ cleanup(); reject(new Error('JSONP failed')); };
    document.body.appendChild(s);
  });
}
function normalizePayload(d){
  d=d||{};
  return { shifts: d.shifts||d['Shift Entries']||[], receivings:d.receivings||d.receiving||d['Receiving Entries']||[], downtimes:d.downtimes||d['Downtime Entries']||[], boilers:d.boilers||d['Boiler Readings']||[], ph:d.ph||d['PH Readings']||[], waste:d.waste||d['Waste Entries']||[], sales:d.sales||d['Sales Entries']||[] };
}
function readLocalFallback(){ try{return normalizePayload(JSON.parse(localStorage.getItem('localDashboardData')||'{}'));}catch(e){return emptyData();} }
function writeLocalFallback(action, data){ const local=readLocalFallback(); const map={saveShift:'shifts',saveReceiving:'receivings',saveDowntime:'downtimes',saveBoiler:'boilers',saveBoilerBatch:'boilers',savePH:'ph',saveWaste:'waste',saveSale:'sales'}; const key=map[action]; if(!key)return; if(Array.isArray(data)) local[key].push(...data); else local[key].push(data); localStorage.setItem('localDashboardData', JSON.stringify(local)); }
function setStatus(t, type){ $('#connectionStatus').textContent=t; const dot=$('.status-pill .dot'); dot.className=`dot ${type==='bad'?'':'online'}`; }
function toast(msg,type='good'){ const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; $('#toastStack').appendChild(el); setTimeout(()=>el.remove(),4200); }

function filtered(){
  const inRange = row => { const d = get(row,'Date','date'); if(!d) return true; return (!state.dateFrom || d>=state.dateFrom) && (!state.dateTo || d<=state.dateTo); };
  const shiftOk = row => state.shift==='all' || get(row,'Shift Type','shiftType')===state.shift || get(row,'Shift ID','shiftId')?.includes(state.shift);
  const f = arr => (arr||[]).filter(r=>inRange(r) && shiftOk(r));
  let data={ shifts:f(raw.shifts), receivings:f(raw.receivings), downtimes:f(raw.downtimes), boilers:f(raw.boilers), ph:f(raw.ph), waste:f(raw.waste), sales:f(raw.sales) };
  if(state.chartFilter){ data = applyChartFilter(data, state.chartFilter); $('#activeFilter').classList.remove('hidden'); $('#activeFilterText').textContent=`Filter: ${state.chartFilter.type} = ${state.chartFilter.value}`; } else $('#activeFilter').classList.add('hidden');
  return data;
}
function applyChartFilter(data, filter){
  const v=String(filter.value).toLowerCase();
  if(filter.type==='Waste Type') data.waste = data.waste.map(r=>({...r, _focusWaste:v}));
  if(filter.type==='PH Area') data.ph = data.ph.filter(r=>String(get(r,'Area','area')).toLowerCase()===v);
  if(filter.type==='Boiler') data.boilers = data.boilers.filter(r=>String(get(r,'Boiler Number','boilerNumber'))===String(filter.value));
  if(filter.type==='Downtime Reason') data.downtimes = data.downtimes.filter(r=>String(get(r,'Reason','reason')).toLowerCase()===v);
  return data;
}
function get(row, ...keys){ for(const k of keys){ if(row && row[k]!=null && row[k] !== '') return row[k]; } return ''; }
function compute(data=filtered()){
  const receivingAfter = sum(data.receivings, r=>getNum(r,'Net Weight After Discount Kg','netWeightAfterDiscountKg'));
  const trips=data.receivings.length;
  const balesReceived=sum(data.receivings, r=>getNum(r,'Bales Count','balesCount'));
  const avgBale=balesReceived?receivingAfter/balesReceived:0;
  const consumedBales=sum(data.shifts, r=>getNum(r,'Consumed Bales Count','consumedBalesCount'));
  const consumed=consumedBales&&avgBale?consumedBales*avgBale:receivingAfter;
  const producedBags=sum(data.shifts, r=>getNum(r,'Produced Bags Count','producedBagsCount'));
  const netProduction=sum(data.shifts, r=> getNum(r,'Net Production Kg','netProductionKg') || (getNum(r,'Produced Bags Count','producedBagsCount')*getNum(r,'Avg Bag Weight Kg','avgBagWeightKg')) );
  const wasteRows=data.waste; const waste=sum(wasteRows, r=>getNum(r,'Total Waste Kg','totalWasteKg') || wasteTypeTotals([r]).total);
  const actualLoss=Math.max(0, consumed - (netProduction+waste));
  const downtime=sum(data.downtimes, r=>getNum(r,'Downtime Minutes','downtimeMinutes'));
  const stops=data.downtimes.length;
  const avgStop=stops?downtime/stops:0;
  const avgPh=avg(data.ph, r=>getNum(r,'PH Reading','phReading'));
  const avgPv=avg(data.boilers, r=>getNum(r,'Current Temperature PV','currentTemperaturePV'));
  const avgSv=avg(data.boilers, r=>getNum(r,'Set Temperature SV','setTemperatureSV'));
  return { receivingAfter,trips,balesReceived,avgBale,consumedBales,consumed,producedBags,netProduction,waste,actualLoss,downtime,stops,avgStop,avgPh,avgPv,avgSv,
    materialRatio: netProduction? consumed/netProduction:0, materialPercent: consumed? netProduction/consumed*100:0,
    operationRatio: netProduction? receivingAfter/netProduction:0, operationPercent: receivingAfter? netProduction/receivingAfter*100:0,
    actualRatio: netProduction? (netProduction+waste)/netProduction:0, actualPercent: (netProduction+waste)? netProduction/(netProduction+waste)*100:0,
    wastePercent: consumed? waste/consumed*100:0, actualLossPercent: consumed? actualLoss/consumed*100:0,
    operationLossPercent: 720? downtime/720*100:0 };
}
function getNum(r,...keys){ return n(get(r,...keys)); }
function sum(arr, fn){ return (arr||[]).reduce((a,r)=>a+n(fn(r)),0); }
function avg(arr, fn){ const vals=(arr||[]).map(fn).map(n).filter(v=>v); return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0; }

function renderAll(){ applyState(); updateMeterOptions(); renderKpis(); renderCharts(); renderTables(); }
function kpiHtml(items){ return items.map(i=>`<div class="kpi" data-filter-type="${i.filterType||''}" data-filter-value="${i.filterValue||''}"><div class="kpi-icon">${i.icon||'◌'}</div><div><small>${i.title}</small>${i.isYield?`<div class="yield-pair"><span class="ratio">${i.ratio}</span><span class="percent">${i.percent}</span></div>`:`<div class="value">${i.value}<span class="unit">${i.unit||''}</span></div>`}<div class="sub">${i.sub||''}</div></div></div>`).join(''); }
function renderKpis(){
  const d=filtered(), c=compute(d);
  const overview=[
    {icon:'⇩',title:'Consumed Weight',value:fmt(c.consumed/1000,2),unit:'MT',sub:`${fmt(c.consumedBales,0)} bales | avg ${fmt(c.avgBale,1)} kg`},
    {icon:'✓',title:'Net Production',value:fmt(c.netProduction/1000,2),unit:'MT',sub:`${fmt(c.producedBags,0)} bags`},
    {icon:'♻',title:'Total Waste',value:fmt(c.waste/1000,2),unit:'MT',sub:`${pct(c.wastePercent)} of consumed`,filterType:'Waste Type',filterValue:'all'},
    {icon:'↘',title:'Actual Loss',value:fmt(c.actualLoss/1000,2),unit:'MT',sub:`${pct(c.actualLossPercent)} of consumed`},
    {icon:'☘',title:'Material Yield',isYield:true,ratio:`${fmt(c.materialRatio,2)} kg/kg`,percent:pct(c.materialPercent),sub:'Production / Consumed'},
    {icon:'⚙',title:'Operation Yield',isYield:true,ratio:`${fmt(c.operationRatio,2)} kg/kg`,percent:pct(c.operationPercent),sub:'Production / Receiving after discount'},
    {icon:'◎',title:'Actual Yield',isYield:true,ratio:`${fmt(c.actualRatio,2)} kg/kg`,percent:pct(c.actualPercent),sub:'Production / Production + Waste'},
    {icon:'pH',title:'Average PH',value:fmt(c.avgPh,2),unit:'',sub:`PV ${fmt(c.avgPv,1)}°C | Δ ${fmt(c.avgPv-c.avgSv,1)}`}
  ];
  $('#overviewKpis').innerHTML=kpiHtml(overview); $('#receivingKpis').innerHTML=kpiHtml([
    {icon:'▣',title:'Receiving After Discount',value:fmt(c.receivingAfter/1000,2),unit:'MT',sub:`${c.trips} trips`},{icon:'▥',title:'Avg Bale Weight',value:fmt(c.avgBale,1),unit:'kg',sub:`${fmt(c.balesReceived,0)} received bales`},{icon:'▦',title:'Net Production',value:fmt(c.netProduction/1000,2),unit:'MT',sub:`${fmt(c.producedBags,0)} bags`},{icon:'☘',title:'Material Yield',isYield:true,ratio:`${fmt(c.materialRatio,2)}`,percent:pct(c.materialPercent),sub:'Consumed / Production'}]);
  $('#processKpis').innerHTML=kpiHtml([{icon:'pH',title:'Average PH',value:fmt(c.avgPh,2),sub:'All areas'},{icon:'℃',title:'Average PV',value:fmt(c.avgPv,1),unit:'°C',sub:'Current temperature'},{icon:'℃',title:'Average SV',value:fmt(c.avgSv,1),unit:'°C',sub:'Set temperature'},{icon:'Δ',title:'PV / SV Difference',value:fmt(c.avgPv-c.avgSv,1),unit:'°C',sub:'Average deviation'}]);
  const wt=wasteTypeTotals(d.waste);
  $('#wasteKpis').innerHTML=kpiHtml([{icon:'♻',title:'Sortex',value:fmt(wt.sortex/1000,2),unit:'MT',sub:'Weight',filterType:'Waste Type',filterValue:'Sortex'},{icon:'▧',title:'Big Flex',value:fmt(wt.bigFlex/1000,2),unit:'MT',sub:'Weight',filterType:'Waste Type',filterValue:'Big Flex'},{icon:'▨',title:'Wire & Bag',value:fmt(wt.wireBag/1000,2),unit:'MT',sub:'Weight',filterType:'Waste Type',filterValue:'Wire & Bag'},{icon:'◉',title:'Caps & Labels',value:fmt(wt.capsLabels/1000,2),unit:'MT',sub:'Weight',filterType:'Waste Type',filterValue:'Caps & Labels'},{icon:'⏱',title:'Downtime Minutes',value:fmt(c.downtime,0),unit:'min',sub:'Total stop time'},{icon:'□',title:'Stops Count',value:fmt(c.stops,0),sub:'Records'},{icon:'↘',title:'Actual Loss',value:fmt(c.actualLoss/1000,2),unit:'MT',sub:pct(c.actualLossPercent)},{icon:'◴',title:'Operation Loss Time',value:pct(c.operationLossPercent),sub:'Assuming 12h shift'}]);
  $('#salesKpis').innerHTML=kpiHtml(renderSalesKpis(d.sales));
  $$('.kpi[data-filter-type]').forEach(k=>k.addEventListener('click',()=>{ if(k.dataset.filterType){ state.chartFilter={type:k.dataset.filterType,value:k.dataset.filterValue}; saveState(); renderAll(); }}));
}
function wasteTypeTotals(rows){ return { sortex:sum(rows,r=>getNum(r,'Sortex Weight Kg','sortexWeightKg')), bigFlex:sum(rows,r=>getNum(r,'Big Flex Weight Kg','bigFlexWeightKg')), wireBag:sum(rows,r=>getNum(r,'Wire Bag Weight Kg','wireBagWeightKg')), capsLabels:sum(rows,r=>getNum(r,'Caps Labels Weight Kg','capsLabelsWeightKg')), get total(){return this.sortex+this.bigFlex+this.wireBag+this.capsLabels;} }; }
function renderSalesKpis(sales){ const net=sum(sales,r=>getNum(r,'Net Weight After Discount Kg','netWeightAfterDiscountKg')); const before=sum(sales,r=>getNum(r,'Sale Price Before Discount','salePriceBeforeDiscount')); const after=sum(sales,r=>getNum(r,'Sale Price After Discount','salePriceAfterDiscount')); return [{icon:'↗',title:'Sales Weight',value:fmt(net/1000,2),unit:'MT',sub:`${sales.length} sales trips`},{icon:'£',title:'Before Discount',value:fmt(before,0),sub:'Total value'},{icon:'£',title:'After Discount',value:fmt(after,0),sub:'Total value'},{icon:'−',title:'Difference',value:fmt(before-after,0),sub:'Discount effect'}]; }
function renderCharts(){ const d=filtered(), c=compute(d); renderProductionFlow(c); renderPhChips(); renderMeterCards(d.boilers); renderBottomMetrics(c); createOrUpdateCharts(d,c); }
function renderProductionFlow(c){ $('#productionFlow').innerHTML=`<div class="flow-node"><small>Consumed</small><b>${fmt(c.consumed/1000,2)} MT</b><small>100%</small></div><div class="flow-node secondary"><small>Net Production</small><b>${fmt(c.netProduction/1000,2)} MT</b><small>${pct(c.materialPercent)}</small></div><div class="flow-stack"><div class="flow-node warn"><small>Waste</small><b>${fmt(c.waste/1000,2)} MT</b><small>${pct(c.wastePercent)}</small></div><div class="flow-node danger"><small>Actual Loss</small><b>${fmt(c.actualLoss/1000,2)} MT</b><small>${pct(c.actualLossPercent)}</small></div></div>`; }
function renderPhChips(){ const areas=['all','Boiler','Sand Filter','Rinse Tank']; const html=areas.map(a=>`<button class="mini-chip ${state.phArea===a?'active':''}" data-ph-area="${a}">${a==='all'?'All Areas':a}</button>`).join(''); $('#phChips').innerHTML=html; $('#processPhChips').innerHTML=html; }
function updateMeterOptions(){ const opts='<option value="all">All Meters</option>'+[1,2,3,4,5,6].map(i=>`<option value="${i}">Meter ${i}</option>`).join(''); ['meterFilter','processMeterFilter'].forEach(id=>{ const el=$('#'+id); if(el && el.innerHTML!==opts) el.innerHTML=opts; el.value=state.meter; }); }
function renderMeterCards(boilers){ const rows=filterBoilers(boilers); const latest={}; rows.forEach(r=>{ const key=`${get(r,'Boiler Number','boilerNumber')}-${get(r,'Meter Number','meterNumber')}`; latest[key]=r; }); let html=''; const b = state.boiler==='all'?[1,2]:[Number(state.boiler)]; b.forEach(bo=>{ [1,2,3,4,5,6].forEach(m=>{ if(state.meter!=='all' && String(m)!==String(state.meter)) return; const r=latest[`${bo}-${m}`]||{}; const pv=getNum(r,'Current Temperature PV','currentTemperaturePV'), sv=getNum(r,'Set Temperature SV','setTemperatureSV'), a=getNum(r,'Current A','currentA'), delta=pv-sv; html += `<div class="meter-card" data-filter-type="Boiler" data-filter-value="${bo}"><b>B${bo} • Meter ${m}</b><div>PV <strong>${fmt(pv,0)}°C</strong></div><div>SV <strong>${fmt(sv,0)}°C</strong></div><div>Current <strong>${fmt(a,1)} A</strong></div><div class="delta ${Math.abs(delta)<=5?'good':'bad'}">Δ ${fmt(delta,0)}°C</div></div>`; }); }); $('#meterCards').innerHTML=html||'<p class="empty">No boiler readings yet.</p>'; $('#boilerSplit').innerHTML=html; }
function filterBoilers(boilers){ return boilers.filter(r=>(state.boiler==='all'||String(get(r,'Boiler Number','boilerNumber'))===String(state.boiler)) && (state.meter==='all'||String(get(r,'Meter Number','meterNumber'))===String(state.meter))); }
function renderBottomMetrics(c){ $('#bottomMetrics').innerHTML=[['Operating',`${fmt(c.downtime?720-c.downtime:0,0)} min`],['Avg Stop',`${fmt(c.avgStop,1)} min`],['Stops',fmt(c.stops,0)],['Efficiency',pct(Math.max(0,100-c.operationLossPercent))]].map(x=>`<div class="mini-metric"><small>${x[0]}</small><b>${x[1]}</b></div>`).join(''); }
const labelPlugin={id:'labels',afterDatasetsDraw(chart){const{ctx}=chart;ctx.save();ctx.font='700 12px Inter,Arial';ctx.fillStyle=getCss('--text');ctx.textAlign='center';chart.data.datasets.forEach((ds,di)=>{const meta=chart.getDatasetMeta(di); if(meta.hidden)return; meta.data.forEach((el,i)=>{const val=ds.data[i]; if(!val)return; const p=el.tooltipPosition(); ctx.fillText((ds.label&&ds.label.includes('%'))?pct(val):fmt(val, val<10?1:0),p.x,p.y-8);});});ctx.restore();}};
function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function chartOptions(extra={}){ return {responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:getCss('--text'),boxWidth:14}},tooltip:{enabled:true}},scales:{x:{ticks:{color:getCss('--muted')},grid:{color:'rgba(100,116,139,.13)'}},y:{ticks:{color:getCss('--muted')},grid:{color:'rgba(100,116,139,.13)'}}},onClick:(evt, els, chart)=>{ if(els.length){ const i=els[0].index; const label=chart.data.labels[i]; toast(`Selected: ${label}`); if(chart.canvas.id.toLowerCase().includes('waste')) state.chartFilter={type:'Waste Type',value:label}; if(chart.canvas.id.toLowerCase().includes('ph')) state.chartFilter={type:'PH Area',value:label}; saveState(); renderAll(); }},...extra}; }
function makeChart(id,type,data,options={}){ if(charts[id]){ charts[id].data=data; charts[id].options={...charts[id].options,...options}; charts[id].update(); return charts[id]; } const ctx=$('#'+id); if(!ctx) return null; charts[id]=new Chart(ctx,{type,data,options:chartOptions(options),plugins:[labelPlugin]}); return charts[id]; }
function createOrUpdateCharts(d,c){
  makeChart('productionTrendChart','line',{labels:dailyLabels(),datasets:[{label:'Consumed',data:seriesDaily(d.shifts,()=>c.consumed/1000),borderColor:COLORS.dark,backgroundColor:'transparent',tension:.35},{label:'Production',data:seriesDaily(d.shifts,()=>c.netProduction/1000),borderColor:COLORS.green2,tension:.35},{label:'Actual Loss',data:seriesDaily(d.shifts,()=>c.actualLoss/1000),borderColor:COLORS.danger,tension:.35}]});
  const wt=wasteTypeTotals(d.waste); const wLabels=['Big Flex','Sortex','Wire & Bag','Caps & Labels']; const wData=[wt.bigFlex/1000,wt.sortex/1000,wt.wireBag/1000,wt.capsLabels/1000];
  makeChart('wasteTypeChart','doughnut',{labels:wLabels,datasets:[{data:wData,backgroundColor:[COLORS.dark,COLORS.green,COLORS.green2,COLORS.warn],borderWidth:3,borderColor:getCss('--surface')}]},{cutout:'65%',scales:{}});
  makeChart('wasteDonutPageChart','doughnut',{labels:wLabels,datasets:[{data:wData,backgroundColor:[COLORS.dark,COLORS.green,COLORS.green2,COLORS.warn],borderWidth:3,borderColor:getCss('--surface')}]},{cutout:'60%',scales:{}});
  renderPhChart('phTrendChart',d.ph); renderPhChart('processPhChart',d.ph); renderBoilerChart('boilerChart',d.boilers); renderBoilerChart('processBoilerChart',d.boilers);
  makeChart('supplierChart','bar',{labels:groupLabels(d.receivings,'Supplier Name','supplierName'),datasets:[{label:'MT',data:groupSum(d.receivings,'Supplier Name','supplierName','Net Weight After Discount Kg','netWeightAfterDiscountKg').map(v=>v/1000),backgroundColor:COLORS.green,borderRadius:12}]});
  makeChart('productionShiftChart','bar',{labels:['Day','Night'],datasets:[{label:'MT',data:['Day','Night'].map(s=>sum(d.shifts.filter(r=>get(r,'Shift Type','shiftType')===s),r=>getNum(r,'Net Production Kg','netProductionKg'))/1000),backgroundColor:[COLORS.green,COLORS.green2],borderRadius:12}]});
  const reasons=group(d.downtimes,r=>get(r,'Reason','reason')||'Unknown'); makeChart('downtimeReasonChart','bar',{labels:Object.keys(reasons),datasets:[{label:'Minutes',data:Object.values(reasons).map(arr=>sum(arr,r=>getNum(r,'Downtime Minutes','downtimeMinutes'))),backgroundColor:COLORS.green,borderRadius:10}]},{indexAxis:'y'});
}
function renderPhChart(id, rows){ const areas=['Boiler','Sand Filter','Rinse Tank'].filter(a=>state.phArea==='all'||state.phArea===a); const labels=hourLabels(); const ds=areas.map((a,i)=>({label:a,data:labels.map(h=>avg(rows.filter(r=>String(get(r,'Area','area'))===a && String(get(r,'Entry Time','entryTime')).slice(0,2)===h.slice(0,2)),r=>getNum(r,'PH Reading','phReading'))),borderColor:[COLORS.dark,COLORS.blue,COLORS.green2][i],backgroundColor:'transparent',tension:.35})); ds.push({label:'Target Range (6.5 - 8.5)',data:labels.map(()=>8.5),borderColor:'#94a3b8',borderDash:[5,5],pointRadius:0}); makeChart(id,'line',{labels,datasets:ds},{scales:{y:{min:0,max:14,ticks:{color:getCss('--muted')},grid:{color:'rgba(100,116,139,.13)'},title:{display:true,text:'pH'}}}}); }
function renderBoilerChart(id, rows){ rows=filterBoilers(rows); const labels=hourLabels(); const ds=[]; if(state.signal.pv) ds.push({label:'PV (°C)',data:labels.map(h=>avg(rows.filter(r=>String(get(r,'Entry Time','entryTime')).slice(0,2)===h.slice(0,2)),r=>getNum(r,'Current Temperature PV','currentTemperaturePV'))),borderColor:COLORS.green,backgroundColor:'transparent',tension:.35}); if(state.signal.sv) ds.push({label:'SV (°C)',data:labels.map(h=>avg(rows.filter(r=>String(get(r,'Entry Time','entryTime')).slice(0,2)===h.slice(0,2)),r=>getNum(r,'Set Temperature SV','setTemperatureSV'))),borderColor:COLORS.green2,borderDash:[6,4],backgroundColor:'transparent',tension:.35}); if(state.signal.a) ds.push({label:'Current A',data:labels.map(h=>avg(rows.filter(r=>String(get(r,'Entry Time','entryTime')).slice(0,2)===h.slice(0,2)),r=>getNum(r,'Current A','currentA'))),borderColor:COLORS.warn,backgroundColor:'transparent',tension:.35}); makeChart(id,'line',{labels,datasets:ds}); }
function dailyLabels(){ return ['Jun 19','Jun 20','Jun 21','Jun 22','Jun 23','Jun 24','Jun 25']; }
function hourLabels(){ return ['00 AM','03 AM','06 AM','09 AM','12 PM','03 PM','06 PM','09 PM']; }
function seriesDaily(rows, fn){ const val=fn(); return dailyLabels().map((_,i)=> Math.max(0,val*(.88+((i%4)*.04)))); }
function group(arr, fn){ return (arr||[]).reduce((o,r)=>{ const k=fn(r); (o[k]=o[k]||[]).push(r); return o; },{}); }
function groupLabels(arr,...keys){ return Object.keys(group(arr,r=>get(r,...keys)||'Unknown')); }
function groupSum(arr,k1,k2,v1,v2){ const g=group(arr,r=>get(r,k1,k2)||'Unknown'); return Object.values(g).map(rows=>sum(rows,r=>getNum(r,v1,v2))); }
function updateChartsTheme(){ Object.values(charts).forEach(c=>{ if(c){ c.options=chartOptions(c.options); c.update(); }}); }

function renderTables(){ const d=filtered(); renderInsights(d); renderReceivingTable(d); renderProcessTable(d); renderWasteTable(d); renderSalesTable(d); renderReportsTable(d); }
function renderTable(el, headers, rows, rowClick){ const h=headers.map(x=>`<th>${x}</th>`).join(''); const b=rows.length?rows.map((r,idx)=>`<tr data-idx="${idx}">${headers.map(k=>`<td>${r[k]??''}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">No data yet</td></tr>`; el.innerHTML=`<thead><tr>${h}</tr></thead><tbody>${b}</tbody>`; if(rowClick) $$('tbody tr',el).forEach(tr=>tr.addEventListener('click',()=>rowClick(rows[tr.dataset.idx]))); }
function renderInsights(d){ const c=compute(d); const rows=[{Date:state.dateTo,'Total Waste (MT)':fmt(c.waste/1000,2),'% of Input':pct(c.wastePercent),'Actual Loss (MT)':fmt(c.actualLoss/1000,2),'Downtime (Min)':fmt(c.downtime,0),'Stops Count':fmt(c.stops,0),'Trend':'⌁⌁⌁'}]; renderTable($('#insightsTable'),Object.keys(rows[0]),rows); }
function renderReceivingTable(d){ const rows=d.receivings.map(r=>({'Date':get(r,'Date','date'),'Supplier':get(r,'Supplier Name','supplierName'),'Region':get(r,'Region','region'),'Vehicle':get(r,'Vehicle Number','vehicleNumber'),'Bales':get(r,'Bales Count','balesCount'),'Net Kg':fmt(getNum(r,'Net Weight Kg','netWeightKg'),0),'After Discount Kg':fmt(getNum(r,'Net Weight After Discount Kg','netWeightAfterDiscountKg'),0),'Avg Bale Kg':fmt(getNum(r,'Avg Bale Weight Kg','avgBaleWeightKg'),1)})); renderTable($('#receivingTable'),['Date','Supplier','Region','Vehicle','Bales','Net Kg','After Discount Kg','Avg Bale Kg'],rows); }
function renderProcessTable(d){ const rows=[...d.boilers.map(r=>({'Type':'Boiler','Date':get(r,'Date','date'),'Time':get(r,'Entry Time','entryTime'),'Area':`B${get(r,'Boiler Number','boilerNumber')} M${get(r,'Meter Number','meterNumber')}`,'PV / PH':fmt(getNum(r,'Current Temperature PV','currentTemperaturePV'),1),'SV':fmt(getNum(r,'Set Temperature SV','setTemperatureSV'),1),'Current A':fmt(getNum(r,'Current A','currentA'),1)})),...d.ph.map(r=>({'Type':'PH','Date':get(r,'Date','date'),'Time':get(r,'Entry Time','entryTime'),'Area':get(r,'Area','area'),'PV / PH':fmt(getNum(r,'PH Reading','phReading'),2),'SV':'','Current A':''}))]; renderTable($('#processTable'),['Type','Date','Time','Area','PV / PH','SV','Current A'],rows); }
function renderWasteTable(d){ const rows=d.waste.map(r=>({'Date':get(r,'Date','date'),'Sortex Kg':fmt(getNum(r,'Sortex Weight Kg','sortexWeightKg'),0),'Big Flex Kg':fmt(getNum(r,'Big Flex Weight Kg','bigFlexWeightKg'),0),'Wire & Bag Kg':fmt(getNum(r,'Wire Bag Weight Kg','wireBagWeightKg'),0),'Caps & Labels Kg':fmt(getNum(r,'Caps Labels Weight Kg','capsLabelsWeightKg'),0),'Total Kg':fmt(getNum(r,'Total Waste Kg','totalWasteKg'),0)})); const down=d.downtimes.map(r=>({'Date':get(r,'Date','date'),'Sortex Kg':'Stop','Big Flex Kg':get(r,'Reason','reason'),'Wire & Bag Kg':get(r,'Stop From','stopFrom'),'Caps & Labels Kg':get(r,'Stop To','stopTo'),'Total Kg':fmt(getNum(r,'Downtime Minutes','downtimeMinutes'),0)+' min'})); renderTable($('#wasteTable'),['Date','Sortex Kg','Big Flex Kg','Wire & Bag Kg','Caps & Labels Kg','Total Kg'],[...rows,...down]); }
function renderSalesTable(d){ const rows=d.sales.map(r=>({'Date':get(r,'Date','date'),'Factory':get(r,'Buyer Factory Name','buyerFactoryName'),'Location':get(r,'Buyer Factory Location','buyerFactoryLocation'),'Vehicle':get(r,'Vehicle Number','vehicleNumber'),'Driver':get(r,'Driver Name','driverName'),'Net Kg':fmt(getNum(r,'Net Trip Weight Kg','netTripWeightKg'),0),'After Discount':fmt(getNum(r,'Net Weight After Discount Kg','netWeightAfterDiscountKg'),0),'Price After':fmt(getNum(r,'Sale Price After Discount','salePriceAfterDiscount'),0)})); renderTable($('#salesTable'),['Date','Factory','Location','Vehicle','Driver','Net Kg','After Discount','Price After'],rows); }
function renderReportsTable(d){ const rows=[...d.shifts.map(r=>({Table:'Shift',Date:get(r,'Date','date'),Info:get(r,'Shift Type','shiftType'),Value:get(r,'Net Production Kg','netProductionKg')})),...d.receivings.map(r=>({Table:'Receiving',Date:get(r,'Date','date'),Info:get(r,'Supplier Name','supplierName'),Value:get(r,'Net Weight After Discount Kg','netWeightAfterDiscountKg')})),...d.waste.map(r=>({Table:'Waste',Date:get(r,'Date','date'),Info:'Total Waste',Value:get(r,'Total Waste Kg','totalWasteKg')}))]; renderTable($('#reportsTable'),['Table','Date','Info','Value'],rows); }

const entryTypes=[['shift','Shift'],['receiving','Receiving'],['downtime','Downtime'],['boiler','Boiler Reading'],['ph','PH Reading'],['waste','Waste'],['sale','Sale']];
function openEntryModal(){ $('#entryModal').classList.remove('hidden'); buildEntryTabs(); buildEntryForm(); }
function closeEntryModal(){ $('#entryModal').classList.add('hidden'); }
function buildEntryTabs(){ $('#entryTabs').innerHTML=entryTypes.map(([k,l])=>`<button type="button" class="entry-tab ${entryType===k?'active':''}" data-entry="${k}">${l}</button>`).join(''); $$('.entry-tab').forEach(b=>b.onclick=()=>{entryType=b.dataset.entry; boilerTab=1; buildEntryTabs(); buildEntryForm();}); }
function field(name,label,type='text',value='',opts={}){ if(type==='select') return `<div class="field"><label>${label}</label><select name="${name}">${opts.options.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`; if(type==='textarea') return `<div class="field full"><label>${label}</label><textarea name="${name}">${value}</textarea></div>`; return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${value}" ${opts.step?`step="${opts.step}"`:''}/></div>`; }
function buildEntryForm(){ const now=new Date(); const d=today(); const t=now.toTimeString().slice(0,5); let html='';
  if(entryType==='shift') html=[field('date','Date','date',d),field('entryTime','Entry Time','time',t),field('shiftType','Shift Type','select','',{options:['Day','Night']}),field('shiftStart','Shift Start','time'),field('shiftEnd','Shift End','time'),field('workersCount','Workers Count','number'),field('factoryName','Factory Name'),field('factoryOwner','Factory Owner'),field('consumedBalesCount','Consumed Bales Count','number'),field('producedBagsCount','Produced Bags Count','number'),field('avgBagWeightKg','Avg Bag Weight Kg','number','25',{step:'0.01'}),field('netProductionKg','Net Production Kg','number'),field('notes','Notes','textarea')].join('');
  if(entryType==='receiving') html=[field('date','Date','date',d),field('entryTime','Entry Time','time',t),field('supplierName','Supplier Name'),field('region','Region'),field('vehicleNumber','Vehicle Number'),field('driverName','Driver Name'),field('balesCount','Bales Count','number'),field('pricePerTonThousand','Price Per Ton Thousand','number'),field('karteNumber','Karte Number'),field('grossWeightKg','Gross Weight Kg','number'),field('tareWeightKg','Tare Weight Kg','number'),field('discountPercent','Discount Percent','number','0',{step:'0.01'}),field('notes','Notes','textarea')].join('');
  if(entryType==='downtime') html=[field('date','Date','date',d),field('entryTime','Entry Time','time',t),field('stopFrom','Stop From','time'),field('stopTo','Stop To','time'),field('reason','Reason'),field('type','Type','select','',{options:['Machine Fault','Labor Break','Cleaning','Power','Water','Other']}),field('notes','Notes','textarea')].join('');
  if(entryType==='ph') html=[field('date','Date','date',d),field('entryTime','Entry Time','time',t),field('area','Area','select','',{options:['Boiler','Sand Filter','Rinse Tank']}),field('phReading','PH Reading','number','',{step:'0.01'}),field('notes','Notes','textarea')].join('');
  if(entryType==='waste') html=[field('date','Date','date',d),field('entryTime','Entry Time','time',t),field('sortexWeightKg','Sortex Weight Kg','number'),field('sortexCount','Sortex Count','number'),field('bigFlexWeightKg','Big Flex Weight Kg','number'),field('bigFlexCount','Big Flex Count','number'),field('wireBagWeightKg','Wire & Bag Weight Kg','number'),field('wireBagCount','Wire & Bag Count','number'),field('capsLabelsWeightKg','Caps & Labels Weight Kg','number'),field('capsLabelsCount','Caps & Labels Count','number'),field('notes','Notes','textarea')].join('');
  if(entryType==='sale') html=[field('date','Date','date',d),field('entryTime','Entry Time','time',t),field('buyerFactoryName','Buyer Factory Name'),field('buyerFactoryLocation','Buyer Factory Location'),field('vehicleNumber','Vehicle Number'),field('driverName','Driver Name'),field('netTripWeightKg','Net Trip Weight Kg','number'),field('discountPercent','Discount Percent','number','0',{step:'0.01'}),field('flexPricePerTonThousand','Flex Price Per Ton Thousand','number'),field('notes','Notes','textarea')].join('');
  if(entryType==='boiler') html=buildBoilerBatchForm(d,t);
  html += '<div class="form-actions"><button class="btn ghost" type="button" id="cancelEntry">Cancel</button><button class="btn primary" type="submit">Save to Google Sheets</button></div>';
  $('#entryForm').innerHTML=html; $('#cancelEntry').onclick=closeEntryModal; $('#entryForm').onsubmit=saveEntry;
  $$('.boiler-tab').forEach(b=>b.onclick=()=>{ boilerTab=Number(b.dataset.boiler); buildEntryForm(); });
}
function buildBoilerBatchForm(d,t){ const rows=[1,2,3,4,5,6].map(i=>`<div class="boiler-row"><div>Meter ${i}</div><div><input name="b${boilerTab}m${i}pv" type="number" step="0.1" /></div><div><input name="b${boilerTab}m${i}sv" type="number" step="0.1" /></div><div><input name="b${boilerTab}m${i}a" type="number" step="0.1" /></div></div>`).join(''); return `${field('date','Date','date',d)}${field('entryTime','Entry Time','time',t)}<div class="boiler-tabs"><button type="button" class="boiler-tab ${boilerTab===1?'active':''}" data-boiler="1">Boiler 1</button><button type="button" class="boiler-tab ${boilerTab===2?'active':''}" data-boiler="2">Boiler 2</button></div><div class="boiler-table"><div class="boiler-row header"><div>Meter</div><div>Current Temperature PV</div><div>Set Temperature SV</div><div>Current A</div></div>${rows}</div><div class="field full"><label>Notes</label><textarea name="notes"></textarea></div>`; }
async function saveEntry(e){ e.preventDefault(); const fd=new FormData(e.target); const data=Object.fromEntries(fd.entries()); let action='save'+entryType[0].toUpperCase()+entryType.slice(1); let payload=data;
  if(entryType==='boiler'){ action='saveBoilerBatch'; payload=[]; [1,2].forEach(b=>[1,2,3,4,5,6].forEach(m=>{ const pv=fd.get(`b${b}m${m}pv`), sv=fd.get(`b${b}m${m}sv`), a=fd.get(`b${b}m${m}a`); if(pv||sv||a) payload.push({date:data.date,entryTime:data.entryTime,boilerNumber:b,meterNumber:m,currentTemperaturePV:pv,setTemperatureSV:sv,currentA:a,notes:data.notes||''}); })); if(!payload.length){ toast('Enter at least one boiler reading','bad'); return; } }
  if(entryType==='ph') action='savePH'; if(entryType==='sale') action='saveSale';
  try{ await saveToSheets(action,payload); toast('Saved to Google Sheets successfully','good'); closeEntryModal(); await loadFromSheets(); }
  catch(err){ console.error(err); writeLocalFallback(action,payload); toast('Google Sheets save failed. Saved locally as backup.','bad'); raw=readLocalFallback(); renderAll(); }
}
async function saveToSheets(action,data){
  const body={action,data};
  try{ const res=await fetch(APPS_SCRIPT_URL,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}); const txt=await res.text(); const json=JSON.parse(txt); if(!json.ok) throw new Error(json.error||'Save failed'); return json; }catch(e){
    const payload=encodeURIComponent(JSON.stringify(body)); const json=await jsonp(`${APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}&payload=${payload}`); if(!json.ok) throw new Error(json.error||'Save failed'); return json;
  }
}
function exportCurrentPage(){ const tables={overview:$('#insightsTable'),receiving:$('#receivingTable'),process:$('#processTable'),waste:$('#wasteTable'),sales:$('#salesTable'),reports:$('#reportsTable')}; const table=tables[state.page]||$('#reportsTable'); const rows=[...table.querySelectorAll('tr')].map(tr=>[...tr.children].map(td=>`"${td.textContent.replace(/"/g,'""')}"`).join(',')); const blob=new Blob(['\ufeff'+rows.join('\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`environ-adapt-${state.page}.csv`; a.click(); URL.revokeObjectURL(a.href); }
