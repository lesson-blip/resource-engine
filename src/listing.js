// Builds what you need to list the product: square cover tiles, a preview PDF and the listing text.
// usage: node src/listing.js units/<id>.json <productDir>
// Expects in productDir: the slide deck exported to PDF (deck.pdf in .work) and the printables PDFs.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const K = require("./kit.js");

const UNIT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const DIR = path.resolve(process.argv[3]);
const WORK = path.join(DIR, ".work");
const OUT = path.join(DIR, "Listing");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(WORK, { recursive: true });
const T = K.THEMES[process.argv[4] || "ocean"], UC = UNIT.colour || "teal";
const C = Object.fromEntries(Object.entries(T.roles).map(([k, v]) => [k, "#" + v]));
const TI = Object.fromEntries(Object.entries(T.tints).map(([k, v]) => [k, "#" + v]));
const FILE = f => "file://" + f;
const FONTS = path.join(K.ASSETS, "fonts");
const esc = s => K.clean(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const t = UNIT.title.replace(/[^A-Za-z0-9]+/g, "_");
const find = re => fs.readdirSync(DIR).find(f => re.test(f));

// ---------- counts for claims ----------
const L = UNIT.lessons;
const nWs = L.reduce((a, l) => a + (l.printables || []).filter(p => p.kind === "worksheet").reduce((b, p) => b + p.levels.length, 0), 0);
const nGames = L.reduce((a, l) => a + (l.printables || []).filter(p => p.kind !== "worksheet").length, 0);
const nSlides = Number(fs.readFileSync(path.join(WORK, "slidecount.txt"), "utf8"));
const nAssess = UNIT.assessment.sections.reduce((a, s) => a + s.items.length, 0);

// ---------- page images ----------
function pages(pdf, prefix, list, dpi = 110) {
  const out = [];
  for (const p of list) {
    const base = path.join(WORK, `${prefix}-${p}`);
    execFileSync("pdftoppm", ["-jpeg", "-r", String(dpi), "-f", String(p), "-l", String(p), "-singlefile", path.join(DIR, pdf), base]);
    out.push(FILE(base + ".jpg"));
  }
  return out;
}
const deckPdf = path.relative(DIR, path.join(WORK, "deck.pdf"));
const wsPdf = find(/_Worksheets_Colour\.pdf$/), keyPdf = find(/_Answer_Key\.pdf$/), asPdf = find(/_Assessment\.pdf$/), fbPdf = find(/_Flip_Book\.pdf$/), wwPdf = find(/_Word_Wall\.pdf$/), poPdf = find(/_Posters\.pdf$/);
// the first lesson starts at slide 4; pick a spread of slide types from lesson 1
const S = pages(deckPdf, "s", [1, 4, 5, 7, 8, 10, 11, 12, 13, 15, 16], 110);
const TPL = (UNIT.templates || []).length;
const WS = pages(wsPdf, "w", [2 + TPL, 3 + TPL, 4 + TPL, 1]);
const KEY = pages(keyPdf, "k", [3]);
const AS = pages(asPdf, "a", [2]);
const FB = pages(fbPdf, "f", [1]);
const WW = pages(wwPdf, "ww", [1]);
const PO = pages(poPdf, "p", [3, 1]);

const css = `
@font-face { font-family: NS; src: url("${FILE(path.join(FONTS, "NunitoSans-Regular.ttf"))}"); font-weight: 400; }
@font-face { font-family: NS; src: url("${FILE(path.join(FONTS, "NunitoSans-Bold.ttf"))}"); font-weight: 800; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: NS, sans-serif; color: #${T.text}; }
.tile { width: 1080px; height: 1080px; position: relative; overflow: hidden; background: radial-gradient(circle at 100% 0%, ${T.bg.a} 0, transparent 55%), radial-gradient(circle at 0% 100%, ${T.bg.b} 0, transparent 55%), ${T.bg.base}; border: 18px solid ${C[UC]}; }
.banner { position: absolute; left: 0; right: 0; bottom: 0; height: 132px; background: ${C[UC]}; color: #fff; font-weight: 800; font-size: 50px; display: flex; align-items: center; justify-content: center; letter-spacing: 0.5px; }
.big { position: absolute; left: 50px; top: 40px; font-weight: 800; line-height: 0.95; font-size: 112px; letter-spacing: -2px; }
.big small { display: block; font-size: 38px; letter-spacing: 0; color: ${C[UC]}; margin-top: 14px; font-weight: 800; }
.pg { position: absolute; background: #fff; border-radius: 10px; box-shadow: 0 18px 40px rgba(40,60,90,0.28); overflow: hidden; }
.pg img { width: 100%; display: block; }
.pill { position: absolute; color: #fff; font-weight: 800; border-radius: 999px; padding: 12px 28px; font-size: 32px; box-shadow: 0 8px 18px rgba(40,60,90,0.2); }
.check { list-style: none; position: absolute; left: 60px; top: 175px; font-size: 38px; line-height: 1.6; font-weight: 800; }
.check li::before { content: "✓"; display: inline-block; width: 52px; height: 52px; border-radius: 99px; background: ${C.mint}; color: #fff; text-align: center; line-height: 52px; margin-right: 18px; font-size: 30px; }
.h2 { position: absolute; left: 50px; top: 45px; font-size: 76px; font-weight: 800; letter-spacing: -1px; }
.lv { position: absolute; top: 200px; width: 300px; text-align: center; }
.lv .tag { color: #fff; font-weight: 800; font-size: 34px; border-radius: 99px; padding: 8px 0; margin-bottom: 14px; }
.lv img.p { width: 34px; }
.dots { display: inline-flex; gap: 7px; vertical-align: middle; margin-right: 6px; } .dots i { width: 16px; height: 16px; border-radius: 50%; background: #fff; display: inline-block; }
`;
const LVS = K.levels(UNIT);
const peps = n => LVS.marker === "chillies" ? `<img class="p" src="${FILE(K.img("hot_pepper"))}">`.repeat(n) : `<span class="dots">${"<i></i>".repeat(n)}</span>`;
const THM = (() => { try { return JSON.parse(fs.readFileSync(path.join(WORK, "themes.json"), "utf8")); } catch (e) { return []; } })();
const nThemes = THM.length;
const slidesLine = nThemes > 1 ? `${L.length} lessons, slides in ${nThemes} themes` : `${L.length} lessons on editable slides`;
const tileIncluded = [slidesLine, `${nWs} worksheets in 3 levels`, `Handwritten answer keys`, `Exit tickets and strips`, `Flip book, word wall, posters`, `Teacher guide and research`];
const included = [nThemes > 1 ? `${L.length} lessons on editable slides in ${nThemes} colour themes: ${THM.map(k => K.THEMES[k].name).join(", ")}` : `${L.length} lessons on editable slides`, `${nWs} worksheets in 3 levels`, `Answer keys in NSW handwriting font`, `Exit ticket slips, paper strips and squared strips`, `Flip book, word wall, posters`, `Teacher notes and research`];

const tiles = [
  `<div class="tile">
    <div class="big">${esc(UNIT.title).toUpperCase().replace(" AS ", "<br>AS ")}<small>${esc(UNIT.stage)} · Years 3 and 4 · NSW syllabus</small></div>
    <div class="pg" style="width:470px; left:560px; top:330px; transform:rotate(4deg)"><img src="${WS[1]}"></div>
    <div class="pg" style="width:600px; left:40px; top:430px; transform:rotate(-3deg)"><img src="${S[6]}"></div>
    <div class="pg" style="width:420px; left:150px; top:690px; transform:rotate(2deg)"><img src="${S[7]}"></div>
    <div class="pill" style="background:${C.indigo}; left:50px; top:350px">Slides + worksheets + test</div>
    <div class="banner">${L.length} lessons · ${nWs} levelled worksheets</div></div>`,
  `<div class="tile">
    <div class="h2">What's included</div>
    <ul class="check">${tileIncluded.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
    <div class="pg" style="width:330px; right:40px; top:200px; transform:rotate(4deg)"><img src="${KEY[0]}"></div>
    <div class="pg" style="width:330px; right:120px; top:520px; transform:rotate(-4deg)"><img src="${AS[0]}"></div>
    <div class="banner">Every printable included</div></div>`,
  `<div class="tile">
    <div class="h2">3 levels every lesson</div>
    ${[0, 1, 2].map(i => [LVS.names[i], i + 1, ["mint", "sky", "indigo"][i], i]).map(([n, k, c, i]) => `<div class="lv" style="left:${45 + i * 335}px"><div class="tag" style="background:${C[c]}">${peps(k)} ${n}</div><div class="pg" style="position:relative; width:300px"><img src="${WS[i]}"></div></div>`).join("")}
    <div class="pill" style="background:${C.lav}; left:50%; transform:translateX(-50%); top:760px; white-space:nowrap">Same maths, every student challenged</div>
    <div class="banner">Differentiated for every learner</div></div>`,
  `<div class="tile">
    <div class="h2">Teaching slides</div>
    ${[1, 2, 3, 4, 5, 8].map((si, i) => `<div class="pg" style="width:470px; left:${45 + (i % 2) * 505}px; top:${175 + Math.floor(i / 2) * 285}px"><img src="${S[si]}"></div>`).join("")}
    <div class="banner">${nThemes > 1 ? `${nSlides} slides · ${nThemes} themes` : `PowerPoint · Google Slides · ${nSlides} slides`}</div></div>`,
  `<div class="tile">
    <div class="h2">Hands-on extras</div>
    <div class="pg" style="width:380px; left:50px; top:190px; transform:rotate(-3deg)"><img src="${FB[0]}"></div>
    <div class="pg" style="width:380px; left:350px; top:250px; transform:rotate(2deg)"><img src="${WW[0]}"></div>
    <div class="pg" style="width:380px; left:650px; top:200px; transform:rotate(4deg)"><img src="${PO[0]}"></div>
    <div class="pill" style="background:${C.teal}; left:60px; top:820px">Flip book</div>
    <div class="pill" style="background:${C.sky}; left:390px; top:840px">Word wall</div>
    <div class="pill" style="background:${C.lav}; left:720px; top:820px">Posters</div>
    <div class="banner">${nGames} games and card sets</div></div>`,
];

// ---------- preview PDF (a short sales deck, A4 portrait) ----------
const pcss = css + `
@page { size: A4; margin: 0; }
.pp { width: 210mm; height: 297mm; padding: 14mm; page-break-after: always; position: relative; overflow: hidden; background: ${T.bg.base}; display: flex; flex-direction: column; gap: 6mm; }
.pp h2 { font-size: 26pt; font-weight: 800; letter-spacing: -0.5px; }
.pp p, .pp li { font-size: 12.5pt; line-height: 1.5; }
.box { background: #fff; border-radius: 5mm; padding: 5mm 6mm; box-shadow: 0 2mm 5mm rgba(60,90,130,0.1); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.shot { background: #fff; border-radius: 3mm; box-shadow: 0 2mm 6mm rgba(40,60,90,0.25); overflow: hidden; position: relative; }
.shot img { width: 100%; display: block; }
.wm::after { content: "PREVIEW"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 40pt; font-weight: 800; color: rgba(15,124,140,0.18); transform: rotate(-25deg); }
.ul li { margin-left: 6mm; }
.cover1 img { width: 100%; border-radius: 4mm; }
`;
const ev = [
  ["Explicit teaching", "I do, We do, You do with mini whiteboard checks every lesson (CESE What Works Best 2025; AERO)."],
  ["Fractions as lengths", "Strips and number lines, not just pizzas, so students see fractions as numbers (Clarke, Roche and Mitchell)."],
  ["Every learner challenged", "One main task with an easier way in and a way to go further, following Sullivan's enabling and extending prompts. Students choose; nobody is labelled."],
  ["Hinge questions", "Each wrong answer matches a common misconception, so you know who to reteach (AERO formative assessment)."],
];
const preview = `
<section class="pp cover1"><img src="TILE0"></section>
<section class="pp"><h2>Would you love to...</h2><div class="box"><ul class="ul">
  <li>teach fractions as lengths and number lines, the way the NSW syllabus asks?</li>
  <li>have a ready lesson for every day, with slides, worksheets and a test that all match?</li>
  <li>challenge your strugglers and your high flyers in the same lesson?</li>
  <li>mark in minutes with answer keys already written in?</li></ul></div>
  <h2>What's included</h2><div class="box"><ul class="ul">${included.map(i => `<li>${esc(i)}</li>`).join("")}<li>${nAssess}-question assessment with self-check and A to E rubric</li></ul></div>
  <div class="box"><p><b>Lessons:</b> ${L.map(l => `${l.n}. ${esc(l.title)}`).join(" · ")}</p></div></section>
<section class="pp"><h2>Inside every lesson</h2><div class="grid2">${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<div class="shot">${`<img src="${S[i]}">`}</div>`).join("")}</div>
  <div class="box"><p>Learning intention and success criteria, warm-up, explicit teaching, turn and talk, a hinge question with a reveal slide, a mini whiteboard check, the activity, Choose your challenge, and Discuss and Connect. Teacher notes are in every slide's notes.</p></div></section>
