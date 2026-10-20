// Builds the teaching slide deck (PowerPoint, opens in Google Slides) for one unit.
// usage: node src/deck.js units/<id>.json <out.pptx> [theme]
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const K = require("./kit.js");
const V = require("./visuals.js");

const UNIT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];
const THEME_KEY = process.argv[4] || "ocean";
if (!K.THEMES[THEME_KEY]) { console.error("unknown theme " + THEME_KEY + ". Use one of: " + K.THEME_KEYS.join(", ")); process.exit(1); }
const T = K.THEMES[THEME_KEY];
V.setTheme(T);
for (const [r, c] of Object.entries(T.roles)) if (K.contrast("#FFFFFF", "#" + c) < 3) console.warn(`CONTRAST theme ${THEME_KEY} role ${r} #${c} is too light for white text`);
const COL = Object.assign({ navy: T.text, muted: T.muted, white: "FFFFFF" }, T.roles);
const TINT = T.tints;
const UC = UNIT.colour || "teal";
const PART = process.argv[5] || "";                       // "A" builds the Component A (skills) deck of an English unit
const ENGLISH = UNIT.subject === "english";
const LESSONS = PART === "A" ? (UNIT.skills || []) : UNIT.lessons;
const LTAG = PART === "A" ? "Skill" : "Lesson";
const lessonName = ls => `${LTAG} ${ls.n}`;
const LVS = K.levels(UNIT);
const RES = K.resources(UNIT);
const PHASE = { lessonTitle: "Beginning the lesson", lisc: "Beginning the lesson", warmup: "Beginning the lesson", reallife: "Beginning the lesson", reveal: "Beginning the lesson", discuss: "Concluding the lesson", exit: "Concluding the lesson" };
function phaseOf(ctx) { if (!ctx || !ctx.ls) return ""; if (PHASE[ctx.kind]) return PHASE[ctx.kind]; if (ctx.s) return PHASE[ctx.s.type] || "Core lesson"; return ""; }
function resTag(ctx) { if (!ctx || !ctx.ls || !ctx.s || !["activity", "levels"].includes(ctx.s.type)) return ""; const ns = (ctx.ls.printables || []).map(p => RES[p.id]).filter(Boolean); return ns.length ? (ns.length === 1 ? `Resource ${ns[0]}` : `Resources ${ns.slice(0, -1).join(", ")} and ${ns[ns.length - 1]}`) : ""; }
// level marker: 1 to 3 dots (or chillies), centred in a box of width w starting at x
function marker(slide, n, c, x, y, w, size) {
  const g = size * 0.35, tot = n * size + (n - 1) * g, x0 = x + (w - tot) / 2;
  for (let k = 0; k < n; k++) {
    if (LVS.marker === "chillies") slide.addImage({ path: K.img("hot_pepper"), x: x0 + k * (size + g), y, w: size, h: size });
    else slide.addShape("ellipse", { x: x0 + k * (size + g), y, w: size, h: size, fill: { color: COL[c] }, line: { color: COL[c], width: 0 } });
  }
}

const W = 13.333, M = 0.5, TOP = 1.45, BOTTOM = 6.7;
let RIGHT = W - M;
let FIT_WARN = 0;
const warn = m => { FIT_WARN++; console.warn("FIT", m); };

