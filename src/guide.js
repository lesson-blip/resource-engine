// Teacher guide (Word) for one unit.
// usage: node src/guide.js units/<id>.json <out.docx>
const fs = require("fs");
const path = require("path");
const D = require("docx");
const K = require("./kit.js");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, PageBreak, LevelFormat, BorderStyle, ExternalHyperlink, Footer, PageNumber, TableLayoutType, ImageRun } = D;

const UNIT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = process.argv[3];
const T = K.THEMES[process.argv[4] || "ocean"], UC = T.roles[UNIT.colour || "teal"];
const NAVY = T.text, MINT = T.roles.mint, SKY = T.roles.sky;
const W = 11906, MAR = 1134, CW = W - 2 * MAR;
const c = s => K.clean(s);
const R = (t, o = {}) => new TextRun({ text: c(t), ...o });
const P = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: Array.isArray(t) ? t : [R(t)] });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [R(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [R(t)] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [R(t)] });
const B = t => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60, line: 276 }, children: Array.isArray(t) ? t : [R(t)] });
const PB = () => new Paragraph({ children: [new PageBreak()] });
const link = (t, u) => new ExternalHyperlink({ link: u, children: [new TextRun({ text: t, style: "Hyperlink" })] });
const bd = { style: BorderStyle.SINGLE, size: 4, color: "C9D4E0" };
const cell = (content, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd },
  shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
  margins: { top: 80, bottom: 80, left: 110, right: 110 },
  children: (Array.isArray(content) ? content : [content]).map(x => typeof x === "string" ? new Paragraph({ spacing: { after: 40, line: 264 }, children: [R(x, { bold: o.bold, color: o.color })] }) : x),
});
const table = (ws, rows) => new Table({ width: { size: ws.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: ws, layout: TableLayoutType.FIXED,
  rows: rows.map((r, i) => new TableRow({ cantSplit: true, tableHeader: i === 0, children: r.map((x, j) => cell(x, ws[j], i === 0 ? { bold: true, color: "FFFFFF", fill: UC } : {})) })) });
const note = (title, items, fill = T.tints.teal) => new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [CW], layout: TableLayoutType.FIXED, rows: [new TableRow({ children: [cell([new Paragraph({ spacing: { after: 80 }, children: [R(title, { bold: true, color: UC, size: 24 })] }), ...items.map(B)], CW, { fill })] })] });

const k = [];
const img = f => new ImageRun({ type: "png", data: fs.readFileSync(K.img(f)), transformation: { width: 80, height: 80 } });
k.push(new Paragraph({ spacing: { before: 1000, after: 300 }, alignment: AlignmentType.CENTER, children: (UNIT.lessons[0].pics || []).filter(K.hasImg).slice(0, 3).map(img) }));
k.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [R(`${UNIT.stage} · ${UNIT.years} · NSW Mathematics`, { color: UC, bold: true, size: 28 })] }));
k.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [R(UNIT.title, { bold: true, size: 60, color: NAVY })] }));
k.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [R(`${UNIT.subtitle} · Teacher guide`, { size: 30, color: NAVY })] }));
k.push(note("In this pack", [
  `Teaching slides for ${UNIT.lessons.length} lessons (PowerPoint, also opens in Google Slides). Teacher notes and answers are in the slide notes.`,
  "Worksheets for every lesson in three levels (Mild, Medium, Spicy), in colour and black and white.",
  "An answer key: the same pages with the answers written in.",
  "A pre-test, an end of unit assessment with student self-check, and an A to E rubric.",
  "Games and card sets, the flip book, word wall cards and posters.",
  "This guide: how a lesson runs, differentiation, the evidence, and notes for every lesson.",
]));
k.push(PB());

k.push(H1("1. The unit at a glance"));
k.push(P(`${UNIT.fit || ""}. The unit runs for about ${UNIT.weeks} weeks. Lessons are about 60 minutes.`));
k.push(table([1000, 3200, 5438], [["Lesson", "Title", "Learning intention"], ...UNIT.lessons.map(l => [String(l.n), l.title, l.li])]));
k.push(H2("Syllabus outcomes"));
UNIT.outcomes.forEach(o => k.push(B([R(o.code + ": ", { bold: true }), R(o.text)])));
k.push(H2("Content covered"));
UNIT.content.forEach(x => k.push(B(x)));

k.push(PB());
k.push(H1("2. How a lesson runs"));
k.push(table([2300, 4000, 3338], [
  ["Part", "What happens", "Why"],
  ["Learning intention and success criteria", "Read them together. Students say them in their own words.", "Students who know what success looks like do better (CESE What Works Best)."],
  ["Warm-up (5 min)", "Revisit earlier learning on mini whiteboards. No scores.", "Spaced retrieval is one of the best supported practices (AERO)."],
  ["I do, We do", "Model with strips and number lines, then try one together.", "Explicit teaching helps most with new content, especially for students who find maths hard (CESE 2025)."],
  ["Turn and talk", "30 to 45 seconds of partner talk on one question.", "Talk builds reasoning and gives every student a turn (Attard)."],
  ["Hinge question", "Everyone answers A, B, C or D at once. Each wrong answer is a known misconception.", "Shows in seconds who is ready to move on (AERO formative assessment)."],
  ["Show me", "Three or four questions on mini whiteboards, then the answer slide.", "Decide who goes to the activity and who stays for another We do."],
  ["Activity and Choose your challenge", "One task at three levels. Students choose and can change.", "Enabling and extending prompts keep everyone on the same maths (Sullivan and colleagues)."],
  ["Discuss and connect, exit ticket", "Share two or three pieces of work, link to the success criteria, then two exit questions.", "Exit tickets form tomorrow's teacher table group."],
]));

