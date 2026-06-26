'use strict';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLnb2avucZNZtn7OZ8VFUCgEfC1tzyyM1z9RcNSHHnOASSUiB9SfXgb39pKBDeelQYQA/exec';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const state = {
  page: 'overview', lang: localStorage.getItem('lang') || 'en', dark: localStorage.getItem('dark') === '1',
  raw: {shifts:[],receivings:[],downtimes:[],boilers:[],ph:[],waste:[],sales:[]}, filtered: {},
  activeFilter: null, charts: {}, entryType: 'shift', boilerTab: 1, boilerDraft: {}, loading: false
};

const i18n = {
  en: {overview:'Overview',receiving:'Receiving & Production',process:'Process, PH & Boilers',waste:'Waste & Downtime',sales:'Sales & Export',reports:'Reports'},
  ar: {overview:'الملخص العام',receiving:'التوريد والإنتاج',process:'التشغيل و PH والغلايات',waste:'الهالك والتوقفات',sales:'المبيعات والتصدير',reports:'التقارير'}
};

function normalizeKey(k){return String(k||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');}
function rowVal(row, names, fallback=''){
  for(const n of names){
    const nk = normalizeKey(n);
    if(row[n] !== undefined && row[n] !== null && row[n] !== '') return row[n];
    for(const key of Object.keys(row||{})) if(normalizeKey(key)===nk && row[key]!=='' && row[key]!==null && row[key]!==undefined) return row[key];
  }
  return fallback;
}
function num(v){ if(v===null||v===undefined||v==='') return 0; if(typeof v==='number') return isFinite(v)?v:0; const x=Number(String(v).replace(/,/g,'').replace('%','').trim()); return isFinite(x)?x:0; }
function fmt(n,d=2){return num(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});}
function fmt0(n){return num(n).toLocaleString('en-US',{maximumFractionDigits:0});}
function mt(kg){return num(kg)/1000;}
function pct(part,total){return num(total)?(num(part)/num(total)*100):0;}
function safeDiv(a,b){return num(b)?num(a)/num(b):0;}
function parseDate(v){
  if(!v) return null;
  if(v instanceof Date) return v;
  if(typeof v === 'number') return new Date(Math.round((v-25569)*86400*1000));
  const s = String(v).trim();
  const d = new Date(s); if(!isNaN(d)) return d;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/); if(m) return new Date(+m[3],+m[2]-1,+m[1]);
  return null;
}
function dateKey(v){const d=parseDate(v); if(!d) return ''; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function timeLabel(v){ if(!v) return ''; if(typeof v==='string') return v.replace(/:\d{2}\s*$/,''); if(v instanceof Date) return `${String(v.getHours()).padStart(2,'0')}:${String(v.getMinutes()).padStart(2,'0')}`; return String(v); }
function shiftType(row){return String(rowVal(row,['Shift Type','shiftType'],'')).trim() || 'Day';}

function showToast(msg, type='ok'){const t=$('#toast'); t.textContent=msg; t.className=`toast ${type==='error'?'error':type==='warn'?'warn':''}`; setTimeout(()=>t.classList.add('hidden'),4200);}
function setConnection(text, ok=true){$('#connectionState').innerHTML=`<span class="dot"></span> ${text}`; $('#sideStatus').textContent = ok ? 'Synced with Google Sheets' : 'Connection issue';}

function jsonp(action, params={}){
  return new Promise((resolve,reject)=>{
    const cb = 'cb_'+Date.now()+'_'+Math.floor(Math.random()*999999);
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('callback', cb);
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k, typeof v==='string'?v:JSON.stringify(v)));
    const script=document.createElement('script');
    const timer=setTimeout(()=>{cleanup(); reject(new Error('Google Sheets request timeout'));},20000);
    function cleanup(){clearTimeout(timer); delete window[cb]; script.remove();}
    window[cb]=(data)=>{cleanup(); data && data.ok===false ? reject(new Error(data.error||'Google Sheets error')) : resolve(data);};
    script.onerror=()=>{cleanup(); reject(new Error('Cannot reach Google Apps Script'));};
    script.src=url.toString(); document.body.appendChild(script);
  });
}

async function loadData(){
  state.loading=true; setConnection('Loading...', true);
  try{
    const res = await jsonp('getDashboardData');
    const s = res.sheets || res.data || res || {};
    state.raw = {shifts:s.shifts||[], receivings:s.receivings||[], downtimes:s.downtimes||[], boilers:s.boilers||[], ph:s.ph||[], waste:s.waste||[], sales:s.sales||[]};
    setConnection('Ready', true); applyFilters(); render();
  }catch(e){
    console.error(e); setConnection('Offline', false); showToast('Google Sheets read failed: '+e.message,'error'); applyFilters(); render();
  }finally{state.loading=false;}
}

