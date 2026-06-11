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
  motto: "নিয়মিত পরীক্ষায় হোক গোছানো প্রস্তুতি",
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

.dRow{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
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
  if(v>=90)return{c:"লিখিত অংশে দারুণ করছ",t:"লিখিত অংশে তোমার হাত বেশ পাকা। উত্তর গুছিয়ে লেখা, দরকারি পয়েন্টগুলো ধরা আর পরিষ্কার উপস্থাপনা—এই মানটা ধরে রাখতে পারলে লিখিত থেকে নিয়মিত ভালো নম্বর আসতেই থাকবে।"};
  if(v>=80)return{c:"লিখিত অংশে ভালো করছ",t:"লিখিত অংশে তুমি ভালো করছ। হাতের লেখা, উত্তরের সাজানো ভাব আর সময় ধরে শেষ করার দিকে আর একটু খেয়াল দাও, গুরুত্বপূর্ণ পয়েন্টে জোর দাও—তাহলে এই অংশের নম্বর আরও বাড়বে।"};
  if(v>=65)return{c:"লিখিত অংশ মোটামুটি ভালো",t:"লিখিত অংশে প্রস্তুতি মোটামুটি ঠিকঠাক আছে। গুরুত্বপূর্ণ প্রশ্নগুলো নিজে হাতে লিখে অনুশীলন করো আর উত্তর গুছিয়ে উপস্থাপন করার চর্চা রাখো—দ্রুত উন্নতি চোখে পড়বে।"};
  if(v>=50)return{c:"লিখিত অংশে আরও মন দিতে হবে",t:"লিখিত অংশে আরও মনোযোগ দরকার। শুধু পড়লে হবে না—নিয়মিত হাতে লিখে অনুশীলন করো, উত্তরের কাঠামো ঠিক রাখো আর সময় ধরে লেখার অভ্যাস করো। তাহলেই এই অংশ থেকে ভালো নম্বর আসবে।"};
  if(v>=30)return{c:"লিখিত অংশটা একটু দুর্বল",t:"লিখিত অংশে নম্বর তুলনায় কম এসেছে। প্রতিদিন একটা নির্দিষ্ট সময় লেখার অনুশীলন করো, গুরুত্বপূর্ণ প্রশ্নের উত্তর আগে থেকে তৈরি রাখো আর খাতা মেন্টরকে দেখিয়ে ভুলগুলো শুধরে নাও।"};
  return{c:"লিখিত অংশে এখনই মন দেওয়া দরকার",t:"লিখিত অংশে নম্বর অনেকটাই কম। আজ থেকেই নিয়ম করে লেখার অভ্যাস গড়ো, একদম সহজ প্রশ্ন থেকে শুরু করো আর মেন্টরের সরাসরি সাহায্য নিয়ে ধাপে ধাপে এগোও—এটা খুব জরুরি।"};
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

function Donut({correct,incorrect,skipped,center,label="মোট",size=98,sw=12}){
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
      <div className="dCtr"><strong style={{color:band(center).bar}}>{center}%</strong><span>{label}</span></div>
    </div>
  );
}
function DonutCard({title,data}){
  const co=data?.correctPercentage||0, ic=data?.incorrectPercentage||0, sk=data?.skippedPercentage||0, b=band(co);
  return(
    <div className="dC">
      <div className="dt">{title}</div>
      <Donut correct={co} incorrect={ic} skipped={sk} center={co} label="MCQ"/>
      <div className="dLeg">
        <div className="l"><span className="n"><span className="dk" style={{background:"#22c55e"}}/>সঠিক</span><b>{co}%</b></div>
        <div className="l"><span className="n"><span className="dk" style={{background:"#ef4444"}}/>ভুল</span><b>{ic}%</b></div>
        <div className="l"><span className="n"><span className="dk" style={{background:"#f59e0b"}}/>স্কিপ</span><b>{sk}%</b></div>
      </div>
      <span className="dChip" style={{background:b.bg,color:b.tx}}>{b.lb}</span>
    </div>
  );
}

