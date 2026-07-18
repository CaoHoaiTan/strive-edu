import {
  END_DATE,
  START_DATE,
  clearMissionStore,
  loadMissionStore,
  makeTask,
  saveMissionStore,
  setStoreUser,
} from '../../lib/store';

export function initMissionControl(options = {}) {
  if (typeof window === 'undefined') return;
  if (window.__missionControlInited) return;
  window.__missionControlInited = true;
  setStoreUser(options.userId || null);

/* ================================================================
   STATE / STORAGE
================================================================= */
const PSPO_DOMAINS = ['Product Definition','Stakeholders','Product Value','Vision & Strategy','Backlog Management','Forecasting & Planning'];
const PMP_DOMAINS  = ['People','Process','Business Environment'];

function fmtISO(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function parseISO(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function dayDiff(a,b){ return Math.round((a-b)/86400000); }
function fmtVN(d){ const dow=['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]; return `${dow} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
function fmtShort(d){ return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; }
function uid(){ return Math.random().toString(36).slice(2,10); }

let store = null;

function loadStore(){ store = loadMissionStore(); }
function saveStore(){ saveMissionStore(store); }

/* -------------------- seed default study plan -------------------- */
const PSPO_POOL = [
  'Đọc Scrum Guide - phần {n}',
  'Xem video Andrew Ramdayal - bài {n}',
  'Làm 20 câu hỏi trắc nghiệm PSPO',
  'Ôn tập Flashcards PSPO',
  'Học Scrum.org Learning Path - module {n}',
  'Xem David McLachlan - bài {n}',
  'Tổng hợp ghi chú Product Backlog Management',
  'Luyện đề mini-test PSPO (10 câu)'
];
const PMP_POOL = [
  'Đọc PMBOK 7 - chương {n}',
  'Đọc Agile Practice Guide - phần {n}',
  'Ôn ECO Domain: People',
  'Ôn ECO Domain: Process',
  'Ôn ECO Domain: Business Environment',
  'Làm 20 câu hỏi trắc nghiệm PMP',
  'Xem video PMP - bài {n}',
  'Luyện đề mini-test PMP (10 câu)'
];

function seedDefaultTasks(){
  const pspoExam = parseISO(store.examDates.PSPO);
  let d = new Date(START_DATE);
  let dayIdx = 0;
  while(d <= END_DATE){
    const iso = fmtISO(d);
    const dayTasks = [];
    if(dayIdx===0){
      dayTasks.push(mkTask('Scrum Guide Chapter 1','PSPO',false));
      dayTasks.push(mkTask('AR Section 4','PMP',false));
      dayTasks.push(mkTask('20 Scrum Questions','PSPO',false));
      dayTasks.push(mkTask('Review Flashcards','PSPO',false));
    } else if(d <= pspoExam){
      // PSPO focus phase: 3 pspo tasks + light pmp intro on weekends
      for(let i=0;i<3;i++){
        const t = PSPO_POOL[(dayIdx*3+i) % PSPO_POOL.length].replace('{n}', Math.ceil((dayIdx+i+1)/3));
        dayTasks.push(mkTask(t,'PSPO',false));
      }
      if(d.getDay()===0 || d.getDay()===6){
        const t = PMP_POOL[dayIdx % PMP_POOL.length].replace('{n}', Math.ceil((dayIdx+1)/4));
        dayTasks.push(mkTask(t,'PMP',false));
      }
    } else if (d.getTime()===pspoExam.getTime()){
      dayTasks.push(mkTask('🎯 PSPO EXAM DAY — Good luck!','PSPO',false));
    } else {
      // PMP focus phase
      for(let i=0;i<3;i++){
        const t = PMP_POOL[(dayIdx*3+i) % PMP_POOL.length].replace('{n}', Math.ceil((dayIdx+i+1)/3));
        dayTasks.push(mkTask(t,'PMP',false));
      }
    }
    store.tasks[iso] = dayTasks;
    d = addDays(d,1);
    dayIdx++;
  }
  // exam day marker for PMP at end date
  const pmpExam = parseISO(store.examDates.PMP);
  const pmpIso = fmtISO(pmpExam);
  if(store.tasks[pmpIso]){
    store.tasks[pmpIso].push(mkTask('🎯 PMP EXAM DAY — Good luck!','PMP',false));
  }
}
function mkTask(text,cert,done,resourceId){ return makeTask(text, cert, done, resourceId||null); }

function seedDefaultResources(){
  store.resources = [
    {id:uid(), name:'Scrum Guide (2020)', cert:'PSPO', type:'doc', done:false, link:'https://scrumguides.org'},
    {id:uid(), name:'PMBOK Guide 7th Edition', cert:'PMP', type:'doc', done:false, link:''},
    {id:uid(), name:'Agile Practice Guide', cert:'PMP', type:'doc', done:false, link:''},
    {id:uid(), name:'ECO - Exam Content Outline', cert:'PMP', type:'doc', done:false, link:''},
    {id:uid(), name:'Andrew Ramdayal - PMP Course', cert:'PMP', type:'video', done:false, link:''},
    {id:uid(), name:'David McLachlan - PSPO/Agile', cert:'PSPO', type:'video', done:false, link:''},
    {id:uid(), name:'Scrum.org Learning Path', cert:'PSPO', type:'course', done:false, link:'https://www.scrum.org/learning-series'}
  ];
}

/* ================================================================
   THEME COLORS FOR CANVAS (reads CSS vars)
================================================================= */
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function chartColors(){
  return {
    text: cssVar('--text-1'), text2: cssVar('--text-2'), grid: cssVar('--grid-line'),
    accent: cssVar('--accent'), accent2: cssVar('--accent-2'),
    pspo: cssVar('--pspo'), pmp: cssVar('--pmp'),
    green: cssVar('--green'), yellow: cssVar('--yellow'), red: cssVar('--red')
  };
}

/* ================================================================
   NAVIGATION
================================================================= */
const viewTitles = {
  dashboard:['Executive Dashboard','Tổng quan hành trình chinh phục PSPO & PMP'],
  calendar:['Learning Calendar', `Timeline 17/07/2026 → 15/01/2027`],
  resources:['Resource Library','Tài liệu và khoá học chính thức'],
  mockexam:['Mock Exam Analytics','Theo dõi điểm số và điểm yếu qua từng lần thi thử'],
  planner:['Daily Planner','Kế hoạch học tập theo từng ngày'],
  analytics:['Analytics','Số liệu tổng hợp toàn bộ quá trình học'],
  errorlog:['Error Log','Ghi nhận & phân tích các câu hỏi làm sai']
};

function switchView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.classList.toggle('active', n.dataset.view===name));
  document.getElementById('pageTitle').textContent = viewTitles[name][0];
  document.getElementById('pageSub').textContent = viewTitles[name][1];
  closeSidebarMobile();
  renderView(name);
}

function renderView(name){
  if(name==='dashboard') renderDashboard();
  else if(name==='calendar') renderCalendar();
  else if(name==='resources') renderResources();
  else if(name==='mockexam') renderMockExam();
  else if(name==='planner') renderPlanner();
  else if(name==='analytics') renderAnalytics();
  else if(name==='errorlog') renderErrorLog();
}

document.querySelectorAll('.nav-item[data-view]').forEach(n=>{
  n.addEventListener('click', ()=>switchView(n.dataset.view));
});

/* mobile sidebar */
const sidebarEl = document.getElementById('sidebar');
const overlayBg = document.getElementById('overlayBg');
document.getElementById('hamburger').addEventListener('click', ()=>{
  sidebarEl.classList.toggle('open'); overlayBg.classList.toggle('show');
});
overlayBg.addEventListener('click', closeSidebarMobile);
function closeSidebarMobile(){ sidebarEl.classList.remove('open'); overlayBg.classList.remove('show'); }

/* theme */
const themeSwitch = document.getElementById('themeSwitch');
themeSwitch.addEventListener('click', ()=>{
  store.theme = store.theme==='dark' ? 'light' : 'dark';
  applyTheme(); saveStore(); renderView(currentView());
});
function applyTheme(){
  document.documentElement.setAttribute('data-theme', store.theme);
  themeSwitch.classList.toggle('on', store.theme==='dark');
}
function currentView(){
  const active = document.querySelector('.nav-item.active[data-view]');
  return active ? active.dataset.view : 'dashboard';
}

/* export / reset */
document.getElementById('btnExportData').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(store,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mission-control-data.json';
  a.click();
});
document.getElementById('btnResetData').addEventListener('click', ()=>{
  confirmAction('Reset toàn bộ dữ liệu về mặc định? Hành động này không thể hoàn tác.', ()=>{
    clearMissionStore();
    loadStore(); applyTheme(); refreshTopCountdown(); renderView(currentView());
  });
});

/* ================================================================
   SVG PROGRESS RING
================================================================= */
function progressRing(svgEl, pct, size, stroke, color, bgColor){
  const r = (size/2) - stroke;
  const c = 2*Math.PI*r;
  const off = c * (1 - Math.max(0,Math.min(100,pct))/100);
  svgEl.setAttribute('width', size); svgEl.setAttribute('height', size);
  svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svgEl.innerHTML = `
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${bgColor}" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round"
      transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset .6s ease"/>
  `;
}

/* ================================================================
   COMPUTATION HELPERS
================================================================= */
function allTasksFlat(){
  const out = [];
  for(const iso in store.tasks){ store.tasks[iso].forEach(t=>out.push({...t, date:iso})); }
  return out;
}
function completedOnDate(task, iso){
  if(!task.completedAt) return false;
  return fmtISO(new Date(task.completedAt)) === iso;
}
function completedBetween(task, from, to){
  if(!task.completedAt) return false;
  const dt = new Date(task.completedAt);
  return dt >= from && dt <= to;
}
function certStats(cert){
  const flat = allTasksFlat().filter(t=>t.cert===cert);
  const done = flat.filter(t=>t.done).length;
  return {total:flat.length, done, pct: flat.length? Math.round(done/flat.length*100):0};
}
function overallStats(){
  const flat = allTasksFlat();
  const done = flat.filter(t=>t.done).length;
  return {total:flat.length, done, pct: flat.length? Math.round(done/flat.length*100):0};
}
function computeStreak(){
  const dates = Object.keys(store.studyLog).filter(d=>store.studyLog[d].hours>0).sort();
  if(dates.length===0) return 0;
  const set = new Set(dates);
  let streak=0; let cur = new Date();
  // count backward from today (or from latest logged day if today has none)
  let d = new Date();
  while(true){
    const iso = fmtISO(d);
    if(set.has(iso)){ streak++; d = addDays(d,-1); }
    else if(fmtISO(d)===fmtISO(new Date())){ d=addDays(d,-1); continue; } // allow today to be empty still
    else break;
  }
  return streak;
}
function weeklyVelocity(){
  const today = new Date();
  const from = addDays(today,-6);
  from.setHours(0,0,0,0);
  const to = new Date(today);
  to.setHours(23,59,59,999);
  const count = allTasksFlat().filter(t=>completedBetween(t, from, to)).length;
  return {count, perDay:(count/7).toFixed(1)};
}
function riskLevel(){
  const today = new Date();
  const overallPct = overallStats().pct;
  const totalDays = dayDiff(END_DATE, START_DATE)+1;
  const elapsed = Math.max(0, Math.min(totalDays, dayDiff(today, START_DATE)+1));
  const expectedPct = Math.round((elapsed/totalDays)*100);
  const gap = expectedPct - overallPct;
  if(gap <= 3) return {level:'green', label:'ON TRACK', detail:`Bạn đang đúng tiến độ (thực tế ${overallPct}% / kỳ vọng ${expectedPct}%).`};
  if(gap <= 12) return {level:'yellow', label:'AT RISK', detail:`Bạn đang chậm nhẹ ${gap}% so với kế hoạch (${overallPct}% / kỳ vọng ${expectedPct}%). Cần tăng tốc.`};
  return {level:'red', label:'BEHIND', detail:`Bạn đang chậm ${gap}% so với kế hoạch (${overallPct}% / kỳ vọng ${expectedPct}%). Cần điều chỉnh gấp!`};
}

/* ================================================================
   CANVAS CHART HELPERS (no external libs)
================================================================= */
function setupCanvas(canvas){
  const parent = canvas.parentElement;
  const cssH = canvas.getAttribute('height') || 200;
  const w = parent.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w*dpr; canvas.height = cssH*dpr;
  canvas.style.width = w+'px'; canvas.style.height = cssH+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  return {ctx, w, h:+cssH};
}

function drawLineChart(canvas, series, opts={}){
  // series: [{label, color, points:[{x_label, y}]}]
  const {ctx,w,h} = setupCanvas(canvas);
  const C = chartColors();
  ctx.clearRect(0,0,w,h);
  const padL=38, padR=14, padT=14, padB=26;
  const plotW = w-padL-padR, plotH = h-padT-padB;
  let maxY = opts.maxY;
  if(maxY===undefined){
    maxY = 1;
    series.forEach(s=>s.points.forEach(p=>{ if(p.y>maxY) maxY=p.y; }));
    maxY = Math.ceil(maxY*1.15);
  }
  const minY = opts.minY||0;
  const n = series[0] ? series[0].points.length : 0;
  // grid
  ctx.strokeStyle = C.grid; ctx.lineWidth=1; ctx.font='10px var(--font-mono)'; ctx.fillStyle=C.text2;
  const rows=4;
  for(let i=0;i<=rows;i++){
    const y = padT + plotH*(i/rows);
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
    const val = Math.round(maxY - (maxY-minY)*(i/rows));
    ctx.fillText(val, 2, y+3);
  }
  function xPos(i){ return n<=1 ? padL : padL + plotW*(i/(n-1)); }
  function yPos(v){ return padT + plotH*(1-( (v-minY)/(maxY-minY || 1) )); }
  // x labels (sparse)
  if(n>0){
    const step = Math.max(1, Math.round(n/6));
    ctx.fillStyle=C.text2;
    for(let i=0;i<n;i+=step){
      ctx.fillText(series[0].points[i].x_label, xPos(i)-10, h-8);
    }
  }
  series.forEach(s=>{
    ctx.beginPath();
    s.points.forEach((p,i)=>{
      const x=xPos(i), y=yPos(p.y);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.strokeStyle = s.color; ctx.lineWidth = s.dashed?1.5:2.2;
    if(s.dashed) ctx.setLineDash([5,4]); else ctx.setLineDash([]);
    ctx.stroke();
    ctx.setLineDash([]);
    if(s.fill){
      ctx.lineTo(xPos(s.points.length-1), padT+plotH);
      ctx.lineTo(xPos(0), padT+plotH);
      ctx.closePath();
      ctx.fillStyle = s.color+'22';
      ctx.fill();
    }
  });
  const hitPoints = [];
  series.forEach(s=>{
    s.points.forEach((p,i)=>{
      hitPoints.push({
        kind:'point',
        x:xPos(i),
        y:yPos(p.y),
        label:s.label,
        value:p.y,
        xLabel:p.x_label,
        color:s.color
      });
    });
  });
  attachChartTooltip(canvas, hitPoints);
}

function drawBarChart(canvas, labels, values, colorFn, opts={}){
  const {ctx,w,h} = setupCanvas(canvas);
  const C = chartColors();
  ctx.clearRect(0,0,w,h);
  const padL=34, padR=10, padT=14, padB=24;
  const plotW=w-padL-padR, plotH=h-padT-padB;
  const maxV = opts.maxY || Math.max(1, ...values)*1.2;
  ctx.strokeStyle=C.grid; ctx.font='10px var(--font-mono)'; ctx.fillStyle=C.text2;
  const rows=4;
  for(let i=0;i<=rows;i++){
    const y=padT+plotH*(i/rows);
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
    ctx.fillText(Math.round(maxV-(maxV*(i/rows))), 2, y+3);
  }
  const bw = plotW/labels.length*0.55;
  labels.forEach((lb,i)=>{
    const cx = padL + plotW*((i+0.5)/labels.length);
    const val = values[i];
    const bh = plotH*(val/maxV);
    const x = cx-bw/2, y = padT+plotH-bh;
    const grad = ctx.createLinearGradient(0,y,0,padT+plotH);
    const col = typeof colorFn==='function'? colorFn(i,val) : colorFn;
    grad.addColorStop(0,col); grad.addColorStop(1,col+'55');
    ctx.fillStyle = grad;
    roundRectPath(ctx,x,y,bw,Math.max(bh,2),4);
    ctx.fill();
    ctx.fillStyle=C.text2; ctx.font='9.5px var(--font-mono)';
    ctx.textAlign='center';
    ctx.fillText(lb, cx, h-8);
    ctx.textAlign='left';
  });
  attachChartTooltip(canvas, labels.map((lb,i)=>{
    const cx = padL + plotW*((i+0.5)/labels.length);
    const val = values[i];
    const bh = plotH*(val/maxV);
    return {
      kind:'bar',
      x:cx,
      y:padT+plotH-bh,
      label:lb,
      value:val,
      xLabel:lb,
      color:typeof colorFn==='function'? colorFn(i,val) : colorFn,
      radius:Math.max(12, plotW/labels.length*0.45)
    };
  }));
}
function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function chartTooltipEl(){
  let tip = document.getElementById('chartTooltip');
  if(!tip){
    tip = el('div','chart-tooltip');
    tip.id = 'chartTooltip';
    document.body.appendChild(tip);
  }
  return tip;
}
function attachChartTooltip(canvas, points){
  canvas.__missionTooltipPoints = points;
  if(canvas.__missionTooltipBound) return;
  canvas.__missionTooltipBound = true;
  canvas.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const data = canvas.__missionTooltipPoints || [];
    let nearest = null;
    let best = Infinity;
    data.forEach(point=>{
      const dx = point.x-x, dy = point.y-y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      const radius = point.radius || 14;
      if(dist < radius && dist < best){ nearest = point; best = dist; }
    });
    const tip = chartTooltipEl();
    if(!nearest){
      tip.classList.remove('show');
      return;
    }
    tip.innerHTML = `<span style="background:${nearest.color}"></span><strong>${escapeHtml(nearest.label)}</strong><em>${escapeHtml(nearest.xLabel)} · ${nearest.value}</em>`;
    tip.style.left = `${e.clientX + 12}px`;
    tip.style.top = `${e.clientY + 12}px`;
    tip.classList.add('show');
  });
  canvas.addEventListener('mouseleave', ()=>{
    chartTooltipEl().classList.remove('show');
  });
}

function drawRadarChart(canvas, labels, datasets){
  // datasets: [{label,color,values:[0..100]}]
  const {ctx,w,h} = setupCanvas(canvas);
  const C = chartColors();
  ctx.clearRect(0,0,w,h);
  const cx=w/2, cy=h/2+6, radius=Math.min(w,h)/2-34;
  const n = labels.length;
  ctx.strokeStyle=C.grid; ctx.fillStyle=C.text2; ctx.font='10px var(--font-mono)';
  const levels=4;
  for(let l=1;l<=levels;l++){
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const ang = -Math.PI/2 + i*(2*Math.PI/n);
      const r = radius*(l/levels);
      const x = cx+r*Math.cos(ang), y=cy+r*Math.sin(ang);
      i===0? ctx.moveTo(x,y): ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
  }
  for(let i=0;i<n;i++){
    const ang = -Math.PI/2 + i*(2*Math.PI/n);
    const x=cx+radius*Math.cos(ang), y=cy+radius*Math.sin(ang);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.strokeStyle=C.grid; ctx.stroke();
    const lx = cx+(radius+14)*Math.cos(ang), ly=cy+(radius+14)*Math.sin(ang);
    ctx.fillStyle=C.text2;
    ctx.textAlign = Math.cos(ang)>0.3?'left':(Math.cos(ang)<-0.3?'right':'center');
    const words = labels[i].split(' ');
    ctx.fillText(labels[i].length>16? (words[0]+' '+(words[1]||'')):labels[i], lx, ly);
  }
  ctx.textAlign='left';
  datasets.forEach(ds=>{
    ctx.beginPath();
    ds.values.forEach((v,i)=>{
      const ang=-Math.PI/2+i*(2*Math.PI/n);
      const r = radius*(Math.max(0,Math.min(100,v))/100);
      const x=cx+r*Math.cos(ang), y=cy+r*Math.sin(ang);
      i===0? ctx.moveTo(x,y): ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = ds.color+'33'; ctx.fill();
    ctx.strokeStyle = ds.color; ctx.lineWidth=2; ctx.stroke();
    ds.values.forEach((v,i)=>{
      const ang=-Math.PI/2+i*(2*Math.PI/n);
      const r = radius*(Math.max(0,Math.min(100,v))/100);
      const x=cx+r*Math.cos(ang), y=cy+r*Math.sin(ang);
      ctx.beginPath(); ctx.arc(x,y,2.6,0,7); ctx.fillStyle=ds.color; ctx.fill();
    });
  });
}

/* ================================================================
   DASHBOARD
================================================================= */
function refreshTopCountdown(){
  const today = new Date();
  const dp = dayDiff(parseISO(store.examDates.PSPO), today);
  const dm = dayDiff(parseISO(store.examDates.PMP), today);
  document.getElementById('pspoCountdownTag').textContent = `PSPO ${dp>=0? dp+'d':'done'}`;
  document.getElementById('pmpCountdownTag').textContent = `PMP ${dm>=0? dm+'d':'done'}`;
}

function renderDashboard(){
  refreshTopCountdown();
  const C = chartColors();
  const overall = overallStats();
  progressRing(document.getElementById('ringOverall'), overall.pct, 66, 7, C.accent, C.grid);
  document.getElementById('overallPct').textContent = overall.pct+'%';
  document.getElementById('overallSub').textContent = `${overall.done} / ${overall.total} tasks`;

  const streak = computeStreak();
  document.getElementById('streakVal').textContent = `${streak} ngày 🔥`;
  document.getElementById('streakSub').textContent = streak>0 ? 'Duy trì streak nhé!' : 'Học hôm nay để bắt đầu streak';

  const vel = weeklyVelocity();
  document.getElementById('velocityVal').textContent = vel.perDay;
  document.getElementById('velocitySub').textContent = `${vel.count} task / 7 ngày gần nhất`;

  const risk = riskLevel();
  const pill = document.getElementById('riskPill');
  pill.className = 'risk-pill risk-'+risk.level;
  pill.innerHTML = `<span class="dot"></span> ${risk.label}`;
  document.getElementById('riskSub').textContent = risk.detail;

  const pspo = certStats('PSPO'), pmp = certStats('PMP');
  progressRing(document.getElementById('ringPspo'), pspo.pct, 90, 8, C.pspo, C.grid);
  progressRing(document.getElementById('ringPmp'), pmp.pct, 90, 8, C.pmp, C.grid);
  document.getElementById('pspoPct').textContent = pspo.pct+'%';
  document.getElementById('pspoSub').textContent = `${pspo.done} / ${pspo.total} tasks hoàn thành`;
  document.getElementById('pmpPct').textContent = pmp.pct+'%';
  document.getElementById('pmpSub').textContent = `${pmp.done} / ${pmp.total} tasks hoàn thành`;
  document.getElementById('pspoExamDateLabel').textContent = 'Ngày thi: '+fmtVN(parseISO(store.examDates.PSPO));
  document.getElementById('pmpExamDateLabel').textContent = 'Ngày thi: '+fmtVN(parseISO(store.examDates.PMP));
  const dP = dayDiff(parseISO(store.examDates.PSPO), new Date());
  const dM = dayDiff(parseISO(store.examDates.PMP), new Date());
  document.getElementById('pspoCountdownFull').textContent = (dP>=0? dP+' ngày còn lại':'Đã qua ngày thi');
  document.getElementById('pmpCountdownFull').textContent = (dM>=0? dM+' ngày còn lại':'Đã qua ngày thi');

  // Burn up/down chart across full range
  const allDates = [];
  let d = new Date(START_DATE);
  while(d<=END_DATE){ allDates.push(new Date(d)); d=addDays(d,1); }
  const totalTasks = allTasksFlat().length;
  const burnUp=[], burnDown=[], ideal=[];
  const today = new Date();
  allDates.forEach((dt,i)=>{
    const endOfDay = new Date(dt);
    endOfDay.setHours(23,59,59,999);
    const cum = allTasksFlat().filter(t=>t.completedAt && new Date(t.completedAt)<=endOfDay && dt<=today).length;
    burnUp.push({x_label: fmtShort(dt), y: cum});
    burnDown.push({x_label: fmtShort(dt), y: Math.max(0,totalTasks-cum)});
    ideal.push({x_label: fmtShort(dt), y: Math.round(totalTasks*(i/(allDates.length-1)))});
  });
  drawLineChart(document.getElementById('chartBurn'), [
    {label:'Ideal', color:C.text2, points:ideal, dashed:true},
    {label:'Burn-down', color:C.red, points:burnDown},
    {label:'Burn-up', color:C.accent, points:burnUp, fill:true}
  ], {maxY: totalTasks*1.1});

  // weekly KPI (last 8 weeks incl current, aligned to START_DATE)
  const weekLabels=[], weekDone=[], weekHours=[];
  for(let w=7;w>=0;w--){
    const wkStart = addDays(today, -today.getDay()-7*w);
    let done=0, hrs=0;
    for(let i=0;i<7;i++){
      const iso = fmtISO(addDays(wkStart,i));
      done += allTasksFlat().filter(t=>completedOnDate(t, iso)).length;
      if(store.studyLog[iso]) hrs += (store.studyLog[iso].hours||0);
    }
    weekLabels.push(fmtShort(wkStart));
    weekDone.push(done); weekHours.push(+hrs.toFixed(1));
  }
  drawBarChart(document.getElementById('chartWeeklyKpi'), weekLabels, weekDone, C.accent);
  drawBarChart(document.getElementById('chartWeeklyHours'), weekLabels, weekHours, C.pspo);
}

/* ================================================================
   CALENDAR
================================================================= */
let calCursor = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), 1);
document.getElementById('calPrev').addEventListener('click', ()=>{ calCursor.setMonth(calCursor.getMonth()-1); renderCalendar(); });
document.getElementById('calNext').addEventListener('click', ()=>{ calCursor.setMonth(calCursor.getMonth()+1); renderCalendar(); });
document.getElementById('calToday').addEventListener('click', ()=>{ calCursor = new Date(new Date().getFullYear(), new Date().getMonth(),1); renderCalendar(); });
document.querySelectorAll('.filter-chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    store.calFilter = c.dataset.filter; saveStore();
    document.querySelectorAll('.filter-chip').forEach(x=>x.className='filter-chip');
    c.className = 'filter-chip active-'+(c.dataset.filter==='all'?'all':c.dataset.filter.toLowerCase());
    renderCalendar();
  });
});

