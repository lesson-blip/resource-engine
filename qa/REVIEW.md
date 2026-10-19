# Independent QA review: s2-fractions-a (Fractions as Lengths)

Reviewed 20 Oct 2026. Files: everything in `dist/s2-fractions-a/` (147-slide deck, colour and BW worksheets 36 pp, answer key 33 pp, assessment, flip book, word wall, posters, teacher guide, Listing/). Source: `units/s2-fractions-a.json`. Standard: `docs/STYLE_GUIDE.md`.

## Verdict: READY AFTER FIXES

The maths is accurate. I checked all 297 question/answer pairs from `qa/check.js --answers` by hand, plus every hinge `answer` index and `why` text, every worksheet visual against its question, exit tickets, warm-ups, card sets (including the Mystery Whole answers in the teacher guide) and the assessment. **There are no arithmetic or answer-key errors.** The problems are:

- Seven worksheet questions are answered by the teaching box on the same page.
- One question refers to a picture that is not on the page.
- One answer runs off the answer key page.
- The posters look unfinished.
- The listing has a truncated claim and a "No prep" claim that the pack does not support.

Severity counts: **High 13, Medium 11, Low 10 (34 issues).**

Severity key: High = must fix before listing. Medium = fix before listing if possible, otherwise in v1.1. Low = polish.

---

## HIGH

**1. Worksheets, L2 Spicy (Quarters and eighths, colour p7), Q1 is the worked example in the teach box.**
The teach box says "A 32 cm strip in quarters: 1/4 is 8 cm, so 3/4 is 24 cm." Q1 then asks for 3/4 of a 32 cm strip. The answer is printed above the question.
Fix (`l2-ws` Extend items[0]):
`{"q": "A 28 cm strip is cut into quarters. How long is 3/4 of the strip?", "answer": "21 cm"}`

**2. Worksheets, L9 Spicy (Compare unit fractions, p32), Q1 is the worked example in the teach box.**
The teach box works through 3/4 vs 2/3 and says "so 3/4 is bigger". Q1 asks "Which is bigger: 2/3 or 3/4?"
Fix (`l9-ws` Extend items[0]):
`{"q": "Which is bigger: 5/6 or 3/4? Explain.", "answer": "5/6. It is only 1/6 short of 1, and 3/4 is 1/4 short. 1/6 is the smaller gap."}`

**3. Worksheets, L3 Spicy (Thirds, p10), the teach box answers Q2.**
The teach box says "2/3 lines up with 4/6". Q2 asks "How many sixths make 2/3?"
Fix (`l3-ws` Extend teach.text):
`"Halve each third to make sixths. 1/3 lines up with 2/6."`

**4. Worksheets, L5 Mild (Counting to one whole, p14): the teach box answers Q2 and Q5, and Q5 cannot be solved.**
- The teach box shows "4/4 = 1" on a quarters line with the dot on 4/4.
- Q2 asks "Write one whole as quarters". The answer is in the teach box.
- Q5 shows the same quarters line with the dot at the end. The end of the line has no label, so the whole is undefined and the question cannot be solved from the page.

Fix (`l5-ws` Support items[1] and items[4]):
- `{"q": "Write one whole as eighths.", "answer": "8/8"}`
- `{"q": "What fraction is marked with the dot?", "visual": {"kind": "numberLine", "from": 0, "to": 1, "ticks": 5, "labels": ["0", "", "", "", "", "1"], "highlight": [5]}, "answer": "5/5, which is 1 whole"}`

**5. Worksheets, L6 Mild (Make one whole, p18), the teach box answers Q1.**
The teach box says "3/4 + 1/4 = 1". Q1 shows a strip with 3/4 shaded and asks how much more is needed.
Fix (`l6-ws` Support items[0]):
`{"q": "How much more to make one whole?", "visual": {"kind": "fractionStrip", "parts": 5, "shaded": 4, "labels": true}, "answer": "1/5"}`