<section class="pp"><h2>Worksheets in 3 levels</h2><div class="grid2">${WS.slice(0, 3).map(s => `<div class="shot wm"><img src="${s}"></div>`).join("")}<div class="shot wm"><img src="${KEY[0]}"></div></div>
  <div class="box"><p>Every lesson has a Support, Core and Extension worksheet on the same maths (students see ${LVS.names.join(", ")}), each with a teaching box at the top. The answer key is the same pages with the answers written in.</p></div></section>
<section class="pp"><h2>Why it works</h2>${ev.map(([h, p]) => `<div class="box"><p><b>${h}.</b> ${esc(p)}</p></div>`).join("")}
  <div class="grid2"><div class="shot wm"><img src="${AS[0]}"></div><div class="shot wm"><img src="${FB[0]}"></div></div></section>
<section class="pp"><h2>Terms of use</h2><div class="box"><p>One licence is for one teacher and their own students. Additional licences are available at a discount. Please do not share, resell or upload any part of this resource.</p></div>
  <div class="box"><p>Pictures: Microsoft Fluent Emoji (MIT licence). Fonts: Nunito Sans and Edu NSW ACT Foundation (SIL Open Font License). Syllabus content paraphrased from the NSW Mathematics K-10 Syllabus © NESA. This resource is not endorsed by NESA or the NSW Department of Education.</p></div></section>`;

// ---------- listing text ----------
const listing = `# ${UNIT.title}: ${UNIT.subtitle} | ${UNIT.stage} NSW Maths Unit | Slides, Differentiated Worksheets, Assessment

