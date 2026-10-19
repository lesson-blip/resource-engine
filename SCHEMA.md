# Unit content schema (v2)

One JSON file per product in `units/<id>.json`. Content only: the engine draws everything.
It must parse with `node -e "JSON.parse(require('fs').readFileSync('units/<id>.json'))"`.

## House rules
- Audience: Year 3 and 4 (Stage 2), NSW, Australian spelling (colour, metre, litre, practise as a verb).
- Teacher text: plain teacher voice, no em dashes, no hype words, no heavy dash use.
- Content is ORIGINAL, written from the NESA syllabus content points and the research. Never copy wording from NSW DoE sample units, Teach Starter, Twinkl, TpT products or textbooks.
- Everything the teacher is told to show or hand out must exist in the unit (slides or printables).
- Maths 100% correct. Every answer is checked. Prefer questions whose answers can be computed.
- Every lesson: explicit teaching (I do, We do), one hinge question, a Show me check, an activity, Choose your challenge (Support / Core / Extension; students see Get started / Main task / Go further with 1 to 3 dots; set `"levelStyle": "chillies"` for Mild / Medium / Spicy), Discuss and Connect.
- CPA: materials, then pictures, then symbols. Fractions as lengths on number lines (Clarke, Roche and Mitchell 2008).
- Kid-friendly definitions with close non-examples.
- Short strings. Titles max 44 chars. Box text max ~130 chars. Lists max 5 items.

## Top level
```json
{
  "id": "s2-fractions-a",
  "title": "Fractions as Lengths",            // product title, 2 to 4 words, used on cover
  "subtitle": "Partitioned Fractions A",       // syllabus focus area
  "stage": "Stage 2", "years": "Years 3 and 4",
  "fit": "Fits NSW Stage 2 Year A Unit 4 (Fractions)",   // where it slots in a school's scope and sequence
  "colour": "teal",                            // unit colour: teal | sky | mint | indigo | lav
  "weeks": 2,
  "outcomes": [{"code": "MA2-PF-01", "text": "..."}],
  "content": ["short paraphrase of each syllabus content point covered"],
  "vocab": [{"word": "numerator", "means": "kid definition", "visual": VISUAL_OR_NULL, "pic": "IMAGE_KEY_OR_NULL"}],
  "misconceptions": [{"think": "what kids wrongly think", "fix": "what to do"}],
  "signature": {"name": "My Fraction Flip Book", "what": "one sentence", "panels": [{"title": "...", "prompt": "...", "visual": VISUAL_OR_NULL}]},
  "lessons": [ LESSON, ... ],
  "assessment": ASSESSMENT,
  "requestImages": ["Fluent emoji folder names you need that are not in img/e3d"]
}
```

## LESSON
```json
{
  "id": "l1", "n": 1,
  "title": "Equal parts of a length",        // max 40
  "menu": "Equal parts",                     // max 22
  "pics": ["straight_ruler"],                 // 1 to 3 image keys for the lesson title slide
  "li": "We are learning to ...",             // max 130
  "sc": ["I can ...", "I can ..."],            // 2 or 3, each max 75
  "materials": ["paper strips", "mini whiteboards"],
  "slides": [ SLIDE, ... ],                    // 8 to 12
  "printables": [ PRINTABLE, ... ],
  "teacherNotes": "3 to 5 sentences.",
  "exitTicket": [{"q": "...", "answer": "...", "visual": VISUAL_OR_NULL}]   // 2 questions, used for next-day grouping
}
```
Order: warmup, explicit teaching (definition / visual / worked / examples), talk, hinge, cfu, activity, levels, discuss.
Every slide may have `"mode": "I do" | "We do" | "You do"` (shown as a tag) and `"notes"` (teacher script, 1 to 4 sentences) and `"pics"` (0 to 2 image keys, only on slides with little text).

