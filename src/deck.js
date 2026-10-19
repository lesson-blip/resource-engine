// Builds the teaching slide deck (PowerPoint, opens in Google Slides) for one unit.
// usage: node src/deck.js units/<id>.json <out.pptx> [theme]
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const K = require("./kit.js");
const V = require("./visuals.js");

const UNIT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];
const THEME_KEY = process.argv[4] || "cool";
const T = K.THEMES[THEME_KEY];
const COL = Object.assign({ navy: T.text, muted: T.muted, white: "FFFFFF" }, T.roles);
const TINT = T.tints;
const UC = UNIT.colour || "teal";

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
function box(slide, text, o) {
  if (typeof text === "string") text = K.clean(text);
  else text = text.map(r => Object.assign({}, r, { text: K.clean(r.text) }));
  const opts = Object.assign({ shape: pres.shapes.ROUNDED_RECTANGLE, fontFace: K.FONT, fontSize: 18, color: COL.navy, valign: "middle", align: "left", margin: [6, 12, 6, 12], fill: { color: "FFFFFF" } }, o);
  if (opts.rectRadius === undefined) opts.rectRadius = Math.min(0.22, opts.h * 0.3);
  if (o.fillColor) { opts.fill = { color: o.fillColor }; delete opts.fillColor; }
  if (o.sh) { opts.shadow = { type: "outer", color: "6F87A3", opacity: 0.16, blur: 10, offset: 2, angle: 90 }; delete opts.sh; }
  if (o.line) { opts.line = o.line; }
  const need = neededH(text, opts.w, opts);
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
    box(slide, `Lesson ${ctx.ls.n}`, { x, y: 0.4, w: 1.45, h: 0.8, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center", margin: 2 });
    x += 1.6;
  }
  const mw = mode ? 1.85 : 0;
  const tw = W - M - x - (mode ? mw + 0.15 : 0);
  let pt = 28; while (pt > 18 && K.linesFor(title, tw, pt, true, 0.5) > 1) pt--;
  box(slide, title, { x, y: 0.4, w: tw, h: 0.8, fontSize: pt, bold: true, sh: true, margin: [4, 16, 4, 16] });
  if (mode) {
    const [ic, c] = MODE[mode];
    box(slide, mode, { x: W - M - mw, y: 0.4, w: mw, h: 0.8, fontSize: 18, bold: true, color: "FFFFFF", fillColor: COL[c], align: "right", margin: [2, 14, 2, 2] });
    slide.addImage({ data: await K.icon(ic, "FFFFFF", COL[c]), x: W - M - mw + 0.14, y: 0.53, w: 0.54, h: 0.54 });
  }
}
function footer(slide, ctx) {
  const label = ctx && ctx.ls ? `${UNIT.title} · Lesson ${ctx.ls.n}` : UNIT.title;
  box(slide, label, { x: M, y: 6.92, w: Math.min(6, K.textW(label, 11, false) + 0.45), h: 0.34, fontSize: 11, color: COL.muted, fillColor: "FFFFFF", align: "center", margin: 1 });
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
function drawRows(slide, rows, { x = M, y, w = RIGHT - M, labelW = 2.0, bottom = BOTTOM, pt = 24, gap = 0.16, center = false, minPt = 15 }) {
  let p = pt, hs;
  while (true) {
    hs = rows.map(r => Math.max(p < 18 ? 0.5 : 0.62, K.hFor(r.text, w - labelW - 0.15, p, false)));
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
    if (labelW > 0) box(slide, r.label, { x, y: cy, w: labelW, h: hs[i], fontSize: Math.min(18, p), bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, r.text, { x: x + (labelW > 0 ? labelW + 0.15 : 0), y: cy, w: w - (labelW > 0 ? labelW + 0.15 : 0), h: hs[i], fontSize: p, fillColor: TINT[c] });
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

R.cover = async (slide) => {
  const pics = UNIT.coverPics || (UNIT.lessons[0].pics || []).slice(0, 2);
  let tpt = 40; while (tpt > 26 && K.linesFor(UNIT.title, 7.6, tpt, true, 0.6) > 1) tpt--;
  box(slide, [
    { text: UNIT.title, options: { fontSize: tpt, bold: true, breakLine: true } },
    { text: `${UNIT.subtitle} · ${UNIT.stage} · ${UNIT.years}`, options: { fontSize: 16, color: COL.muted } },
  ], { x: M, y: 0.4, w: 8.2, h: 1.35, sh: true, margin: [6, 20, 6, 20] });
  pics.filter(K.hasImg).slice(0, 2).forEach((k, i) => slide.addImage({ path: K.img(k), x: 8.95 + i * 1.25, y: 0.45, w: 1.15, h: 1.15 }));
  box(slide, [{ text: "How it works", options: { hyperlink: { slide: 2, tooltip: "How this pack works" }, color: COL.navy, bold: true } }], { x: W - M - 1.6, y: 0.45, w: 1.6, h: 0.55, fontSize: 13, fillColor: TINT.sky, align: "center", margin: 2 });
  box(slide, [{ text: "Word wall", options: { hyperlink: { slide: 3, tooltip: "Words we will use" }, color: COL.navy, bold: true } }], { x: W - M - 1.6, y: 1.15, w: 1.6, h: 0.55, fontSize: 13, fillColor: TINT.mint, align: "center", margin: 2 });
  const ls = UNIT.lessons, half = Math.ceil(ls.length / 2), colW = (W - 2 * M - 0.3) / 2;
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
  const lv = [["Mild", 1, "mint", "Start here to build confidence."], ["Medium", 2, "sky", "The main task. Try it first."], ["Spicy", 3, "indigo", "Ready for more? Explain and prove."]];
  lv.forEach(([n, k, c, t], i) => {
    const x = M + i * (cw + 0.3), y = 4.5;
    const ps = 0.5, tot = k * ps + (k - 1) * 0.05;
    for (let j = 0; j < k; j++) slide.addImage({ path: K.img("hot_pepper"), x: x + 0.25 + j * (ps + 0.05), y: y + 0.12, w: ps, h: ps });
    box(slide, n, { x: x + 0.3 + tot + 0.15, y: y + 0.07, w: cw - tot - 0.45, h: 0.6, fontSize: 20, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, t, { x, y: y + 0.85, w: cw, h: 0.95, fontSize: 17, fillColor: TINT[c], align: "center" });
  });
  footer(slide);
  slide.addNotes("Show this slide on the first day. Students can choose their level in every lesson and move up or down at any time. Never label tables or groups by level.");
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
  const pics = (ls.pics || []).filter(K.hasImg).slice(0, 3);
  const ps = 1.4, pg = 0.35, tot = pics.length * ps + (pics.length - 1) * pg;
  pics.forEach((k, i) => slide.addImage({ path: K.img(k), x: W / 2 - tot / 2 + i * (ps + pg), y: 0.75, w: ps, h: ps }));
  const tag = `Lesson ${ls.n}`;
  box(slide, tag, { x: W / 2 - 0.9, y: 2.35, w: 1.8, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", fillColor: COL[UC], align: "center" });
  let tpt = 40; while (tpt > 26 && K.linesFor(ls.title, W - 2.8, tpt, true) > 1) tpt--;
  box(slide, ls.title, { x: 1.4, y: 3.05, w: W - 2.8, h: 1.2, fontSize: tpt, bold: true, align: "center", sh: true });
  if (ls.materials && ls.materials.length) {
    const t = "You need: " + ls.materials.join(", ");
    const h = K.hFor(t, W - 4.4, 19, false, 0.3);
    box(slide, t, { x: 2.2, y: 4.5, w: W - 4.4, h, fontSize: 19, align: "center", fillColor: TINT.sky });
  }
  footer(slide, it);
  slide.addNotes(`Lesson ${ls.n}: ${ls.title}.\n\n${ls.teacherNotes || ""}`);
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
  const y0 = 1.55 + ph + 0.3, n = s.items.length, cols = n <= 2 ? 1 : 2;
  const cw = cols === 1 ? RIGHT - M : (RIGHT - M - 0.3) / 2, rowsN = Math.ceil(n / cols);
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
    const eh = Math.max(0.9, K.hFor("Example: " + s.example, lw, 21, false, 0.3));
    box(slide, [{ text: "Example: ", options: { bold: true, color: COL.mint } }, { text: s.example }], { x: M, y: 2.85 + mh + 0.25, w: lw, h: eh, fontSize: 21, fillColor: TINT.mint });
  }
  if (s.visual) await placeVisual(slide, s.visual, M + lw + 0.35, 1.6, RIGHT - M - lw - 0.35, BOTTOM - 1.6);
};

R.rows = async (slide, s, it) => {
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
  drawRows(slide, rows, { x: sx, y, w: RIGHT - sx, labelW: 1.5, pt: 22 });
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
      box(slide, "", { x, y, w: cw, h: ih, fillColor: TINT[col] });
      const lh = Math.min(0.75, K.hFor(items[i].label, cw - 0.3, 17, false, 0.2));
      if (items[i].visual) await placeVisual(slide, items[i].visual, x + 0.2, y + 0.12, cw - 0.4, ih - lh - 0.25);
      box(slide, items[i].label, { x: x + 0.15, y: y + ih - lh - 0.1, w: cw - 0.3, h: lh, fontSize: 17, fillColor: "FFFFFF", align: "center", margin: 2 });
    }
  }
};

R.talk = async (slide, s, it) => {
  await header(slide, s.title || "Turn and talk", it, s.mode || "We do");
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
  else box(slide, "Think on your own first. Then share with your partner. Be ready to share your partner's idea.", { x: M + 1.0, y: 1.6 + ph + 0.35, w: lw - 1.0, h: 1.1, fontSize: 20, fillColor: TINT.teal });
};

async function hingeLayout(slide, s, it, reveal) {
  await header(slide, reveal ? "Check: " + s.title : s.title, it, "We do");
  const qh = Math.max(0.9, K.hFor(s.question, RIGHT - M, 24, true, 0.3));
  box(slide, s.question, { x: M, y: TOP + 0.05, w: RIGHT - M, h: qh, fontSize: 24, bold: true, sh: true });
  let y = TOP + 0.05 + qh + 0.25, x0 = M, aw = RIGHT - M;
  if (s.visual) { const vw = (RIGHT - M) * 0.4; await placeVisual(slide, s.visual, M, y, vw, BOTTOM - y - (reveal ? 1.0 : 0)); x0 = M + vw + 0.35; aw = RIGHT - x0; }
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
  if (!reveal) { pill(slide, s.prompt || "Write on your mini whiteboard.", M, y, "lav", 15); y += 0.62; }
  let qw = RIGHT - M;
  if (s.visual) { const vw = (RIGHT - M) * 0.4; await placeVisual(slide, s.visual, RIGHT - vw, y, vw, BOTTOM - y); qw = RIGHT - M - vw - 0.35; }
  const rows = s.questions.map((q, i) => ({ label: String(i + 1), text: reveal ? `${q}  →  ${s.answers[i]}` : q, color: reveal ? "mint" : "sky" }));
  drawRows(slide, rows, { x: M, y, w: qw, labelW: 0.7, pt: 26 });
}
R.cfu = async (slide, s, it) => { await cfuLayout(slide, s, it, false); s._notes = "Answers: " + s.answers.map((a, i) => `${i + 1}) ${a}`).join("  "); };
R.cfuReveal = async (slide, s, it) => { await cfuLayout(slide, s, it, true); };

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
  const cols = [["Mild", s.support, "mint", 1], ["Medium", s.core, "sky", 2], ["Spicy", s.extend, "indigo", 3]];
  const gap = 0.3, cw = (RIGHT - M - 2 * gap) / 3;
  const pt = fitPt(cols.map(c => c[1] || ""), cw, 3.3, 24, 14, false, 0.45);
  cols.forEach(([name, text, c, n], i) => {
    const x = M + i * (cw + gap), ps = 0.62, tot = n * ps + (n - 1) * 0.05;
    for (let k = 0; k < n; k++) slide.addImage({ path: K.img("hot_pepper"), x: x + cw / 2 - tot / 2 + k * (ps + 0.05), y: 1.6, w: ps, h: ps });
    box(slide, name, { x, y: 2.38, w: cw, h: 0.62, fontSize: 22, bold: true, color: "FFFFFF", fillColor: COL[c], align: "center" });
    box(slide, text || "", { x, y: 3.15, w: cw, h: 3.4, fontSize: pt, fillColor: TINT[c], valign: "top", margin: [10, 14, 10, 14] });
  });
  s._notes = s.notes || "Students choose where to start. Give the Mild task after a genuine try, not straight away. Students who finish Medium move to Spicy.";
};

R.discuss = async (slide, s, it) => {
  await header(slide, "Discuss and connect", it);
  const qs = s.questions, aw = RIGHT - M - 1.0, gap = 0.2;
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

R.credits = async (slide) => {
  await header(slide, "Thank you");
  const t1 = "This resource is for use by one teacher in their own classroom. Please buy an additional licence for each extra teacher. You may not share, resell or upload this resource or any part of it.";
  const t2 = "Pictures: Microsoft Fluent Emoji (MIT licence). Font: Nunito Sans (SIL Open Font License). Diagrams drawn for this resource.";
  const t3 = `Syllabus outcomes and content: NSW Mathematics K-10 Syllabus © NSW Education Standards Authority (NESA). ${UNIT.fit ? UNIT.fit + "." : ""} Not endorsed by NESA or the NSW Department of Education.`;
  let y = TOP + 0.1;
  for (const [t, c] of [[t1, "teal"], [t2, "sky"], [t3, "lav"]]) { const h = K.hFor(t, RIGHT - M, 20, false, 0.4); box(slide, t, { x: M, y, w: RIGHT - M, h, fontSize: 20, fillColor: TINT[c] }); y += h + 0.25; }
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
plan.push({ kind: "cover" }, { kind: "howto" });
for (let i = 0; i < Math.ceil(UNIT.vocab.length / WW_PER); i++) plan.push({ kind: "wordwall", page: i });
for (const ls of UNIT.lessons) {
  lessonStart[ls.id] = plan.length + 1;
  plan.push({ kind: "lessonTitle", ls }, { kind: "lisc", ls });
  for (const s of ls.slides) {
    plan.push({ kind: "content", ls, s });
    if (s.type === "hinge") plan.push({ kind: "content", ls, s: Object.assign({}, s, { type: "hingeReveal" }) });
    if (s.type === "cfu") plan.push({ kind: "content", ls, s: Object.assign({}, s, { type: "cfuReveal" }) });
  }
  if (ls.exitTicket && ls.exitTicket.length) plan.push({ kind: "exit", ls });
}
plan.push({ kind: "credits" });

// ---------- build ----------
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: K.FONT, bodyFontFace: K.FONT };
pres.title = `${UNIT.title}: ${UNIT.subtitle}`;
pres.subject = `${UNIT.stage} mathematics`;

(async () => {
  pres.defineSlideMaster({ title: "Content", background: { path: await K.themeBackground(THEME_KEY, "content") }, objects: [] });
  pres.defineSlideMaster({ title: "Cover", background: { path: await K.themeBackground(THEME_KEY, "cover") }, objects: [] });
  const SIMPLE = new Set(["rows", "talk", "discuss", "warmup"]);
  for (const item of plan) {
    const slide = pres.addSlide({ masterName: item.kind === "cover" || item.kind === "lessonTitle" ? "Cover" : "Content" });
    if (item.kind === "content") {
      const s = item.s, fn = R[s.type];
      if (!fn) throw new Error("no renderer " + s.type);
      const pics = SIMPLE.has(s.type) && s.pics ? s.pics.filter(K.hasImg) : null;
      if (pics && pics.length) {
        RIGHT = W - M - 2.45;
        await fn(slide, s, item);
        RIGHT = W - M;
        const ps = pics.length === 1 ? 2.0 : 1.7, tot = pics.length * ps + (pics.length - 1) * 0.35, top = TOP + (BOTTOM - TOP - tot) / 2;
        pics.forEach((k, i) => slide.addImage({ path: K.img(k), x: W - M - 2.2 + (2.2 - ps) / 2, y: top + i * (ps + 0.35), w: ps, h: ps }));
      } else await fn(slide, s, item);
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
