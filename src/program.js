// Written unit of work in NSW program format (Word, landscape), built from the same content as the slides.
// usage: node src/program.js units/<id>.json <out.docx> [theme] [A]
const fs = require("fs");
const D = require("docx");
const K = require("./kit.js");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle, Footer, Header, PageNumber,
  TableLayoutType, PageOrientation, Bookmark, InternalHyperlink, LevelFormat, VerticalAlign, PageBreak } = D;

const UNIT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];
const T = K.THEMES[process.argv[4] || "sunshine"];
const PART = process.argv[5] || "";
const ENGLISH = UNIT.subject === "english";
const LESSONS = PART === "A" ? (UNIT.skills || []) : UNIT.lessons;
const LTAG = PART === "A" ? "Skill" : "Lesson";
const RES = K.resources(UNIT);
const LVN = K.levels(UNIT).names;
const UC = T.roles[UNIT.colour || "teal"], TINT = T.tints[UNIT.colour || "teal"], DARK = "1F2A33", NAVY = T.text;
const PW = 16838, PH = 11906, MAR = 640, CW = PW - 2 * MAR;
const c = s => K.clean(String(s == null ? "" : s)).replace(/\[(adj|verb|adv|noun|conj):([^\]]+)\]/g, "$2").replace(/\*\*([^*]+)\*\*/g, "$1");
const subject = ENGLISH ? "English" : "Mathematics";
const SZ = 17; // 8.5 pt body, like the Department format

const R = (t, o = {}) => new TextRun({ text: c(t), size: SZ, ...o });
const RB = (t, o = {}) => R(t, { bold: true, ...o });
const P = (kids, o = {}) => new Paragraph({ spacing: { after: 30, line: 240 }, ...o, children: Array.isArray(kids) ? kids : [typeof kids === "string" ? R(kids) : kids] });
const NUM = (kids, ref, lvl = 0) => new Paragraph({ numbering: { reference: ref, level: lvl }, spacing: { after: 20, line: 240 }, children: Array.isArray(kids) ? kids : [R(kids)] });
const SUB = kids => new Paragraph({ numbering: { reference: "sub", level: 0 }, spacing: { after: 10, line: 236 }, children: Array.isArray(kids) ? kids : [R(kids)] });
const BUL = kids => new Paragraph({ numbering: { reference: "dot", level: 0 }, spacing: { after: 10, line: 236 }, children: Array.isArray(kids) ? kids : [R(kids)] });
const TICK = kids => new Paragraph({ numbering: { reference: "tick", level: 0 }, spacing: { after: 10, line: 236 }, children: Array.isArray(kids) ? kids : [R(kids)] });
const bd = { style: BorderStyle.SINGLE, size: 6, color: "333333" };
const B4 = { top: bd, bottom: bd, left: bd, right: bd };
const cell = (kids, w, o = {}) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: B4, columnSpan: o.span, rowSpan: o.rowSpan, verticalAlign: o.v || VerticalAlign.TOP,
  shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: "auto" } : undefined, margins: { top: 40, bottom: 40, left: 90, right: 90 },
  children: (Array.isArray(kids) ? kids : [kids]).map(k => typeof k === "string" ? P(R(k)) : k) });
const ctr = (t, o = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [RB(t, o)] });

// numbered lists restart per section: make one numbering reference per lesson section
const numberingConfigs = [
  { reference: "dot", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 260, hanging: 180 } } } }] },
  { reference: "sub", levels: [{ level: 0, format: LevelFormat.BULLET, text: "o", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 620, hanging: 180 } } } }] },
  { reference: "tick", levels: [{ level: 0, format: LevelFormat.BULLET, text: "✓", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 260, hanging: 200 } } } }] },
];
let nref = 0;
function newList() { const r = "n" + (nref++); numberingConfigs.push({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 260 } } } }] }); return r; }

