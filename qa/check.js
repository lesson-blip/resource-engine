// Validates a unit file before building. Prints every question with its answer unless --quiet.
// usage: node qa/check.js units/<id>.json [--quiet] [--answers]
const fs = require("fs");
const path = require("path");
const file = process.argv[2];
const quiet = process.argv.includes("--quiet");
const showAnswers = process.argv.includes("--answers");
const U = JSON.parse(fs.readFileSync(file, "utf8"));
const IMG = path.join(__dirname, "..", "assets", "img");
const errs = [], warns = [], qa = [];
const E = (w, m) => errs.push(`${w}: ${m}`), Wn = (w, m) => warns.push(`${w}: ${m}`);
const KINDS = new Set(["fractionStrip", "fractionWall", "numberLine", "collection", "array", "barModel", "grid", "compass", "angle", "angleSet", "pvChart", "decimalGrid", "mab", "jug", "cubes", "money", "algorithm", "roundLine", "figure"]);
const TYPES = new Set(["reallife", "warmup", "definition", "rows", "visual", "worked", "examples", "talk", "hinge", "cfu", "activity", "levels", "discuss", "display"]);
const dash = /[—–]/;

function visual(v, w) {
  if (!v) return;
  if (!KINDS.has(v.kind)) return E(w, `unknown visual kind ${v.kind}`);
  if (v.kind === "numberLine") {
    if (!Array.isArray(v.labels) || v.labels.length !== v.ticks + 1) E(w, `numberLine labels ${v.labels && v.labels.length} != ticks+1 (${v.ticks + 1})`);
    (v.highlight || []).forEach(h => { if (h < 0 || h > v.ticks) E(w, `numberLine highlight ${h} out of range`); });
  }
  if (v.kind === "fractionStrip" && (v.shaded > v.parts || v.parts < 1)) E(w, "fractionStrip shaded > parts");
}
function text(s, w, max) {
  if (typeof s !== "string") return;
  if (dash.test(s)) Wn(w, `dash in "${s.slice(0, 50)}"`);
  if (max && s.length > max) Wn(w, `${s.length} chars (max ${max}): "${s.slice(0, 50)}"`);
}
function pics(list, w) { (list || []).forEach(p => { if (!fs.existsSync(path.join(IMG, p + ".png"))) Wn(w, `image ${p} not downloaded yet`); }); }
function item(it, w) {
  visual(it.visual, w); text(it.q, w);
  if (it.parts) it.parts.forEach((p, i) => { if (p.answer == null || p.answer === "") E(`${w}${"abcdef"[i]}`, "part has no answer"); qa.push([`${w}${"abcdef"[i]}`, `${it.q} / ${p.q}`, p.answer]); });
  else { if (it.answer == null || it.answer === "") E(w, "item has no answer"); qa.push([w, it.q || "(table)", it.answer]); }
}

for (const k of ["id", "title", "subtitle", "stage", "lessons", "assessment", "vocab", "outcomes"]) if (!U[k]) E("unit", `missing ${k}`);
(U.vocab || []).forEach((v, i) => { visual(v.visual, `vocab ${i + 1}`); text(v.means, `vocab ${v.word}`); });
(U.lessons || []).forEach(l => {
  const w = `L${l.n}`;
  const PH = path.join(__dirname, "..", "assets", "photos");
  const phs = [l.photo, ...((l.reallife && l.reallife.items) || []).map(x => x.photo)].filter(Boolean);
  phs.forEach(k => { if (!(U.photos || {})[k]) E(w, `photo ${k} not in unit.photos`); else if (!fs.existsSync(path.join(PH, k + ".jpg"))) Wn(w, `photo ${k} not downloaded (node src/photos.js fetch)`); });
  if (l.reallife) { text(l.reallife.question, w); l.reallife.items.forEach(x => text(x.caption, w, 110)); }
  text(l.title, w, 44); text(l.menu, w, 24); text(l.li, w, 140); (l.sc || []).forEach(s => text(s, w, 80)); pics(l.pics, w);
  if (!l.sc || l.sc.length < 2) E(w, "needs 2 or 3 success criteria");
  const types = l.slides.map(s => s.type);
  for (const need of ["hinge", "cfu", "activity", "levels", "discuss"]) if (!types.includes(need)) E(w, `no ${need} slide`);
  l.slides.forEach((s, i) => {
    const sw = `${w} slide ${i + 1} (${s.type})`;
    if (!TYPES.has(s.type)) E(sw, "unknown slide type");
    text(s.title, sw, 48); visual(s.visual, sw); pics(s.pics, sw);
    if (s.type === "hinge") {
      if (!Array.isArray(s.options) || s.options.length !== 4) E(sw, "hinge needs 4 options");
      if (!(s.answer >= 0 && s.answer < 4)) E(sw, "hinge answer index");
      if (!s.why || s.why.length !== 4) Wn(sw, "hinge should explain all 4 options");
      qa.push([sw, s.question, s.options && s.options[s.answer]]);
    }
    if (s.type === "cfu") { if (!s.answers || s.answers.length !== s.questions.length) E(sw, "cfu answers count"); s.questions.forEach((q, j) => qa.push([`${sw} q${j + 1}`, q, s.answers && s.answers[j]])); }
    if (s.type === "examples") [...(s.yes || []), ...(s.no || [])].forEach(x => visual(x.visual, sw));
    if (s.type === "levels") ["support", "core", "extend"].forEach(k => { if (!s[k]) E(sw, `levels missing ${k}`); text(s[k], sw, 140); });
    if (s.type === "warmup" && s.answers) s.items.forEach((q, j) => qa.push([`${sw} q${j + 1}`, q, s.answers[j]]));
    if (s.type === "worked") (s.steps || []).forEach(st => text(st.text, sw));
  });
  (l.printables || []).forEach(p => {
    const pw = `${w} ${p.id}`;
    if (p.kind === "worksheet") {
      if (!p.levels || p.levels.length !== 3) E(pw, "worksheet needs 3 levels");
      (p.levels || []).forEach(lv => { if (lv.teach) visual(lv.teach.visual, pw); lv.items.forEach((it, j) => item(it, `${pw} ${lv.level} ${j + 1}`)); });
    } else if (p.kind === "cards") (p.cards || []).forEach(c => visual(c.visual, pw));
    else (p.items || []).forEach((it, j) => item(it, `${pw} ${j + 1}`));
  });
  (l.exitTicket || []).forEach((e, j) => { visual(e.visual, `${w} exit`); qa.push([`${w} exit ${j + 1}`, e.q, e.answer]); });
});
const A = U.assessment || {};
(A.pretest || []).forEach((it, j) => item(it, `pretest ${j + 1}`));
(A.sections || []).forEach((s, si) => s.items.forEach((it, j) => item(it, `test ${si + 1}.${j + 1}`)));

if (!quiet || showAnswers) for (const [w, q, a] of qa) console.log(`${w} | ${q} => ${a}`);
console.log(`${path.basename(file)}: ${U.lessons.length} lessons, ${qa.length} answered questions, ${errs.length} errors, ${warns.length} warnings`);
warns.slice(0, 30).forEach(m => console.log("  warn " + m));
errs.forEach(m => console.log("  ERROR " + m));
if (errs.length) process.exit(1);