## Suggested titles (pick one, max 80 characters on TpT)
- ${UNIT.subtitle} ${UNIT.stage} NSW Maths Unit | Fractions on a Number Line | Differentiated
- Fractions as Lengths Unit | Year 3 and 4 NSW | Slides, Worksheets, Assessment
- ${UNIT.stage} Fractions Unit | Number Lines and Fraction Strips | NSW Syllabus

## Description

Teach fractions as lengths and numbers on a number line with a complete, ready-to-teach ${L.length}-lesson unit written for the NSW Mathematics K-10 Syllabus (${UNIT.subtitle}). Every lesson comes with editable teaching slides, three levels of worksheets and answer keys, so every student works on the same maths at the right level of challenge.

**What's included**
${included.map(i => `- ${i}`).join("\n")}
- ${nAssess}-question assessment with a student self-check and an A to E marking rubric
- A 5-question pre-test to plan your groups
- Printable exit ticket slips for every lesson

**Lessons**
${L.map(l => `${l.n}. ${l.title}`).join("\n")}

**Every lesson includes**
- Learning intention and success criteria
- Warm-up that revisits earlier learning
- Explicit teaching (I do, We do, You do) with fraction strips and number lines
- Turn and talk, a hinge question with a reveal slide, and a mini whiteboard check
- Differentiated at 3 levels: Support, Core and Extension versions of the same task (students see ${LVS.names.join(", ")}, marked with dots, never ability labels)
- Discuss and Connect, and an exit ticket
- Teacher notes in the slide notes