function applyFilters(){
  const from = $('#dateFrom').value; const to = $('#dateTo').value; const sh = $('#shiftFilter').value;
  const byDate = r => {const dk=dateKey(rowVal(r,['Date','date'])); return (!from || dk>=from) && (!to || dk<=to);};
  const byShift = r => sh==='all' || shiftType(r)===sh || String(rowVal(r,['Shift ID'])).toLowerCase().includes(sh.toLowerCase());
  const all = state.raw;
  state.filtered = {
    shifts: all.shifts.filter(r=>byDate(r)&&byShift(r)),
    receivings: all.receivings.filter(r=>byDate(r)&&byShift(r)),
    downtimes: all.downtimes.filter(r=>byDate(r)&&byShift(r)),
    boilers: all.boilers.filter(r=>byDate(r)&&byShift(r)),
    ph: all.ph.filter(r=>byDate(r)&&byShift(r)),
    waste: all.waste.filter(r=>byDate(r)&&byShift(r)),
    sales: all.sales.filter(r=>byDate(r)&&byShift(r))
  };
}
function metrics(){
  const f=state.filtered;
  const receivingKg = f.receivings.reduce((a,r)=>a+num(rowVal(r,['Net Weight After Discount Kg','Net Weight After Discount','netWeightAfterDiscountKg'])),0);
  const receivingTrips = f.receivings.length;
  const consumedKg = f.shifts.reduce((a,r)=>a+(num(rowVal(r,['Consumed Weight Kg'])) || num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg']))),0);
  const bales = f.shifts.reduce((a,r)=>a+num(rowVal(r,['Consumed Bales Count'])),0);
  const prodKg = f.shifts.reduce((a,r)=>a+(num(rowVal(r,['Net Production Kg'])) || num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg']))),0);
  const bags = f.shifts.reduce((a,r)=>a+num(rowVal(r,['Produced Bags Count'])),0);
  const wasteKg = f.waste.reduce((a,r)=>a+ (num(rowVal(r,['Total Waste Weight Kg'])) || num(rowVal(r,['Sortex Weight Kg']))+num(rowVal(r,['Big Flex Weight Kg']))+num(rowVal(r,['Wire And Bags Weight Kg']))+num(rowVal(r,['Broken Caps Labels Weight Kg']))),0);
  const downtimeMin = f.downtimes.reduce((a,r)=>a+num(rowVal(r,['Downtime Minutes'])),0);
  const phVals = f.ph.map(r=>num(rowVal(r,['PH Reading','PH']))).filter(Boolean);
  const avgPh = phVals.length ? phVals.reduce((a,b)=>a+b,0)/phVals.length : 0;
  const pvVals = f.boilers.map(r=>num(rowVal(r,['Current Temperature PV']))).filter(Boolean);
  const svVals = f.boilers.map(r=>num(rowVal(r,['Set Temperature SV']))).filter(Boolean);
  const avgPv = pvVals.length ? pvVals.reduce((a,b)=>a+b,0)/pvVals.length : 0;
  const avgSv = svVals.length ? svVals.reduce((a,b)=>a+b,0)/svVals.length : 0;
  const actualLossKg = Math.max(0, consumedKg - prodKg - wasteKg);
  return {receivingKg,receivingTrips,consumedKg,bales,prodKg,bags,wasteKg,downtimeMin,stops:f.downtimes.length,avgPh,avgPv,avgSv,actualLossKg,
    materialPct:pct(prodKg,consumedKg), materialRatio:safeDiv(consumedKg,prodKg), operationPct:pct(prodKg,receivingKg), operationRatio:safeDiv(receivingKg,prodKg), actualPct:pct(prodKg,prodKg+wasteKg), actualRatio:safeDiv(prodKg+wasteKg,prodKg)};
}
function kpi(title, value, sub, icon='✓', cls='') { return `<article class="kpi-card ${cls}"><div class="kpi-icon">${icon}</div><div><div class="kpi-title">${title}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub||''}</div></div></article>`; }
function yieldKpi(title, ratio, percent, sub, icon){ return `<article class="kpi-card"><div class="kpi-icon">${icon}</div><div><div class="kpi-title">${title}</div><div class="kpi-value ratio-line"><span>${fmt(ratio,2)} <span class="unit">kg/kg</span></span><span class="pct">${fmt(percent,1)}%</span></div><div class="kpi-sub">${sub}</div></div></article>`; }

function render(){
  document.documentElement.dir = state.lang==='ar'?'rtl':'ltr';
  document.body.classList.toggle('dark', state.dark);
  $$('#brandLogo').forEach(img=>img.src = state.dark?'assets/logo-environ-adapt-white.png':'assets/logo-environ-adapt-light.png');
  $$('[data-i18n]').forEach(el=>el.textContent=i18n[state.lang][el.dataset.i18n]||el.textContent);
  const titles={overview:'Environ Adapt Operations Dashboard',receiving:'Receiving & Production',process:'Process, PH & Boilers',waste:'Waste & Downtime',sales:'Sales & Export',reports:'Reports'};
  $('#pageTitle').textContent = titles[state.page] || titles.overview;
  const fn = {overview:renderOverview, receiving:renderReceiving, process:renderProcess, waste:renderWaste, sales:renderSales, reports:renderReports}[state.page] || renderOverview;
  fn();
}

function renderOverview(){
  const m=metrics(), root=$('#page-overview');
  root.innerHTML = `<div class="kpi-grid">
    ${kpi('Consumed Weight', `${fmt(m.consumedKg/1000,2)} <span class="unit">MT</span>`, `${fmt0(m.bales)} bales`, '⇩')}
    ${kpi('Net Production', `${fmt(m.prodKg/1000,2)} <span class="unit">MT</span>`, `${fmt0(m.bags)} bags`, '✓')}
    ${kpi('Total Waste', `${fmt(m.wasteKg/1000,2)} <span class="unit">MT</span>`, `${fmt(pct(m.wasteKg,m.consumedKg),1)}% of consumed`, '♻')}
    ${kpi('Actual Loss', `${fmt(m.actualLossKg/1000,2)} <span class="unit">MT</span>`, `${fmt(pct(m.actualLossKg,m.consumedKg),1)}% of consumed`, '↘')}
    ${yieldKpi('Material Yield',m.materialRatio,m.materialPct,'Consumed / Production','✤')}
    ${yieldKpi('Operation Yield',m.operationRatio,m.operationPct,'Receiving / Production','⚙')}
    ${yieldKpi('Actual Yield',m.actualRatio,m.actualPct,'Production + Waste / Production','◎')}
    ${kpi('Average PH', `${fmt(m.avgPh,2)}`, `PV ${fmt(m.avgPv,1)}°C | Δ ${fmt(m.avgPv-m.avgSv,1)}`, 'pH')}
  </div>
  <div class="grid-3">
    <section class="panel"><h3>Production Balance (MT)</h3>${productionFlow(m)}</section>
    <section class="panel"><div class="panel-head"><h3>Production Trend (MT)</h3><select id="prodTrendMode"><option>Daily</option></select></div><div class="chart-wrap" id="prodTrendBox"><canvas id="prodTrendChart"></canvas></div></section>
    <section class="panel"><h3>Waste by Type (MT)</h3><div class="chart-wrap" id="wastePieBox"><canvas id="wastePieChart"></canvas></div></section>
  </div>
  <div class="grid-2" style="margin-top:18px">
    <section class="panel"><div class="panel-head"><h3>PH Trend by Area (by Hour)</h3>${phFilterHtml()}</div><div class="chart-wrap"><canvas id="phTrendChart"></canvas></div></section>
    <section class="panel"><div class="panel-head"><h3>Boiler Monitoring (PV / SV)</h3>${boilerFilterHtml()}</div><div id="meterCards" class="meter-cards"></div><div class="chart-wrap"><canvas id="boilerTrendChart"></canvas></div></section>
  </div>
  <div class="grid-2" style="margin-top:18px"><section class="panel"><h3>Latest Records</h3>${recordsTable(state.filtered.shifts.slice(-8).reverse(), ['Date','Shift Type','Consumed Weight Kg','Net Production Kg','Material Yield Percent'])}</section><section class="panel"><h3>Operational Summary</h3>${summaryStrip(m)}</section></div>`;
  wireLocalFilters(); drawOverviewCharts();
}
function productionFlow(m){return `<div class="flow-card"><div class="flow-box"><b>Consumed</b><strong>${fmt(m.consumedKg/1000,2)} MT</strong><span>100%</span></div><div class="flow-box light"><b>Net Production</b><strong>${fmt(m.prodKg/1000,2)} MT</strong><span>${fmt(m.materialPct,1)}%</span></div><div class="flow-col"><div class="flow-box warn"><b>Waste</b><strong>${fmt(m.wasteKg/1000,2)} MT</strong><span>${fmt(pct(m.wasteKg,m.consumedKg),1)}%</span></div><div class="flow-box danger"><b>Actual Loss</b><strong>${fmt(m.actualLossKg/1000,2)} MT</strong><span>${fmt(pct(m.actualLossKg,m.consumedKg),1)}%</span></div></div></div>`;}
function summaryStrip(m){return `<div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">${kpi('Total Operating Time','12h','Assuming one shift','◷')}${kpi('Avg Stop Time',`${fmt(m.stops?m.downtimeMin/m.stops:0,1)} min`,'Per Stop','⏸')}${kpi('Stops Count',fmt0(m.stops),'Records','▢')}${kpi('Downtime Minutes',fmt0(m.downtimeMin),'Total','◴')}</div>`;}

function aggregateByDate(rows, getter){const map={}; rows.forEach(r=>{const k=dateKey(rowVal(r,['Date'])); if(!k) return; map[k]=(map[k]||0)+getter(r);}); return map;}
function alignedSeries(maps){const labels=Array.from(new Set(maps.flatMap(mp=>Object.keys(mp)))).sort(); return {labels, datasets:maps.map(mp=>labels.map(l=>mp[l]||0))};}
function drawOverviewCharts(){
  const f=state.filtered;
  const prod=aggregateByDate(f.shifts, r=>(num(rowVal(r,['Net Production Kg'])) || num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg'])))/1000);
  const cons=aggregateByDate(f.shifts, r=>(num(rowVal(r,['Consumed Weight Kg'])) || num(rowVal(r,['Consumed Bales Count']))*num(rowVal(r,['Average Bale Weight Kg'])))/1000);
  const loss=aggregateByDate(f.shifts, r=>0); Object.keys(cons).forEach(k=>loss[k]=Math.max(0,(cons[k]||0)-(prod[k]||0)));
  const s=alignedSeries([cons,prod,loss]); drawLine('prodTrendChart', s.labels, [{label:'Consumed',data:s.datasets[0],color:'#076b39'},{label:'Production',data:s.datasets[1],color:'#19c653'},{label:'Actual Loss',data:s.datasets[2],color:'#ef4444'}]);
  drawWastePie(); drawPHTrend(); drawBoilerTrend();
}
function drawWastePie(){const f=state.filtered.waste; const vals={Sortex:0,'Big Flex':0,'Wire & Bag':0,'Caps & Labels':0}; f.forEach(r=>{vals.Sortex+=num(rowVal(r,['Sortex Weight Kg'])); vals['Big Flex']+=num(rowVal(r,['Big Flex Weight Kg'])); vals['Wire & Bag']+=num(rowVal(r,['Wire And Bags Weight Kg'])); vals['Caps & Labels']+=num(rowVal(r,['Broken Caps Labels Weight Kg']));}); const total=Object.values(vals).reduce((a,b)=>a+b,0); if(!total){emptyBox('wastePieBox','No waste data yet'); return;} drawDoughnut('wastePieChart', Object.keys(vals), Object.values(vals).map(v=>v/1000), ['#0a9d4d','#4ade68','#1e9fe0','#f59e0b']);}
function phFilterHtml(){return `<div class="filters-row"><button class="chip active" data-ph="all">All Areas</button><button class="chip" data-ph="Boiler">Boiler</button><button class="chip" data-ph="Sand Filter">Sand Filter</button><button class="chip" data-ph="Rinse Tank">Rinse Tank</button></div>`}
function boilerFilterHtml(){return `<div class="filters-row"><select id="boilerSel"><option value="all">All Boilers</option><option value="1">Boiler 1</option><option value="2">Boiler 2</option></select><select id="meterSel"><option value="all">All Meters</option>${[1,2,3,4,5,6].map(i=>`<option value="${i}">Meter ${i}</option>`).join('')}</select><button class="chip active" data-boiler-mode="pv">PV</button><button class="chip active" data-boiler-mode="sv">SV</button><button class="chip" data-boiler-mode="amp">Current A</button></div>`}
function wireLocalFilters(){
  $$('[data-ph]').forEach(b=>b.onclick=()=>{$$('[data-ph]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); drawPHTrend(b.dataset.ph);});
  $$('#boilerSel,#meterSel').forEach(el=>el.onchange=()=>drawBoilerTrend());
  $$('[data-boiler-mode]').forEach(b=>b.onclick=()=>{b.classList.toggle('active'); drawBoilerTrend();});
}
function drawPHTrend(area='all'){
  let rows=state.filtered.ph; if(area && area!=='all') rows=rows.filter(r=>String(rowVal(r,['Area'])).toLowerCase()===area.toLowerCase());
  const areas = area==='all'||!area ? ['Boiler','Sand Filter','Rinse Tank'] : [area];
  const labels=Array.from(new Set(rows.map(r=>timeLabel(rowVal(r,['Entry Time']))).filter(Boolean))).sort();
  if(!rows.length||!labels.length){emptyCanvas('phTrendChart','No PH readings in selected range'); return;}
  const colors=['#08753c','#1d6fe8','#34d366'];
  const datasets=areas.map((a,i)=>({label:a,data:labels.map(l=>{const vals=rows.filter(r=>timeLabel(rowVal(r,['Entry Time']))===l && String(rowVal(r,['Area'])).toLowerCase()===a.toLowerCase()).map(r=>num(rowVal(r,['PH Reading']))); return vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:null;}),color:colors[i]}));
  drawLine('phTrendChart', labels, datasets);
}
function drawBoilerTrend(){
  const bs=$('#boilerSel')?.value || 'all', ms=$('#meterSel')?.value || 'all'; const modes=$$('[data-boiler-mode].active').map(x=>x.dataset.boilerMode);
  let rows=state.filtered.boilers; if(bs!=='all') rows=rows.filter(r=>String(rowVal(r,['Boiler Number']))===bs); if(ms!=='all') rows=rows.filter(r=>String(rowVal(r,['Meter Number']))===ms);
  renderMeterCards(rows);
  const labels=Array.from(new Set(rows.map(r=>timeLabel(rowVal(r,['Entry Time']))).filter(Boolean))).sort(); if(!rows.length||!labels.length){emptyCanvas('boilerTrendChart','No boiler readings in selected range'); return;}
  const make=(field,label,color)=>({label,data:labels.map(l=>{const vals=rows.filter(r=>timeLabel(rowVal(r,['Entry Time']))===l).map(r=>num(rowVal(r,[field]))).filter(v=>v||v===0); return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}),color});
  const ds=[]; if(modes.includes('pv')) ds.push(make('Current Temperature PV','PV (°C)','#0aa754')); if(modes.includes('sv')) ds.push(make('Set Temperature SV','SV (°C)','#34d366')); if(modes.includes('amp')) ds.push(make('Current Ampere','Current A','#f59e0b'));
  drawLine('boilerTrendChart', labels, ds);
}
function renderMeterCards(rows){const box=$('#meterCards'); if(!box)return; const bs=$('#boilerSel')?.value || '1'; const boiler=bs==='all'?'1':bs; let html=''; for(let i=1;i<=6;i++){const r=[...rows].reverse().find(x=>String(rowVal(x,['Boiler Number']))===boiler && String(rowVal(x,['Meter Number']))===String(i)); html += `<div class="meter-card"><b>B${boiler} • Meter ${i}</b><div>PV <strong>${fmt(num(rowVal(r||{},['Current Temperature PV'])),0)}°C</strong></div><div>SV ${fmt(num(rowVal(r||{},['Set Temperature SV'])),0)}°C</div><div>Current ${fmt(num(rowVal(r||{},['Current Ampere'])),1)} A</div></div>`;} box.innerHTML=html;}
function emptyBox(id,msg){const el=$('#'+id); if(el) el.innerHTML=`<div class="empty-state">${msg}</div>`;}
function emptyCanvas(id,msg){const c=$('#'+id); const parent=c?.parentElement; if(parent) parent.innerHTML=`<div class="empty-state">${msg}</div>`;}
function destroyChart(id){if(state.charts[id]){state.charts[id].destroy(); delete state.charts[id];}}
function chartClick(label,value){state.activeFilter={label,value}; $('#activeFilterText').textContent=`Active chart selection: ${label} (${fmt(value,2)})`; $('#activeFilterBar').classList.remove('hidden'); showToast(`${label}: ${fmt(value,2)}`);}
function drawLine(id, labels, ds){destroyChart(id); const ctx=$('#'+id); if(!ctx) return; if(!labels.length){emptyCanvas(id,'No data');return;} state.charts[id]=new Chart(ctx,{type:'line',data:{labels,datasets:ds.map(d=>({label:d.label,data:d.data,borderColor:d.color,backgroundColor:d.color+'22',tension:.35,spanGaps:true,pointRadius:3}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},interaction:{mode:'nearest',intersect:false},onClick:(e,els)=>{if(els[0]){const i=els[0].index; const di=els[0].datasetIndex; chartClick(ds[di].label+' '+labels[i],ds[di].data[i]);}},scales:{y:{beginAtZero:true}}}});}
function drawDoughnut(id, labels, data, colors){destroyChart(id); const ctx=$('#'+id); if(!ctx)return; state.charts[id]=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'right'}},onClick:(e,els)=>{if(els[0])chartClick(labels[els[0].index],data[els[0].index]);}}});}
function recordsTable(rows, cols){if(!rows.length)return '<div class="empty-state">No records in selected range</div>'; return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${rowVal(r,[c],'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}

function renderReceiving(){const m=metrics(), f=state.filtered; $('#page-receiving').innerHTML=`<div class="kpi-grid">${kpi('Receiving After Discount',`${fmt(m.receivingKg/1000,2)} <span class="unit">MT</span>`,`${m.receivingTrips} trips`,'▣')}${kpi('Avg Bale Weight',`${fmt(safeDiv(m.receivingKg,m.bales),1)} <span class="unit">kg</span>`,`${fmt0(m.bales)} bales`,'▥')}${kpi('Net Production',`${fmt(m.prodKg/1000,2)} <span class="unit">MT</span>`,`${fmt0(m.bags)} bags`,'▦')}${yieldKpi('Material Yield',m.materialRatio,m.materialPct,'Consumed / Production','✤')}</div><div class="grid-2"><section class="panel"><h3>Receiving by Supplier</h3><div class="chart-wrap"><canvas id="supplierChart"></canvas></div></section><section class="panel"><h3>Production by Shift</h3><div class="chart-wrap"><canvas id="prodShiftChart"></canvas></div></section></div><section class="panel" style="margin-top:18px"><h3>Receiving & Production Table</h3>${recordsTable(f.receivings, ['Date','Supplier Name','Region','Vehicle Number','Bales Count','Net Weight After Discount Kg','Average Bale Weight Kg'])}</section>`; drawSupplierCharts();}
function drawSupplierCharts(){const rec=state.filtered.receivings; const map={}; rec.forEach(r=>{const s=rowVal(r,['Supplier Name'],'Unknown'); map[s]=(map[s]||0)+num(rowVal(r,['Net Weight After Discount Kg']))/1000;}); if(Object.keys(map).length) drawLine('supplierChart',Object.keys(map),[{label:'MT',data:Object.values(map),color:'#08a650'}]); else emptyCanvas('supplierChart','No receiving data'); const map2={}; state.filtered.shifts.forEach(r=>{const s=shiftType(r); map2[s]=(map2[s]||0)+(num(rowVal(r,['Net Production Kg']))||num(rowVal(r,['Produced Bags Count']))*num(rowVal(r,['Average Bag Weight Kg'])))/1000;}); if(Object.keys(map2).length) drawLine('prodShiftChart',Object.keys(map2),[{label:'MT',data:Object.values(map2),color:'#34d366'}]); else emptyCanvas('prodShiftChart','No production data');}
function renderProcess(){const m=metrics(); $('#page-process').innerHTML=`<div class="kpi-grid">${kpi('Average PH',fmt(m.avgPh,2),'All readings','pH')}${kpi('Boiler Avg PV',`${fmt(m.avgPv,1)} <span class="unit">°C</span>`,`SV ${fmt(m.avgSv,1)}°C`,'℃')}${kpi('PV / SV Delta',`${fmt(m.avgPv-m.avgSv,1)} <span class="unit">°C</span>`,'Average difference','Δ')}${kpi('Boiler Readings',fmt0(state.filtered.boilers.length),'Records','▤')}</div><div class="grid-2"><section class="panel"><div class="panel-head"><h3>PH Trend by Area</h3>${phFilterHtml()}</div><div class="chart-wrap tall"><canvas id="phTrendChart"></canvas></div></section><section class="panel"><div class="panel-head"><h3>Boiler Monitoring (PV / SV)</h3>${boilerFilterHtml()}</div><div id="meterCards" class="meter-cards"></div><div class="chart-wrap tall"><canvas id="boilerTrendChart"></canvas></div></section></div><section class="panel" style="margin-top:18px"><h3>Latest Boiler Readings</h3>${recordsTable(state.filtered.boilers.slice(-20).reverse(), ['Date','Entry Time','Boiler Number','Meter Number','Current Temperature PV','Set Temperature SV','Current Ampere'])}</section>`; wireLocalFilters(); drawPHTrend(); drawBoilerTrend();}
function renderWaste(){const m=metrics(); $('#page-waste').innerHTML=`<div class="kpi-grid">${kpi('Total Waste',`${fmt(m.wasteKg/1000,2)} <span class="unit">MT</span>`,`${fmt(pct(m.wasteKg,m.consumedKg),1)}% of consumed`,'♻')}${kpi('Actual Loss',`${fmt(m.actualLossKg/1000,2)} <span class="unit">MT</span>`,`${fmt(pct(m.actualLossKg,m.consumedKg),1)}% of consumed`,'↘')}${kpi('Downtime Minutes',fmt0(m.downtimeMin),'Total stop time','◴')}${kpi('Stops Count',fmt0(m.stops),'Records','▢')}</div><div class="grid-2"><section class="panel"><h3>Waste by Type</h3><div class="chart-wrap"><canvas id="wastePieChart"></canvas></div></section><section class="panel"><h3>Downtime by Reason</h3><div class="chart-wrap"><canvas id="downChart"></canvas></div></section></div><section class="panel" style="margin-top:18px"><h3>Downtime Table</h3>${recordsTable(state.filtered.downtimes, ['Date','Stop From Time','Stop To Time','Downtime Minutes','Downtime Reason','Notes'])}</section>`; drawWastePie(); drawDowntime();}
function drawDowntime(){const map={}; state.filtered.downtimes.forEach(r=>{const s=rowVal(r,['Downtime Reason'],'Unknown'); map[s]=(map[s]||0)+num(rowVal(r,['Downtime Minutes']));}); if(Object.keys(map).length) drawLine('downChart',Object.keys(map),[{label:'Minutes',data:Object.values(map),color:'#08a650'}]); else emptyCanvas('downChart','No downtime data');}
function renderSales(){const rows=state.filtered.sales; const total=rows.reduce((a,r)=>a+num(rowVal(r,['Sale Price After Discount'])),0); const kg=rows.reduce((a,r)=>a+num(rowVal(r,['Net Weight After Discount Kg','Net Trip Weight Kg'])),0); $('#page-sales').innerHTML=`<div class="kpi-grid">${kpi('Sales Weight',`${fmt(kg/1000,2)} <span class="unit">MT</span>`,`${rows.length} trips`,'↗')}${kpi('Sales Value',fmt(total,2),'After discount','💰')}</div><section class="panel"><h3>Sales Table</h3>${recordsTable(rows, ['Date','Buyer Factory Name','Buyer Factory Location','Vehicle Number','Net Trip Weight Kg','Sale Price After Discount'])}</section>`;}
function renderReports(){const rows=[...state.filtered.shifts,...state.filtered.receivings,...state.filtered.downtimes,...state.filtered.boilers,...state.filtered.ph,...state.filtered.waste,...state.filtered.sales]; $('#page-reports').innerHTML=`<section class="panel"><h3>Report Data</h3>${recordsTable(rows.slice(0,200), Object.keys(rows[0]||{Message:'No data'}).slice(0,10))}</section>`;}

const entryTypes=[['shift','Shift'],['receiving','Receiving'],['downtime','Downtime'],['boiler','Boiler Reading'],['ph','PH Reading'],['waste','Waste'],['sale','Sale']];
function openEntry(){ $('#entryModal').classList.remove('hidden'); renderEntryTabs(); renderEntryForm(); }
function renderEntryTabs(){ $('#entryTypeTabs').innerHTML=entryTypes.map(([id,txt])=>`<button type="button" class="entry-tab ${state.entryType===id?'active':''}" data-entry="${id}">${txt}</button>`).join(''); $$('[data-entry]').forEach(b=>b.onclick=()=>{saveBoilerDraft(); state.entryType=b.dataset.entry; renderEntryTabs(); renderEntryForm();});}
function today(){return new Date().toISOString().slice(0,10)} function nowTime(){return new Date().toTimeString().slice(0,5)}
function input(name,label,type='text',val=''){return `<label>${label}<input name="${name}" type="${type}" value="${val}"></label>`}
function select(name,label,opts){return `<label>${label}<select name="${name}">${opts.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></label>`}
function renderEntryForm(){
  const d=today(), t=nowTime(); let html='';
  if(state.entryType==='shift') html = `${input('date','Date','date',d)}${input('entryTime','Time','time',t)}${select('shiftType','Shift Type',['Day','Night'])}${input('shiftStartTime','Shift Start','time')}${input('shiftEndTime','Shift End','time')}${input('workersCount','Workers Count','number')}${input('factoryName','Factory Name')}${input('factoryOwner','Factory Owner')}${input('consumedBalesCount','Consumed Bales','number')}${input('averageBaleWeightKg','Avg Bale Weight Kg','number')}${input('producedBagsCount','Produced Bags','number')}${input('averageBagWeightKg','Avg Bag Weight Kg','number')}${input('notes','Notes')}`;
  if(state.entryType==='receiving') html = `${input('date','Date','date',d)}${input('entryTime','Time','time',t)}${input('supplierName','Supplier Name')}${input('region','Region')}${input('vehicleNumber','Vehicle Number')}${input('driverName','Driver Name')}${input('balesCount','Bales Count','number')}${input('pricePerTonThousand','Price Per Ton Thousand','number')}${input('karteNumber','Karte Number')}${input('grossWeightKg','Gross Weight Kg','number')}${input('tareWeightKg','Tare Weight Kg','number')}${input('discountPercent','Discount Percent','number')}${input('notes','Notes')}`;
  if(state.entryType==='downtime') html = `${input('date','Date','date',d)}${input('entryTime','Time','time',t)}${input('stopFromTime','Stop From','time')}${input('stopToTime','Stop To','time')}${input('downtimeReason','Downtime Reason')}${input('notes','Notes')}`;
  if(state.entryType==='ph') html = `${input('date','Date','date',d)}${input('entryTime','Time','time',t)}${select('area','Area',['Boiler','Sand Filter','Rinse Tank'])}${input('phReading','PH Reading','number')}${input('notes','Notes')}`;
  if(state.entryType==='waste') html = `${input('date','Date','date',d)}${input('entryTime','Time','time',t)}${input('sortexWeightKg','Sortex Weight Kg','number')}${input('sortexCount','Sortex Count','number')}${input('bigFlexWeightKg','Big Flex Weight Kg','number')}${input('bigFlexCount','Big Flex Count','number')}${input('wireAndBagsWeightKg','Wire And Bags Weight Kg','number')}${input('wireAndBagsCount','Wire And Bags Count','number')}${input('brokenCapsLabelsWeightKg','Caps & Labels Weight Kg','number')}${input('brokenCapsLabelsCount','Caps & Labels Count','number')}${input('notes','Notes')}`;
  if(state.entryType==='sale') html = `${input('date','Date','date',d)}${input('entryTime','Time','time',t)}${input('buyerFactoryName','Buyer Factory Name')}${input('buyerFactoryLocation','Buyer Factory Location')}${input('vehicleNumber','Vehicle Number')}${input('driverName','Driver Name')}${input('netTripWeightKg','Net Trip Weight Kg','number')}${input('discountPercent','Discount Percent','number')}${input('flexPricePerTonThousand','Flex Price Per Ton Thousand','number')}${input('notes','Notes')}`;
  if(state.entryType==='boiler') html = boilerBatchForm(d,t);
  html += `<div class="entry-actions"><button type="button" class="btn ghost" id="cancelEntry">Cancel</button><button type="submit" class="btn primary">Save</button></div>`;
  $('#entryForm').innerHTML=html; $('#cancelEntry').onclick=()=>$('#entryModal').classList.add('hidden'); $('#entryForm').onsubmit=saveEntry; if(state.entryType==='boiler') wireBoilerForm();
}
function boilerBatchForm(d,t){state.boilerDraft.date=state.boilerDraft.date||d; state.boilerDraft.entryTime=state.boilerDraft.entryTime||t; return `<label>Date<input name="date" type="date" value="${state.boilerDraft.date}"></label><label>Time<input name="entryTime" type="time" value="${state.boilerDraft.entryTime}"></label><div class="boiler-batch"><div class="boiler-tabs"><button type="button" class="chip ${state.boilerTab===1?'active':''}" data-boiler-tab="1">Boiler 1</button><button type="button" class="chip ${state.boilerTab===2?'active':''}" data-boiler-tab="2">Boiler 2</button></div><table class="boiler-table"><thead><tr><th>Meter</th><th>PV</th><th>SV</th><th>Current A</th></tr></thead><tbody>${[1,2,3,4,5,6].map(i=>{const r=(state.boilerDraft[state.boilerTab]||{})[i]||{};return `<tr><td>Meter ${i}</td><td><input data-meter="${i}" data-field="pv" type="number" value="${r.pv||''}"></td><td><input data-meter="${i}" data-field="sv" type="number" value="${r.sv||''}"></td><td><input data-meter="${i}" data-field="currentAmpere" type="number" value="${r.currentAmpere||''}"></td></tr>`}).join('')}</tbody></table></div>`;}
function saveBoilerDraft(){ if(state.entryType!=='boiler') return; const form=$('#entryForm'); if(!form) return; const fd=new FormData(form); state.boilerDraft.date=fd.get('date')||state.boilerDraft.date; state.boilerDraft.entryTime=fd.get('entryTime')||state.boilerDraft.entryTime; state.boilerDraft[state.boilerTab]=state.boilerDraft[state.boilerTab]||{}; $$('[data-meter]',form).forEach(inp=>{const m=inp.dataset.meter, f=inp.dataset.field; state.boilerDraft[state.boilerTab][m]=state.boilerDraft[state.boilerTab][m]||{}; state.boilerDraft[state.boilerTab][m][f]=inp.value;});}
function wireBoilerForm(){ $$('[data-boiler-tab]').forEach(b=>b.onclick=()=>{saveBoilerDraft(); state.boilerTab=Number(b.dataset.boilerTab); renderEntryForm();}); $$('[data-meter]').forEach(inp=>inp.oninput=()=>saveBoilerDraft()); }
async function saveEntry(e){e.preventDefault(); try{let data={}; if(state.entryType==='boiler'){saveBoilerDraft(); data={date:state.boilerDraft.date,entryTime:state.boilerDraft.entryTime,readings:[]}; [1,2].forEach(b=>{const obj=state.boilerDraft[b]||{}; Object.keys(obj).forEach(m=>{const r=obj[m]; if(r.pv!==''||r.sv!==''||r.currentAmpere!=='') data.readings.push({boilerNumber:b,meterNumber:Number(m),currentTemperaturePV:r.pv,setTemperatureSV:r.sv,currentAmpere:r.currentAmpere});});}); if(!data.readings.length) throw new Error('Enter at least one boiler reading');} else {data=Object.fromEntries(new FormData($('#entryForm')).entries());}
    const action = {shift:'saveShift',receiving:'saveReceiving',downtime:'saveDowntime',boiler:'saveBoilerBatch',ph:'savePH',waste:'saveWaste',sale:'saveSale'}[state.entryType];
    const res=await jsonp(action,{payload:JSON.stringify(data)}); showToast(`Saved to Google Sheets (${res.count||1} record${(res.count||1)>1?'s':''})`); $('#entryModal').classList.add('hidden'); state.boilerDraft={}; await loadData();
  }catch(err){console.error(err); showToast('Save failed: '+err.message,'error');}}

function exportCsv(){const rows=state.filtered[state.page==='overview'?'shifts':state.page==='receiving'?'receivings':state.page==='process'?'boilers':state.page==='waste'?'waste':state.page==='sales'?'sales':'shifts']||[]; if(!rows.length){showToast('No data to export','warn');return;} const cols=Object.keys(rows[0]); const csv=[cols.join(','),...rows.map(r=>cols.map(c=>`"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${state.page}-export.csv`; a.click(); URL.revokeObjectURL(a.href);}
function initDates(){const now=new Date(); const to=now.toISOString().slice(0,10); const from=new Date(now.getTime()-30*864e5).toISOString().slice(0,10); $('#dateFrom').value=from; $('#dateTo').value=to;}
function bind(){
  $$('.nav-item').forEach(b=>b.onclick=()=>{$$('.nav-item').forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.page=b.dataset.page; $$('.page').forEach(p=>p.classList.remove('active')); $('#page-'+state.page).classList.add('active'); render();});
  $('#sidebarToggle').onclick=()=>$('#sidebar').classList.toggle('collapsed'); $('#newEntryBtn').onclick=openEntry; $('#modalClose').onclick=()=>$('#entryModal').classList.add('hidden'); $('#refreshBtn').onclick=loadData; $('#exportBtn').onclick=exportCsv; $('#themeBtn').onclick=()=>{state.dark=!state.dark; localStorage.setItem('dark',state.dark?'1':'0'); render();}; $('#langBtn').onclick=()=>{state.lang=state.lang==='en'?'ar':'en'; localStorage.setItem('lang',state.lang); render();}; $('#dateFrom').onchange=()=>{applyFilters();render();}; $('#dateTo').onchange=()=>{applyFilters();render();}; $('#shiftFilter').onchange=()=>{applyFilters();render();}; $('#clearChartFilter').onclick=()=>{state.activeFilter=null; $('#activeFilterBar').classList.add('hidden');};
}
(async function(){try{if(window.Chart){Chart.defaults.font.family='Inter, Segoe UI, Arial'; Chart.defaults.color='#66748a';}}catch(e){} initDates(); bind(); if(state.dark)document.body.classList.add('dark'); await loadData();})();