const DOW_VN = ['CN','T2','T3','T4','T5','T6','T7'];
function renderCalendar(){
  document.getElementById('calMonthLabel').textContent = calCursor.toLocaleDateString('vi-VN',{month:'long', year:'numeric'});
  const dowWrap = document.getElementById('calDow');
  dowWrap.innerHTML = DOW_VN.map(d=>`<div class="cal-dow">${d}</div>`).join('');

  const grid = document.getElementById('calGrid');
  grid.innerHTML='';
  const firstOfMonth = new Date(calCursor.getFullYear(), calCursor.getMonth(),1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(calCursor.getFullYear(), calCursor.getMonth()+1,0).getDate();
  const todayIso = fmtISO(new Date());

  for(let i=0;i<startOffset;i++){ grid.appendChild(el('div','cal-cell empty')); }
  for(let day=1; day<=daysInMonth; day++){
    const dt = new Date(calCursor.getFullYear(), calCursor.getMonth(), day);
    const iso = fmtISO(dt);
    const cell = el('div','cal-cell');
    cell.dataset.date = iso;
    if(iso===todayIso) cell.classList.add('today');
    if(iso===store.examDates.PSPO || iso===store.examDates.PMP) cell.classList.add('exam-day');
    if(dt<START_DATE || dt>END_DATE){ cell.style.opacity='0.35'; }

    const tasks = (store.tasks[iso]||[]).filter(t=> store.calFilter==='all' || t.cert===store.calFilter);
    const doneCt = tasks.filter(t=>t.done).length;
    const pct = tasks.length? Math.round(doneCt/tasks.length*100):0;

    const row = el('div','cal-date-row');
    row.appendChild(el('div','cal-date-num', String(day)));
    const miniSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    miniSvg.setAttribute('class','cal-progress-mini');
    row.appendChild(miniSvg);
    cell.appendChild(row);

    const taskWrap = el('div','cal-tasks');
    tasks.slice(0,3).forEach(t=>{
      const chip = el('div', 'cal-task-chip c-'+t.cert.toLowerCase()+(t.done?' done':''), t.text);
      taskWrap.appendChild(chip);
    });
    if(tasks.length>3) taskWrap.appendChild(el('div','cal-more', `+${tasks.length-3} khác`));
    cell.appendChild(taskWrap);
    grid.appendChild(cell);

    setTimeout(()=>{ const C=chartColors(); progressRing(miniSvg, pct, 22, 3, tasks.length? (pct===100?C.green:C.accent):C.grid, C.grid); },0);

    cell.addEventListener('click', ()=>openDayModal(iso));
    // drag & drop target
    cell.addEventListener('dragover', e=>{ e.preventDefault(); cell.classList.add('drag-over'); });
    cell.addEventListener('dragleave', ()=> cell.classList.remove('drag-over'));
    cell.addEventListener('drop', e=>{
      e.preventDefault(); cell.classList.remove('drag-over');
      const data = e.dataTransfer.getData('text/plain');
      if(!data) return;
      const [fromIso, taskId] = data.split('::');
      if(fromIso===iso) return;
      moveTask(fromIso, iso, taskId);
      renderCalendar();
    });
  }
  saveStore();
}
function el(tag, className, text){ const e=document.createElement(tag); if(className) e.className=className; if(text!==undefined) e.textContent=text; return e; }

function moveTask(fromIso, toIso, taskId){
  const arr = store.tasks[fromIso]||[];
  const idx = arr.findIndex(t=>t.id===taskId);
  if(idx<0) return;
  const [task] = arr.splice(idx,1);
  if(!store.tasks[toIso]) store.tasks[toIso]=[];
  store.tasks[toIso].push(task);
  saveStore();
}
function setFieldError(id, message){
  const node = document.getElementById(id);
  if(node) node.textContent = message || '';
}
function toast(message){
  let node = document.getElementById('appToast');
  if(!node){
    node = el('div','app-toast');
    node.id = 'appToast';
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(node.__hideTimer);
  node.__hideTimer = window.setTimeout(()=>node.classList.remove('show'), 3200);
}
function confirmAction(message, onConfirm){
  let backdrop = document.getElementById('confirmBackdrop');
  if(!backdrop){
    backdrop = el('div','modal-backdrop');
    backdrop.id = 'confirmBackdrop';
    backdrop.innerHTML = `
      <div class="glass modal confirm-modal">
        <div class="modal-head"><h3>Xác nhận</h3><div class="close-x" data-confirm-close>✕</div></div>
        <div class="small" data-confirm-message></div>
        <div class="confirm-actions">
          <button class="btn btn-ghost" data-confirm-close>Huỷ</button>
          <button class="btn btn-danger" data-confirm-ok>Reset</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e=>{
      if(e.target===backdrop || e.target.dataset.confirmClose!==undefined) backdrop.classList.remove('open');
    });
  }
  backdrop.querySelector('[data-confirm-message]').textContent = message;
  const ok = backdrop.querySelector('[data-confirm-ok]');
  ok.onclick = ()=>{
    backdrop.classList.remove('open');
    onConfirm();
  };
  backdrop.classList.add('open');
}
function readPercentInput(input){
  if(!input || input.value==='') return {ok:false, value:null};
  const value = Number(input.value);
  if(!Number.isFinite(value) || value < 0 || value > 100) return {ok:false, value:null};
  return {ok:true, value};
}

/* ---- day modal ---- */
const dayModalBackdrop = document.getElementById('dayModalBackdrop');
let dayModalDate = null;
function openDayModal(iso){
  dayModalDate = iso;
  const dt = parseISO(iso);
  document.getElementById('dayModalTitle').textContent = fmtVN(dt);
  document.getElementById('dayModalSub').textContent = (iso===store.examDates.PSPO?'🎯 Ngày thi PSPO':'') + (iso===store.examDates.PMP?'🎯 Ngày thi PMP':'');
  renderDayModalTasks();
  dayModalBackdrop.classList.add('open');
}
document.getElementById('dayModalClose').addEventListener('click', ()=>{ dayModalBackdrop.classList.remove('open'); renderCalendar(); });
dayModalBackdrop.addEventListener('click', e=>{ if(e.target===dayModalBackdrop){ dayModalBackdrop.classList.remove('open'); renderCalendar(); } });

function renderDayModalTasks(){
  const wrap = document.getElementById('dayModalTaskList');
  wrap.innerHTML='';
  const tasks = store.tasks[dayModalDate]||[];
  if(tasks.length===0) wrap.appendChild(el('div','empty-state','Chưa có task nào cho ngày này.'));
  tasks.forEach(t=>{
    const row = buildTaskRow(t, dayModalDate, renderDayModalTasks);
    wrap.appendChild(row);
  });
}
document.getElementById('dayModalAddBtn').addEventListener('click', ()=>{
  const txt = document.getElementById('dayModalNewTaskText').value.trim();
  const cert = document.getElementById('dayModalNewTaskCert').value;
  if(!txt) return;
  if(!store.tasks[dayModalDate]) store.tasks[dayModalDate]=[];
  store.tasks[dayModalDate].push(mkTask(txt,cert,false));
  saveStore();
  document.getElementById('dayModalNewTaskText').value='';
  renderDayModalTasks();
});

function buildTaskRow(t, iso, refreshFn){
  const row = el('div','task-row'+(t.done?' done':'')+(t.resourceId?' has-link':''));
  row.draggable = true;
  row.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', iso+'::'+t.id); });
  const check = el('div','task-check'+(t.done?' checked':''));
  check.innerHTML = t.done? '✓':'';
  check.addEventListener('click', (e)=>{
    e.stopPropagation();
    t.done = !t.done;
    t.completedAt = t.done ? new Date().toISOString() : null;
    saveStore(); refreshFn(); renderView(currentView());
  });
  row.appendChild(check);
  const txt = el('div','task-text', t.text);
  txt.addEventListener('click', (e)=>{
    e.stopPropagation();
    const linkedRes = t.resourceId ? store.resources.find(r=>r.id===t.resourceId) : null;
    if(linkedRes){
      if(linkedRes.link){ window.open(linkedRes.link, '_blank'); }
      else { toast('Task đã liên kết tài liệu "'+linkedRes.name+'" nhưng chưa có link.'); }
    } else {
      startEditTask(txt, t, iso, refreshFn, row);
    }
  });
  txt.title = 'Click để mở tài liệu liên kết (nếu có), hoặc sửa nếu chưa liên kết';
  row.appendChild(txt);

  const controls = el('div','task-controls');

  const tag = el('span','tag tag-'+t.cert.toLowerCase(), t.cert);
  controls.appendChild(tag);

  const resSelect = document.createElement('select');
  resSelect.className = 'task-res-select';
  resSelect.title = 'Liên kết tài liệu trong Resource Library';
  const optNone = document.createElement('option');
  optNone.value=''; optNone.textContent='🔗 Liên kết...';
  resSelect.appendChild(optNone);
  store.resources.filter(r=> r.cert===t.cert || r.cert==='Both').forEach(r=>{
    const o = document.createElement('option');
    o.value = r.id; o.textContent = r.name;
    if(r.id === t.resourceId) o.selected = true;
    resSelect.appendChild(o);
  });
  if(!t.resourceId) optNone.selected = true;
  resSelect.addEventListener('click', e=> e.stopPropagation());
  resSelect.addEventListener('mousedown', e=> e.stopPropagation());
  resSelect.addEventListener('change', ()=>{
    t.resourceId = resSelect.value || null;
    saveStore(); refreshFn(); renderView(currentView());
  });
  controls.appendChild(resSelect);

  const linkedRes = t.resourceId ? store.resources.find(r=>r.id===t.resourceId) : null;
  if(linkedRes && linkedRes.link){
    const openA = document.createElement('a');
    openA.href = linkedRes.link; openA.target='_blank'; openA.className='task-link-open';
    openA.textContent = '↗'; openA.title = 'Mở: '+linkedRes.name;
    openA.addEventListener('click', e=> e.stopPropagation());
    controls.appendChild(openA);
  }

  const editBtn = el('div','task-edit-btn','✎');
  editBtn.title = 'Sửa nội dung task';
  editBtn.addEventListener('click', e=>{
    e.stopPropagation();
    startEditTask(txt, t, iso, refreshFn, row);
  });
  controls.appendChild(editBtn);

  const del = el('div','task-del','✕');
  del.addEventListener('click', ()=>{
    store.tasks[iso] = store.tasks[iso].filter(x=>x.id!==t.id);
    saveStore(); refreshFn(); renderCalendar();
  });
  controls.appendChild(del);

  row.appendChild(controls);

  row.addEventListener('click', ()=>{
    const linkedRes = t.resourceId ? store.resources.find(r=>r.id===t.resourceId) : null;
    if(linkedRes){
      if(linkedRes.link){ window.open(linkedRes.link, '_blank'); }
      else { toast('Task đã liên kết tài liệu "'+linkedRes.name+'" nhưng chưa có link.'); }
    } else {
      startEditTask(txt, t, iso, refreshFn, row);
    }
  });

  return row;
}

function startEditTask(txtEl, t, iso, refreshFn, row){
  row.draggable = false;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = t.text;
  input.className = 'task-edit-input';
  input.style.flex = '1';
  input.style.fontSize = '13px';
  input.style.padding = '4px 7px';
  txtEl.replaceWith(input);
  input.focus();
  input.select();
  let committed = false;
  function commit(){
    if(committed) return;
    committed = true;
    const newVal = input.value.trim();
    if(newVal) t.text = newVal;
    saveStore();
    refreshFn();
    renderView(currentView());
  }
  input.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); input.blur(); }
    if(e.key==='Escape'){ committed = true; refreshFn(); }
  });
  input.addEventListener('blur', commit);
  input.addEventListener('click', e=> e.stopPropagation());
  input.addEventListener('dragstart', e=> e.stopPropagation());
}

/* ================================================================
   RESOURCES
================================================================= */
const resIcons = {
  doc:`<svg class="icon" viewBox="0 0 24 24"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/></svg>`,
  video:`<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="4" width="15" height="16" rx="2"/><path d="M17 9l5-3v12l-5-3"/></svg>`,
  course:`<svg class="icon" viewBox="0 0 24 24"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>`
};
function renderResources(){
  const grid = document.getElementById('resourceGrid');
  grid.innerHTML='';
  store.resources.forEach(r=>{
    const card = el('div','glass res-card');
    const top = el('div','res-top');
    const iconWrap = el('div','res-icon');
    iconWrap.style.background = r.cert==='PMP'? 'rgba(242,179,61,.14)': r.cert==='PSPO'?'rgba(47,214,176,.14)':'rgba(91,140,255,.14)';
    iconWrap.style.color = r.cert==='PMP'? 'var(--pmp)': r.cert==='PSPO'?'var(--pspo)':'var(--accent)';
    iconWrap.innerHTML = resIcons[r.type]||resIcons.doc;
    top.appendChild(iconWrap);
    const check = el('div','task-check'+(r.done?' checked':''));
    check.innerHTML = r.done?'✓':'';
    check.style.marginLeft='auto';
    check.addEventListener('click', ()=>{ r.done=!r.done; saveStore(); renderResources(); });
    top.appendChild(check);
    card.appendChild(top);
    card.appendChild(el('div','res-title', r.name));
    const meta = el('div','res-meta', (r.cert)+' · '+({doc:'Tài liệu',video:'Video',course:'Khoá học'}[r.type]||''));
    card.appendChild(meta);

    const linkedTasks = allTasksFlat().filter(t=>t.resourceId===r.id);
    if(linkedTasks.length>0){
      const doneCt = linkedTasks.filter(t=>t.done).length;
      const pct = Math.round(doneCt/linkedTasks.length*100);
      const barBg = el('div','res-progress-bar');
      const barFill = el('div','res-progress-fill');
      barFill.style.width = pct+'%';
      barFill.style.background = r.cert==='PMP'?'var(--pmp)':r.cert==='PSPO'?'var(--pspo)':'var(--accent)';
      barBg.appendChild(barFill);
      card.appendChild(barBg);
      card.appendChild(el('div','small', `🔗 ${doneCt}/${linkedTasks.length} task học liên quan đã hoàn thành`));
    }

    if(r.link){
      const a = document.createElement('a');
      a.href = r.link; a.target='_blank'; a.className='small'; a.textContent='Mở liên kết ↗'; a.style.color='var(--accent)';
      card.appendChild(a);
    }
    const footer = el('div','res-footer');
    footer.appendChild(el('span', null, r.done? 'Hoàn thành ✅':'Đang học'));
    const del = el('span','el-del','Xoá');
    del.addEventListener('click', ()=>{ store.resources = store.resources.filter(x=>x.id!==r.id); saveStore(); renderResources(); });
    footer.appendChild(del);
    card.appendChild(footer);
    grid.appendChild(card);
  });
}
document.getElementById('btnAddResource').addEventListener('click', ()=>{
  document.getElementById('resModalBackdrop').classList.add('open');
});
document.getElementById('resModalClose').addEventListener('click', ()=> document.getElementById('resModalBackdrop').classList.remove('open'));
document.getElementById('resSaveBtn').addEventListener('click', ()=>{
  const name = document.getElementById('resNameInput').value.trim();
  if(!name) return;
  store.resources.push({
    id:uid(), name,
    cert: document.getElementById('resCertInput').value,
    type: document.getElementById('resTypeInput').value,
    link: document.getElementById('resLinkInput').value.trim(),
    done:false
  });
  saveStore();
  document.getElementById('resNameInput').value=''; document.getElementById('resLinkInput').value='';
  document.getElementById('resModalBackdrop').classList.remove('open');
  renderResources();
});

/* ================================================================
   MOCK EXAM ANALYTICS
================================================================= */
function domainsFor(cert){ return cert==='PSPO'? PSPO_DOMAINS : PMP_DOMAINS; }
function renderExamDomainInputs(){
  const cert = document.getElementById('examCertSelect').value;
  const wrap = document.getElementById('examDomainInputs');
  wrap.innerHTML = '<label style="margin-top:6px;">Điểm theo Domain (tuỳ chọn, %)</label>';
  domainsFor(cert).forEach(dm=>{
    const f = el('div','field');
    f.style.marginBottom='6px';
    const lb = el('label', null, dm); lb.style.marginBottom='2px';
    const inp = document.createElement('input');
    inp.type='number'; inp.min=0; inp.max=100; inp.dataset.domain=dm; inp.className='domain-score-input'; inp.placeholder='—';
    f.appendChild(lb); f.appendChild(inp);
    wrap.appendChild(f);
  });
}
document.getElementById('examCertSelect').addEventListener('change', renderExamDomainInputs);

document.getElementById('btnAddExam').addEventListener('click', ()=>{
  const cert = document.getElementById('examCertSelect').value;
  const date = document.getElementById('examDateInput').value;
  const scoreInput = document.getElementById('examScoreInput');
  const scoreResult = readPercentInput(scoreInput);
  setFieldError('examDateError', '');
  setFieldError('examScoreError', '');
  setFieldError('examDomainError', '');
  if(!date){
    setFieldError('examDateError', 'Chọn ngày thi thử.');
    return;
  }
  if(!scoreResult.ok){
    setFieldError('examScoreError', 'Điểm tổng phải là số từ 0 đến 100.');
    return;
  }
  const domains = {};
  let invalidDomain = null;
  document.querySelectorAll('.domain-score-input').forEach(inp=>{
    if(inp.value==='') return;
    const result = readPercentInput(inp);
    if(!result.ok) invalidDomain = inp.dataset.domain;
    else domains[inp.dataset.domain] = result.value;
  });
  if(invalidDomain){
    setFieldError('examDomainError', `Điểm domain "${invalidDomain}" phải từ 0 đến 100.`);
    return;
  }
  store.mockExams.push({id:uid(), date, cert, score:scoreResult.value, domains});
  store.mockExams.sort((a,b)=> a.date.localeCompare(b.date));
  saveStore();
  document.getElementById('examScoreInput').value='';
  renderMockExam();
});

function renderMockExam(){
  renderExamDomainInputs();
  const C = chartColors();

  // history list
  const histWrap = document.getElementById('examHistoryList');
  histWrap.innerHTML='';
  if(store.mockExams.length===0){
    histWrap.appendChild(el('div','empty-state','Chưa có lần thi thử nào được ghi nhận.'));
  } else {
    [...store.mockExams].reverse().forEach(ex=>{
      const row = el('div','exam-history-row');
      row.appendChild(el('div', null, fmtShort(parseISO(ex.date))));
      row.appendChild(el('span','tag tag-'+ex.cert.toLowerCase(), ex.cert));
      const barBg = el('div','score-bar-bg');
      const barFill = el('div','score-bar-fill');
      barFill.style.width = ex.score+'%';
      barFill.style.background = ex.score>=75? C.green : ex.score>=60? C.yellow : C.red;
      barBg.appendChild(barFill);
      row.appendChild(barBg);
      row.appendChild(el('div', null, ex.score+'%'));
      histWrap.appendChild(row);
    });
  }

  // trend chart
  const seriesMap = {PSPO:[], PMP:[]};
  store.mockExams.forEach(ex=> seriesMap[ex.cert].push({x_label:fmtShort(parseISO(ex.date)), y:ex.score}));
  const series = [];
  if(seriesMap.PSPO.length) series.push({label:'PSPO', color:C.pspo, points:seriesMap.PSPO});
  if(seriesMap.PMP.length) series.push({label:'PMP', color:C.pmp, points:seriesMap.PMP});
  if(series.length===0) series.push({label:'—', color:C.text2, points:[{x_label:'',y:0}]});
  drawLineChart(document.getElementById('chartExamTrend'), series, {maxY:100, minY:0});

  // radar
  const radarCert = document.getElementById('radarCertSelect').value;
  const dms = domainsFor(radarCert);
  const avgVals = dms.map(dm=>{
    const vals = store.mockExams.filter(e=>e.cert===radarCert && e.domains && e.domains[dm]!==undefined).map(e=>e.domains[dm]);
    return vals.length? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
  });
  drawRadarChart(document.getElementById('chartRadar'), dms, [{label:radarCert, color: radarCert==='PSPO'?C.pspo:C.pmp, values:avgVals}]);

  // heatmap of weak topics from error log
  const heat = {};
  store.errorLog.forEach(e=>{ heat[e.domain||'Khác'] = (heat[e.domain||'Khác']||0)+1; });
  const heatGrid = document.getElementById('heatGrid');
  heatGrid.innerHTML='';
  const entries = Object.entries(heat).sort((a,b)=>b[1]-a[1]);
  if(entries.length===0){ heatGrid.appendChild(el('div','empty-state','Chưa có dữ liệu Error Log.')); }
  const maxCount = entries.length? entries[0][1] : 1;
  entries.forEach(([domain,count])=>{
    const intensity = count/maxCount;
    const cell = el('div','heat-cell');
    const color = intensity>0.66? C.red : intensity>0.33? C.yellow : C.green;
    cell.style.background = color+'18';
    cell.style.borderColor = color+'55';
    cell.appendChild(el('div','hname', domain));
    cell.appendChild(el('div','hcount', String(count)));
    cell.appendChild(el('div','hlabel','LẦN SAI'));
    heatGrid.appendChild(cell);
  });
}
document.getElementById('radarCertSelect').addEventListener('change', renderMockExam);

/* ================================================================
   DAILY PLANNER
================================================================= */
let plannerDate = fmtISO(new Date() < START_DATE ? START_DATE : (new Date() > END_DATE ? END_DATE : new Date()));
document.getElementById('plannerPrev').addEventListener('click', ()=>{ plannerDate = fmtISO(addDays(parseISO(plannerDate),-1)); renderPlanner(); });
document.getElementById('plannerNext').addEventListener('click', ()=>{ plannerDate = fmtISO(addDays(parseISO(plannerDate),1)); renderPlanner(); });
document.getElementById('plannerTodayBtn').addEventListener('click', ()=>{ plannerDate = fmtISO(new Date()); renderPlanner(); });

function renderPlanner(){
  const dt = parseISO(plannerDate);
  document.getElementById('plannerDateBig').textContent = fmtVN(dt);
  document.getElementById('plannerDateSub').textContent = `Ngày ${dayDiff(dt,START_DATE)+1} / ${dayDiff(END_DATE,START_DATE)+1}`;
  const examTag = document.getElementById('plannerExamTag');
  if(plannerDate===store.examDates.PSPO){ examTag.style.display='inline-flex'; examTag.className='tag tag-pspo'; examTag.textContent='🎯 PSPO EXAM DAY'; }
  else if(plannerDate===store.examDates.PMP){ examTag.style.display='inline-flex'; examTag.className='tag tag-pmp'; examTag.textContent='🎯 PMP EXAM DAY'; }
  else examTag.style.display='none';

  const wrap = document.getElementById('plannerTaskList');
  wrap.innerHTML='';
  const tasks = store.tasks[plannerDate]||[];
  if(tasks.length===0) wrap.appendChild(el('div','empty-state','Chưa có task nào — thêm task bên dưới.'));
  tasks.forEach(t=> wrap.appendChild(buildTaskRow(t, plannerDate, renderPlanner)) );

  const hours = (store.studyLog[plannerDate]||{}).hours || 0;
  document.getElementById('plannerHoursSlider').value = hours;
  document.getElementById('plannerHoursVal').textContent = hours+'h';
  document.getElementById('plannerNoteInput').value = (store.studyLog[plannerDate]||{}).note || '';
}
document.getElementById('plannerAddTaskBtn').addEventListener('click', ()=>{
  const txt = document.getElementById('plannerNewTaskText').value.trim();
  const cert = document.getElementById('plannerNewTaskCert').value;
  if(!txt) return;
  if(!store.tasks[plannerDate]) store.tasks[plannerDate]=[];
  store.tasks[plannerDate].push(mkTask(txt,cert,false));
  saveStore();
  document.getElementById('plannerNewTaskText').value='';
  renderPlanner();
});
document.getElementById('plannerHoursSlider').addEventListener('input', e=>{
  document.getElementById('plannerHoursVal').textContent = e.target.value+'h';
});
document.getElementById('plannerHoursSlider').addEventListener('change', e=>{
  if(!store.studyLog[plannerDate]) store.studyLog[plannerDate]={hours:0,note:''};
  store.studyLog[plannerDate].hours = +e.target.value;
  saveStore();
});
document.getElementById('plannerNoteInput').addEventListener('change', e=>{
  if(!store.studyLog[plannerDate]) store.studyLog[plannerDate]={hours:0,note:''};
  store.studyLog[plannerDate].note = e.target.value;
  saveStore();
});

/* ================================================================
   ANALYTICS
================================================================= */
function renderAnalytics(){
  const C = chartColors();
  let totalHours=0, loggedDays=0;
  for(const iso in store.studyLog){ totalHours += (store.studyLog[iso].hours||0); if(store.studyLog[iso].hours>0) loggedDays++; }
  document.getElementById('anTotalHours').textContent = totalHours.toFixed(1)+'h';
  document.getElementById('anAvgHours').textContent = (loggedDays? (totalHours/loggedDays):0).toFixed(1)+'h';

  const allScores = store.mockExams.map(e=>e.score);
  document.getElementById('anAvgScore').textContent = allScores.length? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length)+'%' : '—';

  // predicted pass rate: blend of avg recent score (60%) and completion% (40%)
  const overall = overallStats();
  const recentScores = allScores.slice(-5);
  const avgRecent = recentScores.length? recentScores.reduce((a,b)=>a+b,0)/recentScores.length : null;
  let passRate;
  if(avgRecent!==null) passRate = Math.round(avgRecent*0.65 + overall.pct*0.35);
  else passRate = Math.round(overall.pct*0.6);
  const prEl = document.getElementById('anPassRate');
  prEl.textContent = passRate+'%';
  prEl.style.color = passRate>=75? C.green : passRate>=55? C.yellow : C.red;

  // completion forecast
  ['PSPO','PMP'].forEach(cert=>{
    const stats = certStats(cert);
    const remaining = stats.total - stats.done;
    const vel = weeklyVelocity();
    const perDay = Math.max(0.3, +vel.perDay);
    const daysNeeded = Math.ceil(remaining/perDay);
    const forecastDate = addDays(new Date(), daysNeeded);
    document.getElementById(cert==='PSPO'?'forecastPspo':'forecastPmp').textContent =
      remaining<=0 ? '✅ Hoàn thành' : `~${fmtVN(forecastDate)} (còn ${remaining} task)`;
  });

  // domain completion chart: use error log domains + mock exam domains as proxy weighting
  const dms = [...PSPO_DOMAINS, ...PMP_DOMAINS];
  const labels = dms.map(d=>d.length>14? d.slice(0,13)+'…':d);
  const values = dms.map(dm=>{
    const scores = store.mockExams.filter(e=>e.domains && e.domains[dm]!==undefined).map(e=>e.domains[dm]);
    if(scores.length) return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
    return overall.pct; // fallback proxy
  });
  drawBarChart(document.getElementById('chartDomainCompletion'), labels, values, (i)=> i<PSPO_DOMAINS.length? C.pspo : C.pmp, {maxY:100});
}

/* ================================================================
   ERROR LOG
================================================================= */
function renderErrorLog(){
  const body = document.getElementById('errorLogBody');
  body.innerHTML='';
  if(store.errorLog.length===0){
    const tr = document.createElement('tr');
    tr.className = 'el-empty-row';
    const td = document.createElement('td'); td.colSpan=7; td.className='empty-state'; td.textContent='Chưa có câu sai nào được ghi lại.';
    tr.appendChild(td); body.appendChild(tr); return;
  }
  [...store.errorLog].reverse().forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Date">${fmtShort(parseISO(e.date))}</td>
      <td data-label="Certificate"><span class="tag tag-${e.cert.toLowerCase()}">${e.cert}</span></td>
      <td data-label="Domain">${escapeHtml(e.domain)}</td>
      <td data-label="Question">${escapeHtml(e.question)}</td>
      <td data-label="Root Cause">${escapeHtml(e.root)}</td>
      <td data-label="Action">${escapeHtml(e.action)}</td>
      <td><span class="el-del">Xoá</span></td>
    `;
    tr.querySelector('.el-del').addEventListener('click', ()=>{
      store.errorLog = store.errorLog.filter(x=>x.id!==e.id);
      saveStore(); renderErrorLog();
    });
    body.appendChild(tr);
  });
}
function escapeHtml(s){ const d=document.createElement('div'); d.textContent = s||''; return d.innerHTML; }

document.getElementById('btnAddError').addEventListener('click', ()=>{
  const date = document.getElementById('elDate').value;
  const cert = document.getElementById('elCert').value;
  const domain = document.getElementById('elDomain').value.trim();
  const question = document.getElementById('elQuestion').value.trim();
  const root = document.getElementById('elRoot').value.trim();
  const action = document.getElementById('elAction').value.trim();
  setFieldError('errorLogFormError', '');
  if(!date){
    setFieldError('errorLogFormError', 'Chọn ngày ghi nhận lỗi.');
    return;
  }
  if(!domain || !question){
    setFieldError('errorLogFormError', 'Nhập ít nhất Domain và Câu hỏi.');
    return;
  }
  store.errorLog.push({id:uid(), date, cert, domain, question, root, action});
  saveStore();
  ['elDomain','elQuestion','elRoot','elAction'].forEach(id=> document.getElementById(id).value='');
  renderErrorLog();
});

/* ================================================================
   INIT
================================================================= */
let resizeTimer = null;
window.addEventListener('resize', ()=>{
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(()=>{ renderView(currentView()); }, 150);
});

loadStore();
applyTheme();
document.getElementById('examDateInput').value = fmtISO(new Date());
document.getElementById('elDate').value = fmtISO(new Date());
renderExamDomainInputs();
switchView('dashboard');
}