## SLIDE types
- `{"type":"warmup","title":"Warm-up: ...","prompt":"...","items":["..."],"answers":["..."]}` 2 to 4 items; retrieval of EARLIER content.
- `{"type":"definition","term":"denominator","means":"...","visual":VISUAL,"example":"short example sentence"}`
- `{"type":"rows","title":"...","intro":"optional","rows":[{"label":"short","text":"...","color":"teal|mint|sky|indigo|lav"}]}` 2 to 4 rows
- `{"type":"visual","title":"...","intro":"optional","visual":VISUAL,"rows":[{"label":"...","text":"..."}]}` 1 to 3 rows
- `{"type":"worked","title":"I do: ...","problem":"...","visual":VISUAL_OR_NULL,"steps":[{"label":"Step 1","text":"..."}]}` 2 to 4 steps, last gives answer
- `{"type":"examples","title":"Is it a quarter?","yes":[{"visual":VISUAL,"label":"..."}],"no":[{"visual":VISUAL,"label":"..."}]}` 2 yes + 2 no, the no ones are CLOSE non-examples
- `{"type":"talk","title":"Turn and talk","prompt":"question","seconds":30,"visual":VISUAL_OR_NULL}`
- `{"type":"hinge","title":"Which one?","question":"...","visual":VISUAL_OR_NULL,"options":["A text","B text","C text","D text"],"answer":1,"why":["why A is wrong (misconception)","why B is right","...","..."]}` options are short (max 30 chars) or describe visuals in words; every wrong option is a known misconception.
- `{"type":"cfu","title":"Show me: ...","prompt":"Write on your mini whiteboard.","questions":["..."],"answers":["..."],"visual":VISUAL_OR_NULL}` 3 or 4 questions
- `{"type":"activity","title":"Activity: ...","steps":["..."],"resource":"printable title","time":"20 min"}`
- `{"type":"levels","support":"Get started task","core":"Main task","extend":"Go further task"}` each max 120; Sullivan enabling / extending prompts
- `{"type":"discuss","questions":["..."],"connect":"Link back to the success criteria."}` 2 or 3 questions
- `{"type":"display","title":"...","visual":VISUAL}`

## VISUAL (drawn accurately by the engine)
Fractions as strings like "3/4".
- `{"kind":"fractionStrip","parts":4,"shaded":1,"labels":true}`
- `{"kind":"fractionWall","rows":[1,2,4,8]}` (or 1,3,6 / 1,5,10)
- `{"kind":"numberLine","from":0,"to":1,"ticks":4,"labels":["0","1/4","2/4","3/4","1"],"highlight":[2]}` labels length = ticks+1, "" for blank. Works past 1: from 0 to 2 ticks 8.
- `{"kind":"collection","count":12,"groups":4,"shadedGroups":1}`
- `{"kind":"array","rows":3,"cols":4}`
- `{"kind":"barModel","whole":"12","parts":["?","3"]}`
Other kinds (grid, compass, angle, angleSet, pvChart, decimalGrid, mab, jug, cubes, money, algorithm, roundLine) exist but are not needed for fractions.
Unequal parts cannot be drawn: describe non-examples with unequal parts in words, or use a strip with wrong number of parts.

## PRINTABLE
- Worksheet in three levels, one A4 page each:
```json
{"id":"l1-ws","kind":"worksheet","title":"Equal parts","levels":[
  {"level":"Support","teach":{"text":"short teaching box with worked example","visual":VISUAL_OR_NULL},"items":[ITEM,...]},
  {"level":"Core","teach":{...},"items":[...]},
  {"level":"Extend","teach":{...},"items":[...]}]}
```
ITEM = `{"q":"question","visual":VISUAL_OR_NULL,"lines":1,"answer":"key answer"}`
  or with parts: `{"q":"stem","visual":VISUAL_OR_NULL,"parts":[{"q":"a part","answer":"..."},...]}` (2 to 4 parts, short)
  or `{"table":{"headers":["..."],"rows":[["",""]]},"answer":"..."}`
  4 or 5 items per level, at most 3 visuals per level.
- Game board / recording sheet: `{"id":"...","kind":"game","title":"...","players":"2 players","need":["dice","counters"],"rules":["..."],"items":[ITEM,...]}` (board drawn from items/visual)
- Cards: `{"id":"...","kind":"cards","title":"...","instructions":"...","cards":[{"text":"...","visual":VISUAL_OR_NULL}]}` 8 to 24 cards

## ASSESSMENT
```json
{"title":"Fractions check-in","sections":[{"heading":"...","items":[ITEM,...]}],
 "selfCheck":["I can ...","..."],
 "rubric":[{"criteria":"...","A":"...","B":"...","C":"...","D":"...","E":"..."}]}
```
12 to 18 items, mapped to the content points. Also include a short pre-test: `"pretest":[ITEM, ITEM, ...]` (5 items).

## IMAGES
Keys = filenames (no .png) in `img/e3d/` (Microsoft Fluent 3D emoji, MIT). Request others in `requestImages` using exact Fluent folder names.