k.push(H1("3. Every learner"));
k.push(P("Mild, Medium and Spicy are three versions of the same task. Students choose where to start and can move at any time. Never label tables or groups by level: fixed ability groups widen gaps (Siemon; Victorian Department of Education)."));
["Give the Mild version after a genuine try, so students still get the benefit of productive struggle.",
  "Use the exit ticket to choose four to six students for a 10 to 15 minute teacher table the next day. Change the group often.",
  "Keep paper strips and number lines out for anyone who wants them. Let students put them away when they are ready.",
  "Spicy tasks ask students to explain, prove and generalise, not to do more of the same."].forEach(x => k.push(B(x)));
k.push(H2("Common misconceptions"));
k.push(table([4600, 5038], [["Students may think", "What helps"], ...UNIT.misconceptions.map(m => [m.think, m.fix])]));
k.push(H2("Words we use"));
k.push(table([2300, 7338], [["Word", "Kid-friendly meaning"], ...UNIT.vocab.map(v => [v.word, v.means])]));

k.push(PB());
k.push(H1("4. Lesson notes"));
for (const l of UNIT.lessons) {
  k.push(H2(`Lesson ${l.n}: ${l.title}`));
  k.push(P([R("Learning intention: ", { bold: true }), R(l.li)]));
  k.push(P([R("Success criteria: ", { bold: true }), R(l.sc.join("; "))]));
  if (l.materials) k.push(P([R("You need: ", { bold: true }), R(l.materials.join(", "))]));
  k.push(P([R("Notes: ", { bold: true }), R(l.teacherNotes || "")]));
  const pr = (l.printables || []).map(p => p.title + (p.kind === "worksheet" ? " (3 levels)" : ""));
  if (pr.length) k.push(P([R("Print: ", { bold: true, color: MINT }), R(pr.join("; "))]));
  if (l.exitTicket) k.push(P([R("Exit ticket answers: ", { bold: true, color: SKY }), R(l.exitTicket.map((e, i) => `${i + 1}) ${e.answer}`).join("  "))]));
}

k.push(PB());
k.push(H1("5. Assessment"));
k.push(P("Give the pre-test before Lesson 1 to plan your first teacher table groups. Give the assessment after the last lesson. The self-check at the end helps students reflect, and the rubric gives a grade on the A to E scale."));
k.push(table([2400, 1450, 1450, 1450, 1450, 1438], [["Criteria", "A", "B", "C", "D", "E"], ...UNIT.assessment.rubric.map(r => [r.criteria, r.A, r.B, r.C, r.D, r.E])]));

k.push(H1("6. References"));
[["NSW Education Standards Authority (2022). Mathematics K-10 Syllabus.", "https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-k-10-2022"],
 ["CESE (2025). What Works Best 2025: Explicit teaching.", "https://education.nsw.gov.au/content/dam/main-education/about-us/educational-data/cese/What_Works_Best_2025_Evidence_guide_explicit_teaching.pdf"],
 ["AERO (2021, updated 2026). Spacing and retrieval practice guide.", "https://www.edresearch.edu.au/guides-resources/practice-guides/spacing-and-retrieval-practice-guide-full-publication"],
 ["Attard, C. (2015). Engagement and mathematics: What does it look like in your classroom? Journal of Professional Learning, NSW Teachers Federation.", "https://cpl.nswtf.org.au/journal/semester-2-2015/engagement-and-mathematics-what-does-it-look-like-in-your-classroom/"],
 ["AERO (2026). At a glance: Formative assessment.", "https://www.edresearch.edu.au/guides-resources/practice-guides/glance-formative-assessment"],
 ["Clarke, D., Roche, A., Cheeseman, J. & Sullivan, P. (2014). Encouraging students to persist when working on challenging tasks.", "https://files.eric.ed.gov/fulltext/EJ1093262.pdf"],
 ["Clarke, D. M., Roche, A. & Mitchell, A. (2008). Ten practical tips for making fractions come alive and make sense.", "https://acuresearchbank.acu.edu.au/item/8v1wx/ten-practical-tips-for-making-fractions-come-alive-and-make-sense"],
 ["Siemon, D. Issues in the Teaching of Mathematics: Ability Grouping. Victorian Department of Education.", "https://www.education.vic.gov.au/Documents/school/teachers/teachingresources/discipline/maths/ability-grouping.pdf"],
].forEach(([t, u]) => k.push(P([R(t + " "), link(u, u)])));
k.push(H2("Licence and credits"));
k.push(P("One licence covers one teacher and their own students. Pictures: Microsoft Fluent Emoji (MIT licence). Fonts: Nunito Sans and Edu NSW ACT Foundation (SIL Open Font License). Syllabus outcomes © NESA. Not endorsed by NESA or the NSW Department of Education."));

const doc = new Document({
  creator: "Resource Engine", title: `${UNIT.title}: Teacher guide`,
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: "1F2D3D" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, color: UC }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: NAVY }, paragraph: { spacing: { before: 220, after: 110 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: SKY }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] }] },
  sections: [{ properties: { page: { size: { width: W, height: 16838 }, margin: { top: MAR, bottom: MAR, left: MAR, right: MAR } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R(`${UNIT.title} · Teacher guide · Page `, { size: 16, color: "8AA0B8" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "8AA0B8" })] })] }) },
    children: k }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log("guide", path.basename(OUT)); });
