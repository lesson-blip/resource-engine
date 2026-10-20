# English unit schema (adds to SCHEMA.md)

An English unit uses everything in SCHEMA.md plus the fields below. Set `"subject": "english"`.
Built for companion packs to NSW Department English units (Components A and B), and for book studies.

## House rules for English
- Everything is ORIGINAL writing. Use the Department unit only for its sequence and focus (it is CC BY 4.0, but we write our own words, examples and model texts).
- NEVER reproduce text or pictures from the mentor book. Refer to it with a locator only: chapter, page and at most the first 4 words of the passage, e.g. `Chapter 1, p 2: the paragraph beginning 'Boggis was a'`. Teachers read or paste from their own copy into the frame the slide provides.
- Character names, place names and plot facts from the book can be named and summarised briefly in our own words (plot summaries of a few words per event, never retelling scenes in detail).
- Model texts (character descriptions, tension paragraphs, orientations) are written fresh by us, in the style the lesson teaches, about NEW characters and places we invent (a new farmer, a new farm), so students innovate rather than copy.
- Plain teacher voice, Australian spelling, no em dashes. Year 3 and 4 reading level on student-facing slides.
- Differentiation: every main writing or reading task has Get started / Main task / Go further (levels slide), matching the Department's Too hard? / Too easy?.

## Top level additions
```json
{
  "subject": "english",
  "departmentUnit": "Stage 2 Year A Unit 1",          // the NSW Department unit this pack accompanies
  "concept": "Narrative", "supportingConcept": "Characterisation",
  "mentorText": {"title": "Fantastic Mr Fox", "author": "Roald Dahl", "edition": "Puffin paperback; page numbers may differ in other editions"},
  "weeksPlan": [{"week": 1, "li": "Students are learning to ...", "sc": ["I can ...", "..."]}],   // one per week
  "lessons": [ LESSON (Component B), ... ],          // each LESSON adds "week": 1..5
  "skills":  [ SKILL (Component A), ... ],           // short daily skill lessons, separate slide deck
  "photos": {...}, "people": {...}                   // as in maths (real photos of settings, cut-out students)
}
```
In English lessons, `hinge`, `cfu` and `levels` are used where they fit, not forced. Each lesson still has an activity and a closing discuss or reflection, and an exit ticket (answers may be "Answers will vary: look for ...").

## SKILL (Component A mini-lesson, 15 to 20 minutes, 3 to 6 slides)
```json
{"id":"a1","n":1,"week":1,"focus":"Spelling | Morphology | Vocabulary | Grammar | Punctuation | Fluency | Handwriting",
 "title":"The long /ee/ sound","li":"...","sc":["I can ..."],
 "slides":[SLIDE,...], "printables":[PRINTABLE,...], "teacherNotes":"..."}
```
Four per week (20 for a 5-week unit), covering the week's Component A focus areas. Use definition, rows, examples, model, cfu (with answers), warmup, mentor (with our own example sentences).

## New SLIDE types
Text in `text`, `example`, `parts[].text`, `rows[].text` and `points` may use colour markup:
`[adj:enormous]` adjective (sky), `[verb:crept]` verb (teal), `[adv:across the yard]` adverbial (lavender), `[noun:barn]` noun (indigo), `[conj:but]` conjunction (mint), `**bold**`.
A legend is drawn automatically for the tags used on the slide.