**Why it works**
- Every worksheet, card set, game board and strip the slides mention is included. You supply string, rulers, scissors and dice.
- Differentiated in every lesson, not just the test
- Built on Australian research (CESE What Works Best, AERO) and the NSW syllabus
- Australian spelling throughout

**Syllabus**
${UNIT.outcomes.map(o => `- ${o.code}: ${o.text}`).join("\n")}
${UNIT.fit ? `\n${UNIT.fit}.` : ""}

**Formats**
PowerPoint slides (open in Google Slides), Word teacher guide, PDF worksheets in colour and black and white, PDF answer key, assessment, exit tickets, flip book, word wall and posters.

## Tags / keywords
fractions, number line, fraction strips, unit fractions, fraction wall, stage 2, year 3, year 4, NSW syllabus, partitioned fractions, differentiated, maths unit, australian

## Price suggestion
Single unit: A$15 to A$19 (TpT US$9 to US$12). Bundle with the next fractions unit for a 20% saving.
`;

(async () => {
  const b = await K.browser();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  const tileFiles = [];
  for (let i = 0; i < tiles.length; i++) {
    const th = path.join(WORK, `tile${i}.html`);
    fs.writeFileSync(th, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${tiles[i]}</body></html>`);
    await pg.goto(FILE(th), { waitUntil: "load" });
    await pg.waitForTimeout(400);
    const f = path.join(OUT, `${t}_Cover_${i + 1}.png`);
    await pg.screenshot({ path: f, clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    tileFiles.push(f);
  }
  await pg.close();
  const pp = await b.newPage();
  const html = path.join(WORK, "preview.html");
  fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${pcss}</style></head><body>${preview.replace("TILE0", FILE(tileFiles[0]))}</body></html>`);
  await pp.goto(FILE(html)); await pp.waitForTimeout(500);
  await pp.pdf({ path: path.join(OUT, `${t}_Preview.pdf`), width: "210mm", height: "297mm", printBackground: true });
  await b.close();
  fs.writeFileSync(path.join(OUT, `${t}_Listing.md`), listing);
  console.log(`listing: ${tileFiles.length} cover tiles, preview PDF, listing text`);
})().catch(e => { console.error(e); process.exit(1); });
