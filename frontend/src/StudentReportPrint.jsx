/* =============================================================================
   StudentReportPrint.jsx  —  Mass-printable A4 (210×297mm) two-sided report cards
   -----------------------------------------------------------------------------
   INTEGRATION (your real app):
     import { PrintableReports } from "./StudentReportPrint";
     ...
     {students.length > 0 && <PrintableReports students={students} />}
   `students` is exactly the array your /upload-result endpoint returns
   (each item has .roll, .subjects, .analysis from generateStudentAnalysis).

   The default export below is a self-contained DEMO that builds 3 sample
   students by running your OWN studentAnalysis logic, so what you preview here
   is what real data will look like.

   PRINT TIP: Print dialog -> Paper A4, Margins "None", turn ON "Background
   graphics" (colors won't print otherwise). Layout is already duplex-ready.
============================================================================= */

import React, { useMemo } from "react";

/* ============================== STYLES ==================================== */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Sora:wght@500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap');

:root{
  --bn:'Hind Siliguri','Noto Sans Bengali','SolaimanLipi',sans-serif;
  --num:'Sora',sans-serif;
  --display:'Bricolage Grotesque','Sora',sans-serif;
  --sc-font:8.4px;          /* subject-comment font (tune for many subjects) */
  --bar-h:74mm;             /* bar chart height */
  --ink:#0f172a; --ink2:#475569; --line:#e2e8f0;
}

.srp-root,.srp-root *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}

.srp-root{font-family:var(--bn);color:var(--ink);text-align:left;}