// ---------- text boxes (always rounded shapes, never plain text boxes) ----------
function neededH(text, w, o) {
  const mt = Array.isArray(o.margin) ? o.margin : [o.margin, o.margin, o.margin, o.margin];
  const mh = (mt[1] + mt[3]) / 72 + 0.06, mv = (mt[0] + mt[2]) / 72;
  let paras = [];
  if (typeof text === "string") paras = text.split("\n").map(t => ({ t, pt: o.fontSize, b: !!o.bold }));
  else { let cur = { t: "", pt: 0, b: false }; text.forEach(r => { const ro = r.options || {}; cur.t += r.text; cur.pt = Math.max(cur.pt, ro.fontSize || o.fontSize); cur.b = cur.b || !!(ro.bold || o.bold); if (ro.breakLine) { paras.push(cur); cur = { t: "", pt: 0, b: false }; } }); if (cur.t) paras.push(cur); }
  let h = mv;
  for (const p of paras) h += K.linesFor(p.t || " ", w, p.pt || o.fontSize, p.b, mh) * (p.pt || o.fontSize) * K.LH / 72;
  return h;
}
// colour markup for grammar: [adj:word] [verb:word] [adv:phrase] [noun:word] [conj:word] and **bold**
const TAGC = { adj: ["sky", "Adjective"], verb: ["teal", "Verb"], adv: ["lav", "Adverbial"], noun: ["indigo", "Noun"], conj: ["mint", "Conjunction"] };
let USED_TAGS = new Set();
const MARK = /\[(adj|verb|adv|noun|conj):([^\]]+)\]|\*\*([^*]+)\*\*/;
function rich(str) {
  const out = []; let rest = K.clean(str);
  while (rest.length) {
    const m = rest.match(MARK);
    if (!m) { out.push({ text: rest, options: {} }); break; }
    if (m.index) out.push({ text: rest.slice(0, m.index), options: {} });
    if (m[1]) { USED_TAGS.add(m[1]); out.push({ text: m[2], options: { bold: true, color: COL[TAGC[m[1]][0]] } }); }
    else out.push({ text: m[3], options: { bold: true } });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}
function legend(slide) {
  if (!USED_TAGS.size) return;
  const tags = [...USED_TAGS]; let x = W - M - 1.45;
  const ws = tags.map(t => K.textW(TAGC[t][1], 11, true) + 0.35);
  x -= ws.reduce((a, b) => a + b + 0.08, 0);
  tags.forEach((t, i) => { box(slide, TAGC[t][1], { x, y: 6.92, w: ws[i], h: 0.34, fontSize: 11, bold: true, color: "FFFFFF", fillColor: COL[TAGC[t][0]], align: "center", margin: 1 }); x += ws[i] + 0.08; });
  USED_TAGS = new Set();
}
function box(slide, text, o) {
  if (typeof text === "string" && MARK.test(text)) text = rich(text);
  if (typeof text === "string") text = K.clean(text);
  else text = text.map(r => Object.assign({}, r, { text: K.clean(r.text) }));
  const opts = Object.assign({ shape: pres.shapes.ROUNDED_RECTANGLE, fontFace: K.FONT, fontSize: 18, color: COL.navy, valign: "middle", align: "left", margin: [6, 12, 6, 12], fill: { color: "FFFFFF" } }, o);
  if (opts.rectRadius === undefined) opts.rectRadius = Math.min(0.22, opts.h * 0.3);
  if (o.fillColor) { opts.fill = { color: o.fillColor }; delete opts.fillColor; }
  if (o.sh) { opts.shadow = { type: "outer", color: "6F87A3", opacity: 0.16, blur: 10, offset: 2, angle: 90 }; delete opts.sh; }
  if (o.line) { opts.line = o.line; }
  // Edu NSW handwriting reads small: set it 25% larger; it measures about like Nunito at the original size
  const measure = Object.assign({}, opts);
  if (o.hw) { opts.fontFace = K.HW; opts.fontSize = Math.round(opts.fontSize * 1.25); delete opts.hw; delete measure.hw; }
  const need = neededH(text, o.hw ? opts.w * 0.97 : opts.w, measure);
  if (need > opts.h + 0.005) warn(`${need.toFixed(2)}>${opts.h.toFixed(2)} :: ${(typeof text === "string" ? text : text.map(r => r.text).join("")).slice(0, 60)}`);
  slide.addText(text, opts);
}
function fitPt(texts, w, hMax, start, min = 14, bold = false, pad = 0.24) {
  let pt = start;
  while (pt > min && Math.max(...texts.map(t => K.hFor(t, w, pt, bold, pad))) > hMax) pt--;
  return pt;
}
function pill(slide, text, x, y, color, pt = 14, h = 0.44) {
  const w = Math.min(10, K.textW(text, pt, true) + 0.5);
  box(slide, text, { x, y, w, h, fontSize: pt, bold: true, color: "FFFFFF", fillColor: COL[color] || color, align: "center", margin: 2 });
  return w;
}

// ---------- visuals ----------
async function visAR(v) { return (await V.render(v)).ar; }
async function placeVisual(slide, v, x, y, w, h, align = "center") {
  const r = await V.render(v);
  let iw = w, ih = w / r.ar;
  if (ih > h) { ih = h; iw = h * r.ar; }
  const ix = align === "left" ? x : x + (w - iw) / 2;
  slide.addImage({ path: r.path, x: ix, y: y + (h - ih) / 2, w: iw, h: ih });
  return { iw, ih };
}

// ---------- chrome ----------
const MODE = { "I do": ["ido", "sky"], "We do": ["wedo", "mint"], "You do": ["youdo", "lav"] };
async function header(slide, title, ctx, mode) {
  let x = M;
  if (ctx && ctx.ls) {
    box(slide, lessonName(ctx.ls), { x, y: 0.4, w: 1.45, h: 0.8, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center", margin: 2 });
    x += 1.6;
  }
  const mw = mode ? 1.85 : 0;
  const rt = resTag(ctx), rw = rt ? K.textW(rt, 14, true) + 0.45 : 0;
  const tw = W - M - x - (mode ? mw + 0.15 : 0) - (rt ? rw + 0.15 : 0);
  if (rt) box(slide, rt, { x: W - M - (mode ? mw + 0.15 : 0) - rw, y: 0.52, w: rw, h: 0.56, fontSize: 14, bold: true, color: "FFFFFF", fillColor: COL.indigo, align: "center", margin: 1 });
  let pt = 28; while (pt > 18 && K.linesFor(title, tw, pt, true, 0.5) > 1) pt--;
  box(slide, title, { x, y: 0.4, w: tw, h: 0.8, fontSize: pt, bold: true, sh: true, margin: [4, 16, 4, 16] });
  if (mode) {
    const [ic, c] = MODE[mode];
    box(slide, mode, { x: W - M - mw, y: 0.4, w: mw, h: 0.8, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL[c], align: "right", margin: [2, 14, 2, 2] });
    slide.addImage({ data: await K.icon(ic, "FFFFFF", COL[c]), x: W - M - mw + 0.14, y: 0.53, w: 0.54, h: 0.54 });
  }
}
function footer(slide, ctx) {
  const label = ctx && ctx.ls ? `${UNIT.title} · ${lessonName(ctx.ls)}` : UNIT.title;
  const lw = Math.min(6, K.textW(label, 11, false) + 0.45);
  box(slide, label, { x: M, y: 6.92, w: lw, h: 0.34, fontSize: 11, color: COL.muted, fillColor: "FFFFFF", align: "center", margin: 1 });
  legend(slide);
  const ph = phaseOf(ctx);
  if (ph) box(slide, ph, { x: M + lw + 0.12, y: 6.92, w: K.textW(ph, 11, true) + 0.45, h: 0.34, fontSize: 11, bold: true, color: COL[UC], fillColor: TINT[UC], align: "center", margin: 1 });
  box(slide, [{ text: "Menu", options: { hyperlink: { slide: 1, tooltip: "Back to the lesson menu" }, color: COL.navy, bold: true } }],
    { x: W - M - 1.3, y: 6.88, w: 1.3, h: 0.4, fontSize: 13, align: "center", fillColor: TINT.sky, margin: 2 });
}

function rowsFit(rows, y, w, labelW, bottom, minPt, basePt, gap = 0.16) {
  for (let pt = basePt; pt >= minPt; pt--) {
    const hs = rows.map(r => Math.max(pt < 18 ? 0.5 : 0.62, K.hFor(r.text, w - labelW - 0.15, pt, false)));
    if (y + hs.reduce((a, b) => a + b, 0) + gap * (rows.length - 1) <= bottom) return true;
  }
  return false;
}
function drawRows(slide, rows, { x = M, y, w = RIGHT - M, labelW = 2.0, bottom = BOTTOM, pt = 24, gap = 0.16, center = false, minPt = 15, hw = false }) {
  let p = pt, hs;
  while (true) {
    hs = rows.map(r => Math.max(p < 18 ? 0.5 : 0.62, K.hFor(r.text, (w - labelW - 0.15) * (hw ? 0.97 : 1), p, false)));
    if (y + hs.reduce((a, b) => a + b, 0) + gap * (rows.length - 1) <= bottom || p <= minPt) break;
    p--;
  }
  let total = hs.reduce((a, b) => a + b, 0) + gap * (rows.length - 1);
  if (y + total > bottom) warn("rows overflow " + rows[0].text.slice(0, 40));
  const spare = bottom - y - total;
  if (spare > 0) { const add = Math.min(0.3, spare / rows.length); hs = hs.map(h => h + add); total += add * rows.length; }
  let cy = center ? y + Math.max(0, (bottom - y - total) / 2) : y;
  rows.forEach((r, i) => {
    const c = r.color || ["teal", "sky", "indigo", "mint", "lav"][i % 5];
    let lp = Math.min(18, p); while (lp > 10 && neededH(String(r.label), labelW, { fontSize: lp, bold: true, margin: [6, 12, 6, 12] }) > hs[i]) lp--;
    if (labelW > 0) box(slide, r.label, { x, y: cy, w: labelW, h: hs[i], fontSize: lp, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, r.text, { x: x + (labelW > 0 ? labelW + 0.15 : 0), y: cy, w: w - (labelW > 0 ? labelW + 0.15 : 0), h: hs[i], fontSize: p, fillColor: TINT[c], hw: hw && r.hw !== false });
    cy += hs[i] + 0.16;
  });
  return cy;
}
async function introBox(slide, text, y, pt = 22) {
  const h = K.hFor(text, RIGHT - M, pt, false, 0.26);
  box(slide, text, { x: M, y, w: RIGHT - M, h, fontSize: pt, sh: true });
  return y + h + 0.22;
}

// ---------- renderers ----------
const R = {};
const plan = [];
const lessonStart = {};
const anchor = {};

R.cover = async (slide) => {
  const pics = UNIT.coverPics || (LESSONS[0].pics || []).slice(0, 2);
  let tpt = 40; while (tpt > 26 && K.linesFor(UNIT.title, 7.6, tpt, true, 0.6) > 1) tpt--;
  box(slide, [
    { text: UNIT.title, options: { fontSize: tpt, bold: true, breakLine: true } },
    { text: `${UNIT.subtitle} · ${UNIT.stage} · ${UNIT.years}`, options: { fontSize: 16, color: COL.muted } },
  ], { x: M, y: 0.4, w: 8.2, h: 1.35, sh: true, margin: [6, 20, 6, 20] });
  pics.filter(K.hasImg).slice(0, 1).forEach(k => slide.addImage({ path: K.img(k), x: 8.9, y: 0.5, w: 1.05, h: 1.05 }));
  const btns = [["At a glance", "glance", "teal"], ["How it works", "howto", "sky"], ["Word wall", "wordwall", "mint"], ["Toolkit", "toolkit", "lav"]].filter(b => anchor[b[1]]);
  const bw = 1.36, bx0 = W - M - 2 * bw - 0.1;
  btns.forEach(([t, k, c], i) => box(slide, [{ text: t, options: { hyperlink: { slide: anchor[k], tooltip: t }, color: COL.navy, bold: true } }],
    { x: bx0 + (i % 2) * (bw + 0.1), y: 0.45 + Math.floor(i / 2) * 0.7, w: bw, h: 0.55, fontSize: 12, fillColor: TINT[c], align: "center", margin: 2 }));
  if (LESSONS.length > 10 && LESSONS.every(l => l.week)) return coverWeeks(slide);
  const ls = LESSONS, half = Math.ceil(ls.length / 2), colW = (W - 2 * M - 0.3) / 2;
  const rowH = Math.min(0.9, (6.75 - 2.05 - 0.14 * (half - 1)) / half);
  ls.forEach((l, i) => {
    const c = i < half ? 0 : 1, r = i % half;
    const x = M + c * (colW + 0.3), y = 2.05 + r * (rowH + 0.14);
    box(slide, `${l.n}`, { x, y, w: 0.75, h: rowH, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL[["teal", "sky", "mint", "indigo", "lav"][i % 5]], align: "center", margin: 1 });
    const pk = (l.pics || []).filter(K.hasImg)[0];
    const tw = colW - 0.9 - (pk ? 0.75 : 0);
    let pt = 19; while (pt > 14 && K.linesFor(l.title, tw, pt, true, 0.3) > 1) pt--;
    box(slide, [{ text: l.title, options: { hyperlink: { slide: lessonStart[l.id], tooltip: l.title }, color: COL.navy, bold: true } }], { x: x + 0.9, y, w: tw, h: rowH, fontSize: pt, fillColor: "FFFFFF", sh: true, margin: [2, 12, 2, 12] });
    if (pk) slide.addImage({ path: K.img(pk), x: x + colW - 0.66, y: y + rowH / 2 - 0.3, w: 0.6, h: 0.6 });
  });
  slide.addNotes(`Lesson menu. Click a lesson to jump to it. Every slide has a Menu button in the bottom right to come back here.\n\n${UNIT.fit || ""}`);
};

async function coverWeeks(slide) {
  const weeks = [...new Set(LESSONS.map(l => l.week))].sort((a, b) => a - b);
  const gap = 0.18, cw = (W - 2 * M - gap * (weeks.length - 1)) / weeks.length, y0 = 2.05;
  const per = Math.max(...weeks.map(w => LESSONS.filter(l => l.week === w).length));
  const rh = Math.min(0.95, (6.75 - y0 - 0.55 - 0.1 * (per - 1)) / per);
  const cols = ["teal", "sky", "mint", "indigo", "lav"];
  weeks.forEach((w, i) => {
    const x = M + i * (cw + gap), c = cols[i % 5];
    box(slide, `Week ${w}`, { x, y: y0, w: cw, h: 0.45, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center", margin: 1 });
    LESSONS.filter(l => l.week === w).forEach((l, j) => {
      const t = `${l.n}. ${l.menu || l.title}`;
      const longest = t.split(/\s+/).reduce((a, b) => K.textW(b, 14, true) > K.textW(a, 14, true) ? b : a, "");
      let pt = 14; while (pt > 9 && (K.linesFor(t, cw, pt, true, 0.3) > 2 || K.textW(longest, pt, true) > cw - 0.35)) pt--;
      box(slide, [{ text: t, options: { hyperlink: { slide: lessonStart[l.id], tooltip: l.title }, color: COL.navy, bold: true } }], { x, y: y0 + 0.55 + j * (rh + 0.1), w: cw, h: rh, fontSize: pt, fillColor: "FFFFFF", sh: true, margin: [2, 8, 2, 8] });
    });
  });
  slide.addNotes(`${PART === "A" ? "Component A skills" : "Lesson"} menu. Click any ${LTAG.toLowerCase()} to jump to it. Every slide has a Menu button in the bottom right to come back here.\n\n${UNIT.fit || ""}`);
}

R.howto = async (slide) => {
  await header(slide, "How this pack works");
  const cw = (W - 2 * M - 0.6) / 3;
  const modes = [["I do", "I show you how. Watch and listen."], ["We do", "We try it together on mini whiteboards."], ["You do", "You have a go on your own or with a partner."]];
  for (let i = 0; i < 3; i++) {
    const [m, t] = modes[i], [ic, c] = MODE[m], x = M + i * (cw + 0.3);
    slide.addImage({ data: await K.icon(ic, COL[c]), x: x + cw / 2 - 0.45, y: 1.55, w: 0.9, h: 0.9 });
    box(slide, m, { x, y: 2.55, w: cw, h: 0.6, fontSize: 22, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, t, { x, y: 3.25, w: cw, h: 0.95, fontSize: 18, fillColor: TINT[c], align: "center" });
  }
  const lv = [0, 1, 2].map(i => [LVS.names[i], i + 1, ["mint", "sky", "indigo"][i], ["An easier way in.", "Where everyone aims to be.", "Ready for more? Explain and prove."][i]]);
  lv.forEach(([n, k, c, t], i) => {
    const x = M + i * (cw + 0.3), y = 4.5;
    const ps = LVS.marker === "chillies" ? 0.5 : 0.26, tot = 3 * ps + 2 * ps * 0.35;
    marker(slide, k, c, x + 0.2, y + 0.37 - ps / 2, tot, ps);
    box(slide, n, { x: x + 0.3 + tot + 0.15, y: y + 0.07, w: cw - tot - 0.45, h: 0.6, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, t, { x, y: y + 0.85, w: cw, h: 0.95, fontSize: 17, fillColor: TINT[c], align: "center" });
  });
  footer(slide);
  slide.addNotes("Show this slide on the first day. Every lesson has one main task with an easier way in (Get started) and a way to go further. Students choose where to start and move at any time. Never label tables or groups by level.");
};

const WW_PER = 6;
R.wordwall = async (slide, it) => {
  const page = (it && it.page) || 0, pages = Math.ceil(UNIT.vocab.length / WW_PER);
  await header(slide, pages > 1 ? `Words we will use (${page + 1} of ${pages})` : "Words we will use");
  const vs = UNIT.vocab.slice(page * WW_PER, page * WW_PER + WW_PER), cols = 1;
  const cw = (W - 2 * M - 0.3 * (cols - 1)) / cols, rowsN = Math.ceil(vs.length / cols);
  const rh = Math.min(0.95, (BOTTOM - TOP - 0.12 * (rowsN - 1)) / rowsN);
  const pt = fitPt(vs.map(v => v.means), cw - 3.25, rh, 20, 15);
  vs.forEach((v, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = M + c * (cw + 0.3), y = TOP + r * (rh + 0.12);
    box(slide, v.word, { x, y, w: 3.1, h: rh, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL[["teal", "sky", "mint", "indigo", "lav"][i % 5]], align: "center", margin: 2 });
    box(slide, v.means, { x: x + 3.2, y, w: cw - 3.2, h: rh, fontSize: pt, fillColor: "FFFFFF", sh: true });
  });
  footer(slide);
  slide.addNotes("Use this as a word wall during the unit. The same words are on the printable word wall cards.");
};

R.lessonTitle = async (slide, it) => {
  const { ls } = it;
  if (K.hasPhoto(ls.photo)) return lessonTitlePhoto(slide, it);
  const pics = (ls.pics || []).filter(K.hasImg).slice(0, 3);
  const ps = 1.4, pg = 0.35, tot = pics.length * ps + (pics.length - 1) * pg;
  pics.forEach((k, i) => slide.addImage({ path: K.img(k), x: W / 2 - tot / 2 + i * (ps + pg), y: 0.75, w: ps, h: ps }));
  const tag = lessonName(ls);
  box(slide, tag, { x: W / 2 - 0.9, y: 2.35, w: 1.8, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center" });
  let tpt = 40; while (tpt > 26 && K.linesFor(ls.title, W - 2.8, tpt, true) > 1) tpt--;
  box(slide, ls.title, { x: 1.4, y: 3.05, w: W - 2.8, h: 1.2, fontSize: tpt, bold: true, align: "center", sh: true });
  if (ls.materials && ls.materials.length) {
    const t = "You need: " + ls.materials.join(", ");
    const h = K.hFor(t, W - 4.4, 19, false, 0.3);
    box(slide, t, { x: 2.2, y: 4.5, w: W - 4.4, h, fontSize: 19, align: "center", fillColor: TINT.sky });
  }
  footer(slide, it);
  slide.addNotes(`${lessonName(ls)}: ${ls.title}.\n\n${ls.teacherNotes || ""}`);
};

async function lessonTitlePhoto(slide, it) {
  const { ls } = it;
  // left: lesson pill, title, you need. right: photo. Clear of the title-slide corner decoration (top corners).
  const px = 6.75, pw = W - M - px, py = 1.9, ph = 4.75;
  slide.addImage({ path: await K.photo(ls.photo, pw, ph, 0.28), x: px, y: py, w: pw, h: ph });
  const lx = M + 0.25, lw = px - lx - 0.4;
  box(slide, lessonName(ls), { x: lx, y: py, w: 1.8, h: 0.55, fontSize: 17, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center" });
  let tpt = 40; while (tpt > 26 && K.linesFor(ls.title, lw, tpt, true, 0.5) > 2) tpt--;
  const th = neededH(ls.title, lw, { fontSize: tpt, bold: true, margin: [8, 18, 8, 18] }) + 0.1;
  box(slide, ls.title, { x: lx, y: py + 0.75, w: lw, h: th, fontSize: tpt, bold: true, sh: true, margin: [8, 18, 8, 18] });
  let y = py + 0.75 + th + 0.3;
  if (ls.materials && ls.materials.length) {
    const t = "You need: " + ls.materials.join(", ");
    const pt = fitPt([t], lw, py + ph - y, 19, 13, false, 0.3);
    const h = Math.min(py + ph - y, K.hFor(t, lw, pt, false, 0.3));
    box(slide, t, { x: lx, y, w: lw, h, fontSize: pt, fillColor: TINT.sky });
  }
  footer(slide, it);
  slide.addNotes(`${lessonName(ls)}: ${ls.title}.\n\n${ls.teacherNotes || ""}`);
}

R.reallife = async (slide, s, it) => {
  await header(slide, s.title || "Fractions in real life", it, "We do");
  const items = s.items.filter(x => K.hasPhoto(x.photo)).slice(0, 3), n = items.length, gap = 0.3;
  const qh = 0.95, top = TOP + 0.05, bottom = BOTTOM - qh - 0.25;
  const cw = n === 1 ? 6.4 : (RIGHT - M - gap * (n - 1)) / n;
  const capPt = n === 3 ? 18 : 20;
  const capH = Math.max(...items.map(x => neededH(x.caption, cw, { fontSize: capPt, margin: [6, 12, 6, 12] }))) + 0.05;
  const phH = bottom - top - capH - 0.15;
  if (n === 1) {
    const x = M;
    slide.addImage({ path: await K.photo(items[0].photo, cw, bottom - top, 0.22, { whole: !!items[0].whole }), x, y: top, w: cw, h: bottom - top });
    const rx = M + cw + 0.35, rw = RIGHT - rx;
    box(slide, items[0].caption, { x: rx, y: top, w: rw, h: Math.min(bottom - top, neededH(items[0].caption, rw, { fontSize: 22, margin: [10, 16, 10, 16] }) + 0.1), fontSize: 22, fillColor: TINT.sky, margin: [10, 16, 10, 16] });
  } else {
    for (let i = 0; i < n; i++) {
      const x = M + i * (cw + gap);
      slide.addImage({ path: await K.photo(items[i].photo, cw, phH, 0.2, { whole: !!items[i].whole }), x, y: top, w: cw, h: phH });
      box(slide, items[i].caption, { x, y: top + phH + 0.15, w: cw, h: capH, fontSize: capPt, fillColor: TINT[["sky", "mint", "lav"][i]], margin: [6, 12, 6, 12] });
    }
  }
  slide.addImage({ data: await K.icon("comments", COL.teal), x: M, y: BOTTOM - qh + (qh - 0.6) / 2, w: 0.6, h: 0.6 });
  const qpt = fitPt([s.question], RIGHT - M - 0.8, qh, 24, 16, true);
  box(slide, s.question, { x: M + 0.8, y: BOTTOM - qh, w: RIGHT - M - 0.8, h: qh, fontSize: qpt, bold: true, sh: true });
  s._notes = s.notes || "Look at each photo together. Ask: are the parts equal? How do you know? Real objects are rarely perfect, so talk about why we use strips and number lines to show exactly equal parts.";
};

R.lisc = async (slide, it) => {
  const { ls } = it;
  await header(slide, "Learning intention and success criteria", it);
  const lw = 5.2, rx = M + lw + 0.35, rw = W - M - rx;
  slide.addImage({ data: await K.icon("target", COL.sky), x: M, y: 1.6, w: 0.62, h: 0.62 });
  box(slide, "Learning intention", { x: M + 0.75, y: 1.6, w: lw - 0.75, h: 0.62, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL.sky });
  box(slide, ls.li, { x: M, y: 2.4, w: lw, h: Math.max(2.4, K.hFor(ls.li, lw, 24, false, 0.5)), fontSize: 24, fillColor: TINT.sky, margin: [10, 18, 10, 18] });
  slide.addImage({ path: K.img("writing_hand"), x: M + lw / 2 - 0.6, y: 5.15, w: 1.2, h: 1.2 });
  slide.addImage({ data: await K.icon("list", COL.mint), x: rx, y: 1.6, w: 0.62, h: 0.62 });
  box(slide, "Success criteria", { x: rx + 0.75, y: 1.6, w: rw - 0.75, h: 0.62, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL.mint });
  const pt = fitPt(ls.sc, rw, (BOTTOM - 2.4 - 0.16 * (ls.sc.length - 1)) / ls.sc.length, 26, 16);
  let y = 2.4;
  ls.sc.forEach(t => { const h = Math.max(0.8, K.hFor(t, rw, pt, false)); box(slide, t, { x: rx, y, w: rw, h, fontSize: pt, fillColor: TINT.mint }); y += h + 0.16; });
  footer(slide, it);
  slide.addNotes("Read the learning intention and success criteria together. Ask what each one would look like in their work today. Come back to them in Discuss and Connect.");
};

R.warmup = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  slide.addImage({ data: await K.icon("timer", COL.lav), x: M, y: 1.6, w: 0.75, h: 0.75 });
  const pw = RIGHT - M - 0.9 - 1.75;
  const ph = Math.max(0.85, K.hFor(s.prompt, pw, 23, true));
  box(slide, s.prompt, { x: M + 0.9, y: 1.55, w: pw, h: ph, fontSize: 23, bold: true, sh: true });
  box(slide, "5 minutes", { x: RIGHT - 1.6, y: 1.55, w: 1.6, h: 0.6, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL.lav, align: "center" });
  let y0 = 1.55 + ph + 0.3; const n = s.items.length;
  const wide = s.visual && (await visAR(s.visual)) > 2.6;
  if (wide) { await placeVisual(slide, s.visual, M, y0 - 0.1, RIGHT - M, 1.2); y0 += 1.25; }
  const side = s.visual && !wide, cols = side ? 1 : n <= 2 ? 1 : 2;
  const vw = side ? (RIGHT - M) * 0.3 : 0;
  if (side) await placeVisual(slide, s.visual, RIGHT - vw, y0, vw, BOTTOM - y0);
  const cw = cols === 1 ? RIGHT - M - (vw ? vw + 0.35 : 0) : (RIGHT - M - 0.3) / 2, rowsN = Math.ceil(n / cols);
  const ih = (BOTTOM - y0 - 0.2 * (rowsN - 1)) / rowsN;
  const pt = fitPt(s.items, cw, Math.min(ih, 1.6), 26, 15);
  s.items.forEach((t, i) => { const c = i % cols, r = Math.floor(i / cols); box(slide, t, { x: M + c * (cw + 0.3), y: y0 + r * (Math.min(ih, 1.6) + 0.2), w: cw, h: Math.min(ih, 1.6), fontSize: pt, fillColor: TINT.lav }); });
  if (s.answers) s._notes = `Answers: ${s.answers.map((a, i) => `${i + 1}) ${a}`).join("  ")}`;
};

R.definition = async (slide, s, it) => {
  await header(slide, `Word: ${s.term}`, it, s.mode || "I do");
  const lw = s.visual ? 6.4 : RIGHT - M;
  box(slide, s.term, { x: M, y: 1.6, w: Math.min(lw, K.textW(s.term, 40, true) + 1), h: 1.0, fontSize: 40, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center" });
  const mh = Math.max(1.3, K.hFor(s.means, lw, 26, false, 0.4));
  box(slide, s.means, { x: M, y: 2.85, w: lw, h: mh, fontSize: 26, sh: true, margin: [10, 18, 10, 18] });
  if (s.example) {
    const eh = Math.max(0.9, neededH([{ text: "Example: ", options: { bold: true } }, { text: s.example }], lw, { fontSize: 21, margin: [6, 12, 6, 12] }) + 0.04);
    box(slide, [{ text: "Example: ", options: { bold: true, color: COL.mint } }, { text: s.example }], { x: M, y: 2.85 + mh + 0.25, w: lw, h: eh, fontSize: 21, fillColor: TINT.mint });
  }
  if (s.visual) await placeVisual(slide, s.visual, M + lw + 0.35, 1.6, RIGHT - M - lw - 0.35, BOTTOM - 1.6);
};

R.rows = async (slide, s, it) => {
  if (s.visual) return R.visual(slide, s, it);
  await header(slide, s.title, it, s.mode);
  let y = TOP + 0.05;
  if (s.intro) y = await introBox(slide, s.intro, y);
  const lw = Math.max(1.4, Math.min(2.4, Math.max(...s.rows.map(r => K.textW(r.label, 18, true))) + 0.5));
  drawRows(slide, s.rows, { y, labelW: lw, pt: 26 });
};

R.visual = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode);
  let y = TOP + 0.05;
  if (s.intro) y = await introBox(slide, s.intro, y);
  const rows = s.rows || [];
  if (!rows.length) { await placeVisual(slide, s.visual, M, y, RIGHT - M, BOTTOM - y); return; }
  const lw = Math.max(1.3, Math.min(2.2, Math.max(...rows.map(r => K.textW(r.label, 18, true))) + 0.5));
  let f = 0.55;
  while (f > 0.3 && !rowsFit(rows, y, RIGHT - M - (RIGHT - M) * f - 0.35, lw, BOTTOM, 17, 24)) f -= 0.04;
  const vw = (RIGHT - M) * f;
  await placeVisual(slide, s.visual, M, y, vw, BOTTOM - y);
  drawRows(slide, rows, { x: M + vw + 0.35, y, w: RIGHT - M - vw - 0.35, labelW: lw, pt: 24, center: true });
};

R.display = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode);
  await placeVisual(slide, s.visual, M, TOP + 0.1, RIGHT - M, BOTTOM - TOP - 0.1);
};

R.worked = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "I do");
  const ph = K.hFor(s.problem, RIGHT - M, 24, true, 0.3);
  box(slide, s.problem, { x: M, y: TOP + 0.05, w: RIGHT - M, h: ph, fontSize: 24, bold: true, fillColor: TINT.mint, sh: true });
  const y = TOP + 0.05 + ph + 0.25;
  const rows = s.steps.map((st, i) => ({ label: st.label || `Step ${i + 1}`, text: st.text, color: ["sky", "teal", "indigo", "mint"][i % 4] }));
  let sx = M;
  if (s.visual) {
    let f = 0.45;
    while (f > 0.26 && !rowsFit(rows, y, RIGHT - M - (RIGHT - M) * f - 0.35, 1.5, BOTTOM, 17, 22)) f -= 0.04;
    const vw = (RIGHT - M) * f; await placeVisual(slide, s.visual, M, y, vw, BOTTOM - y); sx = M + vw + 0.35;
  }
  drawRows(slide, rows, { x: sx, y, w: RIGHT - sx, labelW: 1.5, pt: 22, hw: true });
};

R.examples = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  const cw = (RIGHT - M - 0.4) / 2;
  const cols = [[s.yes, "Yes, it is", "mint", "check"], [s.no, "No, it is not", "lav", "xmark"]];
  for (let c = 0; c < 2; c++) {
    const [items, head, col, ic] = cols[c], x = M + c * (cw + 0.4);
    slide.addImage({ data: await K.icon(ic, COL[col]), x, y: 1.55, w: 0.6, h: 0.6 });
    box(slide, head, { x: x + 0.72, y: 1.55, w: cw - 0.72, h: 0.6, fontSize: 21, bold: true, color: "FFFFFF", fillColor: COL[col], align: "center" });
    const n = items.length, ih = (BOTTOM - 2.35 - 0.2 * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const y = 2.35 + i * (ih + 0.2);
      if (!items[i].visual) { const pt = fitPt(items.map(t => t.label), cw - 0.3, Math.min(ih, 1.2), 22, 14); box(slide, items[i].label, { x, y, w: cw, h: ih, fontSize: pt, fillColor: TINT[col], align: "center" }); continue; }
      box(slide, "", { x, y, w: cw, h: ih, fillColor: TINT[col] });
      const lh = Math.min(0.75, K.hFor(items[i].label, cw - 0.3, 17, false, 0.2));
      if (items[i].visual) await placeVisual(slide, items[i].visual, x + 0.2, y + 0.12, cw - 0.4, ih - lh - 0.25);
      box(slide, items[i].label, { x: x + 0.15, y: y + ih - lh - 0.1, w: cw - 0.3, h: lh, fontSize: 17, fillColor: "FFFFFF", align: "center", margin: 2 });
    }
  }
};

async function talkWide(slide, s, it) {
  const pw = RIGHT - M - 1.0 - 2.6;
  let tpt = 30; while (tpt > 20 && neededH(s.prompt, pw, { margin: [10, 18, 10, 18], fontSize: tpt, bold: true }) > 2.2) tpt--;
  const ph = Math.max(1.4, neededH(s.prompt, pw, { margin: [10, 18, 10, 18], fontSize: tpt, bold: true }) + 0.05);
  slide.addImage({ data: await K.icon("comments", COL.teal), x: M, y: 1.65, w: 0.8, h: 0.8 });
  box(slide, s.prompt, { x: M + 1.0, y: 1.6, w: pw, h: ph, fontSize: tpt, bold: true, sh: true, margin: [10, 18, 10, 18] });
  const sec = s.seconds || 30, ts = Math.min(2.2, ph);
  slide.addText([{ text: `${sec}`, options: { fontSize: Math.round(48 * ts / 2.4), bold: true, breakLine: true } }, { text: "seconds", options: { fontSize: Math.round(16 * Math.max(0.8, ts / 2.4)) } }],
    { shape: pres.shapes.OVAL, x: RIGHT - ts - 0.2, y: 1.6, w: ts, h: ts, fill: { color: TINT.lav }, line: { color: COL.lav, width: 6 }, fontFace: K.FONT, color: COL.lav, align: "center", valign: "middle", margin: 0 });
  const vy = 1.6 + Math.max(ph, ts) + 0.3;
  await placeVisual(slide, s.visual, M, vy, RIGHT - M, BOTTOM - vy);
}
R.talk = async (slide, s, it) => {
  await header(slide, s.title || "Turn and talk", it, s.mode || "We do");
  if (s.visual && (await visAR(s.visual)) > 2.6) return talkWide(slide, s, it);
  const lw = s.visual ? 6.6 : RIGHT - M - 3.2;
  const nh = p => neededH(s.prompt, lw - 1.0, { margin: [10, 18, 10, 18], fontSize: p, bold: true });
  let tpt = 30; while (tpt > 20 && nh(tpt) > 3.0) tpt--;
  const ph = Math.max(1.6, nh(tpt) + 0.05);
  slide.addImage({ data: await K.icon("comments", COL.teal), x: M, y: 1.65, w: 0.8, h: 0.8 });
  box(slide, s.prompt, { x: M + 1.0, y: 1.6, w: lw - 1.0, h: ph, fontSize: tpt, bold: true, sh: true, margin: [10, 18, 10, 18] });
  const sec = s.seconds || 30, tx = s.visual ? M + 1.0 : RIGHT - 2.7;
  const ty = s.visual ? 1.6 + ph + 0.3 : 1.6;
  const ts = Math.max(1.3, Math.min(2.4, BOTTOM - ty));
  slide.addText([{ text: `${sec}`, options: { fontSize: Math.round(48 * ts / 2.4), bold: true, breakLine: true } }, { text: "seconds", options: { fontSize: Math.round(16 * Math.max(0.8, ts / 2.4)) } }],
    { shape: pres.shapes.OVAL, x: tx, y: ty, w: ts, h: ts, fill: { color: TINT.lav }, line: { color: COL.lav, width: 6 }, fontFace: K.FONT, color: COL.lav, align: "center", valign: "middle", margin: 0 });
  if (s.visual) await placeVisual(slide, s.visual, M + lw + 0.35, 1.6, RIGHT - M - lw - 0.35, BOTTOM - 1.6);
  else { const tt = "Think on your own first. Then share with your partner. Be ready to share your partner's idea."; box(slide, tt, { x: M + 1.0, y: 1.6 + ph + 0.35, w: lw - 1.0, h: Math.max(1.1, neededH(tt, lw - 1.0, { fontSize: 20, margin: [6, 12, 6, 12] }) + 0.05), fontSize: 20, fillColor: TINT.teal }); }
};

async function hingeLayout(slide, s, it, reveal) {
  await header(slide, reveal ? "Check: " + s.title : s.title, it, "We do");
  const qh = Math.max(0.9, K.hFor(s.question, RIGHT - M, 24, true, 0.3));
  box(slide, s.question, { x: M, y: TOP + 0.05, w: RIGHT - M, h: qh, fontSize: 24, bold: true, sh: true });
  let y = TOP + 0.05 + qh + 0.25, x0 = M, aw = RIGHT - M;
  if (s.visual && (await visAR(s.visual)) > 2.6) { const vh = 1.35; await placeVisual(slide, s.visual, M, y - 0.1, RIGHT - M, vh); y += vh + 0.1; }
  else if (s.visual) { const vw = (RIGHT - M) * 0.4; await placeVisual(slide, s.visual, M, y, vw, BOTTOM - y - (reveal ? 1.0 : 0)); x0 = M + vw + 0.35; aw = RIGHT - x0; }
  const bottom = reveal ? BOTTOM - 1.1 : BOTTOM;
  const ow = (aw - 0.25) / 2, oh = Math.min(1.6, (bottom - y - 0.25) / 2);
  const pt = fitPt(s.options, ow - 0.9, oh, 24, 14);
  for (let i = 0; i < 4; i++) {
    const c = i % 2, r = Math.floor(i / 2), x = x0 + c * (ow + 0.25), yy = y + r * (oh + 0.25);
    const right = i === s.answer, dim = reveal && !right;
    box(slide, "ABCD"[i], { x, y: yy, w: 0.75, h: oh, fontSize: 24, bold: true, color: "FFFFFF", fillColor: reveal ? (right ? COL.mint : "B8C4D2") : COL.sky, align: "center", margin: 0 });
    box(slide, s.options[i], { x: x + 0.85, y: yy, w: ow - 0.85, h: oh, fontSize: pt, color: dim ? COL.muted : COL.navy, fillColor: reveal && right ? TINT.mint : "FFFFFF", sh: !dim, bold: reveal && right });
  }
  if (reveal) {
    const why = s.why ? s.why[s.answer] : "";
    slide.addImage({ data: await K.icon("check", COL.mint), x: M, y: BOTTOM - 0.85, w: 0.8, h: 0.8 });
    box(slide, why, { x: M + 1.0, y: BOTTOM - 0.9, w: RIGHT - M - 1.0, h: 0.9, fontSize: fitPt([why], RIGHT - M - 1.0, 0.9, 20, 13), fillColor: TINT.mint });
  }
}
R.hinge = async (slide, s, it) => {
  await hingeLayout(slide, s, it, false);
  s._notes = "Hinge question. Everyone shows A, B, C or D on fingers or whiteboards at the same time. Then reveal.\n" + (s.why || []).map((w, i) => `${"ABCD"[i]}: ${w}`).join("\n");
};
R.hingeReveal = async (slide, s, it) => {
  await hingeLayout(slide, s, it, true);
  s._notes = (s.why || []).map((w, i) => `${"ABCD"[i]}: ${w}`).join("\n") + "\n\nIf more than a few students chose a wrong answer, reteach with the materials before the activity.";
};

async function cfuLayout(slide, s, it, reveal) {
  await header(slide, reveal ? "Check your answers" : s.title, it, "We do");
  let y = TOP + 0.05;
  if (!reveal) { slide.addImage({ data: await K.icon("board", COL.lav), x: M, y: y - 0.04, w: 0.52, h: 0.52 }); pill(slide, s.prompt || "Write on your mini whiteboard.", M + 0.64, y, "lav", 15); y += 0.62; }
  let qw = RIGHT - M;
  if (s.visual) { const vw = (RIGHT - M) * 0.4; await placeVisual(slide, s.visual, RIGHT - vw, y, vw, BOTTOM - y); qw = RIGHT - M - vw - 0.35; }
  const rows = s.questions.map((q, i) => ({ label: String(i + 1), text: reveal ? `${q}  →  ${s.answers[i]}` : q, color: reveal ? "mint" : "sky" }));
  drawRows(slide, rows, { x: M, y, w: qw, labelW: 0.7, pt: 26 });
}
R.cfu = async (slide, s, it) => { await cfuLayout(slide, s, it, false); s._notes = "Answers: " + s.answers.map((a, i) => `${i + 1}) ${a}`).join("  "); };
R.cfuReveal = async (slide, s, it) => { await cfuLayout(slide, s, it, true); };

// picture of the first page of this lesson's printable (from the worksheets PDF built before the deck)
const RES_PDF = (() => { for (const d of [path.dirname(OUT), path.dirname(path.dirname(OUT))]) { try { const f = fs.readdirSync(d).find(n => /_Worksheets_Colour\.pdf$/.test(n)); if (f) return path.join(d, f); } catch (e) {} } return null; })();
let RES_PAGES = null;
function resourceThumb(ls) {
  if (!RES_PDF || !ls || !(ls.printables || []).length) return null;
  const { execFileSync } = require("child_process");
  if (!RES_PAGES) {
    RES_PAGES = {};
    const n = +(execFileSync("pdfinfo", [RES_PDF], { encoding: "utf8" }).match(/Pages:\s+(\d+)/) || [0, 0])[1];
    for (let p = 1; p <= n; p++) { const t = execFileSync("pdftotext", ["-f", String(p), "-l", String(p), RES_PDF, "-"], { encoding: "utf8" }); const m = t.match(/Resource (\d+) ·/); if (m && !RES_PAGES[m[1]]) RES_PAGES[m[1]] = p; }
  }
  const rn = RES[ls.printables[0].id], pg = RES_PAGES[rn];
  if (!pg) return null;
  const wd = path.join(path.dirname(RES_PDF), ".work"); fs.mkdirSync(wd, { recursive: true });
  const base = path.join(wd, `res_${rn}`), f = base + ".png";
  if (!fs.existsSync(f) || fs.statSync(f).mtimeMs < fs.statSync(RES_PDF).mtimeMs) execFileSync("pdftoppm", ["-png", "-r", "110", "-f", String(pg), "-l", String(pg), "-singlefile", RES_PDF, base]);
  return f;
}
R.activity = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "You do");
  let lw = 8.2;
  const res = s.resource || "";
  const rows = s.steps.map((t, i) => ({ label: String(i + 1), text: t, color: "teal" }));
  drawRows(slide, rows, { x: M, y: TOP + 0.05, w: lw, labelW: 0.7, pt: 24 });
  const rx = M + lw + 0.35, rw = RIGHT - rx;
  let y = 1.58;
  if (res) {
    slide.addImage({ data: await K.icon("box", COL.indigo), x: rx, y, w: 0.55, h: 0.55 });
    box(slide, "Resource", { x: rx + 0.68, y, w: rw - 0.68, h: 0.58, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL.indigo });
    y += 0.72;
    const pt = fitPt([res], rw, 1.6, 19, 13); const h = Math.max(0.8, K.hFor(res, rw, pt, false));
    box(slide, res, { x: rx, y, w: rw, h, fontSize: pt, fillColor: TINT.indigo }); y += h + 0.3;
  }
  if (s.time) {
    slide.addImage({ data: await K.icon("clock", COL.lav), x: rx, y, w: 0.55, h: 0.55 });
    box(slide, `Time: ${s.time}`, { x: rx + 0.68, y, w: rw - 0.68, h: 0.58, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL.lav });
    y += 0.78;
  }
  const thumb = resourceThumb(it.ls);
  if (thumb && BOTTOM - y > 2.2) {
    const meta = await require("sharp")(thumb).metadata(), th = BOTTOM - y, tw = Math.min(rw, th * meta.width / meta.height);
    const th2 = tw * meta.height / meta.width, tx = rx + (rw - tw) / 2;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: tx - 0.06, y: y - 0.06, w: tw + 0.12, h: th2 + 0.12, fill: { color: "FFFFFF" }, line: { color: TINT.indigo, width: 1.5 }, rectRadius: 0.08, shadow: { type: "outer", color: "6F87A3", opacity: 0.2, blur: 8, offset: 2, angle: 90 } });
    slide.addImage({ path: thumb, x: tx, y, w: tw, h: th2 });
    y = BOTTOM;
  }
  const mats = (it.ls && it.ls.materials) || [];
  if (mats.length && y < BOTTOM - 1.2) {
    slide.addImage({ data: await K.icon("list", COL.teal), x: rx, y, w: 0.55, h: 0.55 });
    box(slide, "You need", { x: rx + 0.68, y, w: rw - 0.68, h: 0.58, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL.teal });
    y += 0.72;
    const mt = mats.join(", "), pt = fitPt([mt], rw, BOTTOM - y, 18, 12);
    box(slide, mt, { x: rx, y, w: rw, h: Math.min(BOTTOM - y, K.hFor(mt, rw, pt, false)), fontSize: pt, fillColor: TINT.teal });
  }
};

R.levels = async (slide, s, it) => {
  await header(slide, s.title || "Choose your challenge", it, "You do");
  const cols = [[LVS.names[0], s.support, "mint", 1], [LVS.names[1], s.core, "sky", 2], [LVS.names[2], s.extend, "indigo", 3]];
  const gap = 0.3, cw = (RIGHT - M - 2 * gap) / 3;
  const pt = fitPt(cols.map(c => c[1] || ""), cw, 3.3, 24, 14, false, 0.45);
  cols.forEach(([name, text, c, n], i) => {
    const x = M + i * (cw + gap), ps = LVS.marker === "chillies" ? 0.62 : 0.3;
    marker(slide, n, c, x, 1.6 + (0.62 - ps) / 2, cw, ps);
    box(slide, name, { x, y: 2.38, w: cw, h: 0.62, fontSize: 22, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, text || "", { x, y: 3.15, w: cw, h: 3.4, fontSize: pt, fillColor: TINT[c], valign: "top", margin: [10, 14, 10, 14] });
  });
  s._notes = s.notes || `Everyone aims for the ${LVS.names[1]}. Students choose where to start. Offer ${LVS.names[0]} after a genuine try, not straight away. Students who finish move to ${LVS.names[2]}.`;
};

function keyVisual(ls) { const v = (ls.slides || []).find(x => x.type === "visual" && x.visual) || (ls.slides || []).find(x => x.visual); return v && v.visual; }
R.discuss = async (slide, s, it) => {
  await header(slide, "Discuss and connect", it);
  const kv = s.visual || (it && it.ls && keyVisual(it.ls));
  let R0 = RIGHT;
  if (kv) { const nw = 4.3; R0 = RIGHT - nw - 0.35; await placeVisual(slide, { kind: "notebook", inner: kv }, R0 + 0.35, TOP + 0.1, nw, BOTTOM - TOP - 0.1); }
  else if (Object.keys(UNIT.people || {}).length) R0 = RIGHT - 2.6;   // room for the student cut-out
  const qs = s.questions, aw = R0 - M - 1.0, gap = 0.2;
  let pt = 28, rh, ch;
  while (true) {
    rh = qs.map(q => Math.max(pt < 20 ? 0.6 : 0.8, K.hFor(q, aw, pt, false)));
    ch = Math.max(0.8, K.hFor("Connect: " + s.connect, aw, Math.min(24, pt), true));
    if (rh.reduce((a, b) => a + b, 0) + gap * qs.length + ch <= BOTTOM - TOP - 0.1 || pt <= 14) break;
    pt--;
  }
  const ic = await K.icon("comments", COL.teal), ic2 = await K.icon("link", COL.mint);
  let y = TOP + 0.1;
  for (let i = 0; i < qs.length; i++) { slide.addImage({ data: ic, x: M, y: y + rh[i] / 2 - 0.3, w: 0.6, h: 0.6 }); box(slide, qs[i], { x: M + 1.0, y, w: aw, h: rh[i], fontSize: pt, sh: true }); y += rh[i] + gap; }
  const cy = Math.min(Math.max(y, BOTTOM - ch), BOTTOM - ch);
  slide.addImage({ data: ic2, x: M, y: cy + ch / 2 - 0.3, w: 0.6, h: 0.6 });
  box(slide, [{ text: "Connect: ", options: { bold: true, color: COL.mint } }, { text: s.connect }], { x: M + 1.0, y: cy, w: aw, h: ch, fontSize: Math.min(24, pt), fillColor: TINT.mint });
};

R.exit = async (slide, it) => {
  const ex = it.ls.exitTicket || [];
  await header(slide, "Exit ticket", it, "You do");
  pill(slide, "On your own. Hand it in before you go.", M, TOP + 0.05, "lav", 15);
  const n = ex.length, cw = (RIGHT - M - 0.3 * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const x = M + i * (cw + 0.3), y = TOP + 0.75, q = ex[i];
    const qh = Math.max(0.9, K.hFor(q.q, cw - 0.85, 22, false));
    box(slide, String(i + 1), { x, y, w: 0.7, h: qh, fontSize: 22, bold: true, color: "FFFFFF", fillColor: COL.lav, align: "center", margin: 0 });
    box(slide, q.q, { x: x + 0.82, y, w: cw - 0.82, h: qh, fontSize: 22, sh: true });
    if (q.visual) await placeVisual(slide, q.visual, x, y + qh + 0.2, cw, BOTTOM - y - qh - 0.2);
  }
  it._notes = "Exit ticket answers: " + ex.map((q, i) => `${i + 1}) ${q.answer}`).join("  ") + "\nSort the tickets into got it / nearly / not yet. Use the not yet pile to choose tomorrow's teacher table group.";
};


// ---------- unit at a glance ----------
async function glanceWeeks(slide) {
  await header(slide, PART === "A" ? "Component A at a glance" : "Unit at a glance");
  const weeks = [...new Set(LESSONS.map(l => l.week))].sort((a, b) => a - b), gap = 0.12;
  const rh = (BOTTOM - TOP - 0.5 - gap * (weeks.length - 1)) / weeks.length;
  const cols = ["teal", "sky", "mint", "indigo", "lav"];
  pill(slide, `${UNIT.departmentUnit ? UNIT.departmentUnit + " · " : ""}${UNIT.mentorText ? UNIT.mentorText.title + " by " + UNIT.mentorText.author + " · " : ""}${LESSONS.length} ${LTAG.toLowerCase()}s`, M, TOP, UC, 13, 0.4);
  const wp = UNIT.weeksPlan || [];
  const lw = 4.6, rx = M + 1.1 + lw + 0.12;
  weeks.forEach((w, i) => {
    const y = TOP + 0.5 + i * (rh + gap), c = cols[i % 5], ls = LESSONS.filter(l => l.week === w);
    box(slide, `Week ${w}`, { x: M, y, w: 1.0, h: rh, fontSize: 14, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center", margin: 1 });
    const li = PART === "A" ? [...new Set(ls.map(l => l.focus))].join(", ") : ((wp.find(x => x.week === w) || {}).li || "");
    box(slide, li, { x: M + 1.1, y, w: lw, h: rh, fontSize: fitPt([li], lw, rh, 13, 9, false, 0.2), fillColor: TINT[c], margin: [3, 8, 3, 8] });
    const t = ls.map(l => `${l.n}. ${l.menu || l.title}`).join("   ");
    box(slide, [{ text: t, options: {} }], { x: rx, y, w: W - M - rx, h: rh, fontSize: fitPt([t], W - M - rx, rh, 13, 9, false, 0.2), fillColor: "FFFFFF", sh: true, margin: [3, 8, 3, 8] });
  });
  footer(slide);
  slide.addNotes("Unit overview for your program. Use the menu to jump to any lesson.");
}
R.glance = async (slide) => {
  if (LESSONS.length > 10 && LESSONS.every(l => l.week)) return glanceWeeks(slide);
  await header(slide, "Unit at a glance");
  const ls = LESSONS, lw = 6.55, gap = 0.08;
  const rh = Math.min(0.62, (BOTTOM - TOP - gap * (ls.length - 1)) / ls.length);
  let pt = 20; while (pt > 12 && (ls.some(l => K.linesFor(l.title, lw - 0.7, pt, true, 0.3) > 1) || pt * K.LH / 72 + 0.12 > rh)) pt--;
  ls.forEach((l, i) => {
    const y = TOP + i * (rh + gap);
    box(slide, `${l.n}`, { x: M, y, w: 0.6, h: rh, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL[["teal", "sky", "mint", "indigo", "lav"][i % 5]], align: "center", margin: 1 });
    box(slide, [{ text: l.title, options: { hyperlink: { slide: lessonStart[l.id], tooltip: l.title }, color: COL.navy, bold: true } }], { x: M + 0.7, y, w: lw - 0.7, h: rh, fontSize: pt, fillColor: "FFFFFF", sh: true, margin: [2, 12, 2, 12] });
  });
  const rx = M + lw + 0.3, rw = W - M - rx;
  const outc = (UNIT.outcomes || []).map(o => `${o.code}: ${o.short || o.text}`).join("\n");
  const mats = UNIT.unitMaterials || [...new Set(ls.flatMap(l => l.materials || []).map(m => m.trim().replace(/\.$/, "")))];
  const blocks = [["Syllabus", outc, "teal"], ["You will need", mats.join(", ") + ".", "mint"], ["Assessment", "Pre-test, a hinge question and mini whiteboard check every lesson, exit tickets, and an end of unit test with self-check and rubric.", "lav"]];
  const runs = (b, p) => [{ text: b[0], options: { bold: true, breakLine: true, fontSize: p } }, { text: b[1], options: { fontSize: p } }];
  const avail = BOTTOM - TOP - 0.5 - 0.15 * 2;
  const hs = p => blocks.map(b => neededH(runs(b, p), rw, { fontSize: p, margin: [6, 14, 6, 14] }) + 0.04);
  let bp = 20; while (bp > 11 && hs(bp).reduce((a, b) => a + b, 0) > avail) bp--;
  let y = TOP;
  pill(slide, `${UNIT.subtitle} · ${UNIT.stage} · ${ls.length} lessons`, rx, y, UC, 13, 0.4); y += 0.5;
  hs(bp).forEach((h, i) => { box(slide, runs(blocks[i], bp), { x: rx, y, w: rw, h, fontSize: bp, fillColor: TINT[blocks[i][2]], margin: [6, 14, 6, 14] }); y += h + 0.15; });
  footer(slide);
  slide.addNotes(`Unit overview for your program. Click a lesson to jump to it.\n\n${UNIT.fit || ""}`);
};

// ---------- toolkit: pieces to drag in edit mode ----------
const TOOL_NOTE = "Toolkit slide. In PowerPoint or Google Slides edit mode, drag the pieces to model the maths. Press Ctrl+D (Cmd+D on a Mac) to copy a piece. Close without saving to put everything back.";
R.toolStrips = async (slide) => {
  await header(slide, "Toolkit: fraction strips", null, "We do");
  const sw = 10.4, x0 = (W - sw) / 2, rh = 0.62, g = 0.12;
  const rows = [[1, "teal"], [2, "sky"], [3, "mint"], [4, "indigo"], [5, "lav"], [8, "teal"]];
  rows.forEach(([n, c], r) => {
    const y = TOP + 0.1 + r * (rh + g), pw = sw / n;
    for (let i = 0; i < n; i++) box(slide, n === 1 ? "1" : `1/${n}`, { x: x0 + i * pw, y, w: pw, h: rh, fontSize: n >= 8 ? 15 : 18, bold: true, color: r === 0 ? COL.navy : "FFFFFF", fillColor: r === 0 ? TINT[c] : COL[c], align: "center", margin: 1, rectRadius: 0.06, line: { color: "FFFFFF", width: 1.5 } });
  });
  footer(slide);
  slide.addNotes(TOOL_NOTE + " Drag pieces under the whole to show how many make one, or line up two strips to compare.");
};
R.toolLine = async (slide) => {
  await header(slide, "Toolkit: number line", null, "We do");
  const x0 = 1.4, x1 = W - 1.4, y = 3.1;
  slide.addShape(pres.shapes.LINE, { x: x0 - 0.2, y, w: x1 - x0 + 0.5, h: 0, line: { color: COL.navy, width: 3, endArrowType: "triangle" } });
  for (const [t, xx] of [["0", x0], ["1", x1]]) {
    slide.addShape(pres.shapes.LINE, { x: xx, y: y - 0.25, w: 0, h: 0.5, line: { color: COL.navy, width: 3 } });
    box(slide, t, { x: xx - 0.3, y: y + 0.35, w: 0.6, h: 0.5, fontSize: 22, bold: true, align: "center", fillColor: "FFFFFF", margin: 1 });
  }
  // movable tick marks and dots
  for (let i = 0; i < 9; i++) slide.addShape(pres.shapes.LINE, { x: 1.6 + i * 0.32, y: 4.35, w: 0, h: 0.4, line: { color: COL.navy, width: 2.5 } });
  for (let i = 0; i < 4; i++) slide.addShape(pres.shapes.OVAL, { x: 4.8 + i * 0.5, y: 4.4, w: 0.32, h: 0.32, fill: { color: COL[["teal", "lav", "mint", "sky"][i]] }, line: { color: "FFFFFF", width: 1 } });
  box(slide, "Drag a tick or a dot onto the line", { x: 7.1, y: 4.3, w: 4.8, h: 0.5, fontSize: 14, color: COL.muted, fillColor: "FFFFFF", align: "center", margin: 1 });
  const cards = ["1/2", "1/4", "2/4", "3/4", "1/3", "2/3", "1/5", "2/5", "3/5", "4/5", "1/8", "3/8", "5/8", "4/4"];
  const cw = 0.78, cg = 0.1, per = 7, cx0 = (W - (per * cw + (per - 1) * cg)) / 2;
  cards.forEach((t, i) => box(slide, t, { x: cx0 + (i % per) * (cw + cg), y: 5.0 + Math.floor(i / per) * 0.7, w: cw, h: 0.58, fontSize: 18, bold: true, align: "center", fillColor: TINT[["teal", "sky", "mint", "indigo", "lav"][i % 5]], margin: 1 }));
  footer(slide);
  slide.addNotes(TOOL_NOTE + " Drag ticks onto the line to make equal parts, then drag a fraction card to name a point. Ask: how many equal spaces from 0 to 1?");
};
R.toolCounters = async (slide) => {
  await header(slide, "Toolkit: counters and ten frames", null, "We do");
  const cs = 0.62, fx = [M + 0.2, M + 0.2 + 5 * cs + 0.5];
  for (const x of fx) for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) slide.addShape(pres.shapes.RECTANGLE, { x: x + c * cs, y: TOP + 0.3 + r * cs, w: cs, h: cs, fill: { color: "FFFFFF" }, line: { color: COL.navy, width: 1.5 } });
  for (let i = 0; i < 20; i++) slide.addShape(pres.shapes.OVAL, { x: 7.6 + (i % 10) * 0.5, y: TOP + 0.35 + Math.floor(i / 10) * 0.6, w: 0.42, h: 0.42, fill: { color: COL[i < 10 ? "teal" : "lav"] }, line: { color: "FFFFFF", width: 1 } });
  box(slide, "Drag counters into the frames. Copy more with Ctrl+D.", { x: M, y: 3.2, w: W - 2 * M, h: 0.6, fontSize: 16, color: COL.muted, fillColor: "FFFFFF", align: "center" });
  footer(slide);
  slide.addNotes(TOOL_NOTE);
};

// ---------- blank templates ----------
const TPL_NOTE = "Template. Right-click the slide in the side panel and choose Duplicate, then type over the text. The boxes keep the theme colours.";
R.tplText = async (slide) => {
  await header(slide, "Type your title here", null, "I do");
  box(slide, "Type here. Keep it short: one idea per box.", { x: M, y: TOP + 0.1, w: W - 2 * M, h: 1.6, fontSize: 24, fillColor: "FFFFFF", sh: true });
  box(slide, "Type an example or a question here.", { x: M, y: TOP + 1.95, w: W - 2 * M, h: 1.4, fontSize: 22, fillColor: TINT.sky });
  footer(slide); slide.addNotes(TPL_NOTE);
};
R.tplTalk = async (slide) => { await R.talk(slide, { prompt: "Type your question here" }, null); footer(slide); slide.addNotes(TPL_NOTE); };
R.tplLevels = async (slide) => { const s = { support: "Type the easier way in here.", core: "Type the main task here.", extend: "Type the go further task here." }; await R.levels(slide, s, null); footer(slide); slide.addNotes(TPL_NOTE + " " + s._notes); };
R.tplGrid = async (slide) => {
  await header(slide, "Type your title here", null, "You do");
  box(slide, "Type the question here. Students show their working on the grid.", { x: M, y: TOP + 0.05, w: W - 2 * M, h: 0.8, fontSize: 22, fillColor: "FFFFFF", sh: true });
  const gy = TOP + 1.05, gh = BOTTOM - gy, gw = W - 2 * M;
  const f = path.join(K.CACHE, `grid_${THEME_KEY}.png`);
  if (!fs.existsSync(f)) {
    const px = 144, Wp = Math.round(gw * px), Hp = Math.round(gh * px), c = Math.round(0.3 * px);
    let lines = ""; for (let x = 0; x <= Wp; x += c) lines += `<line x1="${x}" y1="0" x2="${x}" y2="${Hp}"/>`; for (let y = 0; y <= Hp; y += c) lines += `<line x1="0" y1="${y}" x2="${Wp}" y2="${y}"/>`;
    await require("sharp")(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wp}" height="${Hp}"><rect width="100%" height="100%" rx="24" fill="#FFFFFF"/><g stroke="#${COL.sky}" stroke-opacity="0.22" stroke-width="3">${lines}</g><rect x="1.5" y="1.5" width="${Wp - 3}" height="${Hp - 3}" rx="24" fill="none" stroke="#${COL.sky}" stroke-width="3"/></svg>`)).png().toFile(f);
  }
  slide.addImage({ path: f, x: M, y: gy, w: gw, h: gh });
  footer(slide); slide.addNotes(TPL_NOTE + " The grid is a picture, so students can write on it with the pen tool or you can draw on it in edit mode.");
};
R.tplTwo = async (slide) => {
  await header(slide, "Type your title here", null, "We do");
  const cw = (W - 2 * M - 0.3) / 2;
  [["Type here", "teal"], ["Type here", "mint"]].forEach(([t, c], i) => box(slide, t, { x: M + i * (cw + 0.3), y: TOP + 0.1, w: cw, h: 4.9, fontSize: 24, fillColor: TINT[c], valign: "top", margin: [12, 16, 12, 16] }));
  footer(slide); slide.addNotes(TPL_NOTE);
};

// ---------- English slide types ----------
function pasteFrame(slide, x, y, w, h, locator, hint) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: "FFFFFF" }, line: { color: COL.sky, width: 2, dashType: "dash" }, rectRadius: 0.18 });
  box(slide, locator, { x: x + 0.2, y: y + 0.18, w: w - 0.4, h: Math.max(0.55, K.hFor(locator, w - 0.4, 16, true, 0.25)), fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL.sky, margin: [3, 10, 3, 10] });
  const ty = y + 0.3 + Math.max(0.55, K.hFor(locator, w - 0.4, 16, true, 0.25));
  box(slide, hint, { x: x + 0.2, y: ty, w: w - 0.4, h: Math.min(y + h - ty - 0.2, 1.1), fontSize: 14, color: COL.muted, fillColor: TINT.sky, margin: [3, 10, 3, 10] });
}
const BOOK = () => UNIT.mentorText ? `your copy of ${UNIT.mentorText.title}` : "your copy of the text";
R.reveal = async (slide, s, it) => {
  const st = s.steps[it.step || 0], n = s.steps.length;
  await header(slide, `${s.title || "Slow reveal"} (${(it.step || 0) + 1} of ${n})`, it, "We do");
  let y = TOP + 0.05;
  if (s.intro && !(it.step)) { const h = K.hFor(s.intro, RIGHT - M, 18, false, 0.25); box(slide, s.intro, { x: M, y, w: RIGHT - M, h, fontSize: 18, fillColor: TINT.lav }); y += h + 0.2; }
  const lw = 5.6;
  pasteFrame(slide, M, y, lw, BOTTOM - y, `Read aloud: ${st.locator}`, `Read it from ${BOOK()}, or type it here. Keep the cover hidden.`);
  const rx = M + lw + 0.35, rw = RIGHT - rx;
  box(slide, st.focus, { x: rx, y, w: rw, h: 0.6, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center" });
  drawRows(slide, st.questions.map((q, i) => ({ label: "?", text: q, color: ["sky", "mint", "indigo", "lav"][i % 4] })), { x: rx, y: y + 0.75, w: rw, labelW: 0.55, pt: 22, minPt: 15 });
  s._notes = s.notes || "Read only the part named in the blue box. Give think time, take predictions, and ask students why they think so. Do not confirm or correct yet.";
};
R.mentor = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  let y = TOP + 0.05;
  const th = Math.max(0.7, K.hFor(s.task, RIGHT - M - 0.8, 22, true, 0.3));
  slide.addImage({ data: await K.icon("eye", COL[UC]), x: M, y: y + th / 2 - 0.3, w: 0.6, h: 0.6 });
  box(slide, s.task, { x: M + 0.8, y, w: RIGHT - M - 0.8, h: th, fontSize: 22, bold: true, sh: true });
  y += th + 0.25;
  const lw = 6.1, rx = M + lw + 0.35, rw = RIGHT - rx;
  const qs = s.questions || [];
  if (s.example) {
    const eh = Math.min(2.0, Math.max(0.9, neededH([{ text: "Our example: ", options: { bold: true } }, ...rich(s.example)], lw, { fontSize: 20, margin: [6, 14, 6, 14] }) + 0.08));
    pasteFrame(slide, M, y, lw, BOTTOM - y - eh - 0.2, s.locator, `Paste or type the passage from ${BOOK()} here.`);
    box(slide, [{ text: "Our example: ", options: { bold: true, color: COL.muted } }, ...rich(s.example)], { x: M, y: BOTTOM - eh, w: lw, h: eh, fontSize: 20, fillColor: "FFFFFF", sh: true, margin: [6, 14, 6, 14] });
  } else pasteFrame(slide, M, y, lw, BOTTOM - y, s.locator, `Paste or type the passage from ${BOOK()} here.`);
  if (qs.length) drawRows(slide, qs.map((q, i) => ({ label: "?", text: q, color: ["sky", "mint", "indigo", "lav"][i % 4] })), { x: rx, y, w: rw, labelW: 0.55, pt: 22, minPt: 14 });
  s._notes = s.notes || `Display the passage from ${BOOK()} (${s.locator}). Read it aloud first, then reread it with the task in mind.`;
};
R.anchor = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  const rows = s.points.map((p, i) => { const m = p.match(/^([^:]{2,24}):\s*(.+)$/); return m ? { label: m[1], text: m[2], color: ["teal", "sky", "mint", "indigo", "lav"][i % 5] } : { label: String(i + 1), text: p, color: ["teal", "sky", "mint", "indigo", "lav"][i % 5] }; });
  for (let i = 0; i < (s.blank || 0); i++) rows.push({ label: "+", text: "Add the class's idea here.", color: "lav" });
  const lw = Math.max(0.7, Math.min(2.6, Math.max(...rows.map(r => K.textW(r.label, 18, true))) + 0.5));
  drawRows(slide, rows, { y: TOP + 0.05, labelW: lw, pt: 24, minPt: 14 });
  s._notes = s.notes || "Build this chart with the class: ask for ideas before revealing each point. Keep it on display and add to it in later lessons.";
};
R.model = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "I do");
  let y = TOP + 0.05;
  if (s.intro) { const h = Math.max(0.6, K.hFor(s.intro, RIGHT - M, 18, false, 0.25)); box(slide, s.intro, { x: M, y, w: RIGHT - M, h, fontSize: 18, fillColor: TINT.lav }); y += h + 0.2; }
  if (s.parts && !rowsFit(s.parts.map(p => ({ text: p.text.replace(/\[\w+:|\]|\*\*/g, "") })), y, (RIGHT - M) * 0.97, Math.max(1.4, Math.min(2.8, Math.max(...s.parts.map(r => K.textW(r.label, 16, true))) + 0.5)), BOTTOM, 14, 22)) {
    s._labels = s.parts.map(p => p.label); s.text = s.parts.map(p => p.text).join(" "); s.parts = null;
    if (!s.notes) s.notes = "The parts of this model are: " + s._labels.join(", ") + ". Point to each part as you read it aloud.";
  }
  if (s.parts) {
    const lw = Math.max(1.4, Math.min(2.8, Math.max(...s.parts.map(r => K.textW(r.label, 16, true))) + 0.5));
    drawRows(slide, s.parts.map((p, i) => ({ label: p.label, text: p.text, color: ["teal", "sky", "mint", "indigo", "lav"][i % 5] })), { y, labelW: lw, pt: 22, minPt: 13, hw: true });
  } else {
    const plain = s.text.replace(/\[\w+:|\]|\*\*/g, "");
    let pt = 26; while (pt > 14 && neededH(plain, RIGHT - M, { fontSize: Math.round(pt * 1.25), margin: [12, 20, 12, 20] }) > BOTTOM - y) pt--;
    box(slide, s.text, { x: M, y, w: RIGHT - M, h: BOTTOM - y, fontSize: pt, fillColor: "FFFFFF", sh: true, valign: "top", margin: [12, 20, 12, 20], hw: true });
  }
  s._notes = s.notes || "Think aloud as you write: say why you chose each word and sentence. Students watch first, then help with the next sentence.";
};
R.criteria = async (slide, s, it) => {
  await header(slide, s.title || "Our success criteria", it, s.mode || "We do");
  const sh = Math.max(0.7, K.hFor(s.stem, RIGHT - M - 0.8, 22, true, 0.3));
  slide.addImage({ data: await K.icon("list", COL.mint), x: M, y: TOP + 0.05 + sh / 2 - 0.3, w: 0.6, h: 0.6 });
  box(slide, s.stem, { x: M + 0.8, y: TOP + 0.05, w: RIGHT - M - 0.8, h: sh, fontSize: 22, bold: true, sh: true });
  const rows = s.points.map(p => ({ label: "☐", text: p, color: "mint" }));
  for (let i = 0; i < (s.blank || 0); i++) rows.push({ label: "☐", text: "Our class adds one here.", color: "lav" });
  drawRows(slide, rows, { y: TOP + 0.05 + sh + 0.25, labelW: 0.6, pt: 22, minPt: 14 });
  s._notes = s.notes || "Co-construct: ask students what a good piece would include before you reveal each point. Students tick each one when they check their own work.";
};
R.tag = async (slide, s, it) => {
  await header(slide, s.title || "Peer feedback: Tell, Ask, Give", it, "We do");
  const cw = (RIGHT - M - 0.6) / 3, parts = [["Tell", "teal", "Tell your partner one thing they did well.", "I like how you ...  You used ... well."], ["Ask", "sky", "Ask a question about their writing.", "Why did you ...?  What happens when ...?"], ["Give", "lav", "Give one idea to make it even better.", "You could add ...  Try changing ... to ..."]];
  parts.forEach(([h, c, t, st], i) => {
    const x = M + i * (cw + 0.3);
    box(slide, h, { x, y: TOP + 0.05, w: cw, h: 0.75, fontSize: 30, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, t, { x, y: TOP + 0.95, w: cw, h: 1.5, fontSize: 21, fillColor: TINT[c], align: "center" });
    box(slide, st, { x, y: TOP + 2.6, w: cw, h: 1.6, fontSize: 19, fillColor: "FFFFFF", sh: true, align: "center", hw: true });
  });
  box(slide, "Use our success criteria. Listen, then say thank you.", { x: M, y: BOTTOM - 0.6, w: RIGHT - M, h: 0.6, fontSize: 18, fillColor: TINT.mint, align: "center" });
  s._notes = s.notes || "Model one round of Tell, Ask, Give with a student's permission before pairs begin. Give students time to revise straight after.";
};
// ---------- organiser slides (typed into live, or used as worked examples) ----------
// underlay drawings (circles, connector lines, arcs) are pictures behind the text boxes; finalize ignores them for overlap checks
async function underlay(slide, svgBody, x, y, w, h) {
  const px = 144, W2 = Math.round(w * px), H2 = Math.round(h * px);
  const f = path.join(K.CACHE, "ul_" + K.hash(svgBody + W2 + H2 + THEME_KEY) + ".png");
  if (!fs.existsSync(f)) await require("sharp")(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}" viewBox="0 0 ${w} ${h}">${svgBody}</svg>`)).png().toFile(f);
  slide.addImage({ path: f, x, y, w, h, altText: "underlay" });
}
const ORG = ["teal", "sky", "mint", "indigo", "lav"];
const TYPE_HERE = "Type here";
function cellText(t) { return t == null || t === "" ? "" : t; }
function orgIntro(slide, s, y) {
  if (!s.prompt) return y;
  const h = Math.max(0.6, K.hFor(s.prompt, RIGHT - M - 0.8, 20, true, 0.3));
  box(slide, s.prompt, { x: M + 0.8, y, w: RIGHT - M - 0.8, h, fontSize: 20, bold: true, sh: true });
  return y + h + 0.2;
}
async function orgIcon(slide, y, h) { slide.addImage({ data: await K.icon("list", COL[UC]), x: M, y: y + 0.03, w: 0.6, h: 0.6 }); }
R.venn = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  let y = TOP + 0.05; if (s.prompt) { await orgIcon(slide, y); y = orgIntro(slide, s, y); }
  const h = BOTTOM - y - 0.6, w = RIGHT - M, cw = w * 0.63, r1 = `#${COL.sky}`, r2 = `#${COL.lav}`;
  await underlay(slide, `<ellipse cx="${cw / 2}" cy="${h / 2}" rx="${cw / 2 - 0.03}" ry="${h / 2 - 0.03}" fill="${r1}" fill-opacity="0.13" stroke="${r1}" stroke-width="0.04"/><ellipse cx="${w - cw / 2}" cy="${h / 2}" rx="${cw / 2 - 0.03}" ry="${h / 2 - 0.03}" fill="${r2}" fill-opacity="0.13" stroke="${r2}" stroke-width="0.04"/>`, M, y + 0.6, w, h);
  const lw = 2.6;
  box(slide, s.left, { x: M + cw / 2 - lw / 2 - 0.9, y, w: lw, h: 0.5, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL.sky, align: "center", margin: 1 });
  box(slide, "Both", { x: M + w / 2 - 0.7, y, w: 1.4, h: 0.5, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL.mint, align: "center", margin: 1 });
  box(slide, s.right, { x: M + w - cw / 2 - lw / 2 + 0.9, y, w: lw, h: 0.5, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL.lav, align: "center", margin: 1 });
  const it2 = s.items || {}, ov = 2 * cw - w;
  const col = (items, x, ww) => { const t = (items && items.length) ? items.map(i => "• " + i).join("\n") : TYPE_HERE; const pt = fitPt([t], ww, h * 0.62, 18, 11); box(slide, t, { x, y: y + 0.6 + h * 0.16, w: ww, h: h * 0.68, fontSize: pt, fill: { color: "FFFFFF", transparency: 100 }, valign: "middle", align: "center", margin: [6, 8, 6, 8], color: items && items.length ? COL.navy : COL.muted }); };
  col(it2.left, M + 0.5, w - cw - 0.7); col(it2.both, M + w - cw + 0.1, ov - 0.2); col(it2.right, M + cw + 0.2, w - cw - 0.7);
  s._notes = s.notes || "Fill the diagram with the class. Click into a box and type. Ideas true for both go in the middle.";
};
async function gridSlide(slide, s, it, head, rows, opts = {}) {
  await header(slide, s.title, it, s.mode || "We do");
  let y = TOP + 0.05; if (s.prompt) { await orgIcon(slide, y); y = orgIntro(slide, s, y); }
  const n = head.length, gap = 0.12, w = RIGHT - M, cws = opts.widths || head.map(() => (w - gap * (n - 1)) / n);
  let x = M; head.forEach((h, i) => { box(slide, h, { x, y, w: cws[i], h: 0.6, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL[(opts.cols || ORG)[i % 5]], align: "center", margin: 2 }); x += cws[i] + gap; });
  y += 0.72;
  const nr = rows.length, rh = Math.min(1.5, (BOTTOM - y - gap * (nr - 1)) / nr);
  const pt = fitPt(rows.flat().map(t => cellText(t) || "x"), Math.min(...cws), rh, 24, 13);
  rows.forEach((r, ri) => { x = M; r.forEach((c, ci) => { const t = cellText(c); box(slide, t, { x, y: y + ri * (rh + gap), w: cws[ci], h: rh, fontSize: pt, fillColor: ci === 0 && opts.firstColTint ? TINT[(opts.cols || ORG)[0]] : (ri % 2 ? TINT.sky : "FFFFFF"), sh: ri % 2 === 0, valign: "middle", bold: ci === 0 && opts.firstColBold }); x += cws[ci] + gap; }); });
}
R.tchart = async (slide, s, it) => {
  const rows = s.rows && s.rows.length ? s.rows : Array.from({ length: s.blank || 4 }, () => ["", ""]);
  await gridSlide(slide, s, it, s.headers || ["", ""], rows, { cols: ["mint", "lav"] });
  s._notes = s.notes || "Sort ideas into the two columns with the class. Click into a box to type.";
};
R.table = async (slide, s, it) => {
  const rows = s.rows && s.rows.length ? s.rows : Array.from({ length: s.blank || 4 }, () => s.headers.map(() => ""));
  const w = RIGHT - M, n = s.headers.length, first = s.firstColWidth || 0;
  const widths = first ? [first * w, ...Array(n - 1).fill((w - first * w - 0.12 * (n - 1)) / (n - 1))] : null;
  await gridSlide(slide, s, it, s.headers, rows, { widths, firstColBold: true, firstColTint: true });
  s._notes = s.notes || "Complete the table together. Students copy or complete their own on the matching page.";
};
R.charmap = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  let y = TOP + 0.05; if (s.prompt) { await orgIcon(slide, y); y = orgIntro(slide, s, y); }
  const h = BOTTOM - y, w = RIGHT - M, sp = (s.spokes || []).slice(0, 6), n = sp.length || 6;
  const cx = w / 2, cy = h / 2, bw = 3.5, bh = Math.min(1.45, (h - 0.3) / 3 - 0.15);
  const pos = Array.from({ length: n }, (_, i) => { const col = i % 2 ? 1 : 0, row = Math.floor(i / 2), rows = Math.ceil(n / 2); return [col ? w - bw : 0, rows === 1 ? cy - bh / 2 : row * (h - bh) / (rows - 1)]; });
  const lines = pos.map(([px, py]) => `<line x1="${cx}" y1="${cy}" x2="${px + bw / 2}" y2="${py + bh / 2}" stroke="#${COL[UC]}" stroke-width="0.035" stroke-dasharray="0.12 0.08"/>`).join("");
  await underlay(slide, lines, M, y, w, h);
  const ct = s.centre || "";
  if (s.photo && K.hasPhoto(s.photo)) { const ps = Math.min(2.6, h - 1.0); slide.addImage({ path: await K.photo(s.photo, ps, ps, ps / 2), x: M + cx - ps / 2, y: y + cy - ps / 2 - 0.35, w: ps, h: ps }); box(slide, ct, { x: M + cx - 1.6, y: y + cy + ps / 2 - 0.25, w: 3.2, h: 0.6, fontSize: 22, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center", margin: 1 }); }
  else box(slide, ct, { x: M + cx - 1.6, y: y + cy - 0.55, w: 3.2, h: 1.1, fontSize: 26, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center" });
  pos.forEach(([px, py], i) => { const t = sp[i] ? [{ text: sp[i].label, options: { bold: true, color: COL[ORG[i % 5]], breakLine: true } }, { text: sp[i].text || TYPE_HERE, options: { color: sp[i].text ? COL.navy : COL.muted } }] : [{ text: TYPE_HERE, options: { color: COL.muted } }];
    box(slide, t, { x: M + px, y: y + py, w: bw, h: bh, fontSize: fitPt([(sp[i] && (sp[i].label + " " + (sp[i].text || ""))) || "x"], bw, bh, 17, 11), fillColor: TINT[ORG[i % 5]], valign: "top", margin: [5, 10, 5, 10] }); });
  s._notes = s.notes || "Build the map with the class: a trait or idea in each box, with evidence from the text.";
};
R.mountain = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  let y = TOP + 0.05; if (s.prompt) { await orgIcon(slide, y); y = orgIntro(slide, s, y); }
  const st = s.stages, n = st.length, h = BOTTOM - y, w = RIGHT - M, bw = (w - 0.15 * (n - 1)) / n, bh = Math.min(1.75, h * 0.42);
  const peak = s.peak != null ? s.peak : Math.max(1, n - 2);
  const ys = st.map((_, i) => { const t = i <= peak ? i / peak : 1 - (i - peak) / Math.max(1, n - 1 - peak); return (h - bh) * (1 - t); });
  await underlay(slide, `<polyline points="${st.map((_, i) => `${i * (bw + 0.15) + bw / 2},${ys[i] + bh / 2}`).join(" ")}" fill="none" stroke="#${COL[UC]}" stroke-width="0.05" stroke-dasharray="0.16 0.1"/>`, M, y, w, h);
  st.forEach((t, i) => box(slide, [{ text: t.label, options: { bold: true, color: COL[ORG[i % 5]], breakLine: true } }, { text: t.text || TYPE_HERE, options: { color: t.text ? COL.navy : COL.muted } }], { x: M + i * (bw + 0.15), y: y + ys[i], w: bw, h: bh, fontSize: fitPt(st.map(x => x.label + " " + (x.text || "x")), bw, bh, 16, 10), fillColor: TINT[ORG[i % 5]], valign: "top", sh: true, margin: [5, 8, 5, 8] }));
  s._notes = s.notes || "Place each event on the mountain: tension rises to the climax, then falls to the resolution.";
};
R.flow = async (slide, s, it) => {
  await header(slide, s.title, it, s.mode || "We do");
  let y = TOP + 0.05; if (s.prompt) { await orgIcon(slide, y); y = orgIntro(slide, s, y); }
  const st = s.steps, n = st.length, perRow = n > 4 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / perRow), gap = 0.55, w = RIGHT - M;
  const bw = (w - gap * (perRow - 1)) / perRow, h = BOTTOM - y, bh = Math.min(2.2, (h - 0.5 * (rows - 1)) / rows);
  let arrows = "";
  const P = i => { const r = Math.floor(i / perRow), c = r % 2 ? perRow - 1 - (i % perRow) : i % perRow; return [c * (bw + gap), r * (bh + 0.5)]; };
  for (let i = 0; i < n - 1; i++) { const [x1, y1] = P(i), [x2, y2] = P(i + 1); if (y1 === y2) { const l = x2 > x1, ax = l ? x1 + bw + 0.08 : x1 - 0.08, bx = l ? x2 - 0.08 : x2 + bw + 0.08, ay = y1 + bh / 2; arrows += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${ay}" stroke="#${COL[UC]}" stroke-width="0.05"/><path d="M${bx},${ay} l${l ? -0.15 : 0.15},-0.1 l0,0.2 z" fill="#${COL[UC]}"/>`; } else { const ax = x1 + bw / 2; arrows += `<line x1="${ax}" y1="${y1 + bh + 0.06}" x2="${ax}" y2="${y2 - 0.06}" stroke="#${COL[UC]}" stroke-width="0.05"/><path d="M${ax},${y2 - 0.06} l-0.1,-0.15 l0.2,0 z" fill="#${COL[UC]}"/>`; } }
  await underlay(slide, arrows, M, y, w, h);
  const pt = fitPt(st.map(t => (t.label || "") + " " + (t.text || t)), bw, bh, 18, 11);
  st.forEach((t, i) => { const [px, py] = P(i), lab = t.label || String(i + 1), tx = typeof t === "string" ? t : (t.text || TYPE_HERE);
    box(slide, [{ text: lab, options: { bold: true, color: COL[ORG[i % 5]], breakLine: true } }, { text: tx, options: { color: tx === TYPE_HERE ? COL.muted : COL.navy } }], { x: M + px, y: y + py, w: bw, h: bh, fontSize: pt, fillColor: TINT[ORG[i % 5]], valign: "top", sh: true, margin: [6, 10, 6, 10] }); });
  s._notes = s.notes || "Read the chain in order. Each box leads to the next.";
};
// drag-and-drop sort: drop zones under headings, movable cards underneath
R.sort = async (slide, s, it) => {
  await header(slide, s.title || "Sort it", it, s.mode || "We do");
  let y = TOP + 0.05;
  const ins = s.prompt || "Drag each card to the right group. (Edit mode)";
  y = orgIntro(slide, Object.assign({}, s, { prompt: ins }), y); slide.addImage({ data: await K.icon("hand", COL[UC]), x: M, y: TOP + 0.08, w: 0.6, h: 0.6 });
  const hs = s.headings, n = hs.length, gap = 0.2, w = RIGHT - M, cw = (w - gap * (n - 1)) / n;
  const cards = s.cards || [], cardRows = Math.ceil(cards.length / Math.min(6, cards.length || 1)), per = Math.min(6, cards.length || 1);
  const cardH = 0.62, zoneH = BOTTOM - y - 0.6 - cardRows * (cardH + 0.12) - 0.2;
  hs.forEach((h, i) => { const x = M + i * (cw + gap); box(slide, h, { x, y, w: cw, h: 0.55, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL[ORG[i % 5]], align: "center", margin: 1 }); slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 0.62, w: cw, h: zoneH, fill: { color: TINT[ORG[i % 5]] }, line: { color: COL[ORG[i % 5]], width: 1.5, dashType: "dash" }, rectRadius: 0.15 }); });
  const cy0 = y + 0.62 + zoneH + 0.2, cwid = (w - 0.12 * (per - 1)) / per;
  const pt = fitPt(cards, cwid, cardH, 17, 10, true, 0.15);
  cards.forEach((c, i) => box(slide, c, { x: M + (i % per) * (cwid + 0.12), y: cy0 + Math.floor(i / per) * (cardH + 0.12), w: cwid, h: cardH, fontSize: pt, bold: true, fillColor: "FFFFFF", align: "center", sh: true, line: { color: COL.muted, width: 1 }, margin: 2 }));
  const ans = s.answers ? "Answers: " + Object.entries(s.answers).map(([k, v]) => `${k}: ${v.join(", ")}`).join(". ") : "";
  s._notes = [s.notes || "In edit mode, students come to the board and drag a card into a group, saying why. Close without saving to reset.", ans].filter(Boolean).join("\n\n");
};
// movable sentence strips for sequencing
R.strips = async (slide, s, it) => {
  await header(slide, s.title || "Put them in order", it, s.mode || "We do");
  let y = TOP + 0.05;
  y = orgIntro(slide, Object.assign({}, s, { prompt: s.prompt || "Drag the strips into the right order. (Edit mode)" }), y); slide.addImage({ data: await K.icon("hand", COL[UC]), x: M, y: TOP + 0.08, w: 0.6, h: 0.6 });
  const st = s.items, n = st.length, sh = Math.min(0.75, (BOTTOM - y - 0.12 * (n - 1)) / n), sw = (RIGHT - M) * 0.78;
  const pt = fitPt(st, sw - 0.3, sh, 20, 12);
  const order = s.shuffle || st.map((_, i) => i).sort((a, b) => ((a * 7 + 3) % n) - ((b * 7 + 3) % n));
  order.forEach((k, i) => box(slide, st[k], { x: M + (i % 2 ? 0.6 : 0), y: y + i * (sh + 0.12), w: sw, h: sh, fontSize: pt, fillColor: TINT[ORG[k % 5]], sh: true, margin: [3, 14, 3, 14] }));
  s._notes = [s.notes || "In edit mode students drag strips into order. Close without saving to reset.", "Correct order: " + st.map((t, i) => `${i + 1}) ${t}`).join("  ")].join("\n\n");
};

R.tplVenn = async (slide) => { await R.venn(slide, { title: "Type your title here", left: "Type here", right: "Type here" }, null); footer(slide); slide.addNotes("Template: Venn diagram. Duplicate the slide and type into the boxes."); };
R.tplTchart = async (slide) => { await R.tchart(slide, { title: "Type your title here", headers: ["Type here", "Type here"], blank: 4 }, null); footer(slide); slide.addNotes("Template: T-chart. Duplicate the slide and type into the boxes."); };
R.tplMentor = async (slide) => {
  await header(slide, "Type your title here", null, "We do");
  pasteFrame(slide, M, TOP + 0.05, 6.1, BOTTOM - TOP - 0.05, "Chapter __, p __: the passage beginning ...", `Paste or type the passage from ${BOOK()} here.`);
  drawRows(slide, [{ label: "?", text: "Type a question here.", color: "sky" }, { label: "?", text: "Type a question here.", color: "mint" }], { x: M + 6.45, y: TOP + 0.05, w: RIGHT - M - 6.45, labelW: 0.55, pt: 22 });
  footer(slide); slide.addNotes("Template for any passage. Duplicate it, add the page reference and your questions.");
};

R.credits = async (slide) => {
  await header(slide, "Thank you");
  const t1 = "This resource is for use by one teacher in their own classroom. Please buy an additional licence for each extra teacher. You may not share, resell or upload this resource or any part of it.";
  const cr = K.photoCredits(), used = Object.keys(UNIT.photos || {}).filter(k => cr[k]);
  const names = [...new Set(used.map(k => cr[k].photographer.replace(/^https?:\/\/(www\.)?/, "").replace(/\.com\/?$/, "").replace(/\/$/, "").replace(/[^\p{Script=Latin}\s.'-]/gu, "").replace(/\s+/g, " ").trim()).filter(Boolean))];
  const t2 = "Pictures: Microsoft Fluent Emoji (MIT licence). Fonts: Nunito Sans and Edu NSW ACT Foundation (SIL Open Font License). Diagrams drawn for this resource." + (names.length ? ` Photos from Pexels (pexels.com, Pexels Licence) by ${names.join(", ")}.` : "");
  const t3 = ENGLISH
    ? `Syllabus outcomes: NSW English K-10 Syllabus © NSW Education Standards Authority (NESA). ${UNIT.departmentUnit ? `Designed to accompany the NSW Department of Education ${UNIT.departmentUnit} (© State of New South Wales (Department of Education), 2023, CC BY 4.0). ` : ""}${UNIT.mentorText ? `You need a copy of ${UNIT.mentorText.title} by ${UNIT.mentorText.author}; no text from the book is reproduced here. ` : ""}Not endorsed by NESA or the NSW Department of Education.`
    : `Syllabus outcomes and content: NSW Mathematics K-10 Syllabus © NSW Education Standards Authority (NESA). ${UNIT.fit ? UNIT.fit + "." : ""} Not endorsed by NESA or the NSW Department of Education.`;
  let y = TOP + 0.1;
  const ts = [[t1, "teal"], [t2, "sky"], [t3, "lav"]];
  let cpt = 20; const hs = p => ts.map(([t]) => neededH(t, RIGHT - M, { fontSize: p, margin: [6, 12, 6, 12] }) + 0.06);
  while (cpt > 11 && hs(cpt).reduce((a, b) => a + b, 0) + 0.5 > BOTTOM - y) cpt--;
  hs(cpt).forEach((h, i) => { box(slide, ts[i][0], { x: M, y, w: RIGHT - M, h, fontSize: cpt, fillColor: TINT[ts[i][1]] }); y += h + 0.25; });
  footer(slide);
};

const DEFAULT_NOTES = {
  definition: "Say the word together. Read the meaning aloud and point to the picture. Ask two students to say it in their own words.",
  rows: "Read each part aloud. Pause after each one and ask a student to explain it with an example.",
  visual: "Point to each part of the picture as you read the explanation. Ask students to show the same thing with their strips or on their whiteboards.",
  worked: "Think aloud as you go through each step. Model it with real materials first, then point to the picture. Ask students what you did and why.",
  examples: "Ask students to say why each example fits. Spend the most time on the 'no' examples, because they are close on purpose.",
  talk: "Give think time first, then partner talk. Listen in and choose two pairs to share.",
  activity: "Model the first step. Check everyone has started before you work with a small group.",
  display: "Display this while students work so they can refer back to it.",
  cfuReveal: "Students tick their own answers or fix them. Note who got two or more wrong and see them at the teacher table.",
  discuss: "Choose two or three pieces of work to share, from least to most efficient. Name the maths and link it to the success criteria.",
};

// ---------- plan ----------
plan.push({ kind: "cover" });
anchor.glance = plan.length + 1; plan.push({ kind: "glance" });
anchor.howto = plan.length + 1; plan.push({ kind: "howto" });
anchor.wordwall = plan.length + 1;
for (let i = 0; i < Math.ceil(UNIT.vocab.length / WW_PER); i++) plan.push({ kind: "wordwall", page: i });
for (const ls of LESSONS) {
  lessonStart[ls.id] = plan.length + 1;
  plan.push({ kind: "lessonTitle", ls }, { kind: "lisc", ls });
  if (ls.reallife) plan.push({ kind: "content", ls, s: Object.assign({ type: "reallife" }, ls.reallife) });
  for (const s of ls.slides) {
    if (s.type === "reveal") { s.steps.forEach((_, k) => plan.push({ kind: "content", ls, s: Object.assign({}, s), step: k })); continue; }
    if (s.type === "model" && s.parts && s.parts.length > 4) { const h = Math.ceil(s.parts.length / 2); plan.push({ kind: "content", ls, s: Object.assign({}, s, { title: s.title + " (1 of 2)", parts: s.parts.slice(0, h) }), _split: 1 }, { kind: "content", ls, s: Object.assign({}, s, { title: s.title + " (2 of 2)", intro: null, parts: s.parts.slice(h) }), _split: 1 }); continue; }
    plan.push({ kind: "content", ls, s });
    if (s.type === "hinge") plan.push({ kind: "content", ls, s: Object.assign({}, s, { type: "hingeReveal" }) });
    if (s.type === "cfu") plan.push({ kind: "content", ls, s: Object.assign({}, s, { type: "cfuReveal" }) });
  }
  if (ls.exitTicket && ls.exitTicket.length) plan.push({ kind: "exit", ls });
}
const TOOLS = { fractionStrips: "toolStrips", numberLine: "toolLine", counters: "toolCounters" };
const tools = (UNIT.toolkit || []).filter(t => TOOLS[t]);
if (tools.length) { anchor.toolkit = plan.length + 1; tools.forEach(t => plan.push({ kind: TOOLS[t] })); }
anchor.templates = plan.length + 1;
plan.push(...(ENGLISH ? ["tplText", "tplTwo", "tplMentor", "tplVenn", "tplTchart", "tplTalk", "tplLevels"] : ["tplText", "tplTwo", "tplGrid", "tplTalk", "tplLevels"]).map(k => ({ kind: k })));
plan.push({ kind: "credits" });

// ---------- build ----------
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: K.FONT, bodyFontFace: K.FONT };
pres.title = `${UNIT.title}: ${UNIT.subtitle}${PART === "A" ? " (Component A)" : ""}`;
pres.subject = `${UNIT.stage} ${ENGLISH ? "English" : "mathematics"}`;

(async () => {
  pres.defineSlideMaster({ title: "Content", background: { path: await K.themeBackground(THEME_KEY, "content") }, objects: [] });
  pres.defineSlideMaster({ title: "Cover", background: { path: await K.themeBackground(THEME_KEY, "cover") }, objects: [] });
  pres.defineSlideMaster({ title: "Title", background: { path: await K.themeBackground(THEME_KEY, "title") }, objects: [] });
  const SIMPLE = new Set(["rows", "talk", "discuss", "warmup", "definition", "anchor", "criteria", "mentor"]);
  // cut-out photos of students beside talk and discussion slides (unit.people, cut out by src/photos.js)
  const PEOPLE_ON = new Set(["talk"]);
  const PDIR = path.join(K.ASSETS, "photos", "people");
  const people = Object.keys(UNIT.people || {}).map(k => path.join(PDIR, k + ".png")).filter(f => fs.existsSync(f));
  let pi = 0; const nextPerson = () => people.length ? people[pi++ % people.length] : null;
  for (const item of plan) {
    const slide = pres.addSlide({ masterName: item.kind === "cover" ? "Cover" : item.kind === "lessonTitle" ? (ENGLISH ? "Cover" : "Title") : "Content" });
    if (item.kind === "content") {
      const s = item.s, fn = R[s.type];
      if (!fn) throw new Error("no renderer " + s.type);
      const pics = SIMPLE.has(s.type) && s.pics ? s.pics.filter(K.hasImg) : null;
      const person = (!pics || !pics.length) && PEOPLE_ON.has(s.type) && !s.visual ? nextPerson() : null;
      if (person) {
        RIGHT = W - M - 2.45;
        await fn(slide, s, item);
        RIGHT = W - M;
        const meta = await require("sharp")(person).metadata();
        let ph = BOTTOM - TOP - 0.2, pw = ph * meta.width / meta.height;
        if (pw > 2.25) { pw = 2.25; ph = pw * meta.height / meta.width; }
        slide.addImage({ path: person, x: W - M - pw + (pw < 2.25 ? -(2.25 - pw) / 2 : 0), y: BOTTOM - ph, w: pw, h: ph });
      } else if (pics && pics.length) {
        RIGHT = W - M - 2.45;
        await fn(slide, s, item);
        RIGHT = W - M;
        const ps = pics.length === 1 ? 2.0 : 1.7, tot = pics.length * ps + (pics.length - 1) * 0.35, top = TOP + (BOTTOM - TOP - tot) / 2;
        pics.forEach((k, i) => slide.addImage({ path: K.img(k), x: W - M - 2.2 + (2.2 - ps) / 2, y: top + i * (ps + 0.35), w: ps, h: ps }));
      } else await fn(slide, s, item);
      if (s.type === "discuss" && !keyVisual(item.ls) && !s.visual) { const pf = nextPerson(); if (pf) { const meta = await require("sharp")(pf).metadata(); let ph = 3.4, pw = ph * meta.width / meta.height; if (pw > 2.4) { pw = 2.4; ph = pw * meta.height / meta.width; } slide.addImage({ path: pf, x: W - M - pw, y: BOTTOM - ph, w: pw, h: ph }); } }
      footer(slide, item);
      const notes = [s.notes || DEFAULT_NOTES[s.type], s._notes].filter(Boolean).join("\n\n");
      if (notes) slide.addNotes(K.clean(notes));
    } else if (item.kind === "exit") {
      await R.exit(slide, item); footer(slide, item); slide.addNotes(item._notes);
    } else await R[item.kind](slide, item);
    void 0;
  }
  await pres.writeFile({ fileName: OUT });
  await require("./theme.js").applyTheme(OUT, T);
  console.log(`deck ${path.basename(OUT)}: ${plan.length} slides, theme ${THEME_KEY}, fit warnings ${FIT_WARN}`);
})().catch(e => { console.error(e); process.exit(1); });