- Slow reveal, one slide per step:
`{"type":"reveal","title":"Slow reveal","intro":"Cover hidden. Read one sentence at a time.","steps":[{"focus":"Purpose","locator":"Chapter 10, p 38: the first line of dialogue","questions":["What type of text might this be?","How do you know?"]}]}`
- Mentor text, with a frame for the teacher's own copy:
`{"type":"mentor","title":"How the author describes Boggis","locator":"Chapter 1, p 2: the paragraph beginning 'Boggis was a'","task":"Find the words that tell us how Boggis looks and what he eats.","questions":["..."],"example":"Optional OUR OWN sentence with [adj:markup]"}`
- Anchor chart, built with the class:
`{"type":"anchor","title":"Anchor chart: a narrative","points":["Orientation: who, where, when","..."],"blank":2}`
- Model writing (shown in the NSW handwriting font):
`{"type":"model","title":"I do: a new farmer","intro":"Watch how I ...","parts":[{"label":"Name and job","text":"Farmer Pip was a [adj:pumpkin-and-pear] farmer."}]}` or `"text":"one paragraph"` instead of parts.
- Co-constructed success criteria:
`{"type":"criteria","title":"Our success criteria","stem":"I can write a character description that includes:","points":["declarative sentences that give facts"],"blank":1}`
- Peer feedback (fixed Tell, Ask, Give layout with sentence starters):
`{"type":"tag","title":"Peer feedback: Tell, Ask, Give"}`
- Rows and visual slides accept markup too, for example small steps: `{"label":"1","text":"Mr Fox [verb:crept] [adv:up the tunnel]."}`

## New PRINTABLE kind: organiser
`{"id":"r5","kind":"organiser","template":"orientation","title":"Orientation planner","data":{...}}`
Templates:
- `orientation` five boxes: Characters, Setting (where), Time (when), A hint of the problem, Engaging details.
- `storyMap` A3-style page: a big drawing space with 6 numbered event boxes and a key.
- `arc` narrative arc planner (rising action to climax, falling action, resolution) with boxes along the line.
- `swbst` Somebody, Wanted, But, So, Then table; `data.rows` sets how many But/So rows (default 4).
- `adjectiveSort` three columns: Quantifying, Descriptive, Classifying; `data.examples` one starter word per column.
- `traitBank` `data.traits`: 30 to 40 character traits, grouped (kind, brave, clever, sneaky...) with a short kid meaning each.
- `vocabTable` `data.words`: [{"word":"enormously","locator":"Ch 1, p 2","base":"enormous","suffix":"-ly"}]; students write a student-friendly meaning; answer key shows base and suffix.
- `passage` close reading planner for the teacher: Passage locator, Synopsis, Structure, Language features, Words to teach, with `data.locator` and `data.prompts`.
- `protocols` interaction protocols poster: Partner, Small group, Whole class, each with 3 or 4 "We..." statements in `data`.
- `tag` Tell, Ask, Give feedback cards, 4 per page.
- `resolutionTypes` poster: six endings with one-line meanings in `data.types`.
- `writing` writing page with a success criteria checklist: `data.criteria` [..], `data.lines` (default 14), `data.plan` true adds a small planning box.
Worksheets (kind `worksheet`, three levels) also work for English: items with `lines` and `answer` such as "Answers will vary: look for ...".

## Organiser slides (live on the board; boxes are editable; give content to make a worked example, or leave cells "" for the class to fill)
- `{"type":"venn","title":"...","prompt":"...","left":"Mr Fox","right":"Badger","items":{"left":["..."],"both":["..."],"right":["..."]}}`
- `{"type":"tchart","title":"...","prompt":"...","headers":["A","B"],"rows":[["",""]],"blank":4}`
- `{"type":"table","title":"...","headers":["Farmer","Farm","Looks"],"firstColWidth":0.2,"rows":[["Boggis","",""]]}`
- `{"type":"charmap","title":"Character map: ...","centre":"Mr Fox","photo":"PHOTO_KEY_OPTIONAL","spokes":[{"label":"Clever","text":"evidence or empty"}]}` up to 6 spokes
- `{"type":"mountain","title":"Story mountain","stages":[{"label":"Orientation","text":""}],"peak":3}` 4 to 6 stages
- `{"type":"flow","title":"...","steps":[{"label":"Try 1","text":"..."}]}` 3 to 8 steps
- Drag and drop (edit mode): `{"type":"sort","title":"...","prompt":"...","headings":["A","B","C"],"cards":["..."],"answers":{"A":["..."]}}` up to 12 cards; `{"type":"strips","title":"Put the events in order","items":["in the correct order"]}` (shown shuffled, answer in notes)
- `pics` (1 to 2 Fluent image keys) now also work on definition, anchor, criteria and mentor slides.
