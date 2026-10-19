// Builds every printable for one unit as A4 PDFs.
// usage: node src/printables.js units/<id>.json <outdir>
// Writes: Worksheets (colour + black and white), Answer key (same pages with answers written in),
// Assessment (pre-test, test, self-check, rubric), Flip book, Word wall, Posters.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const V = require("./visuals.js");
const K = require("./kit.js");

const UNIT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = path.resolve(process.argv[3] || "dist");
fs.mkdirSync(OUT, { recursive: true });
const T = K.THEMES[process.argv[4] || "ocean"];
V.setTheme(T);
const C = Object.fromEntries(Object.entries(T.roles).map(([k, v]) => [k, "#" + v]));
const TI = Object.fromEntries(Object.entries(T.tints).map(([k, v]) => [k, "#" + v]));
const UC = UNIT.colour || "teal";
const FILE = f => "file://" + f;
const IMG = k => FILE(path.join(K.IMGDIR, k + ".png"));
const FONTS = path.join(K.ASSETS, "fonts");
const esc = s => K.clean(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fr = s => esc(s).replace(/(^|[^\d/])(\d+)\/(\d+)(?![\d/])/g, '$1<span class="frac"><span>$2</span><span>$3</span></span>');
const LVS = K.levels(UNIT);
const LEVEL = { Support: [LVS.names[0], 1, "mint"], Core: [LVS.names[1], 2, "sky"], Extend: [LVS.names[2], 3, "indigo"] };
const peppers = n => LVS.marker === "chillies" ? `<span class="pep">${`<img src="${IMG("hot_pepper")}">`.repeat(n)}</span>` : `<span class="pep dots">${"<i></i>".repeat(n)}</span>`;

const WIDE = v => v && (v.kind === "numberLine" || v.kind === "fractionWall" || v.kind === "barModel");
async function vis(v, maxH = 30, cls = "", wideW = 150) {
  if (!v) return "";
  const r = await V.render(v);
  const st = cls.includes("pw") ? "width:100%;max-height:none" : WIDE(v) && !cls.includes("free") ? `width:min(100%, ${wideW}mm)` : `max-height:${maxH}mm`;
  return `<div class="vis ${cls}"><img src="${FILE(r.path)}" style="${st}"></div>`;
}

// ---------- building blocks ----------
function header({ title, sub, level, pic, name = true }) {
  const lv = level && LEVEL[level];
  return `<header>
    <div class="ttl">${pic ? `<img class="hpic" src="${IMG(pic)}">` : ""}<div><h1>${fr(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}</div></div>
    <div class="right">
      ${lv ? `<div class="lvl b-${lv[2]}">${peppers(lv[1])}<span>${lv[0]}</span></div>` : ""}
      ${name ? `<div class="namef"><b>Name</b><span class="l1"></span></div>` : ""}
    </div>
  </header>`;
}
const ansSpan = (a, key) => key && a ? `<span class="ans">${fr(a)}</span>` : "";
const lines = (n, ans, key) => Array.from({ length: n }, (_, i) => `<div class="ln">${i === 0 ? ansSpan(ans, key) : ""}</div>`).join("");

async function item(it, n, key) {
  let body = "";
  if (it.table) {
    const t = it.table;
    body = `${it.q ? `<p class="q">${fr(it.q)}</p>` : ""}<table class="tbl"><tr>${t.headers.map(h => `<th>${fr(h)}</th>`).join("")}</tr>${t.rows.map(r => `<tr>${r.map(c => `<td>${c ? fr(c) : "&nbsp;"}</td>`).join("")}</tr>`).join("")}</table>${key && it.answer ? `<div class="keynote">${ansSpan(it.answer, key)}</div>` : ""}`;
  } else {
    body = `<p class="q">${fr(it.q || "")}</p>${await vis(it.visual)}`;
    if (it.parts && it.parts.length) {
      const short = it.parts.every(p => K.clean(p.q).length <= 30);
      body += `<div class="parts ${short ? "two" : ""}">${it.parts.map((p, i) => `<div class="part"><span class="pl">${"abcdef"[i]}</span><span class="pq">${fr(p.q)}</span><span class="pa">${ansSpan(p.answer, key)}</span></div>`).join("")}</div>`;
    } else {
      const nl = it.lines == null ? 1 : it.lines;
      body += nl ? lines(nl, it.answer, key) : (key && it.answer ? `<div class="keynote">${ansSpan(it.answer, key)}</div>` : "");
    }
  }
  return `<div class="item"><div class="qn">${n}</div><div class="qb">${body}</div></div>`;
}
const selfCheck = () => `<div class="self"><b>How did I go?</b><span><i class="cb"></i>Not yet</span><span><i class="cb"></i>Kind of</span><span><i class="cb"></i>Got it</span></div>`;

async function worksheetPages(p, ls, key) {
  let h = "";
  for (const lv of p.levels) {
    let items = ""; let i = 1;
    for (const it of lv.items) items += await item(it, i++, key);
    const tv = lv.teach && lv.teach.visual;
    const stack = tv && (tv.kind === "fractionWall" || (tv.kind === "numberLine" && tv.ticks > 6));
    const teach = lv.teach ? `<div class="teach ${stack ? "stack" : ""}"><div class="tt">${fr(lv.teach.text)}</div>${await vis(tv, 26, "", stack ? 130 : 70)}</div>` : "";
    h += `<section class="page" data-foot="Lesson ${ls.n} · ${esc(p.title)}">${header({ title: p.title, sub: `Lesson ${ls.n} · ${UNIT.title}`, level: lv.level, pic: (ls.pics || [])[0] })}${teach}<div class="items">${items}</div>${selfCheck()}</section>`;
  }
  return h;
}

async function gamePage(p, ls, key) {
  let items = ""; let i = 1;
  for (const it of p.items || []) items += await item(it, i++, key);
  return `<section class="page" data-foot="Lesson ${ls.n} · ${esc(p.title)}">${header({ title: p.title, sub: `Lesson ${ls.n} · Game · ${esc(p.players || "")}`, pic: "game_die" })}
    <div class="rules"><div class="need"><b>You need</b>${(p.need || []).map(n => `<span class="chip">${esc(n)}</span>`).join("")}</div>
    <ol>${(p.rules || []).map(r => `<li>${fr(r)}</li>`).join("")}</ol></div><div class="items">${items}</div></section>`;
}

async function cardsPage(p, ls, key) {
  const hasVis = p.cards.some(c => c.visual);
  let cs = "";
  for (const c of p.cards) cs += `<div class="card ${hasVis ? "tall" : ""}">${c.visual ? await vis(c.visual, 28) : ""}<div class="ct">${fr(c.text || "")}</div></div>`;
  return `<section class="page multi" data-foot="Lesson ${ls.n} · ${esc(p.title)}">${header({ title: p.title, sub: `Lesson ${ls.n} · Cut out the cards`, pic: "scissors", name: false })}
    ${p.instructions ? `<p class="intro">${fr(p.instructions)}</p>` : ""}<div class="cards ${hasVis ? "c3" : "c4"}">${cs}</div></section>`;
}

async function printable(p, ls, key) {
  if (p.kind === "worksheet") return worksheetPages(p, ls, key);
  if (p.kind === "game") return gamePage(p, ls, key);
  if (p.kind === "cards") return key ? "" : cardsPage(p, ls, key);
  if (p.kind === "sheet") return gamePage(Object.assign({ rules: p.instructions ? [p.instructions] : [] }, p), ls, key);
  return "";
}

// ---------- documents ----------
function contentsPage() {
  const rows = UNIT.lessons.map(l => `<tr><td class="n">${l.n}</td><td>${esc(l.title)}</td><td>${["Support", "Core", "Extend"].map(k => `<span class="lv">${peppers(LEVEL[k][1])}<i class="cb"></i></span>`).join("")}</td><td class="date"></td></tr>`).join("");
  return `<section class="page" data-foot="My progress">${header({ title: "My progress", sub: `${UNIT.title} · ${UNIT.subtitle}`, pic: "check_mark_button" })}
    <p class="intro">Tick the level you finished for each lesson. Write the date. Try a spicier level next time if it felt easy.</p>
    <table class="prog"><tr><th>Lesson</th><th>What I learnt</th><th>Levels I finished</th><th>Date</th></tr>${rows}</table></section>`;
}

async function exitSlips() {
  let h = "";
  for (const ls of UNIT.lessons) {
    if (!ls.exitTicket || !ls.exitTicket.length) continue;
    let slip = "";
    let i = 1;
    for (const e of ls.exitTicket) slip += `<div class="eq"><span class="qn">${i++}</span><div class="qb"><p class="q">${fr(e.q)}</p>${await vis(e.visual, 16, "", 95)}<div class="ln"></div>${e.visual ? "" : '<div class="ln"></div>'}</div></div>`;
    const one = `<div class="slip"><div class="sh"><b>Exit ticket · Lesson ${ls.n}</b><span>Name <i class="l1"></i></span></div>${slip}</div>`;
    h += `<section class="page multi slips" data-foot="Exit tickets · Lesson ${ls.n}">${one.repeat(3)}</section>`;
  }
  return h;
}

function templates() {
  const T = UNIT.templates || [];
  let h = "";
  if (T.includes("blankStrips")) h += `<section class="page" data-foot="Paper strips">${header({ title: "Paper strips", sub: "Print on card if you can. Every strip is the same length (18 cm), so they are equal wholes.", pic: "scissors", name: false })}${'<div class="bstrip"></div>'.repeat(7)}</section>`;
  if (T.includes("squaredStrips")) {
    const row = n => `<div class="sqs"><span class="sqn">${n} squares</span><div class="sq" style="grid-template-columns:repeat(${n}, 9mm)">${"<i></i>".repeat(n)}</div></div>`;
    h += `<section class="page" data-foot="Squared strips">${header({ title: "Squared strips", sub: "Cut out a strip. Count squares to check your thirds and fifths.", pic: "straight_ruler", name: false })}${[15, 15, 10, 10, 12, 12, 20].map(row).join("")}</section>`;
  }
  return h;
}

async function worksheets(key) {
  let h = key ? "" : contentsPage() + templates();
  for (const ls of UNIT.lessons) for (const p of ls.printables || []) h += await printable(p, ls, key);
  return h;
}

async function assessment(key) {
  const A = UNIT.assessment;
  let h = "";
  if (A.pretest) {
    let items = ""; let i = 1;
    for (const it of A.pretest) items += await item(it, i++, key);
    h += `<section class="page" data-foot="Pre-test">${header({ title: "What do I know already?", sub: `Pre-test · ${UNIT.title}`, pic: "thinking_face" })}<p class="intro">Have a go. It is fine if you do not know yet. This helps your teacher plan.</p><div class="items">${items}</div></section>`;
  }
  let body = ""; let i = 1;
  for (const s of A.sections) {
    let items = "";
    for (const it of s.items) items += await item(it, i++, key);
    body += `<h2>${fr(s.heading)}</h2><div class="items">${items}</div>`;
  }
  const sc = (A.selfCheck || []).map(t => `<tr><td>${fr(t)}</td><td><i class="cb"></i></td><td><i class="cb"></i></td><td><i class="cb"></i></td></tr>`).join("");
  h += `<section class="page multi" data-foot="${esc(A.title)}">${header({ title: A.title, sub: `${UNIT.title} · ${UNIT.stage}`, pic: "check_mark_button" })}<p class="intro">Show what you know. Work carefully and check your answers.</p>${body}
    <h2>How did I go?</h2><table class="sc"><tr><th></th><th>Not yet</th><th>Kind of</th><th>Got it</th></tr>${sc}</table></section>`;
  if (key && A.rubric) {
    h += `<section class="page" data-foot="Marking rubric">${header({ title: "Marking rubric", sub: `${esc(A.title)} · teacher copy`, name: false })}
      <table class="rub"><tr><th>Criteria</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr>${A.rubric.map(r => `<tr><td><b>${fr(r.criteria)}</b></td>${["A", "B", "C", "D", "E"].map(g => `<td>${fr(r[g])}</td>`).join("")}</tr>`).join("")}</table>
      <p class="intro small">Grades use the NSW Common Grade Scale. Outcomes: ${UNIT.outcomes.map(o => o.code).join(", ")}.</p></section>`;
  }
  return h;
}

async function flipbook() {
  const S = UNIT.signature;
  let h = `<section class="page" data-foot="${esc(S.name)}">${header({ title: S.name, sub: S.what, pic: "open_book", name: false })}
    <div class="howto"><b>How to make it</b><ol><li>Print the strips. Cut along the dashed lines.</li><li>Stack the strips so each one sticks out a little lower than the one above.</li><li>Staple along the top. Each lesson, open your flip book and fill in the next strip.</li></ol></div>`;
  const panels = [{ title: S.name, prompt: "Name:", cover: true }].concat(S.panels);
  let k = 0;
  for (const p of panels) {
    if (k > 0 && k % 3 === 0) h += `</section><section class="page" data-foot="${esc(S.name)}">`;
    h += `<div class="strip"><div class="tab b-${["teal", "sky", "mint", "indigo", "lav"][k % 5]}">${k === 0 ? "Cover" : k}</div><div class="sb"><h3>${fr(p.title)}</h3><p>${fr(p.prompt)}</p>${p.cover ? "" : `<div class="sgrid">${await vis(p.visual, 22)}<div class="slines"><div class="ln"></div><div class="ln"></div></div></div>`}</div></div>`;
    k++;
  }
  return h + "</section>";
}

async function wordwall() {
  let h = "";
  const vs = UNIT.vocab;
  for (let i = 0; i < vs.length; i += 2) {
    h += `<section class="page ww" data-foot="Word wall">`;
    for (const [j, v] of vs.slice(i, i + 2).entries()) {
      h += `<div class="wcard b-${["teal", "sky", "mint", "indigo", "lav"][(i + j) % 5]}-l"><div class="word">${fr(v.word)}</div><div class="wrow"><div class="means">${fr(v.means)}</div>${v.visual ? await vis(v.visual, 45) : v.pic && K.hasImg(v.pic) ? `<img class="wpic" src="${IMG(v.pic)}">` : ""}</div></div>`;
    }
    h += `</section>`;
  }
  return h;
}

async function posters() {
  const big = [];
  for (const ls of UNIT.lessons) {
    const disp = ls.slides.find(s => s.type === "definition" && s.visual) || ls.slides.find(s => (s.type === "visual" || s.type === "worked") && s.visual);
    big.push({ ls, disp });
  }
  let h = `<section class="page poster" data-foot="Poster">${header({ title: "Choose your challenge", sub: "Every lesson has three levels. You can change level at any time.", pic: LVS.marker === "chillies" ? "hot_pepper" : "bullseye", name: false })}
    ${[0, 1, 2].map(i => [LVS.names[i], i + 1, ["mint", "sky", "indigo"][i], LVS.blurbs[i]]).map(([n, k, c, t]) => `<div class="pfact b-${c}-l"><div class="pfh">${peppers(k)}<b>${n}</b></div><p>${t}</p></div>`).join("")}
    <div class="pfact b-lav-l"><div class="pfh"><b>Stuck?</b></div><p>Read it again. Draw it. Use materials. Try a smaller number. Ask a partner.</p></div></section>`;
  h += `<section class="page poster" data-foot="Poster">${header({ title: "Watch out for these", sub: UNIT.title, pic: "warning", name: false })}
    ${UNIT.misconceptions.map((m, i) => `<div class="pfact b-${["teal", "sky", "mint", "indigo", "lav"][i % 5]}-l"><p class="think">Some people think: ${fr(m.think)}</p><p><b>Remember:</b> ${fr(m.fix)}</p></div>`).join("")}</section>`;
  for (const { ls, disp } of big) {
    if (!disp) continue;
    const rows = disp.type === "definition" ? [{ label: disp.term, text: disp.means }] : (disp.rows || disp.steps || []).slice(0, 3);
    const main = ls.poster ? `<div class="pfact b-${UC}-l big"><p>${fr(ls.poster)}</p></div>` : rows.map((r, i) => `<div class="pfact b-${["teal", "sky", "indigo"][i % 3]}-l"><p><b>${fr(r.label || "")}${r.label ? ": " : ""}</b>${fr(r.text)}</p></div>`).join("");
    h += `<section class="page poster" data-foot="Poster · Lesson ${ls.n}">${header({ title: ls.title, sub: `Lesson ${ls.n}`, pic: (ls.pics || [])[0], name: false })}
      <div class="pvis">${await vis(disp.visual, 110, "pw")}</div>${main}
      <div class="pfact b-mint-l"><p><b>I can</b></p>${ls.sc.map(t => `<p>${fr(t.replace(/^I can /, "• "))}</p>`).join("")}</div></section>`;
  }
  return h;
}

// ---------- css ----------
const css = `
@font-face { font-family: NS; src: url("${FILE(path.join(FONTS, "NunitoSans-Regular.ttf"))}"); font-weight: 400; }
@font-face { font-family: NS; src: url("${FILE(path.join(FONTS, "NunitoSans-Bold.ttf"))}"); font-weight: 700; }
@font-face { font-family: HW; src: url("${FILE(path.join(FONTS, "EduNSWACTFoundation.ttf"))}"); }
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: NS, sans-serif; color: #${T.text}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; padding: 11mm 12mm 14mm; position: relative; page-break-after: always; display: flex; flex-direction: column; gap: 3.2mm; }
.page.fixed { height: 297mm; overflow: hidden; }
.inner { display: flex; flex-direction: column; gap: 3.2mm; flex: 1; }
.foot { position: absolute; left: 12mm; right: 12mm; bottom: 5mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: #8A97A8; }
header { display: flex; justify-content: space-between; align-items: center; gap: 5mm; padding-bottom: 2.5mm; border-bottom: 1.6px solid ${C[UC]}; }
.ttl { display: flex; align-items: center; gap: 3mm; }
.hpic { width: 12mm; }
h1 { font-size: 19pt; line-height: 1.1; }
.sub { font-size: 9pt; color: #${T.muted}; margin-top: 0.8mm; }
.right { display: flex; flex-direction: column; align-items: flex-end; gap: 2mm; flex: none; }
.lvl { display: flex; align-items: center; gap: 1.5mm; color: #fff; font-weight: 700; font-size: 10.5pt; padding: 0.8mm 3.5mm; border-radius: 99px; }
.pep img { width: 5mm; vertical-align: middle; }
.pep.dots { display: inline-flex; gap: 0.35em; align-items: center; } .pep.dots i { width: 0.6em; height: 0.6em; border-radius: 50%; background: currentColor; display: inline-block; }
.namef { display: flex; align-items: flex-end; gap: 2mm; font-size: 10pt; width: 64mm; }
.l1 { flex: 1; border-bottom: 1.3px solid #9FB1C5; height: 6mm; }
.b-teal { background: ${C.teal}; } .b-sky { background: ${C.sky}; } .b-mint { background: ${C.mint}; } .b-indigo { background: ${C.indigo}; } .b-lav { background: ${C.lav}; }
.b-teal-l { background: ${TI.teal}; border-color: ${C.teal}; } .b-sky-l { background: ${TI.sky}; border-color: ${C.sky}; } .b-mint-l { background: ${TI.mint}; border-color: ${C.mint}; } .b-indigo-l { background: ${TI.indigo}; border-color: ${C.indigo}; } .b-lav-l { background: ${TI.lav}; border-color: ${C.lav}; }
.teach { display: flex; gap: 4mm; align-items: center; background: ${TI[UC]}; border-radius: 4mm; padding: 3mm 4.5mm; border: 1.4px solid ${C[UC]}; }
.teach .tt { flex: 1; font-size: 11.5pt; line-height: 1.4; }
.teach .vis { flex: none; max-width: 70mm; }
.intro { font-size: 11pt; background: #fff; border: 1.4px solid #D6E0EA; border-radius: 4mm; padding: 2.5mm 4mm; }
.intro.small { font-size: 9pt; }
h2 { font-size: 13pt; color: ${C[UC]}; margin-top: 2mm; }
.items { display: flex; flex-direction: column; }
.item { display: flex; gap: 3.5mm; padding: 3mm 0 3.5mm; border-bottom: 1.4px dotted #B8C4D2; break-inside: avoid; }
.item:last-child { border-bottom: none; }
.qn { width: 7.5mm; height: 7.5mm; border-radius: 99px; background: ${C[UC]}; color: #fff; font-weight: 700; font-size: 10.5pt; display: flex; align-items: center; justify-content: center; flex: none; }
.qb { flex: 1; display: flex; flex-direction: column; gap: 2mm; }
.q { font-size: 12pt; line-height: 1.4; font-weight: 700; }
.vis { display: flex; justify-content: flex-start; }
.vis img { max-width: min(100%, 125mm); }
.ln { border-bottom: 1.3px solid #9FB1C5; height: 10mm; position: relative; }
.parts { display: grid; grid-template-columns: 1fr; gap: 1.5mm 6mm; }
.parts.two { grid-template-columns: 1fr 1fr; }
.part { display: flex; align-items: flex-end; gap: 2mm; font-size: 11.5pt; min-height: 9mm; }
.pl { width: 5.5mm; height: 5.5mm; border-radius: 99px; border: 1.3px solid ${C[UC]}; color: ${C[UC]}; font-size: 9pt; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none; margin-bottom: 1mm; }
.pq { padding-bottom: 1mm; }
.pa { flex: 1; min-width: 22mm; border-bottom: 1.3px solid #9FB1C5; height: 8mm; position: relative; }
.ans { font-family: HW, NS; color: #3A6EA5; font-size: 13.5pt; line-height: 1.15; position: absolute; left: 2mm; right: 0; bottom: 0.6mm; }
.keynote { position: relative; height: 8mm; }
.tbl { border-collapse: collapse; width: 100%; font-size: 11pt; }
.tbl th { background: ${TI[UC]}; padding: 1.8mm; border: 1.2px solid #9FB1C5; }
.tbl td { border: 1.2px solid #9FB1C5; height: 11mm; text-align: center; }
.frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1; font-size: 0.82em; margin: 0 0.4mm; }
.frac span:first-child { border-bottom: 1.2px solid currentColor; padding: 0 0.5mm 0.3mm; }
.frac span:last-child { padding-top: 0.3mm; }
.self { margin-top: auto; display: flex; align-items: center; gap: 5mm; font-size: 10pt; background: #F3F6FA; border-radius: 3mm; padding: 2mm 4mm; }
.self span { display: flex; align-items: center; gap: 1.5mm; }
.cb { display: inline-block; width: 4.5mm; height: 4.5mm; border: 1.4px solid #5B6B7F; border-radius: 1.2mm; }
.rules { background: ${TI.lav}; border-radius: 4mm; padding: 3mm 5mm; font-size: 11.5pt; }
.rules ol { padding-left: 6mm; line-height: 1.5; margin-top: 1.5mm; }
.need { display: flex; flex-wrap: wrap; gap: 2mm; align-items: center; }
.chip { background: #fff; border-radius: 99px; padding: 0.5mm 3mm; font-size: 10pt; font-weight: 700; }
.cards { display: flex; flex-wrap: wrap; }
.cards.c4 .card { width: 25%; } .cards.c3 .card { width: 33.333%; }
.card { border: 1.4px dashed #9FB1C5; min-height: 30mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5mm; padding: 2.5mm; text-align: center; break-inside: avoid; }
.card.tall { min-height: 50mm; }
.teach.stack { flex-direction: column; align-items: stretch; } .teach.stack .vis { max-width: none; justify-content: center; }
.slips { gap: 0; padding-top: 8mm; }
.slip { border: 1.6px dashed #9FB1C5; height: 86mm; overflow: hidden; padding: 3mm 5mm; display: flex; flex-direction: column; gap: 1.5mm; break-inside: avoid; }
.sh { display: flex; justify-content: space-between; align-items: center; font-size: 11pt; color: ${C[UC]}; }
.sh span { display: flex; gap: 2mm; align-items: flex-end; color: #333; } .sh .l1 { width: 50mm; display: inline-block; }
.eq { display: flex; gap: 3mm; } .eq .q { font-size: 11pt; } .eq .ln { height: 11mm; } .eq .ln + .ln { margin-top: 0; }
.bstrip { height: 24mm; width: 180mm; border: 1.6px dashed #7A8BA0; border-radius: 1mm; align-self: center; }
.sqs { display: flex; flex-direction: column; gap: 1mm; } .sqn { font-size: 9pt; color: #5B6B7F; }
.sq { display: grid; grid-auto-rows: 14mm; border: 1.6px solid #333; width: max-content; } .sq i { border-right: 1px solid #555; } .sq i:last-child { border-right: none; }
.card .vis { justify-content: center; }
.ct { font-size: 15pt; font-weight: 700; }
.prog { width: 100%; border-collapse: collapse; font-size: 11pt; }
.prog th { background: ${C[UC]}; color: #fff; padding: 2mm; text-align: left; }
.prog td { border-bottom: 1.2px solid #D6E0EA; padding: 2.4mm 2mm; }
.prog td.n { font-weight: 700; color: ${C[UC]}; width: 10mm; }
.prog td.date { width: 26mm; }
.prog .lv { display: inline-flex; align-items: center; gap: 1mm; margin-right: 3mm; }
.prog .pep img { width: 3.6mm; }
.sc { width: 100%; border-collapse: collapse; font-size: 11pt; }
.sc th, .sc td { border-bottom: 1.2px solid #D6E0EA; padding: 2mm; text-align: center; }
.sc td:first-child { text-align: left; }
.rub { border-collapse: collapse; width: 100%; font-size: 8.8pt; }
.rub th { background: ${C[UC]}; color: #fff; padding: 1.8mm; }
.rub td { border: 1px solid #C9D4E0; padding: 1.8mm; vertical-align: top; }
.howto { background: ${TI.sky}; border-radius: 4mm; padding: 3mm 5mm; font-size: 11pt; }
.howto ol { padding-left: 6mm; line-height: 1.5; }
.strip { display: flex; border: 1.6px dashed #9FB1C5; border-radius: 3mm; min-height: 74mm; overflow: hidden; }
.tab { writing-mode: vertical-rl; transform: rotate(180deg); color: #fff; font-weight: 700; font-size: 12pt; padding: 3mm 2mm; text-align: center; }
.sb { flex: 1; padding: 3mm 5mm; display: flex; flex-direction: column; gap: 2mm; }
.sb h3 { font-size: 15pt; } .sb p { font-size: 11pt; }
.sgrid { display: flex; gap: 5mm; align-items: center; flex: 1; }
.sgrid .vis { max-width: 80mm; } .slines { flex: 1; }
.ww { justify-content: space-around; }
.wcard { border: 2px solid; border-radius: 6mm; padding: 8mm 10mm; height: 128mm; display: flex; flex-direction: column; gap: 5mm; }
.word { font-size: 44pt; font-weight: 700; }
.wrow { display: flex; flex-direction: column; gap: 6mm; align-items: flex-start; flex: 1; }
.means { font-size: 18pt; line-height: 1.4; }
.wpic { width: 40mm; }
.poster h1 { font-size: 30pt; } .poster .hpic { width: 18mm; } .poster .sub { font-size: 12pt; }
.pfact { border-left: 3mm solid; border-radius: 4mm; padding: 4mm 6mm; font-size: 15pt; line-height: 1.4; }
.pfact.big { font-size: 24pt; }
.poster .pfact { font-size: 21pt; } .poster .pfact.big { font-size: 26pt; } .poster .think { font-size: 14pt; }
.poster .inner { justify-content: space-between; } .poster .pvis { flex: 1; align-items: center; } .poster .pvis .vis { width: 100%; }
.pfh { display: flex; align-items: center; gap: 3mm; font-size: 18pt; margin-bottom: 1mm; } .pfh .pep img { width: 8mm; }
.think { color: #${T.muted}; font-size: 13pt; }
.pvis { display: flex; justify-content: center; padding: 4mm 0; } .pvis .vis { justify-content: center; } .pvis .vis img, .wcard .vis img { max-width: 100%; }
/* black and white */
.bw header { border-color: #555; }
.bw .b-teal, .bw .b-sky, .bw .b-mint, .bw .b-indigo, .bw .b-lav, .bw .qn, .bw .prog th, .bw .rub th { background: #fff !important; color: #222 !important; border: 1.4px solid #333; }
.bw .teach, .bw .rules, .bw .howto, .bw [class*="-l"] { background: #fff !important; border-color: #777 !important; }
.bw img { filter: grayscale(1); }
.bw .self, .bw .tbl th { background: #fff; }
`;

// ---------- render ----------
async function render(browser, name, body, cls = "") {
  const f = path.join(OUT, `_${name}.html`);
  fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body class="${cls}">${body}</body></html>`);
  const pg = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await pg.goto(FILE(f)); await pg.waitForTimeout(500);
  const report = await pg.evaluate(() => {
    const LIM = 1122, bad = [];
    document.querySelectorAll(".page").forEach((p, i) => {
      if (p.classList.contains("multi")) return;
      p.classList.add("fixed");
      const inner = document.createElement("div"); inner.className = "inner";
      while (p.firstChild) inner.appendChild(p.firstChild);
      p.appendChild(inner);
      let z = 1;
      while (p.scrollHeight > p.clientHeight + 1 && z > 0.72) { z -= 0.02; inner.style.zoom = z; }
      if (p.scrollHeight > p.clientHeight + 1) bad.push(((p.querySelector("h1") || p.querySelector(".word") || {}).textContent) + " (" + p.scrollHeight + ")");
      else if (z < 0.86) bad.push("small:" + (p.querySelector("h1") || p.querySelector(".word") || {}).textContent + " zoom " + z.toFixed(2));
    });
    return bad;
  });
  // page numbers
  const n = await pg.evaluate(() => { const ps = document.querySelectorAll(".page"); ps.forEach((p, i) => { const d = document.createElement("div"); d.className = "foot"; d.innerHTML = `<span>${p.dataset.foot || ""}</span><span>${i + 1}</span>`; p.appendChild(d); }); return ps.length; });
  await pg.pdf({ path: path.join(OUT, name + ".pdf"), width: "210mm", height: "297mm", printBackground: true });
  await pg.close(); fs.unlinkSync(f);
  console.log(`  ${name}.pdf  ${n} sections${report.length ? "  CHECK: " + report.join(" | ") : ""}`);
}

(async () => {
  const b = await K.browser();
  const t = UNIT.title.replace(/[^A-Za-z0-9]+/g, "_");
  const ws = await worksheets(false);
  await render(b, `${t}_Worksheets_Colour`, ws);
  await render(b, `${t}_Worksheets_BW`, ws, "bw");
  await render(b, `${t}_Answer_Key`, (await worksheets(true)) + (await assessment(true)), "bw");
  await render(b, `${t}_Assessment`, await assessment(false), "bw");
  await render(b, `${t}_Flip_Book`, await flipbook());
  await render(b, `${t}_Word_Wall`, await wordwall());
  await render(b, `${t}_Posters`, await posters());
  await render(b, `${t}_Exit_Tickets`, await exitSlips());
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
