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

.donutRow{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;}
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

/* ============ HARD-CODED WRITTEN-PERCENTAGE COMMENT (frontend) =========== */
function getWrittenComment(percentage) {
  const p = Number(percentage) || 0;
  if (p >= 90)
    return {
      category: "লিখিত অংশে চমৎকার পারফরম্যান্স",
      comment:
        "লিখিত অংশে শিক্ষার্থী চমৎকার করছে। উত্তর গুছিয়ে লেখা, প্রয়োজনীয় পয়েন্ট ও ব্যাখ্যা সঠিকভাবে তুলে ধরা এবং উপস্থাপনার এই মান ধরে রাখলে লিখিত অংশ থেকে ধারাবাহিকভাবে ভালো নম্বর পাওয়া সম্ভব।",
    };
  if (p >= 80)
    return {
      category: "লিখিত অংশে ভালো করছে",
      comment:
        "লিখিত অংশে শিক্ষার্থী ভালো করছে। হাতের লেখা, উত্তরের কাঠামো ও সময় ব্যবস্থাপনায় আরও একটু যত্ন নিলে এবং গুরুত্বপূর্ণ পয়েন্টগুলো জোর দিলে এই অংশের নম্বর আরও বাড়ানো সম্ভব।",
    };
  if (p >= 65)
    return {
      category: "লিখিত অংশ মোটামুটি ভালো",
      comment:
        "লিখিত অংশে প্রস্তুতি মোটামুটি ভালো আছে। গুরুত্বপূর্ণ প্রশ্নগুলো নিয়মিত লিখে অনুশীলন করা এবং উত্তর সাজিয়ে, পরিষ্কারভাবে উপস্থাপন করার চর্চা করলে দ্রুত উন্নতি হবে।",
    };
  if (p >= 50)
    return {
      category: "লিখিত অংশে আরও মনোযোগ দরকার",
      comment:
        "লিখিত অংশে আরও মনোযোগ দেওয়া দরকার। শুধু পড়লেই হবে না—নিয়মিত লিখে অনুশীলন করা, উত্তরের কাঠামো ঠিক রাখা এবং সময় ধরে লেখার চর্চা করলে এই অংশ থেকে ভালো নম্বর আসবে।",
    };
  if (p >= 30)
    return {
      category: "লিখিত অংশ দুর্বল, চর্চা বাড়ানো দরকার",
      comment:
        "লিখিত অংশে ফলাফল তুলনামূলকভাবে কম। প্রতিদিন নির্দিষ্ট সময় লেখার অনুশীলন, গুরুত্বপূর্ণ প্রশ্নের উত্তর তৈরি করা এবং মেন্টরের কাছে খাতা দেখিয়ে ভুলগুলো ঠিক করে নেওয়া দরকার।",
    };
  return {
    category: "লিখিত অংশে বিশেষ মনোযোগ প্রয়োজন",
    comment:
      "লিখিত অংশে ফলাফল অনেক কম এসেছে। এখন থেকেই নিয়মিত লেখার অভ্যাস গড়ে তোলা, বেসিক প্রশ্ন থেকে শুরু করা এবং মেন্টরের সরাসরি সহায়তা নিয়ে ধাপে ধাপে এগোনো খুব জরুরি।",
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

function DonutCard({ title, data }) {
  const correct = data?.correctPercentage || 0;
  const incorrect = data?.incorrectPercentage || 0;
  const skipped = data?.skippedPercentage || 0;
  const total = data?.totalPercentage || 0;
  const written = data?.writtenPercentage || 0;
  const col = bandColor(total);
  return (
    <div className="donutCard">
      <div className="dt">{title}</div>
      <Donut correct={correct} incorrect={incorrect} skipped={skipped} center={total} centerLabel="মোট" />
      <div className="dleg">
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#22c55e" }} />সঠিক</span><b>{correct}%</b></div>
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#ef4444" }} />ভুল</span><b>{incorrect}%</b></div>
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#f59e0b" }} />স্কিপ</span><b>{skipped}%</b></div>
        <div className="l"><span className="nm"><span className="dotk" style={{ background: "#06b6d4" }} />লিখিত</span><b>{written}%</b></div>
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
  const mp = a.mathPartitions || {};
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
        <DonutCard title="Non-Science" data={p.nonScience} />
        <DonutCard title="Mathematical" data={mp.mathematical} />
        <DonutCard title="Non-Math" data={mp.nonMathematical} />
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
          <span className="label">Science vs Non-Science</span>
          <span className="dev">পার্থক্য: {p.comparison?.deviation || 0}%</span>
        </div>
        <h3 style={{ marginTop: 2 }}>{p.comparison?.category}</h3>
        <p>{p.comparison?.comment}</p>
      </div>

      <div className="cmt" style={{ "--accent": "#b45309" }}>
        <div className="ch">
          <span className="label">Math vs Non-Math</span>
          <span className="dev">পার্থক্য: {mp.comparison?.deviation || 0}%</span>
        </div>
        <h3 style={{ marginTop: 2 }}>{mp.comparison?.category}</h3>
        <p>{mp.comparison?.comment}</p>
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
  if (p >= 90) return { category: "খুব ভালো অবস্থানে আছে", comment: "এই বিষয়ে শিক্ষার্থী খুব ভালো অবস্থানে আছে। বর্তমান প্রস্তুতি ও ধারাবাহিকতা ধরে রাখাই এখন সবচেয়ে গুরুত্বপূর্ণ। নিয়মিত অনুশীলন ও রিভিশন চালিয়ে গেলে ভালো ফলাফল ধরে রাখা সম্ভব।" };
  if (p >= 80) return { category: "ভালো পথে আছে", comment: "এই বিষয়ে শিক্ষার্থী ভালো পথে আছে এবং প্রস্তুতি মোটামুটি লাইনে আছে। ছোট কোনো অধ্যায়, সূত্র বা ব্যাখ্যায় সামান্য দুর্বলতা থাকলে এখনই ঠিক করা ভালো, কারণ ছোট ভুল পরে বড় নম্বর কমিয়ে দিতে পারে।" };
  if (p >= 65) return { category: "আরও ফোকাস দিলে ভালো উন্নতি হবে", comment: "এই বিষয়ে প্রস্তুতি এখনো পুরোপুরি সম্পন্ন হয়নি। কিছু টপিক আরও ভালোভাবে বুঝে পড়া দরকার। নিয়মিত রিভিশন ও ভুল হওয়া প্রশ্নগুলো আবার করলে দ্রুত উন্নতি সম্ভব।" };
  if (p >= 50) return { category: "বুঝে পড়ার পদ্ধতি শক্ত করা দরকার", comment: "এই বিষয়ে শিক্ষার্থী হয়তো কিছু টপিক বুঝতে কষ্ট পাচ্ছে। শুধু বেশি পড়লেই হবে না, কীভাবে পড়ছে সেটিও দেখা দরকার। বেসিক আবার দেখে সমস্যার জায়গা খুঁজে বের করলে উন্নতি হবে।" };
  if (p >= 30) return { category: "এখনো উন্নতির ভালো সুযোগ আছে", comment: "এই বিষয়ে এখনো উন্নতির সময় আছে। নিয়মিত ও আন্তরিকভাবে পড়লে মেন্টররা সঠিকভাবে সাহায্য করতে পারবেন। কোথায় ভুল হচ্ছে তা অভিজ্ঞ শিক্ষকের সাথে আলোচনা করা দরকার।" };
  return { category: "এখন থেকেই বিশেষ মনোযোগ দরকার", comment: "এই বিষয়ে ফলাফল অনেক কম এসেছে, তাই এখন থেকেই বিশেষ মনোযোগ দরকার। প্রতিদিন নির্দিষ্ট সময় পড়া, বেসিক থেকে শুরু করা এবং মেন্টরের সাহায্য নেওয়া উচিত।" };
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
  { id: 8, category: "নতুনভাবে শুরু করার ভালো সময়", check: (p) => p.totalPercentage < 30, comment: "শিক্ষার্থীর ফলাফল দেখে বোঝা যাচ্ছে এখন পড়াশোনাকে নতুনভাবে গুছিয়ে শুরু করার সময়। বেসিক ধীরে ধীরে পরিষ্কার করা, প্রতিদিন নির্দিষ্ট সময় পড়া এবং মেন্টরের সাথে নিয়মিত যোগাযোগ রাখলে উন্নতির ভালো সুযোগ আছে।" },
  { id: 1, category: "খুব ভালো অবস্থানে আছে", check: (p) => p.totalPercentage >= 90, comment: "শিক্ষার্থী খুব ভালো অবস্থানে আছে। এই ধারাবাহিকতা ধরে রাখতে নিয়মিত অনুশীলন, রিভিশন এবং পরীক্ষার সময় মনোযোগ বজায় রাখা প্রয়োজন। একইভাবে এগিয়ে গেলে আরও ভালো ফলাফলের সম্ভাবনা রয়েছে।" },
  { id: 2, category: "ভালো, আত্মবিশ্বাস বাড়ালে ফল আরও ভালো হবে", check: (p) => p.totalPercentage < 90 && p.totalPercentage > 70 && p.skippedPercentage + 5 > p.incorrectPercentage, comment: "শিক্ষার্থীর প্রস্তুতি ভালো পর্যায়ে আছে। কিছু প্রশ্ন স্কিপ করা থেকে বোঝা যায়, জানা বিষয়েও আরও আত্মবিশ্বাস নিয়ে উত্তর করলে ফলাফল আরও ভালো হবে। নিয়মিত মডেল টেস্ট ও সাহস নিয়ে উত্তর করার চর্চা দরকার।" },
  { id: 3, category: "ভালো, উত্তরে আরও মনোযোগ দরকার", check: (p) => p.totalPercentage < 90 && p.totalPercentage > 70 && p.incorrectPercentage > p.skippedPercentage + 5, comment: "শিক্ষার্থী ভালো করছে। তবে কিছু ভুল উত্তর কমাতে পারলে ফলাফল আরও স্থিতিশীল হবে। প্রশ্ন ভালোভাবে পড়ে, তাড়াহুড়া না করে নিশ্চিত হয়ে উত্তর করার অভ্যাস তৈরি করলে নম্বর বাড়বে।" },
  { id: 4, category: "কৌশল ঠিক করলে ভালো উন্নতি হবে", check: (p) => p.totalPercentage >= 50 && p.totalPercentage <= 70 && p.skippedPercentage + 10 < p.incorrectPercentage, comment: "প্রস্তুতি মাঝামাঝি পর্যায়ে আছে। ভুলের জায়গা চিহ্নিত করে অধ্যায়ভিত্তিক অনুশীলন করলে ভালো উন্নতি সম্ভব। কোন ধরনের প্রশ্নে বেশি ভুল হচ্ছে তা দেখে মেন্টরের গাইডলাইন অনুযায়ী পড়লে ফলাফল ভালো হবে।" },
  { id: 5, category: "আত্মবিশ্বাস ও চর্চা বাড়ালে উন্নতি হবে", check: (p) => p.totalPercentage >= 50 && p.totalPercentage <= 70 && p.skippedPercentage + 5 > p.incorrectPercentage, comment: "শিক্ষার্থী কিছু প্রশ্ন স্কিপ করছে। আত্মবিশ্বাস বাড়লে জানা প্রশ্নেও উত্তর করার সাহস পাবে। প্রতিদিন ছোট টেস্ট, নিয়মিত রিভিশন এবং সহজ থেকে কঠিন প্রশ্নে এগোলে ভালো উন্নতি হবে।" },
  { id: 6, category: "পড়ার পদ্ধতি আরও কার্যকর করা দরকার", check: (p) => p.totalPercentage >= 30 && p.totalPercentage <= 50 && p.skippedPercentage + 5 < p.incorrectPercentage, comment: "পড়াশোনায় আরও গুছানো পদ্ধতি দরকার। ভুল কমাতে আগে বেসিক ধারণা পরিষ্কার করা, তারপর অধ্যায়ভিত্তিক অনুশীলন ভালো হবে। মেন্টরের পরামর্শে পড়ার ধরন পরিবর্তন করলে উন্নতির সুযোগ আছে।" },
  { id: 7, category: "চর্চা ও আত্মবিশ্বাস বাড়ানোর সময়", check: (p) => p.totalPercentage >= 30 && p.totalPercentage <= 50 && p.skippedPercentage + 5 > p.incorrectPercentage, comment: "স্কিপ করা প্রশ্ন কিছুটা বেশি। নিজের প্রস্তুতির ওপর আত্মবিশ্বাস বাড়ালে স্কিপ করা প্রশ্নেও উত্তর করার চেষ্টা করতে পারবে। ছোট লক্ষ্য নিয়ে প্রতিদিন পড়া ও মেন্টরের সাথে আলোচনা করলে উন্নতি হবে।" },
];
function getInitialComment(pd) {
  const m = commentRules.find((r) => r.check(pd));
  return { ruleId: m ? m.id : null, category: m ? m.category : "মেন্টরের পরামর্শ প্রয়োজন", comment: m ? m.comment : "ফলাফলটি নির্দিষ্ট ক্যাটাগরিতে পড়ছে না। বিষয়ভিত্তিক ফলাফল দেখে মেন্টরের সাথে আলোচনা করে পরবর্তী পরিকল্পনা করা ভালো।" };
}
const sci = ["Physics", "Chemistry", "General Math", "Higher Math", "Biology", "BGS", "Physics 1st", "Physics 2nd", "Chemistry 1st", "Chemistry 2nd", "Biology 1st", "Biology 2nd", "Higher Math 1st", "Higher Math 2nd"];
const nonSci = ["Bangla 1st", "Bangla 2nd", "English 1st", "English 2nd", "Religion", "ICT"];
const mathS = ["Physics", "Chemistry", "General Math", "Higher Math", "Physics 1st", "Physics 2nd", "Chemistry 1st", "Chemistry 2nd", "Higher Math 1st", "Higher Math 2nd"];
const nonMathS = ["Bangla 1st", "Bangla 2nd", "English 1st", "English 2nd", "Religion", "ICT", "Biology", "BGS", "Biology 1st", "Biology 2nd"];
const norm = (n) => String(n || "").trim().toLowerCase().replace(/\s+/g, " ");
function byNames(subjects, names) { const a = names.map(norm); const out = {}; Object.entries(subjects || {}).forEach(([k, v]) => { if (a.includes(norm(k))) out[k] = v; }); return out; }
function partition(title, subjects) { const pd = calculatePercentages(subjects); return { title, ...pd, ...getInitialComment(pd) }; }
function sciCmp(s, ns) {
  const a = s.totalPercentage || 0, b = ns.totalPercentage || 0, dev = Number(Math.abs(a - b).toFixed(2));
  const weak = a < b ? "science" : b < a ? "nonScience" : "equal";
  if (dev < 15) return { deviation: dev, weakerPart: weak, category: "Science ও Non-Science কাছাকাছি", comment: "দুই অংশের পারফরম্যান্স কাছাকাছি, যা ভালো ভারসাম্যের লক্ষণ। যে অংশে সামান্য কম নম্বর, সেখানে একটু বেশি রিভিশন দিলে সামগ্রিক ফলাফল আরও সুন্দর হবে।" };
  if (dev <= 30) return weak === "science"
    ? { deviation: dev, weakerPart: weak, category: "Science-এ বেশি সময় দিলে উন্নতি হবে", comment: "Science অংশে তুলনামূলকভাবে আরও মনোযোগ দিলে ভালো উন্নতি সম্ভব। Physics, Chemistry, Math ও Biology বুঝে পড়া এবং নিয়মিত সমস্যা সমাধান করলে ফলাফল ভালো হবে।" }
    : { deviation: dev, weakerPart: weak, category: "Non-Science-এ রিভিশন বাড়ালে ভালো হবে", comment: "Non-Science অংশে আরও রিভিশন দরকার। Bangla, English, Religion ও ICT সহজ মনে হলেও নিয়মিত না পড়লে নম্বর কমে। প্রতিদিন অল্প সময় রিভিশন করলে উন্নতি হবে।" };
  return weak === "science"
    ? { deviation: dev, weakerPart: weak, category: "Science-এর বেসিক শক্ত করা দরকার", comment: "Science অংশে পার্থক্য বেশি। বেসিক ধারণা পরিষ্কার করা, সূত্র ও কনসেপ্ট বুঝে পড়া এবং মেন্টরের গাইডলাইন অনুযায়ী নিয়মিত অনুশীলন দরকার।" }
    : { deviation: dev, weakerPart: weak, category: "Non-Science-এ নিয়মিত পড়া দরকার", comment: "Non-Science অংশে পার্থক্য বেশি। এই বিষয়গুলোতে নিয়মিত পড়া, লেখা, মুখস্থ ও রিভিশন দরকার। প্রতিদিন নির্দিষ্ট সময় দিলে ফলাফল ভালো হবে।" };
}
function mathCmp(m, nm) {
  const a = m.totalPercentage || 0, b = nm.totalPercentage || 0, dev = Number(Math.abs(a - b).toFixed(2));
  const weak = a < b ? "math" : b < a ? "nonMath" : "equal";
  if (dev < 10) return { deviation: dev, weakerPart: weak, category: "Mathematical ও Non-Math ভারসাম্য ভালো", comment: "দুই অংশের পারফরম্যান্স কাছাকাছি, যা ভালো ভারসাম্যের ইঙ্গিত দেয়। নিয়মিত অনুশীলন ও রিভিশন বজায় রাখলে দুই অংশেই আরও ভালো ফলাফল সম্ভব।" };
  if (dev <= 30) return weak === "math"
    ? { deviation: dev, weakerPart: weak, category: "Mathematical-এ অনুশীলন বাড়ানো দরকার", comment: "Mathematical অংশে আরও অনুশীলন করলে ভালো উন্নতি হবে। Math, Physics ও Chemistry-এর সমস্যা নিয়মিত সমাধান করলে সমস্যার জায়গা বোঝা যাবে এবং নম্বর বাড়বে।" }
    : { deviation: dev, weakerPart: weak, category: "Non-Mathematical-এ রিভিশন দরকার", comment: "Non-Mathematical অংশে আরও রিভিশন দরকার। Bangla, English, Religion, ICT ও Biology নিয়মিত পড়া ও মনে রাখার অনুশীলন করলে ফলাফল ভালো হবে।" };
  return weak === "math"
    ? { deviation: dev, weakerPart: weak, category: "Mathematical-এর বেসিক শক্ত করা দরকার", comment: "Mathematical অংশে আরও মনোযোগ দরকার। নিয়মিত সমস্যা সমাধান, বেসিক ধারণা পরিষ্কার করা এবং মেন্টরের গাইডলাইন নিয়ে এগোলে ভালো উন্নতি সম্ভব।" }
    : { deviation: dev, weakerPart: weak, category: "Non-Mathematical-এ নিয়মিত রিভিশন দরকার", comment: "Non-Mathematical অংশে পার্থক্য বেশি। বোঝা, মুখস্থ, লেখা ও নিয়মিত রিভিশন গুরুত্বপূর্ণ। প্রতিদিন নির্দিষ্ট সময় পড়লে ফলাফল উন্নত করা সম্ভব।" };
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
  if (!valid.length) return { subjectBars: bars, averagePercentage: 0, level: "ডেটা পাওয়া যায়নি", comment: "পর্যাপ্ত তথ্য পাওয়া যায়নি।" };
  const pcts = valid.map((i) => i.totalPercentage).sort((a, b) => a - b);
  const mid = Math.floor(pcts.length / 2);
  const median = pcts.length % 2 === 0 ? (pcts[mid - 1] + pcts[mid]) / 2 : pcts[mid];
  const filtered = valid.filter((i) => Math.abs(i.totalPercentage - median) <= 25);
  const fin = filtered.length ? filtered : valid;
  const avg = Number((fin.reduce((s, i) => s + i.totalPercentage, 0) / fin.length).toFixed(2));
  const low = valid.filter((i) => i.totalPercentage < 55).length;
  const lowRatio = Number(((low / valid.length) * 100).toFixed(2));
  let level, comment;
  if (avg < 55 && lowRatio >= 60) { level = "নিয়মিত সংযোগ তৈরি করা দরকার"; comment = "বেশিরভাগ বিষয়ে ফলাফল কম। প্রতিদিন নির্দিষ্ট সময় পড়া, অধ্যায়ভিত্তিক ছোট লক্ষ্য ঠিক করা এবং মেন্টরের পর্যবেক্ষণে এগোলে ধীরে ধীরে ভালো উন্নতি সম্ভব।"; }
  else if (avg < 70) { level = "মাঝারি পর্যায়ের প্রস্তুতি"; comment = "ফলাফল মাঝারি পর্যায়ে আছে। বেশি সময়, নিয়মিত অনুশীলন এবং কম নম্বর পাওয়া বিষয়গুলোতে আলাদা ফোকাস দরকার।"; }
  else { level = "ভালো পথে আছে"; comment = "সামগ্রিকভাবে ভালো পথে আছে। অবস্থান ধরে রাখতে নিয়মিত অনুশীলন ও রিভিশন চালিয়ে যেতে হবে।"; }
  return { subjectBars: bars, averagePercentage: avg, medianPercentage: Number(median.toFixed(2)), lowSubjectCount: low, lowSubjectRatio: lowRatio, level, comment };
}
function generateStudentAnalysis(subjects) {
  const pd = calculatePercentages(subjects);
  const sciA = partition("Science", byNames(subjects, sci));
  const nsA = partition("Non-Science", byNames(subjects, nonSci));
  const mA = partition("Mathematical", byNames(subjects, mathS));
  const nmA = partition("Non-Mathematical", byNames(subjects, nonMathS));
  return { ...pd, ...getInitialComment(pd), subjectConsistency: consistency(subjects),
    partitions: { science: sciA, nonScience: nsA, comparison: sciCmp(sciA, nsA) },
    mathPartitions: { mathematical: mA, nonMathematical: nmA, comparison: mathCmp(mA, nmA) } };
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