**6. Worksheets, L8 Mild (Fraction families, p26), the teach box answers Q3.**
The teach box lists "1/4, 2/4, 3/4 and 4/4 are the quarters family". Q3 says "Finish the quarters family: 1/4, ___, 3/4, ___".
Fix (`l8-ws` Support items[2]):
`{"q": "Finish the fifths family: 1/5, ___, 3/5, ___, 5/5", "answer": "2/5, 4/5"}`

**7. Worksheets, L9 Mild (Compare unit fractions, p30), the teach box answers Q1a.**
The teach box says "1/2 is longer than 1/4". Q1a asks "1/2 or 1/4".
Fix (`l9-ws` Support items[0].parts[0]):
`{"q": "1/3 or 1/4", "answer": "1/3"}`

**8. Worksheets, L7 Mild (Rebuild the whole, p23), Q1 and Q2 say "This piece" but no piece is drawn.**
The questions can still be answered, but "This piece" points at nothing, which will confuse 8-year-olds.
Fix (`l7-ws` Support items[0] and items[1]). Add a visual and reword:
- `{"q": "This piece is 1/2 of a strip. How many pieces this size make the whole strip?", "visual": {"kind": "fractionStrip", "parts": 1, "shaded": 1, "labels": false}, "answer": "2"}`
- The same change for Q2, with "1/3" in the question and answer "3".

**9. Answer key p25 (L8 Spicy Q3): the answer runs past the right margin and is cut off after "shared into 2".**
Fix (`l8-ws` Extend items[2].answer):
`"Halfway is in the middle of the second third, so it is not on a thirds mark."`
The renderer should also wrap or shrink long answers. This is the only overflow I found.

**10. Listing: "Answer keys written in" is truncated in three places.**
It appears on Cover 2, in the Listing.md "What's included" list and on the Preview PDF p2. It looks like a bug on the most visible tile.
Fix in `src/listing.js` line 72: `"Answer keys in NSW handwriting font"`.

**11. Listing claims "Print and go · No prep" (Cover 2) and "no extra resources to find or insert" (Listing.md), but the pack is missing resources the slides tell teachers to use.**
This breaks the honest-claims rule and the rule that everything the teacher is told to use must be in the pack. Missing:
- **Exit ticket slips.** Every exit ticket slide says "On your own. Hand it in before you go." There is no printable slip, and items with a number line would have to be copied by hand. Add a page per lesson with 4 slips per A4.
- **Squared strips.** L3 Mild says "Use a strip 15 squares long". L4 Mild says "Use a strip 10 squares long". Neither strip is in the pack. Add a page of 15-square and 10-square strips.
- **Equal-length blank strips.** L2 needs "paper strips all the same length" and L8 says "Fold and cut strips to build your own wall". Add a page of 6 equal blank strips, about 18 cm, for folding.
- **Claim text.** Change Cover 2's caption to "Every printable included". Change the listing bullet to "Every worksheet, card set and game board the slides mention is included. You supply paper strips, string, rulers and dice."

**12. Posters (Posters.pdf, all 11 pages) look unfinished, and two have garbled text.**
- Content fills only the top 40 to 50% of each A4 page and the rest is blank. Next to TpT best sellers they will look like drafts.
- The L6 poster reads "3/4 of the strip. 1/4. The parts are still quarters." This happens because `printables.js:179` joins row text without the row labels.
- The L9 poster ends before the conclusion ("Fifths cut it into 5 parts.").

Fix:
- (a) In `src/printables.js:179`, use `` `${r.label}: ${r.text}` `` for rows. Better, add an optional `poster` text field per lesson and use it when present. For L6: `"poster": "We have 3/4. The missing part is 1/4. 3/4 + 1/4 = 1"`. For L9: `"poster": "Same whole: fewer parts means longer parts. 1/3 is longer than 1/5."`
- (b) Scale the poster visual and text to fill the page, for example a visual at 170 mm width and body text at 22 pt or more, or lay posters out as A4 landscape.

