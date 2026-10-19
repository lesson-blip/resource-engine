// Applies the content fixes from qa/REVIEW.md (20 Oct 2026) to the fractions unit.
const fs = require("fs");
const F = "units/s2-fractions-a.json";
const u = JSON.parse(fs.readFileSync(F, "utf8"));
const L = n => u.lessons[n - 1];
const P = (n, id) => L(n).printables.find(p => p.id === id);
const LV = (n, id, l) => P(n, id).levels.find(x => x.level === l);
const slide = (n, pred) => L(n).slides.find(pred);
const set = (o, patch) => Object.assign(o, patch);

// 1-8 answers given away by the teach box, or missing picture
set(LV(2, "l2-ws", "Extend").items[0], { q: "A 28 cm strip is cut into quarters. How long is 3/4 of the strip?", answer: "21 cm" });
set(LV(9, "l9-ws", "Extend").items[0], { q: "Which is bigger: 5/6 or 3/4? Explain.", answer: "5/6. It is only 1/6 short of 1, and 3/4 is 1/4 short. 1/6 is the smaller gap." });
LV(3, "l3-ws", "Extend").teach.text = "Halve each third to make sixths. 1/3 lines up with 2/6.";
set(LV(5, "l5-ws", "Support").items[1], { q: "Write one whole as eighths.", answer: "8/8" });
set(LV(5, "l5-ws", "Support").items[4], { q: "What fraction is marked with the dot?", visual: { kind: "numberLine", from: 0, to: 1, ticks: 5, labels: ["0", "", "", "", "", "1"], highlight: [5] }, answer: "5/5, which is 1 whole" });
set(LV(6, "l6-ws", "Support").items[0], { visual: { kind: "fractionStrip", parts: 5, shaded: 4, labels: true }, answer: "1/5" });
set(LV(8, "l8-ws", "Support").items[2], { q: "Finish the fifths family: 1/5, ___, 3/5, ___, 5/5", answer: "2/5, 4/5" });
set(LV(9, "l9-ws", "Support").items[0].parts[0], { q: "1/3 or 1/4", answer: "1/3" });
set(LV(7, "l7-ws", "Support").items[0], { q: "This piece is 1/2 of a strip. How many pieces this size make the whole strip?", visual: { kind: "fractionStrip", parts: 1, shaded: 1, labels: false } });
set(LV(7, "l7-ws", "Support").items[1], { q: "This piece is 1/3 of a strip. How many pieces this size make the whole strip?", visual: { kind: "fractionStrip", parts: 1, shaded: 1, labels: false } });
// 9 long answer
LV(8, "l8-ws", "Extend").items[2].answer = "Halfway is in the middle of the second third, so it is not on a thirds mark.";
// 13 L1 hinge
set(slide(1, s => s.type === "hinge"), {
  question: "A 10 cm strip is cut into pieces. Which cut makes halves?",
  options: ["4 cm and 6 cm", "5 cm and 5 cm", "Five pieces of 2 cm", "10 cm and 10 cm"], answer: 1,
  why: ["Wrong: 2 pieces are not halves unless they are equal. This child is counting pieces, not checking size.", "Right: 2 equal parts, so each part is one half.", "Wrong: the parts are equal, but there are 5 of them, so each is 1/5.", "Wrong: this child doubled instead of halving. Each half must be shorter than the whole."],
});
// 14 related fractions vs family
LV(8, "l8-ws", "Extend").teach.text = "Halving makes related fractions. Halves, quarters and eighths are related. So are thirds and sixths. They line up on the wall, but each row is its own family.";
slide(8, s => s.type === "hinge").why[2] = "Wrong: these line up, so they are related fractions, but the denominators are different, so they are 3 different families.";
L(8).teacherNotes = L(8).teacherNotes.replace(/^[^.]*\./, "In this unit a fraction family means fractions with the same denominator. The syllabus calls fractions made by halving (halves, quarters, eighths) related fractions; use both words.");
// 15 past 1 is extension only
slide(5, s => s.title === "Fractions keep going past 1").title = "Looking ahead: fractions past 1";
const cfu5 = slide(5, s => s.type === "cfu"); cfu5.questions[3] = "Counting in quarters, what comes after 3/4?"; cfu5.answers[3] = "4/4, which is 1 whole";
u.assessment.rubric[1].A = "Places and names fractions on any 0 to 1 line, explains spaces vs marks, and can extend past 1";
// 16 label 1 on count-to-one line
L(5).slides[3].visual.labels = ["0", "1/5", "", "", "", "1"];
// 21 fraction names on the word wall
const names = [
  ["one half", "One of 2 equal parts of a whole. Two halves make one whole.", 2],
  ["one quarter", "One of 4 equal parts of a whole. Four quarters make one whole.", 4],
  ["one third", "One of 3 equal parts of a whole. Three thirds make one whole.", 3],
  ["one fifth", "One of 5 equal parts of a whole. Five fifths make one whole.", 5],
  ["one eighth", "One of 8 equal parts of a whole. Eight eighths make one whole.", 8],
];
const have = new Set(u.vocab.map(v => v.word));
names.forEach(([w, m, p]) => { if (!have.has(w)) u.vocab.push({ word: w, means: m, visual: { kind: "fractionStrip", parts: p, shaded: 1, labels: true }, pic: null }); });
// 23 game rule
L(5).printables.find(p => p.kind === "game").rules[0] = "Choose one track together. Both players race on that track.";
// 25 to 31 wording and accepted answers
const fixAns = (o, from, to) => { if (o.answer && o.answer.includes(from)) o.answer = to; };
LV(9, "l9-ws", "Core").items[4].answer = "1/3 is 2 spaces from 0 and 1/2 is 3 spaces from 0. 1/3 is closer to 0.";
LV(2, "l2-ws", "Extend").items[4].answer = "3/8 is 3 spaces from 0. 3/4 is 6 spaces from 0 (6/8). 3/4 is closer to 1.";
slide(6, s => s.type === "hinge").why[0] = "Wrong: this child counted the 1 line between the 2 white parts instead of the 2 parts.";
slide(9, s => s.type === "hinge").why[3] = "Wrong: 1/5 is in the middle of the list but not the largest. Fifths are shorter than thirds.";
const swapAll = (o, a, b) => { const s = JSON.stringify(o); return s.includes(a) ? JSON.parse(s.split(a).join(b)) : o; };
u.lessons = swapAll(u.lessons, "fair compare", "fair comparison");
u.lessons = swapAll(u.lessons, "Same whole, fair comparison", "Same whole, fair comparison");
u.lessons = swapAll(u.lessons, "a strip of string", "a piece of string");
LV(6, "l6-ws", "Support").items[2].answer = LV(6, "l6-ws", "Support").items[2].answer.replace(/^2\/8$/, "2/8 (or 1/4)");
for (const s of u.assessment.sections) for (const it of s.items) if (it.answer === "6/8") it.answer = "6/8 (or 3/4)";
// 32 teach-box lines give answers away
const t2 = LV(2, "l2-ws", "Core").teach.visual; if (t2 && t2.kind === "numberLine") t2.labels = t2.labels.map((l, i) => i === 0 || i === 1 || i === t2.ticks ? l : "");
for (const [n, id] of [[3, "l3-ws"], [4, "l4-ws"]]) { const v = LV(n, id, "Core").teach.visual; if (v && v.kind === "numberLine") { v.labels = v.labels.map((l, i) => i === 0 || i === 1 || i === v.ticks ? l : ""); v.highlight = []; } }
// 34 L5 hinge wording
const h5 = slide(5, s => s.type === "hinge"); h5.why[2] = h5.why[2].replace(/counted the 3 marks between 0 and 1[^.]*\./, "stopped one jump short. 3/4 is one quarter short of the whole.");
// 12 poster text per lesson
const posters = { 6: "We have 3/4. The missing part is 1/4. 3/4 + 1/4 = 1", 9: "Same whole: fewer parts means longer parts. 1/3 is longer than 1/5." };
for (const [n, t] of Object.entries(posters)) L(+n).poster = t;
fs.writeFileSync(F, JSON.stringify(u, null, 2));
console.log("applied");