// ---------- turning slides into teaching steps ----------
const bold = w => RB(w + " ");
const notesOf = s => s.notes ? [R(" " + s.notes, { italics: true, color: "555555" })] : [];
function stepsFor(s, ls) {
  const out = []; // each: {lead:[runs], subs:[strings]}
  const t = s.type, q = a => (a || []).map(c);
  if (t === "warmup") out.push({ lead: [bold("Warm-up."), R(s.prompt || "")], subs: q(s.items).map((x, i) => s.answers ? `${x} (${s.answers[i]})` : x) });
  else if (t === "reallife") out.push({ lead: [bold("Show"), R(`the photos on the slide '${s.title}'. `), bold("Ask:"), R(s.question)], subs: s.items.map(i => i.caption) });
  else if (t === "reveal") s.steps.forEach(st => out.push({ lead: [bold("Read aloud"), R(`(${st.locator}). Keep the cover hidden. Focus: ${st.focus}. `), bold("Ask:")], subs: q(st.questions) }));
  else if (t === "mentor") out.push({ lead: [bold("Display"), R(`the passage (${s.locator}) from your copy of the text. ${s.task} `), bold("Ask:")], subs: q(s.questions).concat(s.example ? [`Our example: ${s.example}`] : []) });
  else if (t === "anchor") out.push({ lead: [bold("Co-construct"), R(`an anchor chart: ${s.title.replace(/^Anchor chart:\s*/i, "")}. Record:`)], subs: q(s.points) });
  else if (t === "definition") out.push({ lead: [bold("Explain"), R(`the term '${s.term}': ${s.means}${s.example ? ` For example: ${s.example}` : ""}`)] });
  else if (t === "rows" || t === "visual" || t === "display") out.push({ lead: [bold(s.mode === "I do" ? "Explain:" : "Discuss:"), R(s.title + (s.intro ? `. ${s.intro}` : ""))], subs: (s.rows || []).map(r => `${r.label}: ${r.text}`) });
  else if (t === "worked") out.push({ lead: [bold("Model:"), R(`${s.title.replace(/^I do:\s*/i, "")}. ${s.problem}`)], subs: s.steps.map(x => `${x.label || ""}${x.label ? ": " : ""}${x.text}`) });
  else if (t === "model") out.push({ lead: [bold("Model writing:"), R(`${s.title.replace(/^I do:\s*/i, "")}. Think aloud as you write.${s.intro ? " " + s.intro : ""}`)], subs: s.parts ? s.parts.map(p => `${p.label}: ${p.text}`) : [s.text] });
  else if (t === "examples") out.push({ lead: [bold("Examples and non-examples:"), R(s.title)], subs: [`Yes: ${s.yes.map(x => x.label).join("; ")}`, `No: ${s.no.map(x => x.label).join("; ")}`] });
  else if (t === "talk") out.push({ lead: [bold("Turn and talk:"), R(s.prompt)] });
  else if (t === "hinge") out.push({ lead: [bold("Check for understanding"), R(`(hinge question): ${s.question} Options: ${s.options.map((o, i) => "ABCD"[i] + ") " + o).join("  ")}. Answer: ${"ABCD"[s.answer]}.`)], subs: s.why ? [s.why[s.answer]] : [] });
  else if (t === "cfu") out.push({ lead: [bold("Check for understanding."), R(`${s.prompt || "Students show answers on mini whiteboards."}`)], subs: s.questions.map((x, i) => `${x} (${s.answers[i]})`) });
  else if (t === "criteria") out.push({ lead: [bold("Co-construct success criteria."), R(s.stem)], subs: q(s.points) });
  else if (t === "tag") out.push({ lead: [R("Students give "), bold("peer feedback"), R("using the success criteria and the Tell, Ask, Give strategy, then revise their work.")] });
  else if (t === "activity") { const rn = (ls.printables || []).map(p => RES[p.id]).filter(Boolean); out.push({ lead: [bold(s.title.replace(/^Activity:\s*/i, "") + "."), R(`${s.time ? "(" + s.time + ") " : ""}${s.resource ? `Resource: ${s.resource}${rn.length ? ` (Resource ${rn.join(", ")})` : ""}.` : ""}`)], subs: q(s.steps) }); }
  else if (t === "venn") out.push({ lead: [bold("Compare"), R(`using a Venn diagram: ${s.left} and ${s.right}.${s.prompt ? " " + s.prompt : ""}`)] });
  else if (t === "tchart" || t === "table") out.push({ lead: [bold("Complete"), R(`a ${t === "tchart" ? "T-chart" : "table"} with the class: ${s.title}. Columns: ${(s.headers || []).join(", ")}.${s.prompt ? " " + s.prompt : ""}`)] });
  else if (t === "charmap") out.push({ lead: [bold("Build"), R(`a character map of ${s.centre} with evidence from the text.`)], subs: (s.spokes || []).map(x => x.label + (x.text ? `: ${x.text}` : "")) });
  else if (t === "mountain") out.push({ lead: [bold("Plot"), R(`events on a story mountain: ${s.title}.`)], subs: s.stages.map(x => x.label + (x.text ? `: ${x.text}` : "")) });
  else if (t === "flow") out.push({ lead: [bold("Sequence"), R(`using a flow chart: ${s.title}.`)], subs: s.steps.map(x => typeof x === "string" ? x : (x.label || "") + (x.text ? `: ${x.text}` : "")) });
  else if (t === "sort") out.push({ lead: [bold("Sort"), R(`(drag and drop on the slide): ${s.title}. Groups: ${s.headings.join(", ")}.`)], subs: s.answers ? Object.entries(s.answers).map(([k, v]) => `${k}: ${v.join(", ")}`) : [] });
  else if (t === "strips") out.push({ lead: [bold("Sequence"), R(`the strips (drag and drop on the slide): ${s.title}.`)] });
  if (out.length && s.notes && !["discuss"].includes(t)) out[out.length - 1].note = s.notes;
  return out;
}