function WrittenDonut({pct,size=98,sw=12}){
  const v=Number(pct)||0, r=(size-sw)/2, cx=size/2, C=2*Math.PI*r, col=band(v);
  const len=Math.max((v/100)*C,0);
  return(
    <div className="dW" style={{width:size,height:size}}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef1f7" strokeWidth={sw}/>
        {len>0 && <circle cx={cx} cy={cx} r={r} fill="none" stroke={col.bar} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${len} ${C-len}`} transform={`rotate(-90 ${cx} ${cx})`}/>}
      </svg>
      <div className="dCtr"><strong style={{color:col.bar}}>{v}%</strong><span>লিখিত</span></div>
    </div>
  );
}
function WrittenCard({title,data}){
  const wr=data?.writtenPercentage||0, ob=data?.totalWritten||0, tot=data?.totalWrittenMarks||0, b=band(wr);
  return(
    <div className="dC">
      <div className="dt">{title}</div>
      <WrittenDonut pct={wr}/>
      <div className="dLeg">
        <div className="l"><span className="n"><span className="dk" style={{background:"#06b6d4"}}/>প্রাপ্ত</span><b>{ob}</b></div>
        <div className="l"><span className="n"><span className="dk" style={{background:"#cbd5e1"}}/>মোট</span><b>{tot}</b></div>
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
  const a=student.analysis||{}, p=a.partitions||{}, w=writtenComment(a.writtenPercentage||0);
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
        <DonutCard title="General" data={p.nonScience}/>
      </div>

      <div className="sec" style={{"--ac":"#0891b2"}}><span className="tg">WRITTEN</span><b>লিখিত অংশের ফলাফল (প্রাপ্ত / মোট)</b><span className="ru"/></div>
      <div className="dRow">
        <WrittenCard title="সামগ্রিক" data={a}/>
        <WrittenCard title="Science" data={p.science}/>
        <WrittenCard title="General" data={p.nonScience}/>
      </div>

      <div className="sec" style={{"--ac":"#6d28d9"}}><span className="tg">ANALYSIS</span><b>মন্তব্য ও পর্যবেক্ষণ</b><span className="ru"/></div>

      <div className="cm" style={{"--ac":"#6d28d9"}}>
        <div className="h"><span className="lb">সামগ্রিক</span><h3>{a.category}</h3></div>
        <p>{a.comment}</p>
      </div>
      <div className="cm" style={{"--ac":"#0d9488"}}>
        <div className="h"><span className="lb">Science vs General</span><span className="dv">পার্থক্য: {p.comparison?.deviation||0}%</span></div>
        <h3 style={{marginTop:2}}>{p.comparison?.category}</h3><p>{p.comparison?.comment}</p>
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
  if(p>=90)return{category:"দারুণ করছ, এভাবেই এগিয়ে যাও",comment:"এই বিষয়ে তোমার দখলটা সত্যিই ভালো। এখন নতুন করে চাপ নেওয়ার দরকার নেই—যেভাবে চলছ সেভাবেই নিয়মিত থাকো, আর মাঝে মাঝে আগের পড়াগুলোয় একটু চোখ বুলিয়ে নিও। এই ছন্দটা ধরে রাখতে পারলে পরীক্ষায় এই বিষয় নিয়ে তোমার আর চিন্তা থাকবে না।"};
  if(p>=80)return{category:"প্রায় গুছিয়ে এনেছ",comment:"তোমার প্রস্তুতি প্রায় ঠিক জায়গায় আছে। শুধু ছোটখাটো ফাঁকগুলো—একটা সূত্র, একটা বানান, কিংবা কোনো প্রশ্ন ঠিকমতো না বোঝা—এখনই ধরে নাও। এই ছোট ভুলগুলোই কিন্তু পরীক্ষায় বড় নম্বর খেয়ে ফেলে, তাই হালকাভাবে নিও না।"};
  if(p>=65)return{category:"আর একটু খাটলেই হয়ে যাবে",comment:"এই বিষয়ে এখনো কিছু জায়গা ফাঁকা রয়ে গেছে। যেসব অধ্যায় কঠিন লাগে সেগুলো বুঝে বুঝে পড়ো, আর যেসব প্রশ্নে ভুল করেছ সেগুলো নিজে হাতে আবার করে দেখো। একটু গুছিয়ে এগোলে অল্প দিনেই উন্নতিটা চোখে পড়বে।"};
  if(p>=50)return{category:"পড়ার ধরনটা একটু বদলাতে হবে",comment:"মনে হচ্ছে কিছু টপিক এখনো তোমার কাছে পরিষ্কার হয়নি। শুধু বেশি সময় পড়লেই হবে না—কীভাবে পড়ছ সেটাও দেখা দরকার। বেসিকটা আরেকবার ভালো করে দেখে নাও, আর ঠিক কোথায় আটকে যাচ্ছ সেটা মেন্টরকে বলো; একসাথে ঠিক করে দেব।"};
  if(p>=30)return{category:"এখনো ঘুরে দাঁড়ানোর অনেক সময় আছে",comment:"ভয় পেয়ো না, এই বিষয়ে এখনো ঘুরে দাঁড়ানোর যথেষ্ট সময় আছে। প্রতিদিন একটু একটু করে নিয়ম করে বসো, আর কোথায় সমস্যা হচ্ছে খোলাখুলি মেন্টরের সাথে কথা বলো। মন দিয়ে লেগে থাকলে এই বিষয়েই তুমি অবাক করার মতো উন্নতি করতে পারো।"};
  return{category:"চলো, একদম গোড়া থেকে শুরু করি",comment:"এই বিষয়ে নম্বর অনেকটাই কম এসেছে, তবে এটাকে শেষ ভেবো না—নতুন করে শুরু করার সুযোগ ভাবো। দেরি না করে আজ থেকেই বেসিক ধরো, প্রতিদিন একটা নির্দিষ্ট সময় শুধু এই বিষয়ের জন্য রাখো, আর আটকে গেলেই মেন্টরের কাছে চলে এসো। ধাপে ধাপে এগোলে এখান থেকেও ভালো জায়গায় পৌঁছানো যায়।"};
}
function agg(subjects){let c=0,ic=0,sk=0,m=0,w=0,wt=0;
  Object.values(subjects||{}).forEach(s=>{const d=std(s);c+=d.correct;ic+=d.incorrect;sk+=d.skipped;m+=d.mcqTotal;w+=d.written;wt+=d.writtenTotal;});
  const at=c+ic+sk,bm=m>0?m:at,to=c+w,tm=bm+wt;
  return{totalCorrect:c,totalIncorrect:ic,totalSkipped:sk,totalMcq:bm,totalWritten:w,totalWrittenMarks:wt,totalObtained:to,totalMarks:tm,
    correctPercentage:pc(c,bm),incorrectPercentage:pc(ic,bm),skippedPercentage:pc(sk,bm),writtenPercentage:pc(w,wt),totalPercentage:pc(to,tm)};}
const RULES=[
  {id:8,category:"নতুন করে শুরু করার সময় এখনই",check:p=>p.totalPercentage<30,comment:"এবারের ফলাফলটা বলছে পড়াশোনাটা আবার নতুন করে গুছিয়ে শুরু করা দরকার। একসাথে সব ধরতে যেও না—বেসিক থেকে ধীরে ধীরে এগোও, প্রতিদিন একটা নির্দিষ্ট সময় বসো, আর যেখানে আটকাবে সেখানেই মেন্টরকে জানাও। বাড়ির কেউ একটু খেয়াল রাখলে আর তুমি লেগে থাকলে আবার ঠিক পথে ফেরা কঠিন কিছু না।"},
  {id:1,category:"অসাধারণ, এই ছন্দটা ধরে রাখো",check:p=>p.totalPercentage>=90,comment:"তুমি দারুণ একটা জায়গায় আছ। এখন তোমার একটাই কাজ—এই ছন্দটা নষ্ট হতে না দেওয়া। নিয়মিত অনুশীলন করো, পরীক্ষার সময় মাথা ঠান্ডা রেখে উত্তর দাও, আর ভালো করছি বলে গা ছেড়ে দিও না। এভাবে চললে সামনে আরও ভালো ফল তোমার জন্যই অপেক্ষা করছে।"},
  {id:2,category:"ভালো করছ, এবার একটু সাহস বাড়াও",check:p=>p.totalPercentage<90&&p.totalPercentage>70&&p.skippedPercentage+5>p.incorrectPercentage,comment:"তোমার প্রস্তুতি বেশ ভালো জায়গায় আছে। তবে অনেক প্রশ্ন ছেড়ে দিচ্ছ, মানে জানা জিনিসেও তুমি একটু দ্বিধায় ভুগছ। মডেল টেস্ট দিয়ে, সময় ধরে অনুশীলন করে নিজের ওপর ভরসাটা বাড়াও। জানা প্রশ্নে সাহস করে কলম চালালে এই ছেড়ে দেওয়া প্রশ্নগুলো থেকেই বাড়তি নম্বর চলে আসবে।"},
  {id:3,category:"ভালো করছ, একটু সাবধানে উত্তর দাও",check:p=>p.totalPercentage<90&&p.totalPercentage>70&&p.incorrectPercentage>p.skippedPercentage+5,comment:"তুমি ভালোই করছ, শুধু ভুল উত্তরগুলো একটু কমাতে হবে। অনেক সময় তাড়াহুড়ো করে বা প্রশ্ন পুরোটা না পড়ে উত্তর দিলে এই ভুলগুলো হয়। প্রশ্নটা ঠান্ডা মাথায় পড়ো, নিশ্চিত হয়ে তারপর উত্তর দাও—দেখবে নম্বর নিজে থেকেই উঠে যাচ্ছে।"},
  {id:4,category:"কৌশলটা একটু ঠিক করলেই হবে",check:p=>p.totalPercentage>=50&&p.totalPercentage<=70&&p.skippedPercentage+10<p.incorrectPercentage,comment:"তোমার প্রস্তুতি মাঝামাঝি জায়গায়, খারাপ না। এখন দরকার ভুলগুলো ধরে ফেলা—কোন অধ্যায়ে বা কোন ধরনের প্রশ্নে বারবার আটকাচ্ছ সেটা খুঁজে বের করো। সেই জায়গাগুলো আলাদা করে অনুশীলন করো আর মেন্টরের পরামর্শ মতো এগোও, ফল দ্রুত ভালো হবে।"},
  {id:5,category:"নিজের ওপর ভরসা রাখলেই এগিয়ে যাবে",check:p=>p.totalPercentage>=50&&p.totalPercentage<=70&&p.skippedPercentage+5>p.incorrectPercentage,comment:"তুমি বেশ কিছু প্রশ্ন ছেড়ে দিচ্ছ, অথচ চেষ্টা করলে হয়তো অনেকগুলোরই উত্তর দিতে পারতে। আত্মবিশ্বাসটা একটু বাড়াও—প্রতিদিন ছোট ছোট টেস্ট দাও, সহজ প্রশ্ন থেকে শুরু করে আস্তে আস্তে কঠিনে যাও। নিজের ওপর ভরসা এলেই দেখবে ছেড়ে দেওয়া প্রশ্নেও হাত দিচ্ছ।"},
  {id:6,category:"পড়ার পদ্ধতিটা গুছিয়ে নিতে হবে",check:p=>p.totalPercentage>=30&&p.totalPercentage<=50&&p.skippedPercentage+5<p.incorrectPercentage,comment:"তোমার পড়াটা আরেকটু গুছিয়ে করা দরকার। এখন বেশ ভুল হচ্ছে, তাই আগে বেসিক ধারণাগুলো পরিষ্কার করো, তারপর অধ্যায় ধরে ধরে অনুশীলন করো। মেন্টরের সাথে বসে পড়ার ধরনটা একটু বদলে নাও, আর ভুলগুলো নিয়ম করে আবার দেখো—উন্নতি আসবেই।"},
  {id:7,category:"চর্চা আর সাহস—দুটোই বাড়ানোর সময়",check:p=>p.totalPercentage>=30&&p.totalPercentage<=50&&p.skippedPercentage+5>p.incorrectPercentage,comment:"তুমি অনেক প্রশ্ন ছেড়ে দিচ্ছ, যেটা ঠিক হচ্ছে না। নিজের প্রস্তুতির ওপর একটু আস্থা রাখো—সব না পারলেও যেগুলো পারো অন্তত সেগুলো করার চেষ্টা করো। ছোট লক্ষ্য নিয়ে প্রতিদিন পড়ো, সহজ প্রশ্ন আগে ধরো, আর সমস্যা হলে মেন্টরকে বলো; আস্তে আস্তে সব ঠিক হয়ে যাবে।"},
];
function initCmt(pd){const m=RULES.find(r=>r.check(pd));
  return{category:m?m.category:"মেন্টরের সাথে একটু বসা দরকার",comment:m?m.comment:"তোমার ফলাফলটা ঠিক কোন ছকে ফেলব বোঝা যাচ্ছে না। তাই বিষয়ভিত্তিক নম্বরগুলো নিয়ে একবার মেন্টরের সাথে বসো—কোথায় ভালো আর কোথায় খামতি দেখে সামনের পরিকল্পনাটা একসাথে ঠিক করে নেব।"};}
const SCI=["Physics","Chemistry","General Math","Higher Math","Biology","BGS","Physics 1st","Physics 2nd","Chemistry 1st","Chemistry 2nd","Biology 1st","Biology 2nd","Higher Math 1st","Higher Math 2nd"];
const NSCI=["Bangla 1st","Bangla 2nd","English 1st","English 2nd","Religion","ICT"];
const nm=n=>String(n||"").trim().toLowerCase().replace(/\s+/g," ");
const byNames=(s,names)=>{const a=names.map(nm),o={};Object.entries(s||{}).forEach(([k,v])=>{if(a.includes(nm(k)))o[k]=v;});return o;};
const part=(title,s)=>{const pd=agg(s);return{title,...pd,...initCmt(pd)};};
function sciCmp(s,ns){const a=s.totalPercentage||0,b=ns.totalPercentage||0,d=Number(Math.abs(a-b).toFixed(2)),w=a<b?"science":b<a?"general":"equal";
  if(d<15)return{deviation:d,weakerPart:w,category:"Science আর General—দুটোতেই ভারসাম্য ভালো",comment:"Science আর General দুই দিকেই তোমার অবস্থা প্রায় কাছাকাছি, এটা খুব ভালো লক্ষণ। যেদিকটায় নম্বর সামান্য কম এসেছে, সেখানে একটু বেশি রিভিশন দিলেই সব মিলিয়ে ফলটা আরও সুন্দর দেখাবে।"};
  if(d<=30)return w==="science"?{deviation:d,weakerPart:w,category:"Science-এ একটু বেশি সময় দাও",comment:"General-এর তুলনায় Science-এ তুমি একটু পিছিয়ে আছ। Physics, Chemistry, Math, Biology—এগুলো মুখস্থ না করে বুঝে পড়ো আর নিয়মিত অঙ্ক ও সমস্যা মেলাও। একটু বাড়তি সময় দিলেই এই দিকটা সামলে যাবে।"}:{deviation:d,weakerPart:w,category:"General অংশে রিভিশন একটু বাড়াও",comment:"Science-এর তুলনায় General বিষয়গুলোতে তুমি একটু পিছিয়ে। Bangla, English, Religion, ICT সহজ মনে হলেও নিয়মিত না দেখলে নম্বর পড়ে যায়। প্রতিদিন অল্প করে হলেও এগুলো রিভিশন দাও, পার্থক্যটা ঠিক কমে আসবে।"};
  return w==="science"?{deviation:d,weakerPart:w,category:"Science-এর বেসিকটা শক্ত করা দরকার",comment:"Science-এ পার্থক্যটা বেশ বড়। ঘাবড়ে না গিয়ে গোড়া থেকে ধরো—বেসিক কনসেপ্ট আর সূত্রগুলো ভালো করে বুঝে নাও, মেন্টরের সাহায্য নিয়ে নিয়মিত অনুশীলন করো। ঠিকভাবে শুরু করলে এই দূরত্বটা ধীরে ধীরে মিটে যাবে।"}:{deviation:d,weakerPart:w,category:"General বিষয়গুলোতে নিয়মিত পড়া দরকার",comment:"General বিষয়গুলোতে অনেকটাই পিছিয়ে আছ। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা আর রিভিশনের কোনো বিকল্প নেই। প্রতিদিন একটা নির্দিষ্ট সময় এগুলোর জন্য রাখো—অল্প দিনেই নম্বর উঠতে শুরু করবে।"};}
function bars(s){return Object.entries(s||{}).map(([name,r])=>{const d=std(r),c=sw(d.totalPercentage);return{subject:name,...d,percentage:d.totalPercentage,subjectCommentCategory:c.category,subjectComment:c.comment};});}
function consistency(s){const sbs=bars(s),v=sbs.filter(i=>i.totalMarks>0);
  if(!v.length)return{subjectBars:sbs,averagePercentage:0,level:"ডেটা পাওয়া যায়নি",comment:"পর্যাপ্ত তথ্য পাওয়া যায়নি।"};
  const ps=v.map(i=>i.totalPercentage).sort((a,b)=>a-b),mid=Math.floor(ps.length/2),md=ps.length%2===0?(ps[mid-1]+ps[mid])/2:ps[mid];
  const f=v.filter(i=>Math.abs(i.totalPercentage-md)<=25),fin=f.length?f:v,avg=Number((fin.reduce((a,i)=>a+i.totalPercentage,0)/fin.length).toFixed(2));
  const low=v.filter(i=>i.totalPercentage<55).length,lr=Number(((low/v.length)*100).toFixed(2));
  let level,comment;
  if(avg<55&&lr>=60){level="পড়ার সাথে নিয়মিত যোগটা শক্ত করা দরকার";comment="বেশিরভাগ বিষয়েই নম্বর কম এসেছে। দু-একটা বিষয়ে হঠাৎ ভালো বা খারাপ বাদ দিলেও বোঝা যাচ্ছে, পড়ার সাথে তোমার নিয়মিত যোগটা আরেকটু শক্ত হওয়া দরকার। প্রতিদিন নির্দিষ্ট সময় বসো, ছোট ছোট লক্ষ্য ঠিক করো, আর মেন্টরের নজরে থেকে এগোও—ধীরে ধীরে ঠিক ঘুরে দাঁড়াবে।";}
  else if(avg<70){level="মাঝারি পর্যায়ের প্রস্তুতি";comment="তোমার প্রস্তুতি এখন মাঝামাঝি অবস্থায়। একটু বেশি সময়, একটু বেশি অনুশীলন আর কম নম্বর পাওয়া বিষয়গুলোতে আলাদা মনোযোগ দিলেই হবে। কোন কোন বিষয়ে ভালো করছ আর ঠিক কোথায় নম্বর হারাচ্ছ—সেটা দেখে প্রস্তুতির দিকটা গুছিয়ে নাও।";}
  else{level="ভালো পথেই আছ";comment="সব মিলিয়ে তুমি ভালো পথেই আছ। এই জায়গাটা ধরে রাখতে নিয়মিত অনুশীলন আর রিভিশন চালিয়ে যাও। ভালো ফলের মধ্যেও একটু খেয়াল করো—কোন অংশে সবচেয়ে শক্তিশালী আর কোথায় আর একটু নজর দিলে ফলটা আরও ঝকঝকে হবে।";}
  return{subjectBars:sbs,averagePercentage:avg,medianPercentage:Number(md.toFixed(2)),lowSubjectCount:low,lowSubjectRatio:lr,level,comment};}
function analyze(s){const pd=agg(s),sa=part("Science",byNames(s,SCI)),na=part("General",byNames(s,NSCI));
  return{...pd,...initCmt(pd),subjectConsistency:consistency(s),
    partitions:{science:sa,nonScience:na,comparison:sciCmp(sa,na)}};}
const mk=(c,ic,sk,w)=>({correct:c,incorrect:ic,skipped:sk,mcqTotal:25,written:w,writtenTotal:50});
const NAMES=["Physics 1st","Physics 2nd","Chemistry 1st","Chemistry 2nd","Higher Math 1st","Higher Math 2nd","Biology 1st","Biology 2nd","Bangla 1st","Bangla 2nd","English 1st","English 2nd","ICT"];
const RAW={
  "101":[[22,2,1,42],[20,3,2,40],[23,1,1,45],[21,2,2,43],[19,4,2,38],[18,5,2,36],[24,1,0,46],[22,2,1,44],[20,3,2,41],[21,2,2,40],[17,5,3,35],[16,6,3,33],[23,1,1,44]],
  "214":[[13,7,5,24],[11,8,6,22],[15,6,4,28],[12,8,5,25],[9,9,7,18],[8,10,7,16],[16,5,4,30],[14,6,5,27],[17,5,3,31],[16,5,4,30],[12,8,5,23],[11,9,5,21],[18,4,3,33]],
  "356":[[6,10,9,12],[5,11,9,10],[8,9,8,15],[6,10,9,13],[4,12,9,8],[3,13,9,7],[10,8,7,18],[9,8,8,17],[12,7,6,22],[11,7,7,20],[7,10,8,14],[6,11,8,12],[13,6,6,24]],
};
const SAMPLE_STUDENTS=Object.entries(RAW).map(([roll,rows],idx)=>{const subjects={};NAMES.forEach((n,i)=>{const[c,ic,sk,w]=rows[i];subjects[n]=mk(c,ic,sk,w);});return{id:idx+1,roll,subjects,analysis:analyze(subjects)};});