/* ---- screen-only chrome ---- */
.srp-toolbar{
  position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:16px;
  padding:16px 22px;flex-wrap:wrap;
  background:linear-gradient(110deg,#0b1224,#15233f);
  border-bottom:1px solid rgba(255,255,255,.08);
}
.srp-toolbar h2{font-family:var(--display);color:#fff;font-size:18px;margin:0;letter-spacing:.2px;}
.srp-toolbar .muted{color:#9fb3cf;font-size:12.5px;font-family:var(--num);}
.srp-print-btn{
  margin-left:auto;border:0;cursor:pointer;color:#04121f;font-weight:800;
  font-family:var(--num);font-size:14px;padding:12px 22px;border-radius:999px;
  background:linear-gradient(135deg,#5eead4,#38bdf8,#818cf8);
  box-shadow:0 8px 24px rgba(56,189,248,.35);
}
.srp-print-btn:active{transform:translateY(1px);}
.srp-tip{color:#cbd5e1;font-size:11.5px;background:rgba(255,255,255,.06);
  padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);}
.srp-stage{background:#0a1120;padding:26px 14px 60px;display:flex;
  flex-direction:column;align-items:center;gap:22px;}

/* ---- the actual paper ---- */
.srp-page{
  position:relative;width:210mm;height:297mm;background:#fff;color:var(--ink);
  padding:11mm 10mm 8mm;overflow:hidden;display:flex;flex-direction:column;
}
.srp-stage .srp-page{box-shadow:0 20px 60px rgba(0,0,0,.45);border-radius:2px;}
.srp-page::before{ /* colored edge ribbon */
  content:"";position:absolute;left:0;top:0;bottom:0;width:6mm;
  background:var(--ribbon,linear-gradient(180deg,#6366f1,#22d3ee));
}
.srp-page .corner{position:absolute;right:0;top:0;width:34mm;height:34mm;
  background:var(--ribbon);opacity:.10;
  clip-path:polygon(100% 0,0 0,100% 100%);}

/* ---- HERO (front) ---- */
.hero{display:flex;justify-content:space-between;align-items:stretch;gap:10px;
  padding:7mm 8mm;border-radius:14px;color:#fff;
  background:linear-gradient(120deg,#4338ca,#6d28d9 45%,#0ea5e9);
  box-shadow:0 6px 18px rgba(67,56,202,.25);}
.hero .brand{display:flex;align-items:center;gap:10px;}
.hero .seal{width:13mm;height:13mm;border-radius:11px;display:flex;align-items:center;
  justify-content:center;font-family:var(--display);font-size:20px;font-weight:800;
  background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.5);}
.hero h1{font-family:var(--display);font-size:21px;margin:0;line-height:1.05;}
.hero .sub{font-size:11.5px;opacity:.92;margin-top:2px;}
.hero .right{text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;}
.hero .roll{font-size:10.5px;opacity:.85;letter-spacing:.5px;text-transform:uppercase;font-family:var(--num);}
.hero .rollv{font-family:var(--num);font-weight:800;font-size:23px;line-height:1;}
.hero .cat{margin-top:4px;background:rgba(255,255,255,.95);color:#3730a3;font-weight:800;
  font-size:11px;padding:5px 11px;border-radius:999px;max-width:62mm;text-align:center;}

/* stats strip */
.statStrip{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:7px;}
.stat{border:1px solid var(--line);border-radius:11px;padding:6px 7px;background:#fbfdff;
  display:flex;flex-direction:column;gap:1px;}
.stat .k{font-size:9px;color:var(--ink2);font-weight:600;}
.stat .v{font-family:var(--num);font-weight:800;font-size:16px;}
.stat.tot{background:linear-gradient(135deg,#eef2ff,#e0f2fe);border-color:#c7d2fe;}
.dotk{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:middle;}

/* section label */
.secLabel{display:flex;align-items:center;gap:8px;margin:8px 0 5px;}
.secLabel b{font-family:var(--display);font-size:13.5px;color:#1e293b;}
.secLabel .tag{font-family:var(--num);font-size:9px;color:#fff;background:var(--accent,#6366f1);
  padding:3px 8px;border-radius:6px;font-weight:700;letter-spacing:.3px;}
.secLabel .rule{flex:1;height:2px;border-radius:2px;
  background:linear-gradient(90deg,var(--accent,#6366f1),transparent);}

/* bar chart */
.barCard{border:1px solid var(--line);border-radius:13px;padding:5px 8px 2px;
  background:linear-gradient(180deg,#ffffff,#f7faff);}
.barSvg{width:100%;height:var(--bar-h);display:block;}

/* subject comment grid */
.scGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;align-content:start;flex:1;}
.scCard{border:1px solid var(--line);border-left:3px solid #94a3b8;border-radius:9px;
  padding:5px 7px;background:#fff;display:flex;flex-direction:column;gap:2px;break-inside:avoid;}
.scCard .scTop{display:flex;justify-content:space-between;align-items:center;gap:5px;}
.scCard h4{margin:0;font-size:10.5px;font-weight:700;color:#0f172a;}
.scBadge{font-family:var(--num);font-weight:800;font-size:9px;padding:2px 6px;border-radius:999px;}
.scMini{font-family:var(--num);font-size:7.4px;color:#64748b;}
.scCat{font-size:8.6px;font-weight:700;}
.scCard p{margin:0;font-size:var(--sc-font);line-height:1.42;color:#475569;}

/* footer */
.pageFoot{margin-top:auto;padding-top:5px;display:flex;justify-content:space-between;
  align-items:center;border-top:1px dashed var(--line);
  font-family:var(--num);font-size:9px;color:#94a3b8;}
.pageFoot .pill{background:#0f172a;color:#fff;padding:2px 9px;border-radius:999px;font-weight:700;}

/* ---- BACK ---- */
.backHead{display:flex;justify-content:space-between;align-items:center;padding:5mm 7mm;
  border-radius:13px;color:#fff;background:linear-gradient(120deg,#0f766e,#0e7490 55%,#1d4ed8);}
.backHead h1{font-family:var(--display);font-size:18px;margin:0;}
.backHead .rt{text-align:right;font-family:var(--num);}
.backHead .rt b{font-size:18px;display:block;}
.backHead .rt span{font-size:10px;opacity:.85;}

.donutRow{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
.donutCard{border:1px solid var(--line);border-radius:12px;padding:6px 5px 7px;text-align:center;
  background:linear-gradient(180deg,#ffffff,#f6fbfa);display:flex;flex-direction:column;align-items:center;gap:3px;}
.donutCard .dt{font-size:9.5px;font-weight:800;color:#0f172a;line-height:1.1;min-height:21px;display:flex;align-items:center;}
.donutWrap{position:relative;}
.donutCenter{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.donutCenter strong{font-family:var(--num);font-size:16px;font-weight:800;color:#0f172a;line-height:1;}
.donutCenter span{font-size:7px;color:#64748b;margin-top:1px;}
.dleg{display:flex;flex-direction:column;gap:1px;width:100%;}
.dleg .l{display:flex;align-items:center;justify-content:space-between;font-size:7.6px;color:#475569;}
.dleg .l .nm{display:flex;align-items:center;gap:3px;}
.dleg .l b{font-family:var(--num);}
.dchip{margin-top:1px;font-size:7.6px;font-weight:800;padding:2px 7px;border-radius:999px;}

.cmt{border:1px solid var(--line);border-radius:12px;padding:7px 10px;margin-top:6px;
  background:#fff;border-left:4px solid var(--accent,#6366f1);break-inside:avoid;}
.cmt .ch{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px;}
.cmt .label{font-family:var(--num);font-size:8px;font-weight:700;color:#fff;background:var(--accent,#6366f1);
  padding:2px 8px;border-radius:6px;letter-spacing:.3px;}
.cmt h3{margin:0;font-size:12px;color:#0f172a;font-weight:700;}
.cmt .dev{font-family:var(--num);font-size:9px;font-weight:800;color:#92400e;background:#fef3c7;
  padding:2px 9px;border-radius:999px;white-space:nowrap;}
.cmt p{margin:2px 0 0;font-size:9.4px;line-height:1.55;color:#475569;}
.cmt.written{background:linear-gradient(120deg,#ecfeff,#eef2ff);border-left-color:#06b6d4;}
.cmt.written h3{color:#0e7490;}

/* ---------- PRINT ---------- */
@media print{
  @page{size:A4;margin:0;}
  html,body{background:#fff !important;margin:0;}
  .srp-toolbar,.srp-tip{display:none !important;}
  .srp-stage{background:#fff;padding:0;gap:0;}
  .srp-stage .srp-page{box-shadow:none;border-radius:0;}
  .srp-page{break-after:page;page-break-after:always;}
  .srp-page:last-child{break-after:auto;page-break-after:auto;}
}
`;

/* ===================== BAND COLORS (shared by bar + badges) =============== */
function bandColor(p) {
  const v = Number(p) || 0;
  if (v >= 90) return { bar: "#15803d", bg: "#dcfce7", text: "#166534", label: "চমৎকার" };
  if (v >= 80) return { bar: "#0369a1", bg: "#e0f2fe", text: "#075985", label: "ভালো" };
  if (v >= 65) return { bar: "#b45309", bg: "#fef3c7", text: "#92400e", label: "মোটামুটি" };
  if (v >= 50) return { bar: "#c2410c", bg: "#ffedd5", text: "#9a3412", label: "মনোযোগ দরকার" };
  if (v >= 30) return { bar: "#b91c1c", bg: "#fee2e2", text: "#991b1b", label: "দুর্বল" };
  return { bar: "#475569", bg: "#f1f5f9", text: "#334155", label: "বিশেষ মনোযোগ" };
}

/* ============ WRITTEN-PERCENTAGE COMMENT (frontend, mentor voice) ========= */
function getWrittenComment(percentage) {
  const p = Number(percentage) || 0;
  if (p >= 90)
    return {
      category: "লিখিত অংশে দারুণ করছ",
      comment:
        "লিখিত অংশে তোমার হাত বেশ পাকা। উত্তর গুছিয়ে লেখা, দরকারি পয়েন্টগুলো ধরা আর পরিষ্কার উপস্থাপনা—এই মানটা ধরে রাখতে পারলে লিখিত থেকে নিয়মিত ভালো নম্বর আসতেই থাকবে।",
    };
  if (p >= 80)
    return {
      category: "লিখিত অংশে ভালো করছ",
      comment:
        "লিখিত অংশে তুমি ভালো করছ। হাতের লেখা, উত্তরের সাজানো ভাব আর সময় ধরে শেষ করার দিকে আর একটু খেয়াল দাও, গুরুত্বপূর্ণ পয়েন্টে জোর দাও—তাহলে এই অংশের নম্বর আরও বাড়বে।",
    };
  if (p >= 65)
    return {
      category: "লিখিত অংশ মোটামুটি ভালো",
      comment:
        "লিখিত অংশে প্রস্তুতি মোটামুটি ঠিকঠাক আছে। গুরুত্বপূর্ণ প্রশ্নগুলো নিজে হাতে লিখে অনুশীলন করো আর উত্তর গুছিয়ে উপস্থাপন করার চর্চা রাখো—দ্রুত উন্নতি চোখে পড়বে।",
    };
  if (p >= 50)
    return {
      category: "লিখিত অংশে আরও মন দিতে হবে",
      comment:
        "লিখিত অংশে আরও মনোযোগ দরকার। শুধু পড়লে হবে না—নিয়মিত হাতে লিখে অনুশীলন করো, উত্তরের কাঠামো ঠিক রাখো আর সময় ধরে লেখার অভ্যাস করো। তাহলেই এই অংশ থেকে ভালো নম্বর আসবে।",
    };
  if (p >= 30)
    return {
      category: "লিখিত অংশটা একটু দুর্বল",
      comment:
        "লিখিত অংশে নম্বর তুলনায় কম এসেছে। প্রতিদিন একটা নির্দিষ্ট সময় লেখার অনুশীলন করো, গুরুত্বপূর্ণ প্রশ্নের উত্তর আগে থেকে তৈরি রাখো আর খাতা মেন্টরকে দেখিয়ে ভুলগুলো শুধরে নাও।",
    };
  return {
    category: "লিখিত অংশে এখনই মন দেওয়া দরকার",
    comment:
      "লিখিত অংশে নম্বর অনেকটাই কম। আজ থেকেই নিয়ম করে লেখার অভ্যাস গড়ো, একদম সহজ প্রশ্ন থেকে শুরু করো আর মেন্টরের সরাসরি সাহায্য নিয়ে ধাপে ধাপে এগোও—এটা খুব জরুরি।",
  };
}

/* ============================ DONUT (SVG) ================================ */
function Donut({ correct, incorrect, skipped, center, centerLabel, size = 86, thickness = 14 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const C = 2 * Math.PI * r;
  const gap = 5;
  const segs = [
    { v: Number(correct) || 0, c: "#22c55e" },
    { v: Number(incorrect) || 0, c: "#ef4444" },
    { v: Number(skipped) || 0, c: "#f59e0b" },
  ];
  let cum = 0;
  return (
    <div className="donutWrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        {segs.map((s, i) => {
          const len = Math.max((s.v / 100) * C - gap, 0);
          const rot = -90 + (cum / 100) * 360;
          cum += s.v;
          if (len <= 0) return null;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={s.c}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${C - len}`}
              strokeLinecap="butt"
              transform={`rotate(${rot} ${cx} ${cx})`}
            />
          );
        })}
      </svg>
      <div className="donutCenter">
        <strong>{center}%</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

/* MCQ donut card — correct / incorrect / skipped only (MCQ score in center) */
function DonutCard({ title, data }) {
  const correct = data?.correctPercentage || 0;
  const incorrect = data?.incorrectPercentage || 0;
  const skipped = data?.skippedPercentage || 0;
  const col = bandColor(correct);
  return (
    <div className="donutCard">
      <div className="dt">{title}</div>
      <Donut correct={correct} incorrect={incorrect} skipped={skipped} center={correct} centerLabel="MCQ" />
      <div className="dleg">
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#22c55e" }} />সঠিক</span><b>{correct}%</b></div>
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#ef4444" }} />ভুল</span><b>{incorrect}%</b></div>
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#f59e0b" }} />স্কিপ</span><b>{skipped}%</b></div>
      </div>
      <span className="dchip" style={{ background: col.bg, color: col.text }}>{col.label}</span>
    </div>
  );
}

/* Written donut — single arc: obtained marks vs total marks */
function WrittenDonut({ pct, size = 86, thickness = 14 }) {
  const v = Number(pct) || 0;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const C = 2 * Math.PI * r;
  const col = bandColor(v);
  const len = Math.max((v / 100) * C, 0);
  return (
    <div className="donutWrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        {len > 0 && (
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={col.bar}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${len} ${C - len}`}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        )}
      </svg>
      <div className="donutCenter">
        <strong style={{ color: col.bar }}>{v}%</strong>
        <span>লিখিত</span>
      </div>
    </div>
  );
}

function WrittenCard({ title, data }) {
  const written = data?.writtenPercentage || 0;
  const obtained = data?.totalWritten || 0;
  const total = data?.totalWrittenMarks || 0;
  const col = bandColor(written);
  return (
    <div className="donutCard">
      <div className="dt">{title}</div>
      <WrittenDonut pct={written} />
      <div className="dleg">
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#06b6d4" }} />প্রাপ্ত</span><b>{obtained}</b></div>
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#cbd5e1" }} />মোট</span><b>{total}</b></div>
      </div>
      <span className="dchip" style={{ background: col.bg, color: col.text }}>{col.label}</span>
    </div>
  );
}

/* ============================ BAR CHART (SVG) ============================ */
function BarChart({ bars }) {
  const W = 1000, H = 360, padL = 40, padR = 14, padT = 24, padB = 118;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = Math.max(bars.length, 1);
  const slot = plotW / n;
  const bw = Math.min(slot * 0.6, 44);
  const grid = [0, 25, 50, 75, 100];
  return (
    <svg className="barSvg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {grid.map((g) => {
        const y = padT + plotH - (g / 100) * plotH;
        return (
          <g key={g}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e8edf3" strokeWidth="1" />
            <text x={padL - 7} y={y + 4} textAnchor="end" fontSize="12" fill="#9aa6b2" fontFamily="Sora">{g}</text>
          </g>
        );
      })}
      {bars.map((b, i) => {
        const x = padL + slot * i + slot / 2;
        const bh = (b.pct / 100) * plotH;
        const y = padT + plotH - bh;
        const col = bandColor(b.pct);
        const ly = padT + plotH + 13;
        return (
          <g key={b.subject + i}>
            <rect x={x - bw / 2} y={y} width={bw} height={Math.max(bh, 2)} rx="5" fill={col.bar} />
            <text x={x} y={y - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937" fontFamily="Sora">{b.pct}%</text>
            <text x={x} y={ly} transform={`rotate(-40 ${x} ${ly})`} textAnchor="end" fontSize="13.5" fill="#475569" fontFamily="Hind Siliguri">{b.subject}</text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#cbd5e1" strokeWidth="1.5" />
    </svg>
  );
}

/* =============================== PAGES =================================== */
const BRAND = { name: "BIG BANG EXAM CARE", exam: "মডেল টেস্ট — ফলাফল বিশ্লেষণ", seal: "B" };

function FrontPage({ student }) {
  const a = student.analysis || {};
  const bars = (a.subjectConsistency?.subjectBars || [])
    .map((s) => ({ subject: s.subject, pct: s.totalPercentage || s.percentage || 0 }))
    .sort((x, y) => y.pct - x.pct);
  const comments = [...(a.subjectConsistency?.subjectBars || [])].sort(
    (x, y) => (y.totalPercentage || 0) - (x.totalPercentage || 0)
  );
  const col = bandColor(a.totalPercentage || 0);
  return (
    <div className="srp-page" style={{ "--ribbon": "linear-gradient(180deg,#6366f1,#22d3ee)" }}>
      <div className="corner" />
      <div className="hero">
        <div className="brand">
          <div className="seal">{BRAND.seal}</div>
          <div>
            <h1>{BRAND.name}</h1>
            <div className="sub">{BRAND.exam}</div>
          </div>
        </div>
        <div className="right">
          <div>
            <div className="roll">Roll</div>
            <div className="rollv">{student.roll}</div>
          </div>
          <div className="cat">{a.category}</div>
        </div>
      </div>

      <div className="statStrip">
        <div className="stat tot">
          <span className="k">মোট ফলাফল</span>
          <span className="v" style={{ color: col.bar }}>{a.totalPercentage || 0}%</span>
        </div>
        <div className="stat">
          <span className="k">প্রাপ্ত নম্বর</span>
          <span className="v">{a.totalObtained || 0}/{a.totalMarks || 0}</span>
        </div>
        <div className="stat">
          <span className="k"><span className="dotk" style={{ background: "#22c55e" }} />সঠিক</span>
          <span className="v">{a.totalCorrect || 0}</span>
        </div>
        <div className="stat">
          <span className="k"><span className="dotk" style={{ background: "#ef4444" }} />ভুল</span>
          <span className="v">{a.totalIncorrect || 0}</span>
        </div>
        <div className="stat">
          <span className="k"><span className="dotk" style={{ background: "#f59e0b" }} />স্কিপ</span>
          <span className="v">{a.totalSkipped || 0}</span>
        </div>
      </div>

      <div className="secLabel" style={{ "--accent": "#4f46e5" }}>
        <span className="tag">CHART</span>
        <b>বিষয়ভিত্তিক মোট ফলাফল (%)</b>
        <span className="rule" />
      </div>
      <div className="barCard"><BarChart bars={bars} /></div>

      <div className="secLabel" style={{ "--accent": "#0ea5e9" }}>
        <span className="tag">COMMENTS</span>
        <b>বিষয়ভিত্তিক মন্তব্য</b>
        <span className="rule" />
      </div>
      <div className="scGrid">
        {comments.map((s) => {
          const pct = s.totalPercentage || s.percentage || 0;
          const c = bandColor(pct);
          return (
            <div className="scCard" key={s.subject} style={{ borderLeftColor: c.bar }}>
              <div className="scTop">
                <h4>{s.subject}</h4>
                <span className="scBadge" style={{ background: c.bg, color: c.text }}>{pct}%</span>
              </div>
              <div className="scMini">MCQ {s.mcqPercentage || 0}% · লিখিত {s.writtenPercentage || 0}% · মোট {pct}%</div>
              <div className="scCat" style={{ color: c.text }}>{s.subjectCommentCategory}</div>
              <p>{s.subjectComment}</p>
            </div>
          );
        })}
      </div>

      <div className="pageFoot">
        <span>{BRAND.name} · Roll {student.roll}</span>
        <span className="pill">Page 1 / 2 — Front</span>
      </div>
    </div>
  );
}

function BackPage({ student }) {
  const a = student.analysis || {};
  const p = a.partitions || {};
  const written = getWrittenComment(a.writtenPercentage || 0);
  return (
    <div className="srp-page" style={{ "--ribbon": "linear-gradient(180deg,#0d9488,#2563eb)" }}>
      <div className="corner" />
      <div className="backHead">
        <h1>Performance Deep-Dive · বিশ্লেষণ</h1>
        <div className="rt">
          <b>Roll {student.roll}</b>
          <span>মোট {a.totalPercentage || 0}% · লিখিত {a.writtenPercentage || 0}%</span>
        </div>
      </div>

      <div className="secLabel" style={{ "--accent": "#0d9488" }}>
        <span className="tag">MCQ MIX</span>
        <b>MCQ গঠন বিশ্লেষণ (সঠিক / ভুল / স্কিপ)</b>
        <span className="rule" />
      </div>
      <div className="donutRow">
        <DonutCard title="সামগ্রিক" data={a} />
        <DonutCard title="Science" data={p.science} />
        <DonutCard title="General" data={p.nonScience} />
      </div>

      <div className="secLabel" style={{ "--accent": "#0891b2" }}>
        <span className="tag">WRITTEN</span>
        <b>লিখিত অংশের ফলাফল (প্রাপ্ত / মোট)</b>
        <span className="rule" />
      </div>
      <div className="donutRow">
        <WrittenCard title="সামগ্রিক" data={a} />
        <WrittenCard title="Science" data={p.science} />
        <WrittenCard title="General" data={p.nonScience} />
      </div>

      <div className="secLabel" style={{ "--accent": "#6366f1" }}>
        <span className="tag">ANALYSIS</span>
        <b>মন্তব্য ও পর্যবেক্ষণ</b>
        <span className="rule" />
      </div>

      <div className="cmt" style={{ "--accent": "#6366f1" }}>
        <div className="ch">
          <span className="label">সামগ্রিক</span>
          <h3>{a.category}</h3>
        </div>
        <p>{a.comment}</p>
      </div>

      <div className="cmt" style={{ "--accent": "#0d9488" }}>
        <div className="ch">
          <span className="label">Science vs General</span>
          <span className="dev">পার্থক্য: {p.comparison?.deviation || 0}%</span>
        </div>
        <h3 style={{ marginTop: 2 }}>{p.comparison?.category}</h3>
        <p>{p.comparison?.comment}</p>
      </div>

      <div className="cmt written">
        <div className="ch">
          <span className="label" style={{ background: "#06b6d4" }}>লিখিত অংশ · {a.writtenPercentage || 0}%</span>
          <h3>{written.category}</h3>
        </div>
        <p>{written.comment}</p>
      </div>

      <div className="pageFoot">
        <span>{BRAND.name} · Roll {student.roll}</span>
        <span className="pill">Page 2 / 2 — Back</span>
      </div>
    </div>
  );
}

/* ===================== PUBLIC: PrintableReports ========================== */
export function PrintableReports({ students = [] }) {
  return (
    <div className="srp-root">
      <style>{css}</style>
      <div className="srp-toolbar">
        <h2>Report Cards</h2>
        <span className="muted">{students.length} students · {students.length * 2} pages (A4, duplex)</span>
        <span className="srp-tip">Print → A4 · Margins: None · ✓ Background graphics</span>
        <button className="srp-print-btn" onClick={() => window.print()}>🖨 Print All Report Cards</button>
      </div>
      <div className="srp-stage">
        {students.map((s) => (
          <React.Fragment key={s.id ?? s.roll}>
            <FrontPage student={s} />
            <BackPage student={s} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   ====================  DEMO DATA + YOUR ANALYSIS ENGINE  ==================
   (Below mirrors your utils/studentAnalysis.js so the preview is faithful.
    In your real app the analysis already arrives from the backend — you can
    delete everything from here down and just use <PrintableReports/>.)
========================================================================== */

function safeNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function calcPct(o, t) { const O = safeNumber(o), T = safeNumber(t); if (!T || T <= 0) return 0; return Number(((O / T) * 100).toFixed(2)); }
function getSubjectTotalData(r) {
  const correct = safeNumber(r.correct), incorrect = safeNumber(r.incorrect), skipped = safeNumber(r.skipped);
  const mcqTotal = safeNumber(r.mcqTotal), written = safeNumber(r.written), writtenTotal = safeNumber(r.writtenTotal);
  const attempted = correct + incorrect + skipped;
  const finalMcq = mcqTotal > 0 ? mcqTotal : attempted;
  const totalObtained = correct + written, totalMarks = finalMcq + writtenTotal;
  return { correct, incorrect, skipped, mcqTotal: finalMcq, written, writtenTotal, totalObtained, totalMarks,
    mcqPercentage: calcPct(correct, finalMcq), writtenPercentage: calcPct(written, writtenTotal), totalPercentage: calcPct(totalObtained, totalMarks) };
}
function getSubjectWiseComment(tp) {
  const p = safeNumber(tp);
  if (p >= 90) return { category: "দারুণ করছ, এভাবেই এগিয়ে যাও", comment: "এই বিষয়ে তোমার দখলটা সত্যিই ভালো। এখন নতুন করে চাপ নেওয়ার দরকার নেই—যেভাবে চলছ সেভাবেই নিয়মিত থাকো, আর মাঝে মাঝে আগের পড়াগুলোয় একটু চোখ বুলিয়ে নিও। এই ছন্দটা ধরে রাখতে পারলে পরীক্ষায় এই বিষয় নিয়ে তোমার আর চিন্তা থাকবে না।" };
  if (p >= 80) return { category: "প্রায় গুছিয়ে এনেছ", comment: "তোমার প্রস্তুতি প্রায় ঠিক জায়গায় আছে। শুধু ছোটখাটো ফাঁকগুলো—একটা সূত্র, একটা বানান, কিংবা কোনো প্রশ্ন ঠিকমতো না বোঝা—এখনই ধরে নাও। এই ছোট ভুলগুলোই কিন্তু পরীক্ষায় বড় নম্বর খেয়ে ফেলে, তাই হালকাভাবে নিও না।" };
  if (p >= 65) return { category: "আর একটু খাটলেই হয়ে যাবে", comment: "এই বিষয়ে এখনো কিছু জায়গা ফাঁকা রয়ে গেছে। যেসব অধ্যায় কঠিন লাগে সেগুলো বুঝে বুঝে পড়ো, আর যেসব প্রশ্নে ভুল করেছ সেগুলো নিজে হাতে আবার করে দেখো। একটু গুছিয়ে এগোলে অল্প দিনেই উন্নতিটা চোখে পড়বে।" };
  if (p >= 50) return { category: "পড়ার ধরনটা একটু বদলাতে হবে", comment: "মনে হচ্ছে কিছু টপিক এখনো তোমার কাছে পরিষ্কার হয়নি। শুধু বেশি সময় পড়লেই হবে না—কীভাবে পড়ছ সেটাও দেখা দরকার। বেসিকটা আরেকবার ভালো করে দেখে নাও, আর ঠিক কোথায় আটকে যাচ্ছ সেটা মেন্টরকে বলো; একসাথে ঠিক করে দেব।" };
  if (p >= 30) return { category: "এখনো ঘুরে দাঁড়ানোর অনেক সময় আছে", comment: "ভয় পেয়ো না, এই বিষয়ে এখনো ঘুরে দাঁড়ানোর যথেষ্ট সময় আছে। প্রতিদিন একটু একটু করে নিয়ম করে বসো, আর কোথায় সমস্যা হচ্ছে খোলাখুলি মেন্টরের সাথে কথা বলো। মন দিয়ে লেগে থাকলে এই বিষয়েই তুমি অবাক করার মতো উন্নতি করতে পারো।" };
  return { category: "চলো, একদম গোড়া থেকে শুরু করি", comment: "এই বিষয়ে নম্বর অনেকটাই কম এসেছে, তবে এটাকে শেষ ভেবো না—নতুন করে শুরু করার সুযোগ ভাবো। দেরি না করে আজ থেকেই বেসিক ধরো, প্রতিদিন একটা নির্দিষ্ট সময় শুধু এই বিষয়ের জন্য রাখো, আর আটকে গেলেই মেন্টরের কাছে চলে এসো। ধাপে ধাপে এগোলে এখান থেকেও ভালো জায়গায় পৌঁছানো যায়।" };
}
function calculatePercentages(subjects) {
  let c = 0, ic = 0, sk = 0, mcq = 0, w = 0, wt = 0;
  Object.values(subjects || {}).forEach((s) => { const d = getSubjectTotalData(s); c += d.correct; ic += d.incorrect; sk += d.skipped; mcq += d.mcqTotal; w += d.written; wt += d.writtenTotal; });
  const attempted = c + ic + sk, baseMcq = mcq > 0 ? mcq : attempted;
  const totalObtained = c + w, totalMarks = baseMcq + wt;
  return { totalCorrect: c, totalIncorrect: ic, totalSkipped: sk, totalMcq: baseMcq, totalWritten: w, totalWrittenMarks: wt, totalObtained, totalMarks,
    correctPercentage: calcPct(c, baseMcq), incorrectPercentage: calcPct(ic, baseMcq), skippedPercentage: calcPct(sk, baseMcq), writtenPercentage: calcPct(w, wt), totalPercentage: calcPct(totalObtained, totalMarks) };
}
const commentRules = [
  { id: 8, category: "নতুন করে শুরু করার সময় এখনই", check: (p) => p.totalPercentage < 30, comment: "এবারের ফলাফলটা বলছে পড়াশোনাটা আবার নতুন করে গুছিয়ে শুরু করা দরকার। একসাথে সব ধরতে যেও না—বেসিক থেকে ধীরে ধীরে এগোও, প্রতিদিন একটা নির্দিষ্ট সময় বসো, আর যেখানে আটকাবে সেখানেই মেন্টরকে জানাও। বাড়ির কেউ একটু খেয়াল রাখলে আর তুমি লেগে থাকলে আবার ঠিক পথে ফেরা কঠিন কিছু না।" },
  { id: 1, category: "অসাধারণ, এই ছন্দটা ধরে রাখো", check: (p) => p.totalPercentage >= 90, comment: "তুমি দারুণ একটা জায়গায় আছ। এখন তোমার একটাই কাজ—এই ছন্দটা নষ্ট হতে না দেওয়া। নিয়মিত অনুশীলন করো, পরীক্ষার সময় মাথা ঠান্ডা রেখে উত্তর দাও, আর ভালো করছি বলে গা ছেড়ে দিও না। এভাবে চললে সামনে আরও ভালো ফল তোমার জন্যই অপেক্ষা করছে।" },
  { id: 2, category: "ভালো করছ, এবার একটু সাহস বাড়াও", check: (p) => p.totalPercentage < 90 && p.totalPercentage > 70 && p.skippedPercentage + 5 > p.incorrectPercentage, comment: "তোমার প্রস্তুতি বেশ ভালো জায়গায় আছে। তবে অনেক প্রশ্ন ছেড়ে দিচ্ছ, মানে জানা জিনিসেও তুমি একটু দ্বিধায় ভুগছ। মডেল টেস্ট দিয়ে, সময় ধরে অনুশীলন করে নিজের ওপর ভরসাটা বাড়াও। জানা প্রশ্নে সাহস করে কলম চালালে এই ছেড়ে দেওয়া প্রশ্নগুলো থেকেই বাড়তি নম্বর চলে আসবে।" },
  { id: 3, category: "ভালো করছ, একটু সাবধানে উত্তর দাও", check: (p) => p.totalPercentage < 90 && p.totalPercentage > 70 && p.incorrectPercentage > p.skippedPercentage + 5, comment: "তুমি ভালোই করছ, শুধু ভুল উত্তরগুলো একটু কমাতে হবে। অনেক সময় তাড়াহুড়ো করে বা প্রশ্ন পুরোটা না পড়ে উত্তর দিলে এই ভুলগুলো হয়। প্রশ্নটা ঠান্ডা মাথায় পড়ো, নিশ্চিত হয়ে তারপর উত্তর দাও—দেখবে নম্বর নিজে থেকেই উঠে যাচ্ছে।" },
  { id: 4, category: "কৌশলটা একটু ঠিক করলেই হবে", check: (p) => p.totalPercentage >= 50 && p.totalPercentage <= 70 && p.skippedPercentage + 10 < p.incorrectPercentage, comment: "তোমার প্রস্তুতি মাঝামাঝি জায়গায়, খারাপ না। এখন দরকার ভুলগুলো ধরে ফেলা—কোন অধ্যায়ে বা কোন ধরনের প্রশ্নে বারবার আটকাচ্ছ সেটা খুঁজে বের করো। সেই জায়গাগুলো আলাদা করে অনুশীলন করো আর মেন্টরের পরামর্শ মতো এগোও, ফল দ্রুত ভালো হবে।" },
  { id: 5, category: "নিজের ওপর ভরসা রাখলেই এগিয়ে যাবে", check: (p) => p.totalPercentage >= 50 && p.totalPercentage <= 70 && p.skippedPercentage + 5 > p.incorrectPercentage, comment: "তুমি বেশ কিছু প্রশ্ন ছেড়ে দিচ্ছ, অথচ চেষ্টা করলে হয়তো অনেকগুলোরই উত্তর দিতে পারতে। আত্মবিশ্বাসটা একটু বাড়াও—প্রতিদিন ছোট ছোট টেস্ট দাও, সহজ প্রশ্ন থেকে শুরু করে আস্তে আস্তে কঠিনে যাও। নিজের ওপর ভরসা এলেই দেখবে ছেড়ে দেওয়া প্রশ্নেও হাত দিচ্ছ।" },
  { id: 6, category: "পড়ার পদ্ধতিটা গুছিয়ে নিতে হবে", check: (p) => p.totalPercentage >= 30 && p.totalPercentage <= 50 && p.skippedPercentage + 5 < p.incorrectPercentage, comment: "তোমার পড়াটা আরেকটু গুছিয়ে করা দরকার। এখন বেশ ভুল হচ্ছে, তাই আগে বেসিক ধারণাগুলো পরিষ্কার করো, তারপর অধ্যায় ধরে ধরে অনুশীলন করো। মেন্টরের সাথে বসে পড়ার ধরনটা একটু বদলে নাও, আর ভুলগুলো নিয়ম করে আবার দেখো—উন্নতি আসবেই।" },
  { id: 7, category: "চর্চা আর সাহস—দুটোই বাড়ানোর সময়", check: (p) => p.totalPercentage >= 30 && p.totalPercentage <= 50 && p.skippedPercentage + 5 > p.incorrectPercentage, comment: "তুমি অনেক প্রশ্ন ছেড়ে দিচ্ছ, যেটা ঠিক হচ্ছে না। নিজের প্রস্তুতির ওপর একটু আস্থা রাখো—সব না পারলেও যেগুলো পারো অন্তত সেগুলো করার চেষ্টা করো। ছোট লক্ষ্য নিয়ে প্রতিদিন পড়ো, সহজ প্রশ্ন আগে ধরো, আর সমস্যা হলে মেন্টরকে বলো; আস্তে আস্তে সব ঠিক হয়ে যাবে।" },
];
function getInitialComment(pd) {
  const m = commentRules.find((r) => r.check(pd));
  return { ruleId: m ? m.id : null, category: m ? m.category : "মেন্টরের সাথে একটু বসা দরকার", comment: m ? m.comment : "তোমার ফলাফলটা ঠিক কোন ছকে ফেলব বোঝা যাচ্ছে না। তাই বিষয়ভিত্তিক নম্বরগুলো নিয়ে একবার মেন্টরের সাথে বসো—কোথায় ভালো আর কোথায় খামতি দেখে সামনের পরিকল্পনাটা একসাথে ঠিক করে নেব।" };
}
const sci = ["Physics", "Chemistry", "General Math", "Higher Math", "Biology", "BGS", "Physics 1st", "Physics 2nd", "Chemistry 1st", "Chemistry 2nd", "Biology 1st", "Biology 2nd", "Higher Math 1st", "Higher Math 2nd"];
const general = ["Bangla 1st", "Bangla 2nd", "English 1st", "English 2nd", "Religion", "ICT"];
const norm = (n) => String(n || "").trim().toLowerCase().replace(/\s+/g, " ");
function byNames(subjects, names) { const a = names.map(norm); const out = {}; Object.entries(subjects || {}).forEach(([k, v]) => { if (a.includes(norm(k))) out[k] = v; }); return out; }
function partition(title, subjects) { const pd = calculatePercentages(subjects); return { title, ...pd, ...getInitialComment(pd) }; }
function sciCmp(s, g) {
  const a = s.totalPercentage || 0, b = g.totalPercentage || 0, dev = Number(Math.abs(a - b).toFixed(2));
  const weak = a < b ? "science" : b < a ? "general" : "equal";
  if (dev < 15) return { deviation: dev, weakerPart: weak, category: "Science আর General—দুটোতেই ভারসাম্য ভালো", comment: "Science আর General দুই দিকেই তোমার অবস্থা প্রায় কাছাকাছি, এটা খুব ভালো লক্ষণ। যেদিকটায় নম্বর সামান্য কম এসেছে, সেখানে একটু বেশি রিভিশন দিলেই সব মিলিয়ে ফলটা আরও সুন্দর দেখাবে।" };
  if (dev <= 30) return weak === "science"
    ? { deviation: dev, weakerPart: weak, category: "Science-এ একটু বেশি সময় দাও", comment: "General-এর তুলনায় Science-এ তুমি একটু পিছিয়ে আছ। Physics, Chemistry, Math, Biology—এগুলো মুখস্থ না করে বুঝে পড়ো আর নিয়মিত অঙ্ক ও সমস্যা মেলাও। একটু বাড়তি সময় দিলেই এই দিকটা সামলে যাবে।" }
    : { deviation: dev, weakerPart: weak, category: "General অংশে রিভিশন একটু বাড়াও", comment: "Science-এর তুলনায় General বিষয়গুলোতে তুমি একটু পিছিয়ে। Bangla, English, Religion, ICT সহজ মনে হলেও নিয়মিত না দেখলে নম্বর পড়ে যায়। প্রতিদিন অল্প করে হলেও এগুলো রিভিশন দাও, পার্থক্যটা ঠিক কমে আসবে।" };
  return weak === "science"
    ? { deviation: dev, weakerPart: weak, category: "Science-এর বেসিকটা শক্ত করা দরকার", comment: "Science-এ পার্থক্যটা বেশ বড়। ঘাবড়ে না গিয়ে গোড়া থেকে ধরো—বেসিক কনসেপ্ট আর সূত্রগুলো ভালো করে বুঝে নাও, মেন্টরের সাহায্য নিয়ে নিয়মিত অনুশীলন করো। ঠিকভাবে শুরু করলে এই দূরত্বটা ধীরে ধীরে মিটে যাবে।" }
    : { deviation: dev, weakerPart: weak, category: "General বিষয়গুলোতে নিয়মিত পড়া দরকার", comment: "General বিষয়গুলোতে অনেকটাই পিছিয়ে আছ। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা আর রিভিশনের কোনো বিকল্প নেই। প্রতিদিন একটা নির্দিষ্ট সময় এগুলোর জন্য রাখো—অল্প দিনেই নম্বর উঠতে শুরু করবে।" };
}
function subjectBarsOf(subjects) {
  return Object.entries(subjects || {}).map(([name, r]) => {
    const d = getSubjectTotalData(r), c = getSubjectWiseComment(d.totalPercentage);
    return { subject: name, ...d, percentage: d.totalPercentage, subjectCommentCategory: c.category, subjectComment: c.comment };
  });
}
function consistency(subjects) {
  const bars = subjectBarsOf(subjects);
  const valid = bars.filter((i) => i.totalMarks > 0);
  if (!valid.length) return { subjectBars: bars, averagePercentage: 0, level: "ডেটা পাওয়া যায়নি", comment: "বিষয়ভিত্তিক হিসাব করার মতো যথেষ্ট তথ্য এখানে নেই।" };
  const pcts = valid.map((i) => i.totalPercentage).sort((a, b) => a - b);
  const mid = Math.floor(pcts.length / 2);
  const median = pcts.length % 2 === 0 ? (pcts[mid - 1] + pcts[mid]) / 2 : pcts[mid];
  const filtered = valid.filter((i) => Math.abs(i.totalPercentage - median) <= 25);
  const fin = filtered.length ? filtered : valid;
  const avg = Number((fin.reduce((s, i) => s + i.totalPercentage, 0) / fin.length).toFixed(2));
  const low = valid.filter((i) => i.totalPercentage < 55).length;
  const lowRatio = Number(((low / valid.length) * 100).toFixed(2));
  let level, comment;
  if (avg < 55 && lowRatio >= 60) { level = "পড়ার সাথে নিয়মিত যোগটা শক্ত করা দরকার"; comment = "বেশিরভাগ বিষয়েই নম্বর কম এসেছে। দু-একটা বিষয়ে হঠাৎ ভালো বা খারাপ বাদ দিলেও বোঝা যাচ্ছে, পড়ার সাথে তোমার নিয়মিত যোগটা আরেকটু শক্ত হওয়া দরকার। প্রতিদিন নির্দিষ্ট সময় বসো, ছোট ছোট লক্ষ্য ঠিক করো, আর মেন্টরের নজরে থেকে এগোও—ধীরে ধীরে ঠিক ঘুরে দাঁড়াবে।"; }
  else if (avg < 70) { level = "মাঝারি পর্যায়ের প্রস্তুতি"; comment = "তোমার প্রস্তুতি এখন মাঝামাঝি অবস্থায়। একটু বেশি সময়, একটু বেশি অনুশীলন আর কম নম্বর পাওয়া বিষয়গুলোতে আলাদা মনোযোগ দিলেই হবে। কোন কোন বিষয়ে ভালো করছ আর ঠিক কোথায় নম্বর হারাচ্ছ—সেটা দেখে প্রস্তুতির দিকটা গুছিয়ে নাও।"; }
  else { level = "ভালো পথেই আছ"; comment = "সব মিলিয়ে তুমি ভালো পথেই আছ। এই জায়গাটা ধরে রাখতে নিয়মিত অনুশীলন আর রিভিশন চালিয়ে যাও। ভালো ফলের মধ্যেও একটু খেয়াল করো—কোন অংশে সবচেয়ে শক্তিশালী আর কোথায় আর একটু নজর দিলে ফলটা আরও ঝকঝকে হবে।"; }
  return { subjectBars: bars, averagePercentage: avg, medianPercentage: Number(median.toFixed(2)), lowSubjectCount: low, lowSubjectRatio: lowRatio, level, comment };
}
function generateStudentAnalysis(subjects) {
  const pd = calculatePercentages(subjects);
  const sciA = partition("Science", byNames(subjects, sci));
  const generalA = partition("General", byNames(subjects, general));
  return { ...pd, ...getInitialComment(pd), subjectConsistency: consistency(subjects),
    partitions: { science: sciA, nonScience: generalA, comparison: sciCmp(sciA, generalA) } };
}

/* sample raw subjects -> analyzed -> rendered */
const subj = (correct, incorrect, skipped, written) => ({ correct, incorrect, skipped, mcqTotal: 25, written, writtenTotal: 50 });
const SUBJECT_NAMES = ["Physics 1st", "Physics 2nd", "Chemistry 1st", "Chemistry 2nd", "Higher Math 1st", "Higher Math 2nd", "Biology 1st", "Biology 2nd", "Bangla 1st", "Bangla 2nd", "English 1st", "English 2nd", "ICT"];
const RAW = {
  "101": [[22,2,1,42],[20,3,2,40],[23,1,1,45],[21,2,2,43],[19,4,2,38],[18,5,2,36],[24,1,0,46],[22,2,1,44],[20,3,2,41],[21,2,2,40],[17,5,3,35],[16,6,3,33],[23,1,1,44]],
  "214": [[13,7,5,24],[11,8,6,22],[15,6,4,28],[12,8,5,25],[9,9,7,18],[8,10,7,16],[16,5,4,30],[14,6,5,27],[17,5,3,31],[16,5,4,30],[12,8,5,23],[11,9,5,21],[18,4,3,33]],
  "356": [[6,10,9,12],[5,11,9,10],[8,9,8,15],[6,10,9,13],[4,12,9,8],[3,13,9,7],[10,8,7,18],[9,8,8,17],[12,7,6,22],[11,7,7,20],[7,10,8,14],[6,11,8,12],[13,6,6,24]],
};
const SAMPLE_STUDENTS = Object.entries(RAW).map(([roll, rows], idx) => {
  const subjects = {};
  SUBJECT_NAMES.forEach((nm, i) => { const [c, ic, sk, w] = rows[i]; subjects[nm] = subj(c, ic, sk, w); });
  return { id: idx + 1, roll, subjects, analysis: generateStudentAnalysis(subjects) };
});

export default function App() {
  const students = useMemo(() => SAMPLE_STUDENTS, []);
  return <PrintableReports students={students} />;
}