function lessonTable(ls) {
  const BEGIN = new Set(["warmup", "reallife", "reveal"]);
  const begin = [], core = [], conclude = [];
  let started = false;
  for (const s of ls.slides) {
    if (s.type === "levels") continue;
    if (s.type === "discuss") { conclude.push(s); continue; }
    if (!started && BEGIN.has(s.type)) begin.push(s); else { started = true; core.push(s); }
  }
  if (ls.reallife) begin.unshift(Object.assign({ type: "reallife" }, ls.reallife));
  const right = [];
  const section = (title, mins, slides, pre = []) => {
    right.push(P([RB(`${title}${mins ? ` (${mins} minutes)` : ""}`)], { spacing: { before: 40, after: 20 } }));
    const ref = newList();
    pre.forEach(p => right.push(NUM(p, ref)));
    slides.forEach(s => stepsFor(s, ls).forEach(st => { right.push(NUM(st.lead.concat(st.note ? [R(" " + st.note, { italics: true, color: "555555" })] : []), ref)); (st.subs || []).forEach(x => right.push(SUB(c(x)))); }));
  };
  const total = PART === "A" ? 20 : 60;
  section("Beginning the lesson", PART === "A" ? 3 : 10, begin, [[bold("Share"), R("the learning intention and success criteria. Ask students to say them in their own words.")]]);
  section("Core lesson", PART === "A" ? 14 : 45, core);
  const lv = ls.slides.find(s => s.type === "levels");
  if (lv) {
    right.push(P([RB("Differentiation")], { spacing: { before: 40, after: 20 } }));
    right.push(P([RB("Additional scaffolding: "), R(`(${LVN[0]}) ${lv.support}`)]));
    right.push(P([RB("Core: "), R(`(${LVN[1]}) ${lv.core}`)]));
    right.push(P([RB("Extending and challenging: "), R(`(${LVN[2]}) ${lv.extend}`)]));
  }
  right.push(P([RB("Assessment")], { spacing: { before: 40, after: 10 } }));
  right.push(P([RB("What to look for")]));
  const codes = (UNIT.outcomes || []).map(o => o.code);
  (ls.sc || []).forEach(s => right.push(BUL([R(`Can students ${c(s).replace(/^I can /i, "").replace(/\.$/, "")}?`)])));
  if (ls.assessment) right.push(P([RB("Assessment task: "), R(typeof ls.assessment === "string" ? ls.assessment : ls.assessment.text || "")]));
  section("Concluding the lesson", PART === "A" ? 3 : 5, conclude.map(d => ({ type: "discussQ", d })), []);
  const dq = conclude[0];
  if (dq) { const ref = newList(); right.pop(); right.push(NUM([RB("Ask:")], ref)); dq.questions.forEach(x => right.push(SUB(c(x)))); if (dq.connect) right.push(NUM([RB("Connect:"), R(dq.connect)], ref)); if (ls.exitTicket && ls.exitTicket.length) right.push(NUM([RB("Exit ticket:"), R(ls.exitTicket.map(e => c(e.q)).join("  "))], ref)); }
  // left column
  const L = 4300, Rw = CW - L;
  const left = [];
  left.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [RB(ls.title, { size: 20 })] }));
  const leftHead = t => new Paragraph({ alignment: AlignmentType.CENTER, shading: { fill: TINT, type: ShadingType.CLEAR, color: "auto" }, spacing: { before: 60, after: 40 }, children: [RB(t, { size: 19 })] });
  left.push(leftHead("What are we learning today?"));
  left.push(P([RB("Learning intention:")]));
  left.push(P([RB("We are learning: ")]));
  left.push(BUL([R(c(ls.li).replace(/^(We are|Students are) learning (to |about )?/i, "to "))]));
  left.push(P([RB("Success criteria:")], { spacing: { before: 60, after: 20 } }));
  (ls.sc || []).forEach(s => left.push(TICK([R(s)])));
  left.push(leftHead("Resources"));
  (ls.printables || []).forEach(p => left.push(BUL([R(`Resource ${RES[p.id]}: ${p.title}${p.kind === "worksheet" ? " (3 levels)" : ""}`, { color: UC, underline: {} })])));
  left.push(BUL([R(`${LTAG} ${ls.n} slides`)]));
  (ls.materials || []).forEach(m => left.push(BUL([R(m)])));
  left.push(leftHead("Teacher notes"));
  if (ls.teacherNotes) left.push(P([R(ls.teacherNotes)]));
  const bm = new Bookmark({ id: `${LTAG.toLowerCase()}${ls.n}`, children: [RB(`${LTAG} ${ls.n}`, { size: 20 })] });
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [L, Rw], layout: TableLayoutType.FIXED, rows: [
    ...programHeader([L, Rw]),
    new TableRow({ children: [cell(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [bm] }), L, { fill: TINT }), cell(ctr("Teaching and learning experiences", { size: 19 }), Rw, { fill: TINT })] }),
    new TableRow({ children: [cell(left, L), cell(right, Rw)] }),
  ] });
}