**13. Slides 12 and 13, L1 hinge "Which strip shows 1/2 shaded?": the options describe strips in words but no strips are shown.**
This is a weak first hinge question, and it is pictured on Cover 1 and Preview p3. The deck builder (`hingeLayout`) cannot put a visual on an option, so reword the question so text options work.
Fix (L1 hinge):
```json
"question": "A 10 cm strip is cut into pieces. Which cut makes halves?",
"options": ["4 cm and 6 cm", "5 cm and 5 cm", "2 cm, 2 cm, 2 cm, 2 cm and 2 cm", "10 cm and 10 cm"],
"answer": 1,
"why": ["Wrong: 2 pieces are not halves unless they are equal. This child is counting pieces, not checking size.",
        "Right: 2 equal parts, so each part is one half.",
        "Wrong: the parts are equal, but there are 5 of them, so each is 1/5.",
        "Wrong: this child doubled instead of halving. Each half must be shorter than the whole."]
```
The longer-term alternative is to add `optionVisuals` support to `hingeLayout`.

## MEDIUM

**14. "Fraction family" conflicts with the NSW idea of related fractions, and the unit is inconsistent with itself.**
- MA2-PF-01 (quoted on the Thank you slide, in the listing and in the guide) describes eighths, sixths and tenths as related fractions formed by halving. Many Australian teachers call halves, quarters and eighths a "fraction family".
- The unit defines family as "same denominator" (vocab, L8 Mild teach box, L8 hinge). The L8 hinge then marks "1/2, 2/4, 4/8" as wrong.
- The L8 Spicy teach box says "Halving makes new families: halves to quarters to eighths". Read alongside the hinge, that phrase invites the related-fractions meaning.
- The teacher guide L8 note says "The syllabus asks students to see that fractions made from the same number of equal parts form a family". I could not confirm that wording in the syllabus.

Fix:
- `l8-ws` Extend teach.text: `"Halving makes related fractions. Halves, quarters and eighths are related. So are thirds and sixths. They line up on the wall, but each row is its own family."`
- L8 hinge why[2]: `"Wrong: these line up, so they are related fractions, but the denominators are different, so they are 3 different families."`
- Teacher guide L8 note, replace the first sentence with: `"In this unit a fraction family means fractions with the same denominator. The syllabus calls fractions made by halving (halves, quarters, eighths) related fractions; use both words."`

**15. Some content goes beyond Partitioned Fractions A.**
Fractions greater than one and equivalence belong to Partitioned Fractions B. They currently appear in:
- L5 slide "Fractions keep going past 1" (I do)
- L5 CFU q4 "Counting in quarters, what comes after 4/4? → 5/4"
- L5 Spicy worksheet and L5 Spicy challenge
- the misconception "Fractions stop at 1"
- rubric A "including past 1"
- the listing tag "equivalent fractions"

Keep them as extension and say so. Do not assess them in the core.
Fix:
- L5 slide title (line 2682): `"Looking ahead: fractions past 1"`.
- L5 CFU questions[3]: `"Counting in quarters, what comes after 3/4?"` with answer `"4/4, which is 1 whole"`.
- Rubric (line 5773) "A": `"Places and names fractions on any 0 to 1 line, explains spaces vs marks, and can extend past 1"`.
- Listing: replace the tag "equivalent fractions" with "fraction strips".

**16. Slide 73 (L5 "We do: Count fifths to one whole"): the number line has no label at 1, so the end of the whole is not shown on a "count to one whole" slide.**
Fix (L5 slides[3].visual.labels): `["0", "1/5", "", "", "", "1"]`.

**17. Worksheets p33 (Face-off cards): the title page is blank except the header and instructions; all 14 cards are on p34.**
This wastes a page and looks broken. Make the card grid start on the header page, as the other card sets do, or move the header onto p34.

