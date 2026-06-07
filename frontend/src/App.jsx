/* =============================================================================
   App.jsx — Result Report Card Printer (single self-contained file)

   Settings (top of file):
     • API_URL  -> backend upload endpoint
     • PREVIEW  -> true shows 3 demo students; set false to start empty
     • bigbang.png -> place in your public/ folder (served at /bigbang.png)

   PRINT: dialog -> A4 · Margins: None · turn ON "Background graphics".
   Each student = 2 pages (front + back), duplex-ready.
============================================================================= */

import React, { useState, useMemo } from "react";

const API_URL = "https://report-9coj.onrender.com/api/upload-result";
const PREVIEW = true;

const BRAND = {
  name: "BIG BANG EXAM CARE",
  exam: "",
  logo: "/bigbang.png",            // file lives in public/
  motto: "নিয়মিত পরীক্ষায় হোক গোছানো প্রস্তুতি",
};

/* =============================== STYLES ================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Sora:wght@500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&display=swap');

.srp-root{
  --bn:'Hind Siliguri','Noto Sans Bengali',sans-serif;
  --num:'Sora',sans-serif;
  --display:'Fraunces','Sora',serif;
  --sc-font:8.3px; --bar-h:70mm;
  --ink:#101728; --ink2:#5b6678; --line:#e7e9f0;
  font-family:var(--bn); color:var(--ink); text-align:left;
}
.srp-root,.srp-root *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}

/* ---------- screen chrome ---------- */
.srp-bar{
  position:sticky; top:0; z-index:50; display:flex; align-items:center; gap:14px;
  flex-wrap:wrap; padding:16px 22px;
  background:linear-gradient(110deg,#0c1330,#241552 60%,#0e2a4d); color:#fff;
  box-shadow:0 6px 24px rgba(8,10,30,.4);
}
.srp-bar .logo{display:flex;align-items:center;gap:11px;}
.srp-bar .crest{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;
  justify-content:center;background:#fff;overflow:hidden;padding:4px;
  box-shadow:0 4px 14px rgba(251,191,36,.4);}
.srp-bar .crest img{width:100%;height:100%;object-fit:contain;}
.srp-bar h2{font-family:var(--display);font-size:19px;margin:0;letter-spacing:.2px;}
.srp-bar .sub{font-size:11.5px;color:#b9c2e6;font-family:var(--num);}
.srp-actions{margin-left:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.srp-file{font-size:12px;color:#dfe4f7;font-family:var(--num);
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);
  border-radius:10px;padding:8px 12px;max-width:230px;}
.srp-file::file-selector-button{border:0;margin-right:9px;padding:5px 11px;border-radius:7px;
  font-family:var(--num);font-weight:700;cursor:pointer;color:#1a103a;
  background:linear-gradient(135deg,#a5f3fc,#67e8f9);}
.srp-btn{border:0;cursor:pointer;font-family:var(--num);font-weight:800;font-size:13.5px;
  padding:11px 20px;border-radius:999px;color:#06121f;
  background:linear-gradient(135deg,#5eead4,#38bdf8);box-shadow:0 8px 22px rgba(56,189,248,.4);}
.srp-btn.print{background:linear-gradient(135deg,#fcd34d,#fb923c);box-shadow:0 8px 22px rgba(251,146,60,.45);}
.srp-btn:disabled{opacity:.55;cursor:not-allowed;}
.srp-btn:active{transform:translateY(1px);}
.srp-tip{width:100%;font-size:11px;color:#aeb8e0;font-family:var(--num);}

.srp-empty{padding:80px 24px;text-align:center;color:#64748b;font-family:var(--num);
  background:#f6f7fb;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;}
.srp-empty .big{font-size:54px;}
.srp-stage{background:#eef0f6;padding:28px 14px 64px;display:flex;flex-direction:column;align-items:center;gap:24px;}

/* ---------- A4 paper ---------- */
.srp-page{
  position:relative; width:210mm; height:297mm; background:#fff; color:var(--ink);
  padding:10mm 9mm 7mm; overflow:hidden; display:flex; flex-direction:column;
  background-image:radial-gradient(circle at 1px 1px, rgba(16,23,40,.035) 1px, transparent 0);
  background-size:18px 18px;
}
.srp-stage .srp-page{box-shadow:0 24px 60px rgba(10,12,40,.28);border-radius:3px;}
.srp-page::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5mm;background:var(--rb,linear-gradient(180deg,#6d28d9,#0ea5e9));}
.srp-page .flourish{position:absolute;right:-30mm;top:-30mm;width:80mm;height:80mm;border-radius:50%;
  background:var(--rb);opacity:.06;}

/* ===== FRONT hero ===== */
.hd{display:flex;justify-content:space-between;align-items:center;padding:6mm 7mm;border-radius:15px;color:#fff;
  background:linear-gradient(120deg,#4c1d95,#6d28d9 42%,#1d4ed8);box-shadow:0 8px 22px rgba(76,29,149,.3);}
.hd .lf{display:flex;align-items:center;gap:11px;}
.hd .seal{width:14mm;height:14mm;border-radius:12px;display:flex;align-items:center;justify-content:center;
  background:#fff;overflow:hidden;padding:1.5mm;box-shadow:0 4px 12px rgba(0,0,0,.18);}
.hd .seal img{width:100%;height:100%;object-fit:contain;}
.hd h1{font-family:var(--display);font-size:22px;margin:0;line-height:1.02;}
.hd .ex{font-size:11px;opacity:.9;margin-top:2px;}
.hd .rt{text-align:right;}
.hd .rl{font-family:var(--num);font-size:10px;letter-spacing:1px;text-transform:uppercase;opacity:.8;}
.hd .rv{font-family:var(--num);font-weight:800;font-size:26px;line-height:1;}

/* score band: gauge + stats */
.score{display:grid;grid-template-columns:auto 1fr;gap:11px;margin-top:8px;align-items:center;
  padding:6px;border-radius:15px;background:linear-gradient(120deg,#faf5ff,#eff6ff);border:1px solid #e9e2fb;}
.gauge{position:relative;width:34mm;height:34mm;}
.gauge .gc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.gauge .gv{font-family:var(--num);font-weight:800;font-size:23px;line-height:1;}
.gauge .gl{font-size:8.5px;color:var(--ink2);margin-top:1px;}
.gauge .grade{font-family:var(--display);font-weight:800;font-size:13px;margin-top:2px;padding:1px 9px;border-radius:999px;color:#fff;}
.scoreRt{display:flex;flex-direction:column;gap:6px;padding-right:6px;}
.cat{align-self:flex-start;font-weight:800;font-size:11.5px;padding:5px 13px;border-radius:999px;}
.mini{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.mini .m{padding:5px 6px;border-radius:10px;background:#fff;border:1px solid var(--line);}
.mini .mk{font-size:8.5px;color:var(--ink2);font-weight:600;}
.mini .mv{font-family:var(--num);font-weight:800;font-size:15px;}
.dk{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px;}

/* section label */
.sec{display:flex;align-items:center;gap:8px;margin:9px 0 5px;}
.sec .tg{font-family:var(--num);font-size:9px;color:#fff;background:var(--ac,#6d28d9);padding:3px 9px;border-radius:6px;font-weight:800;letter-spacing:.4px;}
.sec b{font-family:var(--display);font-size:14px;color:#1b2236;}
.sec .ru{flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--ac,#6d28d9),transparent);}

.barCard{border:1px solid var(--line);border-radius:14px;padding:6px 9px 2px;background:linear-gradient(180deg,#fff,#f7f9ff);}
.barSvg{width:100%;height:var(--bar-h);display:block;}

.scGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;align-content:start;flex:1;}
.scC{border:1px solid var(--line);border-left:3px solid #94a3b8;border-radius:9px;padding:5px 7px;background:#fff;
  display:flex;flex-direction:column;gap:2px;break-inside:avoid;}
.scC .t{display:flex;justify-content:space-between;align-items:center;gap:5px;}
.scC h4{margin:0;font-size:10.5px;font-weight:700;}
.scC .bd{font-family:var(--num);font-weight:800;font-size:9px;padding:2px 6px;border-radius:999px;}
.scC .mn{font-family:var(--num);font-size:7.2px;color:#7a8499;}
.scC .ct{font-size:8.4px;font-weight:700;}
.scC p{margin:0;font-size:var(--sc-font);line-height:1.4;color:#5b6678;}

.ft{margin-top:auto;padding-top:5px;display:flex;justify-content:space-between;align-items:center;
  border-top:1px dashed var(--line);font-family:var(--num);font-size:8.5px;color:#9aa3b5;}
.ft .pill{background:#101728;color:#fff;padding:2px 9px;border-radius:999px;font-weight:700;}

/* ===== BACK ===== */
.bh{display:flex;justify-content:space-between;align-items:center;padding:5mm 7mm;border-radius:14px;color:#fff;
  background:linear-gradient(120deg,#0f766e,#0891b2 55%,#1d4ed8);box-shadow:0 8px 22px rgba(13,148,136,.28);}
.bh h1{font-family:var(--display);font-size:18px;margin:0;}
.bh .r{text-align:right;font-family:var(--num);}
.bh .r b{font-size:17px;display:block;}
.bh .r span{font-size:9.5px;opacity:.88;}

.dRow{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;}
.dC{border:1px solid var(--line);border-radius:13px;padding:7px 5px 8px;text-align:center;
  background:linear-gradient(180deg,#fff,#f6fbfb);display:flex;flex-direction:column;align-items:center;gap:4px;}
.dC .dt{font-size:9.5px;font-weight:800;line-height:1.05;min-height:21px;display:flex;align-items:center;}
.dW{position:relative;}
.dCtr{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.dCtr strong{font-family:var(--num);font-weight:800;font-size:15px;line-height:1;}
.dCtr span{font-size:7px;color:#7a8499;margin-top:1px;}
.dLeg{display:flex;flex-direction:column;gap:1px;width:100%;}
.dLeg .l{display:flex;align-items:center;justify-content:space-between;font-size:7.6px;color:#5b6678;}
.dLeg .l .n{display:flex;align-items:center;gap:3px;}
.dLeg .l b{font-family:var(--num);}
.dChip{margin-top:1px;font-size:7.6px;font-weight:800;padding:2px 8px;border-radius:999px;}

.cm{border:1px solid var(--line);border-radius:13px;padding:8px 11px;margin-top:7px;background:#fff;
  border-left:4px solid var(--ac,#6d28d9);break-inside:avoid;}
.cm .h{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px;}
.cm .lb{font-family:var(--num);font-size:8px;font-weight:800;color:#fff;background:var(--ac,#6d28d9);padding:2px 9px;border-radius:6px;letter-spacing:.3px;}
.cm h3{margin:0;font-size:12.5px;font-weight:700;}
.cm .dv{font-family:var(--num);font-size:9px;font-weight:800;color:#92400e;background:#fef3c7;padding:2px 9px;border-radius:999px;white-space:nowrap;}
.cm p{margin:2px 0 0;font-size:9.4px;line-height:1.55;color:#5b6678;}
.cm.wr{background:linear-gradient(120deg,#ecfeff,#eef2ff);border-left-color:#06b6d4;}
.cm.wr h3{color:#0e7490;}

/* ---------- PRINT ---------- */
@media print{
  @page{size:A4;margin:0;}
  html,body{background:#fff !important;margin:0 !important;}
  #root{border:0 !important;width:auto !important;max-width:none !important;text-align:left !important;}
  .srp-bar,.srp-tip,.srp-empty{display:none !important;}
  .srp-stage{background:#fff;padding:0;gap:0;}
  .srp-stage .srp-page{box-shadow:none;border-radius:0;}
  .srp-page{break-after:page;page-break-after:always;}
  .srp-page:last-child{break-after:auto;page-break-after:auto;}
}
`;

/* ===================== band colors / grade / written ==================== */
function band(p){
  const v=Number(p)||0;
  if(v>=90)return{bar:"#15803d",bg:"#dcfce7",tx:"#166534",lb:"চমৎকার",g:"#16a34a"};
  if(v>=80)return{bar:"#0369a1",bg:"#e0f2fe",tx:"#075985",lb:"ভালো",g:"#0284c7"};
  if(v>=65)return{bar:"#b45309",bg:"#fef3c7",tx:"#92400e",lb:"মোটামুটি",g:"#d97706"};
  if(v>=50)return{bar:"#c2410c",bg:"#ffedd5",tx:"#9a3412",lb:"মনোযোগ দরকার",g:"#ea580c"};
  if(v>=30)return{bar:"#b91c1c",bg:"#fee2e2",tx:"#991b1b",lb:"দুর্বল",g:"#dc2626"};
  return{bar:"#475569",bg:"#f1f5f9",tx:"#334155",lb:"বিশেষ মনোযোগ",g:"#64748b"};
}
function grade(p){const v=Number(p)||0;
  if(v>=90)return"A+";if(v>=80)return"A";if(v>=70)return"A-";if(v>=60)return"B";if(v>=50)return"C";if(v>=40)return"D";return"F";}

function writtenComment(p){
  const v=Number(p)||0;
  if(v>=90)return{c:"লিখিত অংশে চমৎকার পারফরম্যান্স",t:"লিখিত অংশে শিক্ষার্থী চমৎকার করছে। উত্তর গুছিয়ে লেখা, প্রয়োজনীয় পয়েন্ট ও ব্যাখ্যা সঠিকভাবে তুলে ধরা এবং উপস্থাপনার এই মান ধরে রাখলে লিখিত অংশ থেকে ধারাবাহিকভাবে ভালো নম্বর পাওয়া সম্ভব।"};
  if(v>=80)return{c:"লিখিত অংশে ভালো করছে",t:"লিখিত অংশে শিক্ষার্থী ভালো করছে। হাতের লেখা, উত্তরের কাঠামো ও সময় ব্যবস্থাপনায় আরও একটু যত্ন নিলে এবং গুরুত্বপূর্ণ পয়েন্টে জোর দিলে এই অংশের নম্বর আরও বাড়ানো সম্ভব।"};
  if(v>=65)return{c:"লিখিত অংশ মোটামুটি ভালো",t:"লিখিত অংশে প্রস্তুতি মোটামুটি ভালো আছে। গুরুত্বপূর্ণ প্রশ্নগুলো নিয়মিত লিখে অনুশীলন করা এবং উত্তর সাজিয়ে পরিষ্কারভাবে উপস্থাপন করার চর্চা করলে দ্রুত উন্নতি হবে।"};
  if(v>=50)return{c:"লিখিত অংশে আরও মনোযোগ দরকার",t:"লিখিত অংশে আরও মনোযোগ দরকার। শুধু পড়লেই হবে না—নিয়মিত লিখে অনুশীলন করা, উত্তরের কাঠামো ঠিক রাখা এবং সময় ধরে লেখার চর্চা করলে এই অংশ থেকে ভালো নম্বর আসবে।"};
  if(v>=30)return{c:"লিখিত অংশ দুর্বল, চর্চা বাড়ানো দরকার",t:"লিখিত অংশে ফলাফল তুলনামূলকভাবে কম। প্রতিদিন নির্দিষ্ট সময় লেখার অনুশীলন, গুরুত্বপূর্ণ প্রশ্নের উত্তর তৈরি করা এবং মেন্টরের কাছে খাতা দেখিয়ে ভুল ঠিক করে নেওয়া দরকার।"};
  return{c:"লিখিত অংশে বিশেষ মনোযোগ প্রয়োজন",t:"লিখিত অংশে ফলাফল অনেক কম। এখন থেকেই নিয়মিত লেখার অভ্যাস গড়ে তোলা, বেসিক প্রশ্ন থেকে শুরু করা এবং মেন্টরের সরাসরি সহায়তা নিয়ে ধাপে ধাপে এগোনো খুব জরুরি।"};
}

/* ============================ SVG charts ================================ */
function Gauge({pct}){
  const v=Number(pct)||0, size=128, sw=14, r=(size-sw)/2, c=2*Math.PI*r, cx=size/2;
  const col=band(v);
  return(
    <div className="gauge">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eceff6" strokeWidth={sw}/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={col.bar} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${(v/100)*c} ${c}`} transform={`rotate(-90 ${cx} ${cx})`}/>
      </svg>
      <div className="gc">
        <div className="gv" style={{color:col.bar}}>{v}%</div>
        <div className="gl">মোট ফলাফল</div>
        <div className="grade" style={{background:col.g}}>Grade {grade(v)}</div>
      </div>
    </div>
  );
}

function Donut({correct,incorrect,skipped,center,size=98,sw=12}){
  const r=(size-sw)/2, cx=size/2, C=2*Math.PI*r, gap=5;
  const segs=[{v:+correct||0,c:"#22c55e"},{v:+incorrect||0,c:"#ef4444"},{v:+skipped||0,c:"#f59e0b"}];
  let cum=0;
  return(
    <div className="dW" style={{width:size,height:size}}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef1f7" strokeWidth={sw}/>
        {segs.map((s,i)=>{const len=Math.max((s.v/100)*C-gap,0);const rot=-90+(cum/100)*360;cum+=s.v;
          if(len<=0)return null;
          return <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={s.c} strokeWidth={sw}
            strokeDasharray={`${len} ${C-len}`} transform={`rotate(${rot} ${cx} ${cx})`}/>;})}
      </svg>
      <div className="dCtr"><strong style={{color:band(center).bar}}>{center}%</strong><span>মোট</span></div>
    </div>
  );
}
function DonutCard({title,data}){
  const co=data?.correctPercentage||0, ic=data?.incorrectPercentage||0, sk=data?.skippedPercentage||0,
        tot=data?.totalPercentage||0, wr=data?.writtenPercentage||0, b=band(tot);
  return(
    <div className="dC">
      <div className="dt">{title}</div>
      <Donut correct={co} incorrect={ic} skipped={sk} center={tot}/>
      <div className="dLeg">
        <div className="l"><span className="n"><span className="dk" style={{background:"#22c55e"}}/>সঠিক</span><b>{co}%</b></div>
        <div className="l"><span className="n"><span className="dk" style={{background:"#ef4444"}}/>ভুল</span><b>{ic}%</b></div>
        <div className="l"><span className="n"><span className="dk" style={{background:"#f59e0b"}}/>স্কিপ</span><b>{sk}%</b></div>
        <div className="l"><span className="n"><span className="dk" style={{background:"#06b6d4"}}/>লিখিত</span><b>{wr}%</b></div>
      </div>
      <span className="dChip" style={{background:b.bg,color:b.tx}}>{b.lb}</span>
    </div>
  );
}

function BarChart({bars}){
  const W=1000,H=350,padL=38,padR=12,padT=22,padB=112;
  const pw=W-padL-padR, ph=H-padT-padB, n=Math.max(bars.length,1), slot=pw/n, bw=Math.min(slot*0.58,42);
  return(
    <svg className="barSvg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        {bars.map((b,i)=>{const c=band(b.pct);return(
          <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.bar} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={c.bar} stopOpacity="0.62"/>
          </linearGradient>);})}
      </defs>
      {[0,25,50,75,100].map(g=>{const y=padT+ph-(g/100)*ph;return(
        <g key={g}>
          <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#e9edf4" strokeWidth="1"/>
          <text x={padL-6} y={y+4} textAnchor="end" fontSize="12" fill="#9aa3b5" fontFamily="Sora">{g}</text>
        </g>);})}
      {bars.map((b,i)=>{const x=padL+slot*i+slot/2, bh=(b.pct/100)*ph, y=padT+ph-bh, ly=padT+ph+13;
        return(
          <g key={b.subject+i}>
            <rect x={x-bw/2} y={y} width={bw} height={Math.max(bh,2)} rx="5" fill={`url(#g${i})`}/>
            <text x={x} y={y-5} textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#1b2236" fontFamily="Sora">{b.pct}%</text>
            <text x={x} y={ly} transform={`rotate(-42 ${x} ${ly})`} textAnchor="end" fontSize="13" fill="#5b6678" fontFamily="Hind Siliguri">{b.subject}</text>
          </g>);})}
      <line x1={padL} y1={padT+ph} x2={W-padR} y2={padT+ph} stroke="#cbd2df" strokeWidth="1.5"/>
    </svg>
  );
}

/* =============================== PAGES ================================== */
function Front({student}){
  const a=student.analysis||{};
  const sb=a.subjectConsistency?.subjectBars||[];
  const bars=sb.map(s=>({subject:s.subject,pct:s.totalPercentage||s.percentage||0})).sort((x,y)=>y.pct-x.pct);
  const cmts=[...sb].sort((x,y)=>(y.totalPercentage||0)-(x.totalPercentage||0));
  const b=band(a.totalPercentage||0);
  return(
    <div className="srp-page" style={{"--rb":"linear-gradient(180deg,#6d28d9,#0ea5e9)"}}>
      <div className="flourish"/>
      <div className="hd">
        <div className="lf">
          <div className="seal"><img src={BRAND.logo} alt="logo"/></div>
          <div><h1>{BRAND.name}</h1><div className="ex">{BRAND.exam}</div></div>
        </div>
        <div className="rt"><div className="rl">Roll No</div><div className="rv">{student.roll}</div></div>
      </div>

      <div className="score">
        <Gauge pct={a.totalPercentage||0}/>
        <div className="scoreRt">
          <span className="cat" style={{background:b.bg,color:b.tx}}>{a.category}</span>
          <div className="mini">
            <div className="m"><div className="mk">প্রাপ্ত</div><div className="mv">{a.totalObtained||0}/{a.totalMarks||0}</div></div>
            <div className="m"><div className="mk"><span className="dk" style={{background:"#22c55e"}}/>সঠিক</div><div className="mv">{a.totalCorrect||0}</div></div>
            <div className="m"><div className="mk"><span className="dk" style={{background:"#ef4444"}}/>ভুল</div><div className="mv">{a.totalIncorrect||0}</div></div>
            <div className="m"><div className="mk"><span className="dk" style={{background:"#f59e0b"}}/>স্কিপ</div><div className="mv">{a.totalSkipped||0}</div></div>
          </div>
        </div>
      </div>

      <div className="sec" style={{"--ac":"#4f46e5"}}><span className="tg">CHART</span><b>বিষয়ভিত্তিক মোট ফলাফল (%)</b><span className="ru"/></div>
      <div className="barCard"><BarChart bars={bars}/></div>

      <div className="sec" style={{"--ac":"#0ea5e9"}}><span className="tg">COMMENTS</span><b>বিষয়ভিত্তিক মন্তব্য</b><span className="ru"/></div>
      <div className="scGrid">
        {cmts.map(s=>{const pct=s.totalPercentage||s.percentage||0,c=band(pct);return(
          <div className="scC" key={s.subject} style={{borderLeftColor:c.bar}}>
            <div className="t"><h4>{s.subject}</h4><span className="bd" style={{background:c.bg,color:c.tx}}>{pct}%</span></div>
            <div className="mn">MCQ {s.mcqPercentage||0}% · লিখিত {s.writtenPercentage||0}% · মোট {pct}%</div>
            <div className="ct" style={{color:c.tx}}>{s.subjectCommentCategory}</div>
            <p>{s.subjectComment}</p>
          </div>);})}
      </div>

      <div className="ft"><span>{BRAND.name} · {BRAND.motto}</span><span className="pill">Roll {student.roll} · Page 1/2</span></div>
    </div>
  );
}

function Back({student}){
  const a=student.analysis||{}, p=a.partitions||{}, mp=a.mathPartitions||{}, w=writtenComment(a.writtenPercentage||0);
  return(
    <div className="srp-page" style={{"--rb":"linear-gradient(180deg,#0d9488,#2563eb)"}}>
      <div className="flourish"/>
      <div className="bh">
        <h1>Performance Deep-Dive · বিশ্লেষণ</h1>
        <div className="r"><b>Roll {student.roll}</b><span>মোট {a.totalPercentage||0}% · লিখিত {a.writtenPercentage||0}%</span></div>
      </div>

      <div className="sec" style={{"--ac":"#0d9488"}}><span className="tg">MCQ MIX</span><b>MCQ গঠন বিশ্লেষণ (সঠিক / ভুল / স্কিপ)</b><span className="ru"/></div>
      <div className="dRow">
        <DonutCard title="সামগ্রিক" data={a}/>
        <DonutCard title="Science" data={p.science}/>
        <DonutCard title="Non-Science" data={p.nonScience}/>
        <DonutCard title="Mathematical" data={mp.mathematical}/>
        <DonutCard title="Non-Math" data={mp.nonMathematical}/>
      </div>

      <div className="sec" style={{"--ac":"#6d28d9"}}><span className="tg">ANALYSIS</span><b>মন্তব্য ও পর্যবেক্ষণ</b><span className="ru"/></div>

      <div className="cm" style={{"--ac":"#6d28d9"}}>
        <div className="h"><span className="lb">সামগ্রিক</span><h3>{a.category}</h3></div>
        <p>{a.comment}</p>
      </div>
      <div className="cm" style={{"--ac":"#0d9488"}}>
        <div className="h"><span className="lb">Science vs Non-Science</span><span className="dv">পার্থক্য: {p.comparison?.deviation||0}%</span></div>
        <h3 style={{marginTop:2}}>{p.comparison?.category}</h3><p>{p.comparison?.comment}</p>
      </div>
      <div className="cm" style={{"--ac":"#b45309"}}>
        <div className="h"><span className="lb">Math vs Non-Math</span><span className="dv">পার্থক্য: {mp.comparison?.deviation||0}%</span></div>
        <h3 style={{marginTop:2}}>{mp.comparison?.category}</h3><p>{mp.comparison?.comment}</p>
      </div>
      <div className="cm wr">
        <div className="h"><span className="lb" style={{background:"#06b6d4"}}>লিখিত · {a.writtenPercentage||0}%</span><h3>{w.c}</h3></div>
        <p>{w.t}</p>
      </div>

      <div className="ft"><span>{BRAND.name} · {BRAND.motto}</span><span className="pill">Roll {student.roll} · Page 2/2</span></div>
    </div>
  );
}

/* ============================== APP ==================================== */
export default function App(){
  const seed = useMemo(()=>PREVIEW?SAMPLE_STUDENTS:[],[]);
  const [students,setStudents]=useState(seed);
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(false);

  const upload=async()=>{
    if(!file){alert("Select an Excel file first");return;}
    const fd=new FormData(); fd.append("file",file);
    try{
      setLoading(true);
      const res=await fetch(API_URL,{method:"POST",body:fd});
      const data=await res.json();
      setStudents(data.students||[]);
    }catch(e){console.error(e);alert("Upload failed — is the backend running?");}
    finally{setLoading(false);}
  };

  return(
    <div className="srp-root">
      <style>{CSS}</style>
      <div className="srp-bar">
        <div className="logo">
          <div className="crest"><img src={BRAND.logo} alt="logo"/></div>
          <div><h2>Report Card Printer</h2><div className="sub">{BRAND.name}</div></div>
        </div>
        <div className="srp-actions">
          <input className="srp-file" type="file" accept=".xlsx,.xls" onChange={e=>setFile(e.target.files[0])}/>
          <button className="srp-btn" onClick={upload} disabled={loading}>{loading?"Processing…":"Upload Excel"}</button>
          {students.length>0 && <button className="srp-btn print" onClick={()=>window.print()}>🖨 Print All ({students.length})</button>}
        </div>
        <div className="srp-tip">Print → A4 · Margins: None · ✓ Background graphics · each student = 2 pages (front + back)</div>
      </div>

      {students.length===0 ? (
        <div className="srp-empty"><div className="big">📄</div><div>Upload an Excel file to generate report cards.</div></div>
      ):(
        <div className="srp-stage">
          {students.map(s=>(
            <React.Fragment key={s.id??s.roll}>
              <Front student={s}/>
              <Back student={s}/>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   DEMO DATA + analysis engine (mirrors backend utils/studentAnalysis.js).
   Seeds the PREVIEW only. Delete this whole block in production once you set
   PREVIEW=false — real analysis comes from the backend in student.analysis.
========================================================================== */
const sn=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
const pc=(o,t)=>{const O=sn(o),T=sn(t);if(!T||T<=0)return 0;return Number(((O/T)*100).toFixed(2));};
function std(r){const c=sn(r.correct),ic=sn(r.incorrect),sk=sn(r.skipped),mt=sn(r.mcqTotal),w=sn(r.written),wt=sn(r.writtenTotal);
  const at=c+ic+sk,fm=mt>0?mt:at,to=c+w,tm=fm+wt;
  return{correct:c,incorrect:ic,skipped:sk,mcqTotal:fm,written:w,writtenTotal:wt,totalObtained:to,totalMarks:tm,
    mcqPercentage:pc(c,fm),writtenPercentage:pc(w,wt),totalPercentage:pc(to,tm)};}
function sw(tp){const p=sn(tp);
  if(p>=90)return{category:"খুব ভালো অবস্থানে আছে",comment:"এই বিষয়ে শিক্ষার্থী খুব ভালো অবস্থানে আছে। বর্তমান প্রস্তুতি ও ধারাবাহিকতা ধরে রাখাই এখন সবচেয়ে গুরুত্বপূর্ণ। নিয়মিত অনুশীলন ও রিভিশন চালিয়ে গেলে ভালো ফলাফল ধরে রাখা সম্ভব।"};
  if(p>=80)return{category:"ভালো পথে আছে",comment:"এই বিষয়ে শিক্ষার্থী ভালো পথে আছে এবং প্রস্তুতি মোটামুটি লাইনে আছে। ছোট কোনো অধ্যায়, সূত্র বা ব্যাখ্যায় সামান্য দুর্বলতা থাকলে এখনই ঠিক করা ভালো, কারণ ছোট ভুল পরে বড় নম্বর কমিয়ে দিতে পারে।"};
  if(p>=65)return{category:"আরও ফোকাস দিলে ভালো উন্নতি হবে",comment:"এই বিষয়ে প্রস্তুতি এখনো পুরোপুরি সম্পন্ন হয়নি। কিছু টপিক আরও ভালোভাবে বুঝে পড়া দরকার। নিয়মিত রিভিশন ও ভুল হওয়া প্রশ্নগুলো আবার করলে দ্রুত উন্নতি সম্ভব।"};
  if(p>=50)return{category:"বুঝে পড়ার পদ্ধতি শক্ত করা দরকার",comment:"এই বিষয়ে শিক্ষার্থী হয়তো কিছু টপিক বুঝতে কষ্ট পাচ্ছে। শুধু বেশি পড়লেই হবে না, কীভাবে পড়ছে সেটিও দেখা দরকার। বেসিক আবার দেখে সমস্যার জায়গা খুঁজে বের করলে উন্নতি হবে।"};
  if(p>=30)return{category:"এখনো উন্নতির ভালো সুযোগ আছে",comment:"এই বিষয়ে এখনো উন্নতির সময় আছে। নিয়মিত ও আন্তরিকভাবে পড়লে মেন্টররা সঠিকভাবে সাহায্য করতে পারবেন। কোথায় ভুল হচ্ছে তা অভিজ্ঞ শিক্ষকের সাথে আলোচনা করা দরকার।"};
  return{category:"এখন থেকেই বিশেষ মনোযোগ দরকার",comment:"এই বিষয়ে ফলাফল অনেক কম এসেছে, তাই এখন থেকেই বিশেষ মনোযোগ দরকার। প্রতিদিন নির্দিষ্ট সময় পড়া, বেসিক থেকে শুরু করা এবং মেন্টরের সাহায্য নেওয়া উচিত।"};
}
function agg(subjects){let c=0,ic=0,sk=0,m=0,w=0,wt=0;
  Object.values(subjects||{}).forEach(s=>{const d=std(s);c+=d.correct;ic+=d.incorrect;sk+=d.skipped;m+=d.mcqTotal;w+=d.written;wt+=d.writtenTotal;});
  const at=c+ic+sk,bm=m>0?m:at,to=c+w,tm=bm+wt;
  return{totalCorrect:c,totalIncorrect:ic,totalSkipped:sk,totalMcq:bm,totalWritten:w,totalWrittenMarks:wt,totalObtained:to,totalMarks:tm,
    correctPercentage:pc(c,bm),incorrectPercentage:pc(ic,bm),skippedPercentage:pc(sk,bm),writtenPercentage:pc(w,wt),totalPercentage:pc(to,tm)};}
const RULES=[
  {id:8,category:"নতুনভাবে শুরু করার ভালো সময়",check:p=>p.totalPercentage<30,comment:"শিক্ষার্থীর ফলাফল দেখে বোঝা যাচ্ছে এখন পড়াশোনাকে নতুনভাবে গুছিয়ে শুরু করার সময়। বেসিক ধীরে ধীরে পরিষ্কার করা, প্রতিদিন নির্দিষ্ট সময় পড়া এবং মেন্টরের সাথে নিয়মিত যোগাযোগ রাখলে উন্নতির ভালো সুযোগ আছে।"},
  {id:1,category:"খুব ভালো অবস্থানে আছে",check:p=>p.totalPercentage>=90,comment:"শিক্ষার্থী খুব ভালো অবস্থানে আছে। এই ধারাবাহিকতা ধরে রাখতে নিয়মিত অনুশীলন, রিভিশন এবং পরীক্ষার সময় মনোযোগ বজায় রাখা প্রয়োজন। একইভাবে এগিয়ে গেলে আরও ভালো ফলাফলের সম্ভাবনা রয়েছে।"},
  {id:2,category:"ভালো, আত্মবিশ্বাস বাড়ালে ফল আরও ভালো হবে",check:p=>p.totalPercentage<90&&p.totalPercentage>70&&p.skippedPercentage+5>p.incorrectPercentage,comment:"শিক্ষার্থীর প্রস্তুতি ভালো পর্যায়ে আছে। কিছু প্রশ্ন স্কিপ করা থেকে বোঝা যায়, জানা বিষয়েও আরও আত্মবিশ্বাস নিয়ে উত্তর করলে ফলাফল আরও ভালো হবে। নিয়মিত মডেল টেস্ট ও সাহস নিয়ে উত্তর করার চর্চা দরকার।"},
  {id:3,category:"ভালো, উত্তরে আরও মনোযোগ দরকার",check:p=>p.totalPercentage<90&&p.totalPercentage>70&&p.incorrectPercentage>p.skippedPercentage+5,comment:"শিক্ষার্থী ভালো করছে। তবে কিছু ভুল উত্তর কমাতে পারলে ফলাফল আরও স্থিতিশীল হবে। প্রশ্ন ভালোভাবে পড়ে, তাড়াহুড়া না করে নিশ্চিত হয়ে উত্তর করার অভ্যাস তৈরি করলে নম্বর বাড়বে।"},
  {id:4,category:"কৌশল ঠিক করলে ভালো উন্নতি হবে",check:p=>p.totalPercentage>=50&&p.totalPercentage<=70&&p.skippedPercentage+10<p.incorrectPercentage,comment:"প্রস্তুতি মাঝামাঝি পর্যায়ে আছে। ভুলের জায়গা চিহ্নিত করে অধ্যায়ভিত্তিক অনুশীলন করলে ভালো উন্নতি সম্ভব। কোন ধরনের প্রশ্নে বেশি ভুল হচ্ছে তা দেখে মেন্টরের গাইডলাইন অনুযায়ী পড়লে ফলাফল ভালো হবে।"},
  {id:5,category:"আত্মবিশ্বাস ও চর্চা বাড়ালে উন্নতি হবে",check:p=>p.totalPercentage>=50&&p.totalPercentage<=70&&p.skippedPercentage+5>p.incorrectPercentage,comment:"শিক্ষার্থী কিছু প্রশ্ন স্কিপ করছে। আত্মবিশ্বাস বাড়লে জানা প্রশ্নেও উত্তর করার সাহস পাবে। প্রতিদিন ছোট টেস্ট, নিয়মিত রিভিশন এবং সহজ থেকে কঠিন প্রশ্নে এগোলে ভালো উন্নতি হবে।"},
  {id:6,category:"পড়ার পদ্ধতি আরও কার্যকর করা দরকার",check:p=>p.totalPercentage>=30&&p.totalPercentage<=50&&p.skippedPercentage+5<p.incorrectPercentage,comment:"পড়াশোনায় আরও গুছানো পদ্ধতি দরকার। ভুল কমাতে আগে বেসিক ধারণা পরিষ্কার করা, তারপর অধ্যায়ভিত্তিক অনুশীলন ভালো হবে। মেন্টরের পরামর্শে পড়ার ধরন পরিবর্তন করলে উন্নতির সুযোগ আছে।"},
  {id:7,category:"চর্চা ও আত্মবিশ্বাস বাড়ানোর সময়",check:p=>p.totalPercentage>=30&&p.totalPercentage<=50&&p.skippedPercentage+5>p.incorrectPercentage,comment:"স্কিপ করা প্রশ্ন কিছুটা বেশি। নিজের প্রস্তুতির ওপর আত্মবিশ্বাস বাড়ালে স্কিপ করা প্রশ্নেও উত্তর করার চেষ্টা করতে পারবে। ছোট লক্ষ্য নিয়ে প্রতিদিন পড়া ও মেন্টরের সাথে আলোচনা করলে উন্নতি হবে।"},
];
function initCmt(pd){const m=RULES.find(r=>r.check(pd));
  return{category:m?m.category:"মেন্টরের পরামর্শ প্রয়োজন",comment:m?m.comment:"ফলাফলটি নির্দিষ্ট ক্যাটাগরিতে পড়ছে না। বিষয়ভিত্তিক ফলাফল দেখে মেন্টরের সাথে আলোচনা করে পরবর্তী পরিকল্পনা করা ভালো।"};}
const SCI=["Physics","Chemistry","General Math","Higher Math","Biology","BGS","Physics 1st","Physics 2nd","Chemistry 1st","Chemistry 2nd","Biology 1st","Biology 2nd","Higher Math 1st","Higher Math 2nd"];
const NSCI=["Bangla 1st","Bangla 2nd","English 1st","English 2nd","Religion","ICT"];
const MTH=["Physics","Chemistry","General Math","Higher Math","Physics 1st","Physics 2nd","Chemistry 1st","Chemistry 2nd","Higher Math 1st","Higher Math 2nd"];
const NMTH=["Bangla 1st","Bangla 2nd","English 1st","English 2nd","Religion","ICT","Biology","BGS","Biology 1st","Biology 2nd"];
const nm=n=>String(n||"").trim().toLowerCase().replace(/\s+/g," ");
const byNames=(s,names)=>{const a=names.map(nm),o={};Object.entries(s||{}).forEach(([k,v])=>{if(a.includes(nm(k)))o[k]=v;});return o;};
const part=(title,s)=>{const pd=agg(s);return{title,...pd,...initCmt(pd)};};
function sciCmp(s,ns){const a=s.totalPercentage||0,b=ns.totalPercentage||0,d=Number(Math.abs(a-b).toFixed(2)),w=a<b?"science":b<a?"nonScience":"equal";
  if(d<15)return{deviation:d,weakerPart:w,category:"Science ও Non-Science কাছাকাছি",comment:"দুই অংশের পারফরম্যান্স কাছাকাছি, যা ভালো ভারসাম্যের লক্ষণ। যে অংশে সামান্য কম নম্বর, সেখানে একটু বেশি রিভিশন দিলে সামগ্রিক ফলাফল আরও সুন্দর হবে।"};
  if(d<=30)return w==="science"?{deviation:d,weakerPart:w,category:"Science-এ বেশি সময় দিলে উন্নতি হবে",comment:"Science অংশে তুলনামূলকভাবে আরও মনোযোগ দিলে ভালো উন্নতি সম্ভব। Physics, Chemistry, Math ও Biology বুঝে পড়া এবং নিয়মিত সমস্যা সমাধান করলে ফলাফল ভালো হবে।"}:{deviation:d,weakerPart:w,category:"Non-Science-এ রিভিশন বাড়ালে ভালো হবে",comment:"Non-Science অংশে আরও রিভিশন দরকার। Bangla, English, Religion ও ICT সহজ মনে হলেও নিয়মিত না পড়লে নম্বর কমে। প্রতিদিন অল্প সময় রিভিশন করলে উন্নতি হবে।"};
  return w==="science"?{deviation:d,weakerPart:w,category:"Science-এর বেসিক শক্ত করা দরকার",comment:"Science অংশে পার্থক্য বেশি। বেসিক ধারণা পরিষ্কার করা, সূত্র ও কনসেপ্ট বুঝে পড়া এবং মেন্টরের গাইডলাইন অনুযায়ী নিয়মিত অনুশীলন দরকার।"}:{deviation:d,weakerPart:w,category:"Non-Science-এ নিয়মিত পড়া দরকার",comment:"Non-Science অংশে পার্থক্য বেশি। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা, মুখস্থ ও রিভিশন দরকার। প্রতিদিন নির্দিষ্ট সময় দিলে ফলাফল ভালো হবে।"};}
function mathCmp(m,nmd){const a=m.totalPercentage||0,b=nmd.totalPercentage||0,d=Number(Math.abs(a-b).toFixed(2)),w=a<b?"math":b<a?"nonMath":"equal";
  if(d<10)return{deviation:d,weakerPart:w,category:"Mathematical ও Non-Math ভারসাম্য ভালো",comment:"দুই অংশের পারফরম্যান্স কাছাকাছি, যা ভালো ভারসাম্যের ইঙ্গিত দেয়। নিয়মিত অনুশীলন ও রিভিশন বজায় রাখলে দুই অংশেই আরও ভালো ফলাফল সম্ভব।"};
  if(d<=30)return w==="math"?{deviation:d,weakerPart:w,category:"Mathematical-এ অনুশীলন বাড়ানো দরকার",comment:"Mathematical অংশে আরও অনুশীলন করলে ভালো উন্নতি হবে। Math, Physics ও Chemistry-এর সমস্যা নিয়মিত সমাধান করলে সমস্যার জায়গা বোঝা যাবে এবং নম্বর বাড়বে।"}:{deviation:d,weakerPart:w,category:"Non-Mathematical-এ রিভিশন দরকার",comment:"Non-Mathematical অংশে আরও রিভিশন দরকার। Bangla, English, Religion, ICT ও Biology নিয়মিত পড়া ও মনে রাখার অনুশীলন করলে ফলাফল ভালো হবে।"};
  return w==="math"?{deviation:d,weakerPart:w,category:"Mathematical-এর বেসিক শক্ত করা দরকার",comment:"Mathematical অংশে আরও মনোযোগ দরকার। নিয়মিত সমস্যা সমাধান, বেসিক ধারণা পরিষ্কার করা এবং মেন্টরের গাইডলাইন নিয়ে এগোলে ভালো উন্নতি সম্ভব।"}:{deviation:d,weakerPart:w,category:"Non-Mathematical-এ নিয়মিত রিভিশন দরকার",comment:"Non-Mathematical অংশে পার্থক্য বেশি। বোঝা, মুখস্থ, লেখা ও নিয়মিত রিভিশন গুরুত্বপূর্ণ। প্রতিদিন নির্দিষ্ট সময় পড়লে ফলাফল উন্নত করা সম্ভব।"};}
function bars(s){return Object.entries(s||{}).map(([name,r])=>{const d=std(r),c=sw(d.totalPercentage);return{subject:name,...d,percentage:d.totalPercentage,subjectCommentCategory:c.category,subjectComment:c.comment};});}
function consistency(s){const sbs=bars(s),v=sbs.filter(i=>i.totalMarks>0);
  if(!v.length)return{subjectBars:sbs,averagePercentage:0,level:"ডেটা পাওয়া যায়নি",comment:"পর্যাপ্ত তথ্য পাওয়া যায়নি।"};
  const ps=v.map(i=>i.totalPercentage).sort((a,b)=>a-b),mid=Math.floor(ps.length/2),md=ps.length%2===0?(ps[mid-1]+ps[mid])/2:ps[mid];
  const f=v.filter(i=>Math.abs(i.totalPercentage-md)<=25),fin=f.length?f:v,avg=Number((fin.reduce((a,i)=>a+i.totalPercentage,0)/fin.length).toFixed(2));
  const low=v.filter(i=>i.totalPercentage<55).length,lr=Number(((low/v.length)*100).toFixed(2));
  let level,comment;
  if(avg<55&&lr>=60){level="নিয়মিত সংযোগ তৈরি করা দরকার";comment="বেশিরভাগ বিষয়ে ফলাফল কম। প্রতিদিন নির্দিষ্ট সময় পড়া, অধ্যায়ভিত্তিক ছোট লক্ষ্য ঠিক করা এবং মেন্টরের পর্যবেক্ষণে এগোলে ধীরে ধীরে ভালো উন্নতি সম্ভব।";}
  else if(avg<70){level="মাঝারি পর্যায়ের প্রস্তুতি";comment="ফলাফল মাঝারি পর্যায়ে আছে। বেশি সময়, নিয়মিত অনুশীলন এবং কম নম্বর পাওয়া বিষয়গুলোতে আলাদা ফোকাস দরকার।";}
  else{level="ভালো পথে আছে";comment="সামগ্রিকভাবে ভালো পথে আছে। অবস্থান ধরে রাখতে নিয়মিত অনুশীলন ও রিভিশন চালিয়ে যেতে হবে।";}
  return{subjectBars:sbs,averagePercentage:avg,medianPercentage:Number(md.toFixed(2)),lowSubjectCount:low,lowSubjectRatio:lr,level,comment};}
function analyze(s){const pd=agg(s),sa=part("Science",byNames(s,SCI)),na=part("Non-Science",byNames(s,NSCI)),ma=part("Mathematical",byNames(s,MTH)),nma=part("Non-Mathematical",byNames(s,NMTH));
  return{...pd,...initCmt(pd),subjectConsistency:consistency(s),
    partitions:{science:sa,nonScience:na,comparison:sciCmp(sa,na)},
    mathPartitions:{mathematical:ma,nonMathematical:nma,comparison:mathCmp(ma,nma)}};}
const mk=(c,ic,sk,w)=>({correct:c,incorrect:ic,skipped:sk,mcqTotal:25,written:w,writtenTotal:50});
const NAMES=["Physics 1st","Physics 2nd","Chemistry 1st","Chemistry 2nd","Higher Math 1st","Higher Math 2nd","Biology 1st","Biology 2nd","Bangla 1st","Bangla 2nd","English 1st","English 2nd","ICT"];
const RAW={
  "101":[[22,2,1,42],[20,3,2,40],[23,1,1,45],[21,2,2,43],[19,4,2,38],[18,5,2,36],[24,1,0,46],[22,2,1,44],[20,3,2,41],[21,2,2,40],[17,5,3,35],[16,6,3,33],[23,1,1,44]],
  "214":[[13,7,5,24],[11,8,6,22],[15,6,4,28],[12,8,5,25],[9,9,7,18],[8,10,7,16],[16,5,4,30],[14,6,5,27],[17,5,3,31],[16,5,4,30],[12,8,5,23],[11,9,5,21],[18,4,3,33]],
  "356":[[6,10,9,12],[5,11,9,10],[8,9,8,15],[6,10,9,13],[4,12,9,8],[3,13,9,7],[10,8,7,18],[9,8,8,17],[12,7,6,22],[11,7,7,20],[7,10,8,14],[6,11,8,12],[13,6,6,24]],
};
const SAMPLE_STUDENTS=Object.entries(RAW).map(([roll,rows],idx)=>{const subjects={};NAMES.forEach((n,i)=>{const[c,ic,sk,w]=rows[i];subjects[n]=mk(c,ic,sk,w);});return{id:idx+1,roll,subjects,analysis:analyze(subjects)};});