function programHeader(ws) {
  const CWt = ws.reduce((a, b) => a + b, 0);
  const cols = [1600, CWt - 1600 - 2200 - 4 * 700, 2200, 700, 700, 700, 700];
  const head = new TableRow({ children: [cell(ctr(`${UNIT.stage} ${subject} Program${PART === "A" ? " (Component A)" : ""}`, { color: "FFFFFF", size: 20 }), CWt, { fill: DARK, span: 7 })] });
  const r2 = new TableRow({ children: [cell(ctr("Stage"), cols[0], { fill: TINT }), cell(ctr("Unit"), cols[1], { fill: TINT }), cell(ctr("Duration"), cols[2], { fill: TINT }), cell(ctr("Term"), cols[3] * 4, { fill: TINT, span: 4 })] });
  const stage = (UNIT.stage || "").replace("Stage ", "S").replace("Early Stage 1", "ES1");
  const unitName = ENGLISH ? `${UNIT.departmentUnit ? UNIT.departmentUnit.replace(/^Stage \d+ /, "") + " · " : ""}${UNIT.title}` : `${UNIT.subtitle} · ${UNIT.title}`;
  const r3 = new TableRow({ children: [cell(ctr(stage, { bold: false }), cols[0]), cell(ctr(unitName, { bold: false }), cols[1]), cell(ctr(`${UNIT.weeks || ""} weeks`, { bold: false }), cols[2]), ...[1, 2, 3, 4].map(t => cell(ctr(String(t), { bold: false }), cols[3]))] });
  return [head, r2, r3];
}