**18. Text and labels too small to read in several places.**
- Fraction wall labels in teach boxes on L2 Spicy, L3 Spicy, L4 Spicy, L8 Mild, Medium and Spicy, and L9 Mild and Medium. The eighths and tenths labels are about 2 mm high and clip the cell borders.
- Flip book panel 8 wall.
- Word wall "fraction family" card: the wall sits small and left-aligned.
- Make One Whole eighths card strips.
- L4 Spicy Q3 and Q4 number lines are drawn at half width. "2/10" is unreadable and the tenths ticks are cramped.
- Slide 3 (Words we will use) definitions are about 11 pt, too small to read from the back of a classroom.

Fix:
- Fraction walls under 90 mm wide: drop the eighths and tenths labels or draw them at 7 pt or larger.
- Draw number lines at full content width (L4 Spicy items[2] and [3]).
- Slide 3: split the 10 words over 2 slides.

**19. 20 slides have no teacher notes, but the listing and Preview PDF claim notes on every slide.**
The listing says "Teacher notes in the slide notes". Preview p3 says "Teacher notes are in every slide's notes."
Slides with no notes: 31, 40, 42, 47, 55, 58, 63, 71, 79, 94, 102, 104, 110, 111, 120, 121, 126, 135, 142, 147. These include the word slides for one third, one fifth and unit fraction, plus Thinking backwards, We do 1/4 of a ribbon, Activity: Mystery wholes, Sort into families and I do Compare 1/3 and 1/5.
Fix: add `notes` to those slide objects. "Check your answers" and Thank you slides can have a one-line note. Alternatively, change the claim to "Teacher notes on the teaching slides".

**20. Read_Me_First.txt points to the font licence in "this folder's Fonts readme", but there is no Fonts readme in the folder or the PRODUCT.zip.**
The SIL OFL requires the licence to travel with embedded or bundled fonts. Add `Fonts_Licence.txt` (OFL 1.1 text for Nunito Sans and Edu NSW ACT Foundation) to the dist and the zip, or change the line.

**21. The word wall has no cards for the fraction names the unit teaches.**
The 10 cards are whole, equal parts, fraction, numerator, denominator, unit fraction, number line, estimate and adjust, fraction family and missing part. There are no cards for half, quarter, third, fifth, eighth, sixth or tenth, which are the core Stage 2 vocabulary.
Fix: add to `vocab`, for example:
`{"word": "one third", "means": "One of 3 equal parts of a whole. Three thirds make one whole.", "visual": {"kind": "fractionStrip", "parts": 3, "shaded": 1, "labels": true}, "pic": null}`
Do the same for half, quarter, fifth and eighth. Sixth and tenth are optional.

**22. Listing text (Listing.md).**
- "Why teachers love it" implies reviews the product does not have. Rename it "Why it works" (honest-claims rule).
- Suggested title 3 says "Australian Curriculum Spelling". The Australian Curriculum is ACARA's, not NSW's, so this is misleading. Use "Stage 2 Fractions Unit | Number Lines and Fraction Strips | NSW Syllabus".
- "K–10" uses an en dash. Write "K-10" or "K to 10".
- "Formats" leaves out the Word teacher guide and the PDF flip book, word wall and posters. Use: "PowerPoint slides (open in Google Slides), Word teacher guide, PDF worksheets in colour and black and white, PDF answer key, assessment, flip book, word wall and posters."
- The bullet "Pre-test and assessment" duplicates the two bullets below it. Delete it.

**23. Race to One (worksheets p17), rule 1 contradicts itself.**
It currently reads "Each player chooses a track. Both players use the same track each round."
Fix (`l5-game` rules[0]): `"Choose one track together. Both players race on that track."`

**24. Teacher guide (.docx).**
- Success criteria in the lesson notes run together with no separators, for example "name each part one half I can tell if parts...". Join them with "; " or set them as bullets.
- "Attard" and "CESE assessment guide" are cited in the lesson-run table but are not in the references.
- See also issue 14 about the L8 syllabus claim.