// ---------- overview page ----------
function overview() {
  const L = 7000, Rw = CW - L;
  const desc = ENGLISH
    ? `This ${UNIT.weeks}-week unit develops ${String(UNIT.concept || "narrative").toLowerCase()}${UNIT.supportingConcept ? " and " + String(UNIT.supportingConcept).toLowerCase() : ""}${UNIT.mentorText ? ` through the mentor text ${UNIT.mentorText.title} by ${UNIT.mentorText.author}` : ""}. ${PART === "A" ? "Component A skill lessons build spelling, morphology, vocabulary, grammar, punctuation, fluency and handwriting." : "Component B lessons move from reading and analysing the text to planning, drafting and revising students' own writing."}`
    : `This ${UNIT.weeks}-week unit covers ${UNIT.subtitle}. ${(UNIT.content || []).slice(0, 4).map(x => c(x).replace(/\.?$/, ".")).join(" ")}`;
  const rows = [
    ...programHeader([L, Rw]),
    new TableRow({ children: [cell(ctr("Unit description"), L, { fill: TINT }), cell(ctr("Outcomes"), Rw, { fill: TINT })] }),
    new TableRow({ children: [cell([P([RB("Duration: "), R(`${UNIT.weeks} weeks, ${LESSONS.length} ${LTAG.toLowerCase()}s of about ${PART === "A" ? "15 to 20" : "60"} minutes`)]), P(R(desc)), P([RB("Please note: "), R("each lesson matches a lesson in the slides. Fuller teaching notes are in the slide notes.")]), ...(UNIT.mentorText ? [P([RB("Mentor text: "), R(`${UNIT.mentorText.title} by ${UNIT.mentorText.author}. You need a copy of the book. Page references are to the ${UNIT.mentorText.edition || "Puffin edition"}.`)])] : [])], L),
      cell((UNIT.outcomes || []).map(o => P([RB(o.code + " "), R(o.text)])), Rw)] }),
  ];
  const t1 = new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [L, Rw], layout: TableLayoutType.FIXED, rows });
  const c1 = 1600, c2 = CW - c1 - 4000;
  const lrows = [new TableRow({ tableHeader: true, children: [cell(ctr(LTAG), c1, { fill: TINT }), cell(ctr("Title"), c2, { fill: TINT }), cell(ctr(ENGLISH ? "Week / Notes" : "Registration / Notes"), 4000, { fill: TINT })] })];
  LESSONS.forEach(l => lrows.push(new TableRow({ children: [
    cell(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new InternalHyperlink({ anchor: `${LTAG.toLowerCase()}${l.n}`, children: [new TextRun({ text: String(l.n), style: "Hyperlink", size: SZ + 2 })] })] }), c1),
    cell(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new InternalHyperlink({ anchor: `${LTAG.toLowerCase()}${l.n}`, children: [new TextRun({ text: c(l.title), style: "Hyperlink", size: SZ + 2 })] })] }), c2),
    cell(ctr(l.week ? `Week ${l.week}${l.focus ? " · " + l.focus : ""}` : "", { bold: false }), 4000)] })));
  const t2 = new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [c1, c2, 4000], layout: TableLayoutType.FIXED, rows: lrows });
  return [t1, new Paragraph({ spacing: { after: 160 }, children: [] }), t2];
}

const attribution = ENGLISH
  ? `Designed to accompany the NSW Department of Education ${UNIT.departmentUnit || ""} (© State of New South Wales (Department of Education), 2023, CC BY 4.0). Syllabus outcomes © NESA. Not endorsed by NESA or the NSW Department of Education.`
  : `Syllabus outcomes © NESA. Not endorsed by NESA or the NSW Department of Education.`;
const kids = [...overview()];
LESSONS.forEach(l => { kids.push(new Paragraph({ children: [new PageBreak()] })); kids.push(lessonTable(l)); });

const doc = new Document({
  styles: { default: { document: { run: { font: "Century Gothic", size: SZ } } }, paragraphStyles: [] },
  numbering: { config: numberingConfigs },
  sections: [{
    properties: { page: { size: { width: PH, height: PW, orientation: PageOrientation.LANDSCAPE }, margin: { top: 560, bottom: 560, left: MAR, right: MAR } } },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: c(attribution), size: 13, italics: true, color: "555555" }), new TextRun({ text: "\t" }), new TextRun({ children: [PageNumber.CURRENT], size: 14 })], tabStops: [{ type: "right", position: CW }] })] }) },
    children: kids,
  }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log("program", require("path").basename(OUT), LESSONS.length, LTAG.toLowerCase() + "s"); });