## LOW

**25. Answer keys say "2nd mark" and "3rd mark", which is ambiguous when the unit teaches "count spaces, not marks".**
- `l9-ws` Core items[4].answer: `"1/3 is 2 spaces from 0 and 1/2 is 3 spaces from 0. 1/3 is closer to 0."`
- `l2-ws` Extend items[4].answer: `"3/8 is 3 spaces from 0. 3/4 is 6 spaces from 0 (6/8). 3/4 is closer to 1."`

**26. L6 hinge why[0] talks about "the 1 mark between 3/5 and 1", but the hinge visual is a strip, not a number line.**
Fix: `"Wrong: this child counted the 1 line between the 2 white parts instead of the 2 parts."`

**27. L9 hinge why[3] says "5 parts are shorter than 3 parts", which is not accurate wording.**
Fix: `"Wrong: 1/5 is in the middle of the list but not the largest. Fifths are shorter than thirds."`

**28. "fair compare" is used as a noun.**
- Line 5083 title: `"Same whole, fair comparison"`.
- Line 5487 answer: `"... so it is not a fair comparison."`

**29. L7 "Thinking backwards" key idea (line 3849) is ungrammatical.**
Fix: `"The denominator tells how many of these parts make the whole."`

**30. L3 I do (line 1544) says "a strip of string".**
Fix: `"Make thirds of a piece of string without a ruler."`

**31. Accept equivalent answers.**
- `l6-ws` Support items[2].answer: `"2/8 (or 1/4)"`.
- Assessment 3.2 answer: `"6/8 (or 3/4)"`.

**32. On some Core pages the teach box shows a fully labelled line, so a question can be copied rather than worked out.**
- L2 Core Q1 (missing eighths labels)
- L3 Core Q3 (dot at 2/3)
- L4 Core Q2 (dot at 3/5)

Fix: label only 0, the first unit fraction and 1 in those teach-box lines. For example, L2 Core teach.visual.labels: `["0", "1/8", "", "", "", "", "", "", "1"]`.

**33. Large empty areas.**
- Exit ticket slides: the number line is small at bottom left and about 60% of the slide is blank.
- L6 exit ticket slide is about 75% blank.
- Mystery Whole cards page is two-thirds blank.
- Make One Whole and Fraction Match overflow pages are half or mostly blank.
- Preview PDF pp2, 5 and 6 are mostly blank.

Fix:
- Enlarge exit-ticket visuals and place them under their item.
- Size card grids to fill the page.
- Add the lesson sequence image and a sample answer key page to the preview, and drop the answer-key thumbnail from the "Worksheets in 3 levels" preview page.

**34. L5 hinge why[2] says "counted the 3 marks between 0 and 1", but the hinge shows no number line.**
Fix: add a visual to the hinge, `{"kind": "numberLine", "from": 0, "to": 1, "ticks": 4, "labels": ["0", "", "", "", "1"], "highlight": []}`, or reword: `"Wrong: 3/4 is one quarter short of the whole."`

---

## Checked and correct

- **Counts in the listing:** 9 lessons, 27 worksheets, 147 slides, 16-question test, 5-question pre-test, 5 games and card sets.
- **Answers:** all 297 answers. All 9 hinge answer indexes. Hinge distractor rationales apart from issues 26, 27 and 34.
- **Visuals:** every number line's labels and highlight against its question. Strip parts and shaded values.
- **Card sets and game:** card pairs (9 pairs in Make One Whole). Mystery Whole answers (12, 16, 14, 12, 16, 8, 15, 12, 18, 16, 8, 18 cm).
- **Language and layout:** no em dashes in the unit JSON, slides or guide. Australian spelling throughout. No overlapping or off-slide boxes in the deck.
- **Sources:** outcome code MA2-PF-01 matches the NSW curriculum site. The CESE What Works Best 2025 citation is real.
